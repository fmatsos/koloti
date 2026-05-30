import { fail, redirect } from '@sveltejs/kit';
import { z } from 'zod/v4';
import { createServiceClient } from '$lib/server/supabase';
import { writeAuditLog } from '$lib/server/audit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	return { session: locals.session, profile: locals.profile };
};

const createSchema = z.object({
	title: z.string().min(1).max(255).trim(),
	type: z.enum(['ordinaire', 'extraordinaire']),
	mode: z.enum(['presentiel', 'en_ligne', 'hybride']),
	scheduled_at: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/),
	location: z.string().max(300).trim().optional(),
	quorum_pct: z.coerce.number().int().min(1).max(100).default(50)
});

export const actions: Actions = {
	default: async ({ request, locals }) => {
		if (!locals.profile || !['admin', 'editor'].includes(locals.profile.role))
			return fail(403, { error: 'Non autorisé.' });

		const parsed = createSchema.safeParse(Object.fromEntries(await request.formData()));
		if (!parsed.success)
			return fail(400, { error: parsed.error.issues[0]?.message ?? 'Invalide.' });

		const supabase = createServiceClient();
		const { data: ag, error: err } = await supabase
			.from('assembly')
			.insert({
				title: parsed.data.title,
				type: parsed.data.type,
				mode: parsed.data.mode,
				scheduled_at: parsed.data.scheduled_at,
				location: parsed.data.location || null,
				quorum_pct: parsed.data.quorum_pct,
				status: 'draft',
				created_by: locals.profile.id
			})
			.select('id')
			.single();

		if (err || !ag) return fail(500, { error: err?.message ?? 'Erreur interne.' });

		await writeAuditLog({
			actorId: locals.profile.id,
			action: 'assembly.create',
			entity: 'assembly',
			entityId: ag.id,
			payload: {
				title: parsed.data.title,
				type: parsed.data.type,
				scheduled_at: parsed.data.scheduled_at
			}
		});

		redirect(303, `/admin/ag/${ag.id}`);
	}
};
