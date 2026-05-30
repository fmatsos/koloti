import { error, fail, redirect } from '@sveltejs/kit';
import { z } from 'zod/v4';
import { createServiceClient } from '$lib/server/supabase';
import { writeAuditLog } from '$lib/server/audit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!locals.profile || !['admin', 'editor'].includes(locals.profile.role)) {
		throw redirect(303, '/app/');
	}

	const supabase = createServiceClient();
	const { data: post } = await supabase
		.from('info_post')
		.select('id, title, body, is_published, published_at, created_at')
		.eq('id', params.id)
		.single();

	if (!post) throw error(404, 'Post introuvable');
	return { session: locals.session, profile: locals.profile, post };
};

const updateSchema = z.object({
	title: z.string().min(1).max(255).trim(),
	body: z.string().min(1).max(50000).trim(),
	is_published: z.coerce.boolean().default(false)
});

export const actions: Actions = {
	update: async ({ request, locals, params }) => {
		if (!locals.profile || !['admin', 'editor'].includes(locals.profile.role))
			return fail(403, { error: 'Non autorisé.' });

		const parsed = updateSchema.safeParse(Object.fromEntries(await request.formData()));
		if (!parsed.success)
			return fail(400, { error: parsed.error.issues[0]?.message ?? 'Invalide.' });

		const supabase = createServiceClient();

		const { data: current } = await supabase
			.from('info_post')
			.select('is_published, published_at')
			.eq('id', params.id)
			.single();

		const publishedAt =
			parsed.data.is_published && !current?.is_published
				? new Date().toISOString()
				: (current?.published_at ?? null);

		const { error: err } = await supabase
			.from('info_post')
			.update({
				title: parsed.data.title,
				body: parsed.data.body,
				is_published: parsed.data.is_published,
				published_at: publishedAt
			})
			.eq('id', params.id);

		if (err) return fail(400, { error: err.message });

		await writeAuditLog({
			actorId: locals.profile.id,
			action: 'info_post.update',
			entity: 'info_post',
			entityId: params.id,
			payload: { title: parsed.data.title, is_published: parsed.data.is_published }
		});

		return { success: true };
	},

	delete: async ({ locals, params }) => {
		if (!locals.profile || locals.profile.role !== 'admin')
			return fail(403, { error: 'Non autorisé.' });

		const supabase = createServiceClient();
		const { error: err } = await supabase.from('info_post').delete().eq('id', params.id);
		if (err) return fail(400, { error: err.message });

		await writeAuditLog({
			actorId: locals.profile.id,
			action: 'info_post.delete',
			entity: 'info_post',
			entityId: params.id
		});

		throw redirect(303, '/informations');
	}
};
