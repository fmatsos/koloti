import { error } from '@sveltejs/kit';
import { z } from 'zod/v4';
import { createServiceClient } from '$lib/server/supabase';
import { writeAuditLog } from '$lib/server/audit';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import type { RequestHandler } from './$types';

const schema = z.object({
	profile_id: z.string().uuid('profile_id doit être un UUID valide')
});

async function hashToken(token: string): Promise<string> {
	const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
	return Array.from(new Uint8Array(bytes))
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');
}

export const GET: RequestHandler = async ({ url, locals }) => {
	// Auth guard
	if (!locals.profile || locals.profile.role !== 'admin') {
		throw error(403, 'Non autorisé');
	}

	// Validate profile_id param
	const profileIdParam = url.searchParams.get('profile_id');
	const parsed = schema.safeParse({ profile_id: profileIdParam });
	if (!parsed.success) {
		throw error(400, 'profile_id invalide');
	}

	const { profile_id } = parsed.data;
	const supabase = createServiceClient();

	// Fetch target profile — must exist and be pending
	const { data: targetProfile, error: profileError } = await supabase
		.from('profile')
		.select('id, first_name, last_name, email, status')
		.eq('id', profile_id)
		.single();

	if (profileError || !targetProfile) {
		throw error(404, 'Profil introuvable');
	}

	if (targetProfile.status !== 'pending') {
		throw error(400, 'Seuls les comptes en attente peuvent avoir une feuille de bienvenue');
	}

	// Generate extended 30-day activation token
	const tokenBytes = new Uint8Array(32);
	crypto.getRandomValues(tokenBytes);
	const tokenClear = Array.from(tokenBytes)
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');
	const tokenHash = await hashToken(tokenClear);

	const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

	// Revoke previous unused links
	await supabase
		.from('activation_link')
		.update({ revoked: true })
		.eq('profile_id', profile_id)
		.eq('revoked', false)
		.is('used_at', null);

	await writeAuditLog({
		actorId: locals.profile.id,
		action: 'activation.revoke_previous',
		entity: 'activation_link',
		entityId: null,
		payload: { profile_id }
	});

	// Insert extended activation link
	const { data: link, error: insertError } = await supabase
		.from('activation_link')
		.insert({
			profile_id,
			token_hash: tokenHash,
			kind: 'extended',
			expires_at: expiresAt,
			created_by: locals.profile.id
		})
		.select('id')
		.single();

	if (insertError || !link) {
		throw error(500, 'Erreur lors de la création du lien d\'activation');
	}

	await writeAuditLog({
		actorId: locals.profile.id,
		action: 'activation.issue',
		entity: 'activation_link',
		entityId: link.id,
		payload: { profile_id, kind: 'extended', expires_at: expiresAt }
	});

	// Call Edge Function to generate PDF
	if (!locals.session?.access_token) {
		throw error(401, 'Session expirée');
	}

	try {
		const edgeFunctionUrl = `${PUBLIC_SUPABASE_URL}/functions/v1/welcome-sheet`;
		const response = await fetch(edgeFunctionUrl, {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${locals.session.access_token}`,
				'apikey': PUBLIC_SUPABASE_ANON_KEY,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				profile_id,
				token_clear: tokenClear
			})
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.error('Edge Function error:', response.status, errorText);
			throw error(502, `Erreur génération PDF: ${response.status}`);
		}

		const pdfBytes = await response.arrayBuffer();
		const fileName = `bienvenue-${targetProfile.first_name}-${targetProfile.last_name}`.replace(
			/\s+/g,
			'-'
		);

		return new Response(pdfBytes, {
			status: 200,
			headers: {
				'Content-Type': 'application/pdf',
				'Content-Disposition': `attachment; filename="${fileName}.pdf"`,
				'Cache-Control': 'no-store',
				'X-Content-Type-Options': 'nosniff'
			}
		});
	} catch (err) {
		if (err instanceof Error && 'status' in err) {
			throw err;
		}
		console.error('Unexpected error in welcome-sheet endpoint:', err);
		throw error(500, 'Erreur serveur');
	}
};
