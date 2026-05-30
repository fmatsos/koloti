/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

import { build, files, version } from '$service-worker';

declare const self: ServiceWorkerGlobalScope;

// Cache app-shell uniquement — JAMAIS de données sensibles
// (votes, cotisations, documents, profils)
const CACHE_NAME = `koloti-shell-${version}`;

// Fichiers statiques de l'app shell
const ASSETS = [
	...build, // fichiers buildés par SvelteKit
	...files // fichiers dans /static (manifest, icônes)
];

self.addEventListener('install', (event) => {
	event.waitUntil(
		caches.open(CACHE_NAME).then((cache) => {
			return cache.addAll(ASSETS);
		})
	);
	// Activer immédiatement sans attendre les onglets existants
	self.skipWaiting();
});

self.addEventListener('activate', (event) => {
	// Supprimer les anciens caches de l'app shell
	event.waitUntil(
		caches.keys().then((keys) =>
			Promise.all(
				keys
					.filter((key) => key !== CACHE_NAME)
					.map((key) => caches.delete(key))
			)
		)
	);
	self.clients.claim();
});

self.addEventListener('fetch', (event) => {
	const { request } = event;
	const url = new URL(request.url);

	// Ne pas intercepter :
	// - Les requêtes non-GET
	// - Les requêtes vers Supabase (données)
	// - Les routes d'API (données en temps réel)
	// - Les routes admin / app (données sensibles)
	if (
		request.method !== 'GET' ||
		url.hostname.includes('supabase') ||
		url.pathname.startsWith('/api/') ||
		url.pathname.startsWith('/admin/') ||
		url.pathname.startsWith('/app/')
	) {
		return;
	}

	// Pour les assets de l'app shell : cache-first
	event.respondWith(
		caches.match(request).then((cached) => {
			if (cached) return cached;

			return fetch(request).then((response) => {
				// Mettre en cache uniquement les assets statiques réussis
				if (response.ok && ASSETS.includes(url.pathname)) {
					const clone = response.clone();
					caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
				}
				return response;
			});
		})
	);
});
