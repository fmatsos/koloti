import { createServiceClient } from '$lib/server/supabase';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const supabase = createServiceClient();

	const { data: rows } = await supabase
		.from('property')
		.select(
			'id, reference, address, vote_weight, ownership(id, start_date, end_date, is_primary, profile:profile_id(full_name, email, phone))'
		)
		.order('reference');

	const exportCsv = url.searchParams.get('export') === 'csv';

	const properties = (rows ?? []).map((prop) => {
		const ownerships = Array.isArray(prop.ownership) ? prop.ownership : [];
		const active = ownerships.filter((o: { end_date: string | null }) => !o.end_date);
		return { ...prop, activeOwnerships: active };
	});

	return { session: locals.session, profile: locals.profile, properties, exportCsv };
};
