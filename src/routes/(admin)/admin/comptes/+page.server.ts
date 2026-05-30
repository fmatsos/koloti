import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const { profile } = locals;
	if (!profile || profile.role !== 'admin') throw redirect(303, '/app/');

	const statusFilter = url.searchParams.get('status') ?? 'all';
	const search = url.searchParams.get('q') ?? '';

	let query = locals.supabase
		.from('profile')
		.select(
			`
			id, full_name, email, phone, role, status, last_login_at, activated_at, created_at,
			credential(login)
		`
		)
		.order('created_at', { ascending: false });

	if (statusFilter !== 'all') {
		query = query.eq('status', statusFilter as 'pending' | 'active' | 'inactive');
	}

	if (search) {
		query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
	}

	const { data: comptes, error } = await query;

	return {
		session: locals.session,
		profile,
		comptes: comptes ?? [],
		statusFilter,
		search,
		error: error?.message ?? null
	};
};
