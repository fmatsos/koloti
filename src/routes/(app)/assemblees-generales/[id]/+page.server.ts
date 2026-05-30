import { error } from '@sveltejs/kit';
import { createServiceClient } from '$lib/server/supabase';
import { computeQuorum } from '$lib/server/quorum';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const supabase = createServiceClient();
	const { data: ag } = await supabase
		.from('assembly')
		.select(
			'id, title, type, mode, status, scheduled_at, location, quorum_pct, agenda_item(id, position, title, description, requires_vote)'
		)
		.eq('id', params.id)
		.single();

	if (!ag) throw error(404, 'Assemblée introuvable');

	const agendaItems = (Array.isArray(ag.agenda_item) ? ag.agenda_item : []).sort(
		(a: { position: number }, b: { position: number }) => a.position - b.position
	);

	let quorum = null;
	if (ag.status === 'open') {
		const { data: properties } = await supabase.from('property').select('id, vote_weight');
		const { data: attendances } = await supabase
			.from('attendance')
			.select('property_id, mode')
			.eq('assembly_id', params.id);
		const totalVoteWeight = (properties ?? []).reduce((s, p) => s + p.vote_weight, 0);
		const propMap = new Map((properties ?? []).map((p) => [p.id, p.vote_weight]));
		quorum = computeQuorum({
			attendances: (attendances ?? []).map((a) => ({
				mode: a.mode,
				vote_weight: propMap.get(a.property_id) ?? 1
			})),
			totalVoteWeight,
			quorumPct: ag.quorum_pct
		});
	}

	return { session: locals.session, profile: locals.profile, ag, agendaItems, quorum };
};
