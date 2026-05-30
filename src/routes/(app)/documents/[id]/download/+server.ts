import { error } from '@sveltejs/kit';
import { createServiceClient } from '$lib/server/supabase';
import type { RequestHandler } from './$types';

const STORAGE_BUCKET = 'documents';
const SIGNED_URL_EXPIRY = 300; // 5 minutes

// Visibilité autorisée selon le rôle
function canAccess(role: string, visibility: string): boolean {
	if (visibility === 'members') return true;
	if (visibility === 'editors') return role === 'editor' || role === 'admin';
	if (visibility === 'admin') return role === 'admin';
	return false;
}

export const GET: RequestHandler = async ({ params, locals }) => {
	if (!locals.profile) throw error(401, 'Non authentifié');

	const supabase = createServiceClient();
	const { data: doc } = await supabase
		.from('document')
		.select('id, title, storage_path, visibility, mime_type')
		.eq('id', params.id)
		.single();

	if (!doc) throw error(404, 'Document introuvable');
	if (!canAccess(locals.profile.role, doc.visibility)) throw error(403, 'Accès refusé');

	const { data: signed, error: signErr } = await supabase.storage
		.from(STORAGE_BUCKET)
		.createSignedUrl(doc.storage_path, SIGNED_URL_EXPIRY, { download: doc.title });

	if (signErr || !signed?.signedUrl) throw error(500, 'Impossible de générer le lien de téléchargement');

	return new Response(null, {
		status: 302,
		headers: { Location: signed.signedUrl }
	});
};
