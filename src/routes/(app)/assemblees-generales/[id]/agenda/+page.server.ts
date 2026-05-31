import { error, fail, redirect } from '@sveltejs/kit';
import { z } from 'zod/v4';
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
		.select('id, title, status')
		.eq('id', params.id)
		.single();

	if (!ag) throw error(404, 'Assemblée introuvable');

	const { data: items } = await supabase
		.from('agenda_item')
		.select('id, position, title, description, requires_vote')
		.eq('assembly_id', params.id)
		.order('position');

	return { session: locals.session, profile: locals.profile, ag, items: items ?? [] };
};

const addSchema = z.object({
	title: z.string().min(1).max(255).trim(),
	description: z.string().max(2000).trim().optional(),
	requires_vote: z.coerce.boolean().default(false)
});

const updateSchema = z.object({
	item_id: z.string().uuid(),
	title: z.string().min(1).max(255).trim(),
	description: z.string().max(2000).trim().optional(),
	requires_vote: z.coerce.boolean().default(false)
});

const deleteSchema = z.object({ item_id: z.string().uuid() });
const moveSchema = z.object({ item_id: z.string().uuid(), direction: z.enum(['up', 'down']) });

export const actions: Actions = {
	add: async ({ request, locals, params }) => {
		if (!locals.profile || !['admin', 'editor'].includes(locals.profile.role))
			return fail(403, { error: 'Non autorisé.' });

		const supabase = createServiceClient();
		const { data: ag } = await supabase
			.from('assembly')
			.select('status')
			.eq('id', params.id)
			.single();
		if (ag?.status !== 'draft')
			return fail(400, {
				error: "L'ordre du jour ne peut être modifié que si l'AG est en brouillon."
			});

		const parsed = addSchema.safeParse(Object.fromEntries(await request.formData()));
		if (!parsed.success)
			return fail(400, { error: parsed.error.issues[0]?.message ?? 'Invalide.' });

		// Prochain numéro de position
		const { count } = await supabase
			.from('agenda_item')
			.select('id', { count: 'exact', head: true })
			.eq('assembly_id', params.id);
		const position = (count ?? 0) + 1;

		const { error: err } = await supabase.from('agenda_item').insert({
			assembly_id: params.id,
			title: parsed.data.title,
			description: parsed.data.description || null,
			requires_vote: parsed.data.requires_vote,
			position
		});

		if (err) return fail(400, { error: err.message });
		await writeAuditLog({
			actorId: locals.profile.id,
			action: 'agenda_item.add',
			entity: 'agenda_item',
			payload: { assembly_id: params.id, title: parsed.data.title }
		});
		return { success: true };
	},

	update: async ({ request, locals, params }) => {
		if (!locals.profile || !['admin', 'editor'].includes(locals.profile.role))
			return fail(403, { error: 'Non autorisé.' });

		const supabase = createServiceClient();
		const { data: ag } = await supabase
			.from('assembly')
			.select('status')
			.eq('id', params.id)
			.single();
		if (ag?.status !== 'draft')
			return fail(400, { error: 'Modification impossible hors brouillon.' });

		const parsed = updateSchema.safeParse(Object.fromEntries(await request.formData()));
		if (!parsed.success)
			return fail(400, { error: parsed.error.issues[0]?.message ?? 'Invalide.' });

		const { error: err } = await supabase
			.from('agenda_item')
			.update({
				title: parsed.data.title,
				description: parsed.data.description || null,
				requires_vote: parsed.data.requires_vote
			})
			.eq('id', parsed.data.item_id)
			.eq('assembly_id', params.id);

		if (err) return fail(400, { error: err.message });
		return { success: true };
	},

	delete: async ({ request, locals, params }) => {
		if (!locals.profile || !['admin', 'editor'].includes(locals.profile.role))
			return fail(403, { error: 'Non autorisé.' });

		const supabase = createServiceClient();
		const { data: ag } = await supabase
			.from('assembly')
			.select('status')
			.eq('id', params.id)
			.single();
		if (ag?.status !== 'draft')
			return fail(400, { error: 'Suppression impossible hors brouillon.' });

		const parsed = deleteSchema.safeParse(Object.fromEntries(await request.formData()));
		if (!parsed.success) return fail(400, { error: 'Invalide.' });

		// Supprimer puis renuméroter
		const { data: deleted } = await supabase
			.from('agenda_item')
			.delete()
			.eq('id', parsed.data.item_id)
			.eq('assembly_id', params.id)
			.select('position')
			.single();
		if (deleted) {
			const { data: remaining } = await supabase
				.from('agenda_item')
				.select('id, position')
				.eq('assembly_id', params.id)
				.order('position');
			for (let i = 0; i < (remaining ?? []).length; i++) {
				await supabase
					.from('agenda_item')
					.update({ position: i + 1 })
					.eq('id', remaining![i].id);
			}
		}
		return { success: true };
	},

	move: async ({ request, locals, params }) => {
		if (!locals.profile || !['admin', 'editor'].includes(locals.profile.role))
			return fail(403, { error: 'Non autorisé.' });

		const supabase = createServiceClient();
		const { data: ag } = await supabase
			.from('assembly')
			.select('status')
			.eq('id', params.id)
			.single();
		if (ag?.status !== 'draft')
			return fail(400, { error: 'Modification impossible hors brouillon.' });

		const parsed = moveSchema.safeParse(Object.fromEntries(await request.formData()));
		if (!parsed.success) return fail(400, { error: 'Invalide.' });

		const { data: item } = await supabase
			.from('agenda_item')
			.select('id, position')
			.eq('id', parsed.data.item_id)
			.single();
		if (!item) return fail(404, { error: 'Point introuvable.' });

		const swapPos = parsed.data.direction === 'up' ? item.position - 1 : item.position + 1;
		const { data: neighbor } = await supabase
			.from('agenda_item')
			.select('id')
			.eq('assembly_id', params.id)
			.eq('position', swapPos)
			.single();
		if (!neighbor) return { success: true }; // déjà au bout

		// Swap positions
		await supabase.from('agenda_item').update({ position: swapPos }).eq('id', item.id);
		await supabase.from('agenda_item').update({ position: item.position }).eq('id', neighbor.id);
		return { success: true };
	}
};
