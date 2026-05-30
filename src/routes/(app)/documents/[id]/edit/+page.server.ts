import { error, fail, redirect } from '@sveltejs/kit';
import { z } from 'zod/v4';
import { createServiceClient } from '$lib/server/supabase';
import { writeAuditLog } from '$lib/server/audit';
import type { Actions, PageServerLoad } from './$types';

const STORAGE_BUCKET = 'documents';

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!locals.profile || !['admin', 'editor'].includes(locals.profile.role)) {
		throw redirect(303, '/app/');
	}

	const supabase = createServiceClient();
	const { data: doc } = await supabase
		.from('document')
		.select(
			'id, title, type, visibility, description, year, storage_path, mime_type, size_bytes, created_at'
		)
		.eq('id', params.id)
		.single();

	if (!doc) throw error(404, 'Document introuvable');
	return { session: locals.session, profile: locals.profile, doc };
};

const visibilitySchema = z.object({
	visibility: z.enum(['members', 'editors', 'admin'])
});

export const actions: Actions = {
	updateVisibility: async ({ request, locals, params }) => {
		if (!locals.profile || !['admin', 'editor'].includes(locals.profile.role))
			return fail(403, { error: 'Non autorisé.' });

		const parsed = visibilitySchema.safeParse(Object.fromEntries(await request.formData()));
		if (!parsed.success)
			return fail(400, { error: parsed.error.issues[0]?.message ?? 'Invalide.' });

		const supabase = createServiceClient();
		const { error: err } = await supabase
			.from('document')
			.update({ visibility: parsed.data.visibility })
			.eq('id', params.id);

		if (err) return fail(400, { error: err.message });

		await writeAuditLog({
			actorId: locals.profile.id,
			action: 'document.visibility',
			entity: 'document',
			entityId: params.id,
			payload: { visibility: parsed.data.visibility }
		});

		return { success: true };
	},

	delete: async ({ locals, params }) => {
		if (!locals.profile || !['admin', 'editor'].includes(locals.profile.role))
			return fail(403, { error: 'Non autorisé.' });

		const supabase = createServiceClient();

		// Récupérer le storage_path avant suppression
		const { data: doc } = await supabase
			.from('document')
			.select('storage_path')
			.eq('id', params.id)
			.single();

		if (!doc) return fail(404, { error: 'Document introuvable.' });

		// Supprimer le fichier Storage
		await supabase.storage.from(STORAGE_BUCKET).remove([doc.storage_path]);

		// Supprimer la ligne DB
		const { error: err } = await supabase.from('document').delete().eq('id', params.id);
		if (err) return fail(400, { error: err.message });

		await writeAuditLog({
			actorId: locals.profile.id,
			action: 'document.delete',
			entity: 'document',
			entityId: params.id,
			payload: { storage_path: doc.storage_path }
		});

		throw redirect(303, '/documents');
	}
};
