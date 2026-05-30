import { json, error } from '@sveltejs/kit';
import { z } from 'zod/v4';
import { createServiceClient } from '$lib/server/supabase';
import { writeAuditLog } from '$lib/server/audit';
import { PUBLIC_APP_URL } from '$env/static/public';
import type { RequestHandler } from './$types';

const schema = z.object({
	profile_id: z.string().uuid(),
	kind: z.enum(['standard', 'extended']).default('standard'),
	extended_days: z.number().int().min(1).max(30).default(7).optional()
});

async function hashToken(token: string): Promise<string> {
	const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
	return Array.from(new Uint8Array(bytes))
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');
}

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.profile || locals.profile.role !== 'admin') {
		throw error(403, 'Non autorisé');
	}

	const body = await request.json();
	const parsed = schema.safeParse(body);
	if (!parsed.success) throw error(400, 'Données invalides');

	const { profile_id, kind, extended_days } = parsed.data;
	const supabase = createServiceClient();

	const { data: targetProfile } = await supabase
		.from('profile')
		.select('id, email, full_name, status')
		.eq('id', profile_id)
		.single();

	if (!targetProfile) throw error(404, 'Profil introuvable');

	const validityHours = kind === 'extended' ? (extended_days ?? 7) * 24 : 72;
	const expiresAt = new Date(Date.now() + validityHours * 60 * 60 * 1000).toISOString();

	const tokenBytes = new Uint8Array(32);
	crypto.getRandomValues(tokenBytes);
	const tokenClear = Array.from(tokenBytes)
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');
	const tokenHash = await hashToken(tokenClear);

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

	const { data: link, error: insertError } = await supabase
		.from('activation_link')
		.insert({
			profile_id,
			token_hash: tokenHash,
			kind,
			expires_at: expiresAt,
			created_by: locals.profile.id
		})
		.select('id')
		.single();

	if (insertError || !link) throw error(500, 'Erreur création lien');

	await writeAuditLog({
		actorId: locals.profile.id,
		action: 'activation.issue',
		entity: 'activation_link',
		entityId: link.id,
		payload: { profile_id, kind, expires_at: expiresAt }
	});

	const activationUrl = `${PUBLIC_APP_URL}/activate/${tokenClear}`;

	try {
		await supabase.auth.admin.generateLink({
			type: 'invite',
			email: targetProfile.email,
			options: { redirectTo: activationUrl }
		});
	} catch (e) {
		console.error('Erreur envoi email activation:', e);
	}

	return json({ success: true, link_id: link.id, expires_at: expiresAt });
};
