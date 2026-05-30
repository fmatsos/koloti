import { fail, redirect } from '@sveltejs/kit';
import { z } from 'zod/v4';
import type { Actions, PageServerLoad } from './$types';
import { createServiceClient } from '$lib/server/supabase';
import { PUBLIC_APP_URL } from '$env/static/public';

export const load: PageServerLoad = async ({ locals, url }) => {
	const { session } = await locals.safeGetSession();
	if (session) throw redirect(303, '/app');

	const error = url.searchParams.get('error');
	const redirectTo = url.searchParams.get('redirect') ?? '/app';
	return { session: null, profile: null, error, redirectTo };
};

const passwordSchema = z.object({
	login: z.string().min(1).max(50),
	password: z.string().min(1).max(200),
	redirectTo: z.string().default('/app')
});

const magicLinkSchema = z.object({
	login: z.string().min(1).max(50),
	redirectTo: z.string().default('/app')
});

export const actions: Actions = {
	// Connexion par login + mot de passe
	password: async ({ request, locals }) => {
		const formData = Object.fromEntries(await request.formData());
		const parsed = passwordSchema.safeParse(formData);

		if (!parsed.success) {
			// Réponse uniforme — pas d'énumération de comptes
			return fail(400, { error: 'Identifiants incorrects.' });
		}

		const { login, password, redirectTo } = parsed.data;

		// Résoudre le login en email via la table credential
		// Service role requis : l'utilisateur n'est pas encore authentifié, les RLS bloquent anon
		const serviceClient = createServiceClient();
		const { data: credential } = await serviceClient
			.from('credential')
			.select('profile_id, profile:profile_id(email, status)')
			.eq('login', login)
			.single();

		if (!credential || !credential.profile) {
			// Réponse identique qu'il n'y ait pas de login ou un mauvais mdp
			return fail(400, { error: 'Identifiants incorrects.' });
		}

		const profile = Array.isArray(credential.profile) ? credential.profile[0] : credential.profile;

		if (!profile || profile.status === 'inactive') {
			return fail(400, { error: 'Identifiants incorrects.' });
		}

		// Authentification via l'email Supabase Auth
		const { error } = await locals.supabase.auth.signInWithPassword({
			email: profile.email,
			password
		});

		if (error) {
			// Réponse uniforme
			return fail(400, { error: 'Identifiants incorrects.' });
		}

		throw redirect(303, redirectTo);
	},

	// Envoi d'un magic link
	magiclink: async ({ request, locals }) => {
		const formData = Object.fromEntries(await request.formData());
		const parsed = magicLinkSchema.safeParse(formData);

		if (!parsed.success) {
			return fail(400, { error: 'Login invalide.' });
		}

		const { login, redirectTo } = parsed.data;

		// Résoudre le login en email
		// Service role requis : l'utilisateur n'est pas encore authentifié, les RLS bloquent anon
		const serviceClient = createServiceClient();
		const { data: credential } = await serviceClient
			.from('credential')
			.select('profile_id, profile:profile_id(email, status)')
			.eq('login', login)
			.single();

		if (!credential || !credential.profile) {
			return fail(400, { error: 'Login inconnu. Vérifiez votre identifiant ou contactez un administrateur.' });
		}

		const profile = Array.isArray(credential.profile) ? credential.profile[0] : credential.profile;

		if (!profile || profile.status === 'inactive') {
			return { success: true };
		}

		await locals.supabase.auth.signInWithOtp({
			email: profile.email,
			options: {
				emailRedirectTo: `${PUBLIC_APP_URL}/auth/callback?next=${encodeURIComponent(redirectTo)}`
			}
		});

		// Toujours retourner succès (pas d'énumération de comptes)
		return { success: true };
	}
};
