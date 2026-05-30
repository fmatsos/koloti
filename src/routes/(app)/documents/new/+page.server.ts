import { fail, redirect } from '@sveltejs/kit';
import { z } from 'zod/v4';
import { createServiceClient } from '$lib/server/supabase';
import { writeAuditLog } from '$lib/server/audit';
import type { Actions, PageServerLoad } from './$types';

const STORAGE_BUCKET = 'documents';
const MAX_SIZE_BYTES = 20 * 1024 * 1024; // 20 Mo

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.profile || !['admin', 'editor'].includes(locals.profile.role)) {
		throw redirect(303, '/app/');
	}

	return { session: locals.session, profile: locals.profile };
};

const metaSchema = z.object({
	title: z.string().min(1).max(255).trim(),
	type: z.enum([
		'statuts',
		'pv_ag',
		'budget',
		'facture',
		'cahier_charges',
		'convocation',
		'courrier',
		'autre'
	]),
	visibility: z.enum(['members', 'editors', 'admin']).default('members'),
	description: z.string().max(1000).trim().optional(),
	year: z.coerce.number().int().min(2000).max(2100).optional()
});

export const actions: Actions = {
	default: async ({ request, locals }) => {
		if (!locals.profile || !['admin', 'editor'].includes(locals.profile.role))
			return fail(403, { error: 'Non autorisé.' });

		const formData = await request.formData();
		const file = formData.get('file') as File | null;

		if (!file || file.size === 0) return fail(400, { error: 'Fichier requis.' });
		if (file.size > MAX_SIZE_BYTES)
			return fail(400, { error: 'Fichier trop volumineux (max 20 Mo).' });

		const parsed = metaSchema.safeParse(Object.fromEntries(formData));
		if (!parsed.success)
			return fail(400, { error: parsed.error.issues[0]?.message ?? 'Invalide.' });

		const supabase = createServiceClient();

		// Chemin unique dans Storage
		const ext = file.name.split('.').pop() ?? 'bin';
		const storagePath = `${parsed.data.year ?? 'misc'}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

		const arrayBuffer = await file.arrayBuffer();
		const { error: storageErr } = await supabase.storage
			.from(STORAGE_BUCKET)
			.upload(storagePath, arrayBuffer, {
				contentType: file.type || 'application/octet-stream',
				upsert: false
			});

		if (storageErr) return fail(500, { error: `Erreur upload : ${storageErr.message}` });

		const { data: doc, error: dbErr } = await supabase
			.from('document')
			.insert({
				title: parsed.data.title,
				type: parsed.data.type,
				visibility: parsed.data.visibility,
				description: parsed.data.description || null,
				year: parsed.data.year ?? null,
				storage_path: storagePath,
				mime_type: file.type || null,
				size_bytes: file.size,
				uploaded_by: locals.profile.id
			})
			.select('id')
			.single();

		if (dbErr || !doc) {
			// Rollback Storage upload
			await supabase.storage.from(STORAGE_BUCKET).remove([storagePath]);
			return fail(500, { error: dbErr?.message ?? 'Erreur interne.' });
		}

		await writeAuditLog({
			actorId: locals.profile.id,
			action: 'document.upload',
			entity: 'document',
			entityId: doc.id,
			payload: {
				title: parsed.data.title,
				type: parsed.data.type,
				visibility: parsed.data.visibility,
				size_bytes: file.size
			}
		});

		redirect(303, '/documents');
	}
};
