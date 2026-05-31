import { fail, redirect } from '@sveltejs/kit';
import { z } from 'zod/v4';
import { writeAuditLog } from '$lib/server/audit';
import { createServiceClient } from '$lib/server/supabase';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.profile || !['admin', 'editor'].includes(locals.profile.role)) {
		throw redirect(303, '/');
	}

	return { session: locals.session, profile: locals.profile };
};

const schema = z.object({
	reference: z.string().min(1).max(100).trim(),
	street_number: z.string().max(20).trim().optional(),
	street_name: z.string().max(200).trim().optional(),
	cadastre_number: z.string().max(50).trim().optional()
});

export const actions: Actions = {
	default: async ({ request, locals }) => {
		if (!locals.profile || !['admin', 'editor'].includes(locals.profile.role)) {
			return fail(403, { error: 'Non autorisé.' });
		}

		const parsed = schema.safeParse(Object.fromEntries(await request.formData()));
		if (!parsed.success) {
			return fail(400, { error: parsed.error.issues[0]?.message ?? 'Invalide.' });
		}

		const supabase = createServiceClient();
		const { data: prop, error: err } = await supabase
			.from('property')
			.insert({
				reference: parsed.data.reference,
				street_number: parsed.data.street_number || null,
				street_name: parsed.data.street_name || null,
				cadastre_number: parsed.data.cadastre_number || null
			})
			.select('id')
			.single();

		if (err || !prop) return fail(500, { error: 'Erreur création propriété.' });

		await writeAuditLog({
			actorId: locals.profile.id,
			action: 'property.create',
			entity: 'property',
			entityId: prop.id,
			payload: parsed.data
		});

		throw redirect(303, `/proprietes/${prop.id}/view`);
	}
};
