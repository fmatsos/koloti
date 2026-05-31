import { fail, redirect } from '@sveltejs/kit';
import { z } from 'zod/v4';
import { createServiceClient } from '$lib/server/supabase';
import { writeAuditLog } from '$lib/server/audit';
import { generateUniqueLogin } from '$lib/server/generate-login';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.profile || locals.profile.role !== 'admin') throw redirect(303, '/app/');
	return { session: locals.session, profile: locals.profile };
};

const newAccountSchema = z.object({
	first_name: z.string().min(1, 'Le prénom est requis.').max(100).trim(),
	last_name: z.string().min(1, 'Le nom est requis.').max(100).trim(),
	email: z.string().email().max(200).toLowerCase().trim(),
	phone: z.string().max(20).trim().optional(),
	role: z.enum(['admin', 'editor', 'member'])
});

export const actions: Actions = {
	default: async ({ request, locals, fetch }) => {
		if (!locals.profile || locals.profile.role !== 'admin') {
			return fail(403, { error: 'Non autorisé.' });
		}

		const formData = Object.fromEntries(await request.formData());
		const parsed = newAccountSchema.safeParse(formData);

		if (!parsed.success) {
			return fail(400, {
				error: parsed.error.issues[0]?.message ?? 'Données invalides.',
				values: formData
			});
		}

		const { first_name, last_name, email, phone, role } = parsed.data;
		const supabase = createServiceClient();

		// Vérifier que l'email n'est pas déjà utilisé
		const { data: existing } = await supabase
			.from('profile')
			.select('id')
			.eq('email', email)
			.single();

		if (existing) {
			return fail(400, {
				error: 'Un compte avec cet email existe déjà.',
				values: formData
			});
		}

		// Créer l'utilisateur dans Supabase Auth
		const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
			email,
			email_confirm: false
		});

		if (authError || !authUser.user) {
			return fail(500, { error: 'Erreur lors de la création du compte auth.', values: formData });
		}

		// Créer le profil
		const { error: profileError } = await supabase.from('profile').insert({
			id: authUser.user.id,
			email,
			first_name,
			last_name,
			phone: phone ?? null,
			role,
			status: 'pending'
		});

		if (profileError) {
			// Nettoyer l'utilisateur auth créé
			await supabase.auth.admin.deleteUser(authUser.user.id);
			return fail(500, { error: 'Erreur lors de la création du profil.', values: formData });
		}

		// Générer un login unique (6 chars alphanumériques)
		const login = await generateUniqueLogin(supabase);

		// Créer le credential
		const { error: credError } = await supabase.from('credential').insert({
			profile_id: authUser.user.id,
			login
		});

		if (credError) {
			return fail(500, { error: 'Erreur lors de la création du login.', values: formData });
		}

		// Tracer la création
		await writeAuditLog({
			actorId: locals.profile.id,
			action: 'account.create',
			entity: 'profile',
			entityId: authUser.user.id,
			payload: { email, first_name, last_name, role, login }
		});

		// Déclencher l'émission du lien d'activation via l'Edge Function
		try {
			const res = await fetch('/api/issue-activation-link', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ profile_id: authUser.user.id })
			});
			if (!res.ok) {
				console.error('Erreur émission lien activation:', await res.text());
			}
		} catch (e) {
			console.error('Erreur appel issue-activation-link:', e);
		}

		throw redirect(303, `/comptes/${authUser.user.id}/view?created=1`);
	}
};
