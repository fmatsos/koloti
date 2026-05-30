import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	const { session, profile } = locals;

	if (!session || !profile) {
		throw redirect(303, '/login');
	}

	if (profile.status !== 'active') {
		throw redirect(303, '/login?error=account_inactive');
	}

	if (!['admin', 'editor'].includes(profile.role)) {
		throw redirect(303, '/app/?error=forbidden');
	}

	return { session, profile };
};
