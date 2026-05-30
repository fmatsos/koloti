import { createServiceClient } from '$lib/server/supabase';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const supabase = createServiceClient();
	const { data: assemblies } = await supabase
		.from('assembly')
		.select('id, title, type, mode, status, scheduled_at, convened_at, opened_at')
		.order('scheduled_at', { ascending: false });

	return { session: locals.session, profile: locals.profile, assemblies: assemblies ?? [] };
};
