import { redirect } from '@sveltejs/kit';
import { createServiceClient } from '$lib/server/supabase';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.profile || locals.profile.role !== 'admin') throw redirect(303, '/app/');

	const supabase = createServiceClient();
	const search = url.searchParams.get('q') ?? '';
	const statusFilter = url.searchParams.get('status') ?? '';

	let query = supabase
		.from('profile')
		.select('id, first_name, last_name, email, role, status, last_login_at, credential(login)')
		.order('last_name');

	if (search) query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);
	if (statusFilter) query = query.eq('status', statusFilter as 'pending' | 'active' | 'inactive');

	const { data: comptes } = await query;

	return {
		session: locals.session,
		profile: locals.profile,
		comptes: comptes ?? [],
		search,
		statusFilter
	};
};
