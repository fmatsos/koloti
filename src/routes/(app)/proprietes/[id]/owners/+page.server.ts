import { error, fail, redirect } from '@sveltejs/kit';
import { z } from 'zod/v4';
import { createServiceClient } from '$lib/server/supabase';
import { writeAuditLog } from '$lib/server/audit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!locals.profile || !['admin', 'editor'].includes(locals.profile.role)) {
		throw redirect(303, '/app/');
	}

	const supabase = createServiceClient();

	const { data: prop } = await supabase
		.from('property')
		.select('id, reference')
		.eq('id', params.id)
		.single();
	if (!prop) throw error(404, 'Propriété introuvable');

	const { data: ownerships } = await supabase
		.from('ownership')
		.select(
			'id, profile_id, start_date, end_date, is_primary, profile:profile_id(full_name, email)'
		)
		.eq('property_id', params.id)
		.order('start_date', { ascending: false });

	const { data: profiles } = await supabase
		.from('profile')
		.select('id, full_name, email')
		.eq('status', 'active')
		.order('full_name');

	return {
		session: locals.session,
		profile: locals.profile,
		prop,
		ownerships: ownerships ?? [],
		profiles: profiles ?? []
	};
};

const addSchema = z.object({
	profile_id: z.string().uuid(),
	start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
	is_primary: z.coerce.boolean().default(true)
});

const endSchema = z.object({
	ownership_id: z.string().uuid(),
	end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
});

export const actions: Actions = {
	add: async ({ request, locals, params }) => {
		if (!locals.profile || !['admin', 'editor'].includes(locals.profile.role))
			return fail(403, { error: 'Non autorisé.' });
		const parsed = addSchema.safeParse(Object.fromEntries(await request.formData()));
		if (!parsed.success)
			return fail(400, { error: parsed.error.issues[0]?.message ?? 'Invalide.' });

		const supabase = createServiceClient();
		const { error: err } = await supabase.from('ownership').insert({
			property_id: params.id,
			profile_id: parsed.data.profile_id,
			start_date: parsed.data.start_date,
			is_primary: parsed.data.is_primary
		});

		if (err) return fail(400, { error: err.message });
		await writeAuditLog({
			actorId: locals.profile.id,
			action: 'ownership.add',
			entity: 'ownership',
			payload: { property_id: params.id, ...parsed.data }
		});
		return { success: true };
	},

	end: async ({ request, locals }) => {
		if (!locals.profile || !['admin', 'editor'].includes(locals.profile.role))
			return fail(403, { error: 'Non autorisé.' });
		const parsed = endSchema.safeParse(Object.fromEntries(await request.formData()));
		if (!parsed.success)
			return fail(400, { error: parsed.error.issues[0]?.message ?? 'Invalide.' });

		const supabase = createServiceClient();
		await supabase
			.from('ownership')
			.update({ end_date: parsed.data.end_date })
			.eq('id', parsed.data.ownership_id);
		await writeAuditLog({
			actorId: locals.profile.id,
			action: 'ownership.end',
			entity: 'ownership',
			entityId: parsed.data.ownership_id,
			payload: { end_date: parsed.data.end_date }
		});
		return { success: true };
	}
};
