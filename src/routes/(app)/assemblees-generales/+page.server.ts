import { createServiceClient } from '$lib/server/supabase';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const supabase = createServiceClient();
	const { data: assemblees } = await supabase
		.from('assembly')
		.select('id, title, type, mode, status, scheduled_at')
		.neq('status', 'draft')
		.order('scheduled_at', { ascending: false });

	return { session: locals.session, profile: locals.profile, assemblees: assemblees ?? [] };
};
