import { createServerClient } from '@supabase/ssr';
import { type Handle, redirect } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import { createServiceClient } from '$lib/server/supabase';

// Routes accessibles sans authentification
const PUBLIC_ROUTES = ['/login', '/activate', '/magic-link'];

function isPublicRoute(pathname: string): boolean {
	return PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
}

const supabaseHandle: Handle = async ({ event, resolve }) => {
	event.locals.supabase = createServerClient<import('$lib/types/database').Database>(
		PUBLIC_SUPABASE_URL,
		PUBLIC_SUPABASE_ANON_KEY,
		{
			cookies: {
				getAll: () => event.cookies.getAll(),
				setAll: (cookiesToSet) => {
					cookiesToSet.forEach(({ name, value, options }) => {
						event.cookies.set(name, value, { ...options, path: '/' });
					});
				}
			}
		}
	);

	// Helper sécurisé pour récupérer la session (valide le JWT côté serveur)
	event.locals.safeGetSession = async () => {
		const {
			data: { session }
		} = await event.locals.supabase.auth.getSession();

		if (!session) return { session: null, user: null };

		const {
			data: { user },
			error
		} = await event.locals.supabase.auth.getUser();

		if (error || !user) return { session: null, user: null };

		return { session, user };
	};

	return resolve(event, {
		filterSerializedResponseHeaders(name) {
			return name === 'content-range' || name === 'x-supabase-api-version';
		}
	});
};

const sessionHandle: Handle = async ({ event, resolve }) => {
	const { session, user } = await event.locals.safeGetSession();
	event.locals.session = session;
	event.locals.user = user;
	event.locals.profile = null;

	if (user) {
		const { data: profile } = await event.locals.supabase
			.from('profile')
			.select('*')
			.eq('id', user.id)
			.single();
		event.locals.profile = profile;

		// Mise à jour de last_login_at (serveur uniquement, service_role)
		// Limitée aux sessions avec un profil existant pour éviter les doublons
		const serviceClient = createServiceClient();
		await serviceClient
			.from('profile')
			.update({ last_login_at: new Date().toISOString() })
			.eq('id', user.id);
	}

	return resolve(event);
};

const authGuardHandle: Handle = async ({ event, resolve }) => {
	const { pathname } = event.url;

	// Routes d'auth publiques — toujours accessibles
	if (isPublicRoute(pathname) || pathname === '/') {
		return resolve(event);
	}

	const { session, user } = await event.locals.safeGetSession();

	// Pas de session → redirection vers login
	if (!session || !user) {
		throw redirect(303, `/login?redirect=${encodeURIComponent(pathname)}`);
	}

	const profile = event.locals.profile;

	// Compte non actif → redirection avec message
	if (profile && profile.status !== 'active') {
		throw redirect(303, '/login?error=account_inactive');
	}

	// Zone admin — uniquement admin et éditeur
	if (pathname.startsWith('/admin')) {
		if (!profile || !['admin', 'editor'].includes(profile.role)) {
			throw redirect(303, '/app?error=forbidden');
		}
	}

	return resolve(event);
};

const securityHeadersHandle: Handle = async ({ event, resolve }) => {
	const response = await resolve(event);

	// En-têtes de sécurité
	response.headers.set('X-Frame-Options', 'DENY');
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	response.headers.set('X-XSS-Protection', '0'); // Désactivé car géré par CSP
	response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

	// HSTS (HTTPS only — actif en production via Netlify)
	if (event.url.protocol === 'https:') {
		response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
	}

	// Content Security Policy
	// Nonce-based CSP possible en amélioration ultérieure
	const csp = [
		"default-src 'self'",
		"script-src 'self' 'unsafe-inline'", // unsafe-inline requis par SvelteKit hydration
		"style-src 'self' 'unsafe-inline'",
		"img-src 'self' data: blob:",
		"font-src 'self'",
		`connect-src 'self' ${PUBLIC_SUPABASE_URL} wss://*.supabase.co`,
		"frame-ancestors 'none'",
		"base-uri 'self'",
		"form-action 'self'"
	].join('; ');

	response.headers.set('Content-Security-Policy', csp);

	return response;
};

export const handle = sequence(
	supabaseHandle,
	sessionHandle,
	authGuardHandle,
	securityHeadersHandle
);
