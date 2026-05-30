import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const user = await locals.safeGetUser();
	if (user) throw redirect(303, '/app/');
	throw redirect(303, '/login');
};
