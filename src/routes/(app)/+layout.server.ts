import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	const { user, profile } = locals;

	if (!user || !profile) {
		throw redirect(303, '/login');
	}

	if (profile.must_change_credentials) {
		throw redirect(303, '/change-credentials');
	}

	if (profile?.status === 'inactive') {
		throw redirect(303, '/login?error=account_inactive');
	}

	if (profile?.status === 'pending') {
		throw redirect(303, '/login?error=account_pending');
	}

	return { user, profile };
};
