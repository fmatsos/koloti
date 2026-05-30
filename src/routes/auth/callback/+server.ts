import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Échange le code PKCE (magic link) contre une session Supabase.
// emailRedirectTo doit pointer ici ; le paramètre `next` porte la destination finale.
export const GET: RequestHandler = async ({ url, locals }) => {
	const code = url.searchParams.get('code');
	const next = url.searchParams.get('next') ?? '/app';

	if (code) {
		const { error } = await locals.supabase.auth.exchangeCodeForSession(code);
		if (!error) {
			throw redirect(303, next);
		}
	}

	throw redirect(303, '/login?error=magic_link_invalid');
};
