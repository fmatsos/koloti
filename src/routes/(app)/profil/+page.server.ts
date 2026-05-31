import { fail } from '@sveltejs/kit';
import { z } from 'zod/v4';
import { createServiceClient } from '$lib/server/supabase';
import { writeAuditLog } from '$lib/server/audit';
import { PUBLIC_APP_URL } from '$env/static/public';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	return { profile: locals.profile };
};

const identitySchema = z.object({
	first_name: z.string().trim().min(1, 'Le prénom est requis.').max(100),
	last_name: z.string().trim().min(1, 'Le nom est requis.').max(100)
});

const emailSchema = z.object({
	email: z.string().trim().toLowerCase().email('Email invalide.').max(254)
});

export const actions: Actions = {
	updateIdentity: async ({ request, locals }) => {
		if (!locals.user || !locals.profile) return fail(401, { error: 'Non authentifié.' });

		const formData = Object.fromEntries(await request.formData());
		const parsed = identitySchema.safeParse(formData);
		if (!parsed.success)
			return fail(400, { error: parsed.error.issues[0]?.message ?? 'Données invalides.' });

		const { first_name, last_name } = parsed.data;
		const supabase = createServiceClient();

		await supabase.from('profile').update({ first_name, last_name }).eq('id', locals.user.id);

		await writeAuditLog({
			actorId: locals.profile.id,
			action: 'profile.update_identity',
			entity: 'profile',
			entityId: locals.user.id,
			payload: { first_name, last_name }
		});

		return { success: true, action: 'identity' };
	},

	updateEmail: async ({ request, locals }) => {
		if (!locals.user || !locals.profile) return fail(401, { error: 'Non authentifié.' });

		const formData = Object.fromEntries(await request.formData());
		const parsed = emailSchema.safeParse(formData);
		if (!parsed.success)
			return fail(400, { error: parsed.error.issues[0]?.message ?? 'Email invalide.' });

		const { email } = parsed.data;
		const supabase = createServiceClient();

		const { data: conflict } = await supabase
			.from('profile')
			.select('id')
			.eq('email', email)
			.neq('id', locals.user.id)
			.maybeSingle();

		if (conflict) return fail(400, { error: 'Cet email est déjà utilisé.' });

		await supabase.auth.admin.updateUserById(locals.user.id, { email });
		await supabase.from('profile').update({ email }).eq('id', locals.user.id);

		await writeAuditLog({
			actorId: locals.profile.id,
			action: 'profile.update_email',
			entity: 'profile',
			entityId: locals.user.id,
			payload: { email }
		});

		return { success: true, action: 'email' };
	},

	requestPasswordChange: async ({ locals }) => {
		if (!locals.user || !locals.profile) return fail(401, { error: 'Non authentifié.' });

		await locals.supabase.auth.resetPasswordForEmail(locals.user.email!, {
			redirectTo: `${PUBLIC_APP_URL}/auth/callback?next=/profil/nouveau-mot-de-passe`
		});

		return { success: true, action: 'password_reset_sent' };
	}
};
