import { createServerClient } from '@supabase/ssr';
import { type Handle, redirect } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import { bootstrapAdminAccount } from '$lib/server/bootstrap-admin';
import { createServiceClient } from '$lib/server/supabase';

// Routes accessibles sans authentification
const PUBLIC_ROUTES = ['/login', '/activate', '/magic-link', '/auth/callback'];

function isPublicRoute(pathname: string): boolean {
	return PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
}

let bootstrapPromise: Promise<void> | null = null;

async function ensureBootstrapAdmin() {
	if (!bootstrapPromise) {
		bootstrapPromise = bootstrapAdminAccount()
			.then(() => undefined)
			.catch((error) => {
				console.error('[bootstrap-admin] Erreur:', error);
			})
			.finally(() => {
				bootstrapPromise = null;
			});
	}

	await bootstrapPromise;
}

const bootstrapHandle: Handle = async ({ event, resolve }) => {
	await ensureBootstrapAdmin();
	return resolve(event);
};

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

	event.locals.safeGetUser = async () => {
		const {
			data: { user },
			error
		} = await event.locals.supabase.auth.getUser();

		if (error || !user) return null;

		return user;
	};

	return resolve(event, {
		filterSerializedResponseHeaders(name) {
			return name === 'content-range' || name === 'x-supabase-api-version';
		}
	});
};

const sessionHandle: Handle = async ({ event, resolve }) => {
	const user = await event.locals.safeGetUser();
	event.locals.session = null;
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

	const user = event.locals.user;

	// Pas d'utilisateur authentifié → redirection vers login
	if (!user) {
		throw redirect(303, `/login?redirect=${encodeURIComponent(pathname)}`);
	}

	const profile = event.locals.profile;

	if (profile?.must_change_credentials && pathname !== '/change-credentials') {
		throw redirect(303, '/change-credentials');
	}

	if (pathname === '/change-credentials' && profile && !profile.must_change_credentials) {
		throw redirect(303, '/');
	}

	// Compte désactivé → redirection avec message
	if (profile?.status === 'inactive') {
		throw redirect(303, '/login?error=account_inactive');
	}

	// Compte en attente d'activation → redirection avec message
	if (profile?.status === 'pending') {
		throw redirect(303, '/login?error=account_pending');
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
	bootstrapHandle,
	supabaseHandle,
	sessionHandle,
	authGuardHandle,
	securityHeadersHandle
);
