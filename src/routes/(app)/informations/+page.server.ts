import { loadInfoPage } from '$lib/server/info-posts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const result = await loadInfoPage(1, locals.profile);
	return { session: locals.session, profile: locals.profile, ...result };
};
