import { redirect } from '@sveltejs/kit';
import { createServiceClient } from '$lib/server/supabase';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.profile || !['admin', 'editor'].includes(locals.profile.role)) {
		throw redirect(303, '/app/');
	}

	const supabase = createServiceClient();

	const { data: rows } = await supabase
		.from('property')
		.select(
			'id, reference, street_number, street_name, cadastre_number, vote_weight, ownership(id, start_date, end_date, is_primary, profile:profile_id(first_name, last_name, email, phone))'
		)
		.order('reference');

	const exportCsv = url.searchParams.get('export') === 'csv';

	const properties = (rows ?? []).map((prop) => {
		const ownerships = Array.isArray(prop.ownership) ? prop.ownership : [];
		const active = ownerships.filter((o: { end_date: string | null }) => !o.end_date);
		const formattedAddress = [prop.street_number, prop.street_name].filter(Boolean).join(' ');
		return { ...prop, formattedAddress, activeOwnerships: active };
	});

	return { session: locals.session, profile: locals.profile, properties, exportCsv };
};
