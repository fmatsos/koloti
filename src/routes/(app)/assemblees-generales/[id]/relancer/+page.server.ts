import { error, fail, redirect } from '@sveltejs/kit';
import { createServiceClient } from '$lib/server/supabase';
import { writeAuditLog } from '$lib/server/audit';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!locals.profile || locals.profile.role !== 'admin') {
		throw redirect(303, '/app/');
	}

	const supabase = createServiceClient();
	const { data: ag } = await supabase
		.from('assembly')
		.select('id, title, status')
		.eq('id', params.id)
		.single();
	if (!ag) throw error(404, 'Assemblée introuvable');
	if (ag.status !== 'convened')
		throw error(400, "L'AG doit être convoquée pour relancer les comptes.");

	const { data: pending } = await supabase
		.from('profile')
		.select('id, full_name, email')
		.eq('status', 'pending')
		.order('full_name');

	return { session: locals.session, profile: locals.profile, ag, pending: pending ?? [] };
};

export const actions: Actions = {
	default: async ({ locals, params, fetch }) => {
		if (!locals.profile || locals.profile.role !== 'admin')
			return fail(403, { error: 'Réservé aux administrateurs.' });

		const supabase = createServiceClient();
		const { data: ag } = await supabase
			.from('assembly')
			.select('status')
			.eq('id', params.id)
			.single();
		if (ag?.status !== 'convened') return fail(400, { error: 'AG non convoquée.' });

		const { data: pending } = await supabase
			.from('profile')
			.select('id, full_name, email')
			.eq('status', 'pending');
		const fnUrl = `${PUBLIC_SUPABASE_URL}/functions/v1/issue-activation-link`;

		let sent = 0;
		const errors: string[] = [];

		for (const profile of pending ?? []) {
			const res = await fetch(fnUrl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${locals.session?.access_token ?? ''}`
				},
				body: JSON.stringify({ profile_id: profile.id })
			});
			if (res.ok) {
				sent++;
			} else {
				const body = await res.json().catch(() => ({}));
				errors.push(`${profile.email}: ${(body as { error?: string }).error ?? 'Erreur'}`);
			}
		}

		await writeAuditLog({
			actorId: locals.profile.id,
			action: 'activation.bulk_reissue',
			entity: 'assembly',
			entityId: params.id,
			payload: { sent, errors: errors.length }
		});

		return { success: true, sent, errors };
	}
};
