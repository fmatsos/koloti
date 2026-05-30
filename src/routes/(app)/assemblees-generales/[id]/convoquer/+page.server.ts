import { error, fail, redirect } from '@sveltejs/kit';
import { createServiceClient } from '$lib/server/supabase';
import { writeAuditLog } from '$lib/server/audit';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!locals.profile || !['admin', 'editor'].includes(locals.profile.role)) {
		throw redirect(303, '/app/');
	}

	const supabase = createServiceClient();
	const { data: ag } = await supabase
		.from('assembly')
		.select('id, title, status, scheduled_at, agenda_item(id, title)')
		.eq('id', params.id)
		.single();

	if (!ag) throw error(404, 'Assemblée introuvable');
	if (ag.status !== 'draft') throw error(400, "L'AG n'est pas en statut draft.");

	const items = Array.isArray(ag.agenda_item) ? ag.agenda_item : [];
	return { session: locals.session, profile: locals.profile, ag, itemCount: items.length };
};

export const actions: Actions = {
	default: async ({ locals, params, fetch }) => {
		if (!locals.profile || !['admin', 'editor'].includes(locals.profile.role))
			return fail(403, { error: 'Non autorisé.' });

		// Appel de la Edge Function convene-assembly
		const fnUrl = `${PUBLIC_SUPABASE_URL}/functions/v1/convene-assembly`;
		const res = await fetch(fnUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
				'x-koloti-actor-id': locals.profile.id
			},
			body: JSON.stringify({ assembly_id: params.id })
		});

		if (!res.ok) {
			const body = await res.json().catch(() => ({}));
			return fail(res.status, {
				error: (body as { error?: string }).error ?? 'Erreur lors de la convocation.'
			});
		}

		const result = await res.json();

		await writeAuditLog({
			actorId: locals.profile.id,
			action: 'assembly.convene_initiated',
			entity: 'assembly',
			entityId: params.id,
			payload: { recipients: result.recipients }
		});

		redirect(303, `/assemblees-generales/${params.id}`);
	}
};
