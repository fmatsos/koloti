import { error, fail } from '@sveltejs/kit';
import { z } from 'zod/v4';
import { createServiceClient } from '$lib/server/supabase';
import { writeAuditLog } from '$lib/server/audit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const supabase = createServiceClient();
	const { data: prop } = await supabase
		.from('property')
		.select(
			'*, ownership(id, profile_id, start_date, end_date, is_primary, profile:profile_id(full_name, email, status))'
		)
		.eq('id', params.id)
		.single();

	if (!prop) throw error(404, 'Propriété introuvable');
	return { session: locals.session, profile: locals.profile, prop };
};

const editSchema = z.object({
	reference: z.string().min(1).max(100).trim(),
	address: z.string().max(300).trim().optional(),
	vote_weight: z.coerce.number().int().min(1).max(100)
});

export const actions: Actions = {
	update: async ({ request, locals, params }) => {
		if (!locals.profile || !['admin', 'editor'].includes(locals.profile.role))
			return fail(403, { error: 'Non autorisé.' });
		const parsed = editSchema.safeParse(Object.fromEntries(await request.formData()));
		if (!parsed.success)
			return fail(400, { error: parsed.error.issues[0]?.message ?? 'Invalide.' });

		const supabase = createServiceClient();
		await supabase
			.from('property')
			.update({ ...parsed.data, address: parsed.data.address || null })
			.eq('id', params.id);
		await writeAuditLog({
			actorId: locals.profile.id,
			action: 'property.update',
			entity: 'property',
			entityId: params.id,
			payload: parsed.data
		});
		return { success: true };
	}
};
