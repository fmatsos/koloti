import { error } from '@sveltejs/kit';
import { renderMarkdown } from '$lib/server/markdown';
import { createServiceClient } from '$lib/server/supabase';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const isAdminOrEditor = ['admin', 'editor'].includes(locals.profile?.role ?? '');
	const supabase = createServiceClient();

	let query = supabase
		.from('info_post')
		.select('id, title, body, is_published, published_at, created_at, author:author_id(full_name)')
		.eq('id', params.id);

	if (!isAdminOrEditor) query = query.eq('is_published', true);

	const { data: post } = await query.single();
	if (!post) throw error(404, 'Information introuvable');

	return {
		session: locals.session,
		profile: locals.profile,
		post: { ...post, bodyHtml: await renderMarkdown(post.body ?? '') },
		isAdminOrEditor
	};
};
