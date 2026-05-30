import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	const { user, profile } = locals;

	if (!user || !profile) {
		throw redirect(303, '/login');
	}

	if (profile.status !== 'active') {
		throw redirect(303, '/login?error=account_inactive');
	}

	return { user, profile };
};
