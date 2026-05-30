import { redirect } from '@sveltejs/kit';
import { createServiceClient } from '$lib/server/supabase';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.profile || !['admin', 'editor'].includes(locals.profile.role)) {
		throw redirect(303, '/app/');
	}

	const supabase = createServiceClient();
	const { data: proprietes } = await supabase
		.from('property')
		.select('id, reference, street_number, street_name, cadastre_number')
		.order('reference');

	return { session: locals.session, profile: locals.profile, proprietes: proprietes ?? [] };
};
