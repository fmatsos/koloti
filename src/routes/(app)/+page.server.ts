import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const { data: recentPosts } = await locals.supabase
		.from('info_post')
		.select('id, title, published_at')
		.eq('is_published', true)
		.order('published_at', { ascending: false })
		.limit(3);

	return { profile: locals.profile, recentPosts: recentPosts ?? [] };
};
