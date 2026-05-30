import { error } from '@sveltejs/kit';
import { createServiceClient } from '$lib/server/supabase';
import { computeQuorum } from '$lib/server/quorum';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const supabase = createServiceClient();
	const { data: ag } = await supabase
		.from('assembly')
		.select('id, title, status, quorum_pct')
		.eq('id', params.id)
		.single();

	if (!ag) throw error(404, 'Assemblée introuvable');

	const { data: properties } = await supabase.from('property').select('id, vote_weight');
	const { data: attendances } = await supabase
		.from('attendance')
		.select('property_id, mode')
		.eq('assembly_id', params.id);

	const totalVoteWeight = (properties ?? []).reduce((s, p) => s + p.vote_weight, 0);
	const propMap = new Map((properties ?? []).map((p) => [p.id, p.vote_weight]));

	const quorum = computeQuorum({
		attendances: (attendances ?? []).map((a) => ({
			mode: a.mode,
			vote_weight: propMap.get(a.property_id) ?? 1
		})),
		totalVoteWeight,
		quorumPct: ag.quorum_pct
	});

	const byMode = { present: 0, represented: 0, absent: 0 } as Record<string, number>;
	for (const a of attendances ?? []) {
		byMode[a.mode] = (byMode[a.mode] ?? 0) + (propMap.get(a.property_id) ?? 1);
	}

	return { session: locals.session, profile: locals.profile, ag, quorum, byMode, totalVoteWeight };
};
