import { createServiceClient } from '$lib/server/supabase';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const supabase = createServiceClient();
	const isAdminOrEditor = ['admin', 'editor'].includes(locals.profile?.role ?? '');

	let query = supabase
		.from('assembly')
		.select('id, title, type, mode, status, scheduled_at')
		.order('scheduled_at', { ascending: false });

	if (!isAdminOrEditor) query = query.neq('status', 'draft');

	const { data: assemblees } = await query;

	return { session: locals.session, profile: locals.profile, assemblees: assemblees ?? [], isAdminOrEditor };
};
