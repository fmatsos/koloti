import { error, fail, redirect } from '@sveltejs/kit';
import { createServiceClient } from '$lib/server/supabase';
import { writeAuditLog } from '$lib/server/audit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!locals.profile || !['admin', 'editor'].includes(locals.profile.role)) {
		throw redirect(303, '/');
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
	default: async ({ locals, params }) => {
		if (!locals.profile || !['admin', 'editor'].includes(locals.profile.role))
			return fail(403, { error: 'Non autorisé.' });

		const supabase = createServiceClient();
		const { data, error: fnError } = await supabase.functions.invoke('convene-assembly', {
			body: { assembly_id: params.id },
			headers: { 'x-koloti-actor-id': locals.profile.id }
		});

		if (fnError) {
			return fail(500, { error: fnError.message ?? 'Erreur lors de la convocation.' });
		}

		await writeAuditLog({
			actorId: locals.profile.id,
			action: 'assembly.convene_initiated',
			entity: 'assembly',
			entityId: params.id,
			payload: { recipients: data.recipients }
		});

		redirect(303, `/assemblees-generales/${params.id}`);
	}
};
