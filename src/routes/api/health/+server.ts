import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Endpoint de ping — maintient le projet Supabase actif (anti-pause free tier)
// Pas d'authentification requise, pas de données sensibles
export const GET: RequestHandler = async () => {
	return json({ status: 'ok', timestamp: new Date().toISOString() });
};
