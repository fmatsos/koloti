import { fail, redirect } from '@sveltejs/kit';
import { z } from 'zod/v4';
import { BOOTSTRAP_ADMIN_LOGIN } from '$lib/server/bootstrap-admin';
import { createServiceClient } from '$lib/server/supabase';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user || !locals.profile) {
		throw redirect(303, '/login');
	}

	if (!locals.profile.must_change_credentials) {
		throw redirect(303, '/app');
	}

	const supabase = createServiceClient();
	const { data: credential } = await supabase
		.from('credential')
		.select('login')
		.eq('profile_id', locals.profile.id)
		.single();

	return {
		session: locals.session,
		profile: locals.profile,
		currentLogin: credential?.login ?? BOOTSTRAP_ADMIN_LOGIN
	};
};

const changeCredentialsSchema = z
	.object({
		login: z
			.string()
			.trim()
			.toLowerCase()
			.min(3, 'Le login doit faire au moins 3 caractères.')
			.max(20, 'Le login ne peut pas dépasser 20 caractères.')
			.regex(
				/^[a-z0-9]+$/,
				'Le login ne peut contenir que des lettres minuscules et des chiffres.'
			),
		password: z.string().min(8, 'Le mot de passe doit faire au moins 8 caractères.').max(200),
		password_confirm: z.string().min(8).max(200)
	})
	.refine((data) => data.password === data.password_confirm, {
		message: 'Les mots de passe ne correspondent pas.',
		path: ['password_confirm']
	})
	.refine((data) => data.login !== BOOTSTRAP_ADMIN_LOGIN, {
		message: 'Le login admin doit être changé.',
		path: ['login']
	});

export const actions: Actions = {
	default: async ({ request, locals }) => {
		if (!locals.user || !locals.profile) {
			throw redirect(303, '/login');
		}

		if (!locals.profile.must_change_credentials) {
			throw redirect(303, '/app');
		}

		const formData = Object.fromEntries(await request.formData());
		const parsed = changeCredentialsSchema.safeParse(formData);

		if (!parsed.success) {
			return fail(400, {
				error: parsed.error.issues[0]?.message ?? 'Données invalides.',
				values: formData
			});
		}

		const { login, password } = parsed.data;
		const supabase = createServiceClient();

		const { data: currentCredential } = await supabase
			.from('credential')
			.select('login')
			.eq('profile_id', locals.profile.id)
			.single();

		if (!currentCredential) {
			return fail(500, { error: 'Login introuvable.', values: formData });
		}

		if (login === currentCredential.login) {
			return fail(400, {
				error: 'Vous devez choisir un nouvel identifiant.',
				values: formData
			});
		}

		const { data: conflict } = await supabase
			.from('credential')
			.select('profile_id')
			.eq('login', login)
			.neq('profile_id', locals.profile.id)
			.maybeSingle();

		if (conflict) {
			return fail(400, {
				error: 'Ce login est déjà utilisé par un autre compte.',
				values: formData
			});
		}

		const { error: loginError } = await supabase
			.from('credential')
			.update({ login })
			.eq('profile_id', locals.profile.id);

		if (loginError) {
			return fail(500, { error: 'Erreur lors de la mise à jour du login.', values: formData });
		}

		const { error: passwordError } = await supabase.auth.admin.updateUserById(locals.user.id, {
			password
		});

		if (passwordError) {
			return fail(500, {
				error: 'Erreur lors de la mise à jour du mot de passe.',
				values: formData
			});
		}

		const { error: profileError } = await supabase
			.from('profile')
			.update({ must_change_credentials: false })
			.eq('id', locals.profile.id);

		if (profileError) {
			return fail(500, {
				error: 'Erreur lors de la validation du changement d’identifiants.',
				values: formData
			});
		}

		throw redirect(303, '/app');
	}
};
