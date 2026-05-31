import { redirect } from '@sveltejs/kit';
import { loadInfoPage } from '$lib/server/info-posts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
	const page = parseInt(params.num, 10);
	if (Number.isNaN(page) || page < 2) throw redirect(303, '/informations');

	const result = await loadInfoPage(page, locals.profile);
	if (page > result.totalPages && result.totalPages > 0) throw redirect(303, '/informations');

	return { session: locals.session, profile: locals.profile, ...result };
};
