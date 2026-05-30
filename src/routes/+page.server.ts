import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const user = await locals.safeGetUser();
	const profile = locals.profile;
	if (user && profile?.must_change_credentials) throw redirect(303, '/change-credentials');
	if (user) throw redirect(303, '/app/');
	throw redirect(303, '/login');
};
