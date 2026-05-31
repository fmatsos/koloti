import { error, fail, redirect } from '@sveltejs/kit';
import { z } from 'zod/v4';
import { createServiceClient } from '$lib/server/supabase';
import { writeAuditLog } from '$lib/server/audit';
import { computeQuorum } from '$lib/server/quorum';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!locals.profile || !['admin', 'editor'].includes(locals.profile.role)) {
		throw redirect(303, '/');
	}

	const supabase = createServiceClient();
	const { data: ag } = await supabase
		.from('assembly')
		.select('id, title, status, quorum_pct')
		.eq('id', params.id)
		.single();

	if (!ag) throw error(404, 'Assemblée introuvable');
	if (ag.status !== 'open')
		throw error(400, "L'émargement n'est disponible que si l'AG est en cours.");

	// Propriétés avec propriétaires actifs
	const { data: properties } = await supabase
		.from('property')
		.select(
			'id, reference, vote_weight, ownership(profile_id, is_primary, end_date, profile:profile_id(first_name, last_name))'
		)
		.order('reference');

	// Émargements déjà enregistrés
	const { data: attendances } = await supabase
		.from('attendance')
		.select('id, property_id, mode, profile_id')
		.eq('assembly_id', params.id);

	const attendanceMap = new Map((attendances ?? []).map((a) => [a.property_id, a]));

	const props = (properties ?? []).map((p) => {
		const ownerships = Array.isArray(p.ownership) ? p.ownership : [];
		const active = ownerships.filter((o) => !o.end_date);
		const primary = active.find((o: { is_primary: boolean }) => o.is_primary) ?? active[0];
		const profile = primary
			? Array.isArray(primary.profile)
				? primary.profile[0]
				: primary.profile
			: null;
		const attendance = attendanceMap.get(p.id);
		return {
			id: p.id,
			reference: p.reference,
			vote_weight: p.vote_weight,
			ownerName: profile ? `${profile.first_name} ${profile.last_name}`.trim() : '—',
			ownerId: primary?.profile_id ?? null,
			attendance
		};
	});

	// Calcul quorum
	const totalVoteWeight = (properties ?? []).reduce((s, p) => s + p.vote_weight, 0);
	const quorumResult = computeQuorum({
		attendances: (attendances ?? []).map((a) => {
			const prop = (properties ?? []).find((p) => p.id === a.property_id);
			return { mode: a.mode, vote_weight: prop?.vote_weight ?? 1 };
		}),
		totalVoteWeight,
		quorumPct: ag.quorum_pct
	});

	return { session: locals.session, profile: locals.profile, ag, props, quorum: quorumResult };
};

const attendSchema = z.object({
	property_id: z.string().uuid(),
	profile_id: z.string().uuid(),
	mode: z.enum(['present', 'represented', 'absent'])
});

export const actions: Actions = {
	default: async ({ request, locals, params }) => {
		if (!locals.profile || !['admin', 'editor'].includes(locals.profile.role))
			return fail(403, { error: 'Non autorisé.' });

		const parsed = attendSchema.safeParse(Object.fromEntries(await request.formData()));
		if (!parsed.success)
			return fail(400, { error: parsed.error.issues[0]?.message ?? 'Invalide.' });

		const supabase = createServiceClient();
		const { data: ag } = await supabase
			.from('assembly')
			.select('status')
			.eq('id', params.id)
			.single();
		if (ag?.status !== 'open') return fail(400, { error: "L'AG n'est pas ouverte." });

		// Upsert (unique par assembly_id, property_id)
		const { error: err } = await supabase.from('attendance').upsert(
			{
				assembly_id: params.id,
				property_id: parsed.data.property_id,
				profile_id: parsed.data.profile_id,
				mode: parsed.data.mode,
				recorded_at: new Date().toISOString()
			},
			{ onConflict: 'assembly_id,property_id' }
		);

		if (err) return fail(400, { error: err.message });

		await writeAuditLog({
			actorId: locals.profile.id,
			action: 'attendance.record',
			entity: 'attendance',
			payload: {
				assembly_id: params.id,
				property_id: parsed.data.property_id,
				mode: parsed.data.mode
			}
		});
		return { success: true };
	}
};
