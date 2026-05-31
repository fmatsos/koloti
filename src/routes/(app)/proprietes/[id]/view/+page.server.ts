import { error, redirect } from '@sveltejs/kit';
import { createServiceClient } from '$lib/server/supabase';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!locals.profile || !['admin', 'editor'].includes(locals.profile.role)) {
		throw redirect(303, '/app/');
	}

	const supabase = createServiceClient();
	const { data: prop } = await supabase
		.from('property')
		.select(
			`
			id, reference, street_number, street_name, cadastre_number,
			ownership(id, start_date, end_date, is_primary,
				profile:profile_id(id, first_name, last_name, email))
		`
		)
		.eq('id', params.id)
		.single();

	if (!prop) throw error(404, 'Propriété introuvable');

	const all = Array.isArray(prop.ownership) ? prop.ownership : [];
	const ownerships = [...all].sort(
		(a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
	);

	return { session: locals.session, profile: locals.profile, prop, ownerships };
};
