import { renderMarkdown } from '$lib/server/markdown';
import { createServiceClient } from '$lib/server/supabase';

export const INFO_PAGE_SIZE = 10;

function truncateMarkdown(md: string, maxLen: number): { preview: string; truncated: boolean } {
	if (md.length <= maxLen) return { preview: md, truncated: false };

	const cut = md.lastIndexOf(' ', maxLen);
	const pos = cut > 0 ? cut : maxLen;

	return { preview: `${md.slice(0, pos)}...`, truncated: true };
}

export async function loadInfoPage(page: number, profile: { role: string } | null) {
	const supabase = createServiceClient();
	const isAdminOrEditor = ['admin', 'editor'].includes(profile?.role ?? '');
	const from = (page - 1) * INFO_PAGE_SIZE;
	const to = from + INFO_PAGE_SIZE - 1;

	let query = supabase
		.from('info_post')
		.select(
			'id, title, body, is_published, published_at, created_at, author:author_id(full_name)',
			{
				count: 'exact'
			}
		)
		.order('published_at', { ascending: false });

	if (!isAdminOrEditor) query = query.eq('is_published', true);

	const { data: posts, count } = await query.range(from, to);
	const totalPages = Math.ceil((count ?? 0) / INFO_PAGE_SIZE);

	const postsWithPreview = await Promise.all(
		(posts ?? []).map(async (post) => {
			const { preview, truncated } = truncateMarkdown(post.body ?? '', 500);

			return {
				...post,
				bodyPreviewHtml: await renderMarkdown(preview),
				isTruncated: truncated
			};
		})
	);

	return { posts: postsWithPreview, totalPages, currentPage: page, isAdminOrEditor };
}
