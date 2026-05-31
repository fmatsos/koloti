import { fail, redirect } from '@sveltejs/kit';
import { z } from 'zod/v4';
import { writeAuditLog } from '$lib/server/audit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	return { profile: locals.profile };
};

const setPasswordSchema = z
	.object({
		password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères.').max(200),
		password_confirm: z.string()
	})
	.refine((d) => d.password === d.password_confirm, {
		message: 'Les mots de passe ne correspondent pas.',
		path: ['password_confirm']
	});

export const actions: Actions = {
	default: async ({ request, locals }) => {
		if (!locals.user || !locals.profile) return fail(401, { error: 'Non authentifié.' });

		const formData = Object.fromEntries(await request.formData());
		const parsed = setPasswordSchema.safeParse(formData);
		if (!parsed.success)
			return fail(400, { error: parsed.error.issues[0]?.message ?? 'Données invalides.' });

		const { error } = await locals.supabase.auth.updateUser({ password: parsed.data.password });

		if (error)
			return fail(400, {
				error: 'Impossible de modifier le mot de passe. Le lien a peut-être expiré.'
			});

		await writeAuditLog({
			actorId: locals.profile.id,
			action: 'profile.update_password',
			entity: 'profile',
			entityId: locals.user.id
		});

		throw redirect(303, '/profil?password_changed=1');
	}
};
