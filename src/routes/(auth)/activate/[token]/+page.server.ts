import { fail, redirect } from '@sveltejs/kit';
import { z } from 'zod/v4';
import { createServiceClient } from '$lib/server/supabase';
import type { Actions, PageServerLoad } from './$types';

async function hashToken(token: string): Promise<string> {
	const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
	return Array.from(new Uint8Array(bytes))
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');
}

export const load: PageServerLoad = async ({ params }) => {
	const { token } = params;

	if (!token || token.length < 32) {
		return {
			session: null,
			profile: null,
			valid: false,
			reason: 'invalid' as const,
			token: null,
			linkId: null,
			fullName: null
		};
	}

	const tokenHash = await hashToken(token);
	const supabase = createServiceClient();

	const { data: link } = await supabase
		.from('activation_link')
		.select('id, profile_id, expires_at, used_at, revoked')
		.eq('token_hash', tokenHash)
		.single();

	if (!link) {
		return {
			session: null,
			profile: null,
			valid: false,
			reason: 'invalid' as const,
			token: null,
			linkId: null,
			fullName: null
		};
	}

	if (link.revoked) {
		return {
			session: null,
			profile: null,
			valid: false,
			reason: 'revoked' as const,
			token: null,
			linkId: null,
			fullName: null
		};
	}

	if (link.used_at) {
		return {
			session: null,
			profile: null,
			valid: false,
			reason: 'used' as const,
			token: null,
			linkId: null,
			fullName: null
		};
	}

	if (new Date(link.expires_at) < new Date()) {
		return {
			session: null,
			profile: null,
			valid: false,
			reason: 'expired' as const,
			token: null,
			linkId: null,
			fullName: null
		};
	}

	const { data: profile } = await supabase
		.from('profile')
		.select('id, first_name, last_name, email')
		.eq('id', link.profile_id)
		.single();

	return {
		session: null,
		profile: null,
		valid: true,
		reason: null as null,
		token,
		linkId: link.id,
		fullName: profile ? `${profile.first_name} ${profile.last_name}`.trim() : null
	};
};

const activateSchema = z
	.object({
		token: z.string().min(32),
		link_id: z.string().uuid(),
		mode: z.enum(['password', 'magiclink']),
		password: z.string().min(8).max(200).optional(),
		password_confirm: z.string().optional()
	})
	.refine(
		(data) =>
			data.mode === 'magiclink' ||
			(data.password !== undefined && data.password === data.password_confirm),
		{ message: 'Les mots de passe ne correspondent pas.' }
	);

export const actions: Actions = {
	activate: async ({ request }) => {
		const formData = Object.fromEntries(await request.formData());
		const parsed = activateSchema.safeParse(formData);

		if (!parsed.success) {
			return fail(400, {
				error: parsed.error.issues[0]?.message ?? 'Données invalides.'
			});
		}

		const { token, link_id, mode, password } = parsed.data;
		const supabase = createServiceClient();

		// Re-vérifier le lien (consommation atomique)
		const tokenHash = await hashToken(token);
		const { data: link } = await supabase
			.from('activation_link')
			.select('id, profile_id, expires_at, used_at, revoked')
			.eq('token_hash', tokenHash)
			.eq('id', link_id)
			.single();

		if (!link || link.revoked || link.used_at || new Date(link.expires_at) < new Date()) {
			return fail(400, { error: 'Lien invalide ou expiré.' });
		}

		// Récupérer le profil + email auth
		const { data: profile } = await supabase
			.from('profile')
			.select('id, email, status')
			.eq('id', link.profile_id)
			.single();

		if (!profile) {
			return fail(400, { error: 'Compte introuvable.' });
		}

		// Marquer le lien comme utilisé (atomique)
		await supabase
			.from('activation_link')
			.update({ used_at: new Date().toISOString() })
			.eq('id', link_id)
			.is('used_at', null); // guard supplémentaire

		if (mode === 'password' && password) {
			// Définir le mot de passe via admin API
			const { data: authUser } = await supabase.auth.admin.listUsers();
			const user = authUser?.users.find((u) => u.email === profile.email);

			if (user) {
				await supabase.auth.admin.updateUserById(user.id, { password });
			}
		}

		// Passer le statut à active + enregistrer activated_at
		await supabase
			.from('profile')
			.update({
				status: 'active',
				activated_at: new Date().toISOString()
			})
			.eq('id', profile.id);

		// Tracer dans audit_log
		await supabase.from('audit_log').insert({
			action: 'activation.used',
			entity: 'activation_link',
			entity_id: link_id,
			payload: { profile_id: profile.id, mode }
		});

		throw redirect(303, '/login?activated=1');
	}
};
