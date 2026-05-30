import { createServiceClient } from '$lib/server/supabase';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const supabase = createServiceClient();

	const { data: posts } = await supabase
		.from('info_post')
		.select('id, title, is_published, published_at, created_at, author:author_id(full_name)')
		.order('created_at', { ascending: false });

	return { session: locals.session, profile: locals.profile, posts: posts ?? [] };
};
