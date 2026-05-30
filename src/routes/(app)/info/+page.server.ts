import { createServiceClient } from '$lib/server/supabase';
import { renderMarkdown } from '$lib/server/markdown';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const supabase = createServiceClient();

	const { data: posts } = await supabase
		.from('info_post')
		.select('id, title, body, published_at, author:author_id(full_name)')
		.eq('is_published', true)
		.order('published_at', { ascending: false });

	const rendered = await Promise.all(
		(posts ?? []).map(async (p) => ({
			...p,
			bodyHtml: await renderMarkdown(p.body ?? '')
		}))
	);

	return { session: locals.session, profile: locals.profile, posts: rendered };
};
