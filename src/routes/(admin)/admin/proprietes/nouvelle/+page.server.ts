import { fail, redirect } from '@sveltejs/kit';
import { z } from 'zod/v4';
import { createServiceClient } from '$lib/server/supabase';
import { writeAuditLog } from '$lib/server/audit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	return { session: locals.session, profile: locals.profile };
};

const schema = z.object({
	reference: z.string().min(1).max(100).trim(),
	address: z.string().max(300).trim().optional(),
	vote_weight: z.coerce.number().int().min(1).max(100).default(1)
});

export const actions: Actions = {
	default: async ({ request, locals }) => {
		if (!locals.profile || !['admin', 'editor'].includes(locals.profile.role)) {
			return fail(403, { error: 'Non autorisé.' });
		}
		const formData = Object.fromEntries(await request.formData());
		const parsed = schema.safeParse(formData);
		if (!parsed.success) return fail(400, { error: parsed.error.issues[0]?.message ?? 'Invalide.' });

		const supabase = createServiceClient();
		const { data: prop, error: err } = await supabase
			.from('property')
			.insert({ ...parsed.data, address: parsed.data.address || null })
			.select('id')
			.single();

		if (err || !prop) return fail(500, { error: 'Erreur création propriété.' });

		await writeAuditLog({ actorId: locals.profile.id, action: 'property.create', entity: 'property', entityId: prop.id, payload: parsed.data });
		throw redirect(303, `/admin/proprietes/${prop.id}`);
	}
};
