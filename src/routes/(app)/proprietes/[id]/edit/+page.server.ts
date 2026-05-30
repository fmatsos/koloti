import { error, fail, redirect } from '@sveltejs/kit';
import { z } from 'zod/v4';
import { writeAuditLog } from '$lib/server/audit';
import { createServiceClient } from '$lib/server/supabase';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!locals.profile || !['admin', 'editor'].includes(locals.profile.role)) {
		throw redirect(303, '/app/');
	}

	const supabase = createServiceClient();
	const { data: prop } = await supabase
		.from('property')
		.select('id, reference, street_number, street_name, cadastre_number')
		.eq('id', params.id)
		.single();

	if (!prop) throw error(404, 'Propriété introuvable');

	return { session: locals.session, profile: locals.profile, prop };
};

const editSchema = z.object({
	reference: z.string().min(1).max(100).trim(),
	street_number: z.string().max(20).trim().optional(),
	street_name: z.string().max(200).trim().optional(),
	cadastre_number: z.string().max(50).trim().optional()
});

export const actions: Actions = {
	update: async ({ request, locals, params }) => {
		if (!locals.profile || !['admin', 'editor'].includes(locals.profile.role)) {
			return fail(403, { error: 'Non autorisé.' });
		}

		const parsed = editSchema.safeParse(Object.fromEntries(await request.formData()));
		if (!parsed.success) {
			return fail(400, { error: parsed.error.issues[0]?.message ?? 'Invalide.' });
		}

		const supabase = createServiceClient();
		await supabase
			.from('property')
			.update({
				reference: parsed.data.reference,
				street_number: parsed.data.street_number || null,
				street_name: parsed.data.street_name || null,
				cadastre_number: parsed.data.cadastre_number || null
			})
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
