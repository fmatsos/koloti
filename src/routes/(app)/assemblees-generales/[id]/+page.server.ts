import { error, fail } from '@sveltejs/kit';
import { z } from 'zod/v4';
import { createServiceClient } from '$lib/server/supabase';
import { writeAuditLog } from '$lib/server/audit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const supabase = createServiceClient();
	const isAdminOrEditor = ['admin', 'editor'].includes(locals.profile?.role ?? '');
	const { data: ag } = await supabase
		.from('assembly')
		.select('*, agenda_item(id, position, title, description, requires_vote)')
		.eq('id', params.id)
		.order('position', { referencedTable: 'agenda_item', ascending: true })
		.single();

	if (!ag) throw error(404, 'Assemblée introuvable');
	if (ag.status === 'draft' && !isAdminOrEditor) throw error(404, 'Assemblée introuvable');

	return { session: locals.session, profile: locals.profile, ag, isAdminOrEditor };
};

const editSchema = z.object({
	title: z.string().min(1).max(255).trim(),
	type: z.enum(['ordinaire', 'extraordinaire']),
	mode: z.enum(['presentiel', 'en_ligne', 'hybride']),
	scheduled_at: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/),
	location: z.string().max(300).trim().optional(),
	quorum_pct: z.coerce.number().int().min(1).max(100)
});

export const actions: Actions = {
	update: async ({ request, locals, params }) => {
		if (!locals.profile || !['admin', 'editor'].includes(locals.profile.role))
			return fail(403, { error: 'Non autorisé.' });

		const supabase = createServiceClient();
		const { data: current } = await supabase
			.from('assembly')
			.select('status')
			.eq('id', params.id)
			.single();
		if (current?.status !== 'draft')
			return fail(400, { error: 'Seule une AG en brouillon peut être modifiée.' });

		const parsed = editSchema.safeParse(Object.fromEntries(await request.formData()));
		if (!parsed.success)
			return fail(400, { error: parsed.error.issues[0]?.message ?? 'Invalide.' });

		const { error: err } = await supabase
			.from('assembly')
			.update({
				title: parsed.data.title,
				type: parsed.data.type,
				mode: parsed.data.mode,
				scheduled_at: parsed.data.scheduled_at,
				location: parsed.data.location || null,
				quorum_pct: parsed.data.quorum_pct
			})
			.eq('id', params.id);

		if (err) return fail(400, { error: err.message });

		await writeAuditLog({
			actorId: locals.profile.id,
			action: 'assembly.update',
			entity: 'assembly',
			entityId: params.id,
			payload: { title: parsed.data.title }
		});
		return { success: true };
	},

	open: async ({ locals, params }) => {
		if (!locals.profile || !['admin', 'editor'].includes(locals.profile.role))
			return fail(403, { error: 'Non autorisé.' });

		const supabase = createServiceClient();
		const { data: current } = await supabase
			.from('assembly')
			.select('status')
			.eq('id', params.id)
			.single();
		if (current?.status !== 'convened')
			return fail(400, { error: "L'AG doit être convoquée avant d'être ouverte." });

		const { error: err } = await supabase
			.from('assembly')
			.update({
				status: 'open',
				opened_at: new Date().toISOString()
			})
			.eq('id', params.id);

		if (err) return fail(400, { error: err.message });

		await writeAuditLog({
			actorId: locals.profile.id,
			action: 'assembly.open',
			entity: 'assembly',
			entityId: params.id,
			payload: {}
		});

		// Fire-and-forget: do not await, failure must not affect the action
		supabase.functions.invoke('notify-assembly-open', {
			body: { assembly_id: params.id }
		}).catch((e) => console.error('[notify-assembly-open] invoke error:', e));

		return { success: true };
	},

	close: async ({ locals, params }) => {
		// Clôturer est réservé aux admins uniquement (pas aux éditeurs)
		if (!locals.profile || locals.profile.role !== 'admin')
			return fail(403, { error: 'Non autorisé.' });

		const supabase = createServiceClient();
		const { data: current } = await supabase
			.from('assembly')
			.select('status')
			.eq('id', params.id)
			.single();
		if (!current)
			return fail(404, { error: 'Assemblée introuvable.' });
		if (current.status !== 'open')
			return fail(400, { error: "L'AG doit être en cours pour être clôturée." });

		const { error: err } = await supabase
			.from('assembly')
			.update({
				status: 'closed',
				closed_at: new Date().toISOString()
			})
			.eq('id', params.id);

		if (err) return fail(400, { error: err.message });

		await writeAuditLog({
			actorId: locals.profile.id,
			action: 'assembly.close',
			entity: 'assembly',
			entityId: params.id,
			payload: {}
		});
		return { success: true };
	}
};
