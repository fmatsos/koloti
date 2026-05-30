import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const { data: proprietes } = await locals.supabase
		.from('property')
		.select('id, reference, address, vote_weight, created_at')
		.order('reference');

	return { session: locals.session, profile: locals.profile, proprietes: proprietes ?? [] };
};
