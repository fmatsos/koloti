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
	body: z.string().min(1).max(50000).trim(),
	is_published: z.coerce.boolean().default(false)
});

export const actions: Actions = {
	default: async ({ request, locals }) => {
		if (!locals.profile || !['admin', 'editor'].includes(locals.profile.role))
			return fail(403, { error: 'Non autorisé.' });

		const parsed = createSchema.safeParse(Object.fromEntries(await request.formData()));
		if (!parsed.success)
			return fail(400, { error: parsed.error.issues[0]?.message ?? 'Invalide.' });

		const supabase = createServiceClient();
		const { data: post, error: err } = await supabase
			.from('info_post')
			.insert({
				title: parsed.data.title,
				body: parsed.data.body,
				is_published: parsed.data.is_published,
				author_id: locals.profile.id,
				published_at: parsed.data.is_published ? new Date().toISOString() : null
			})
			.select('id')
			.single();

		if (err || !post) return fail(500, { error: err?.message ?? 'Erreur interne.' });

		await writeAuditLog({
			actorId: locals.profile.id,
			action: 'info_post.create',
			entity: 'info_post',
			entityId: post.id,
			payload: { title: parsed.data.title, is_published: parsed.data.is_published }
		});

		redirect(303, '/admin/informations');
	}
};
