import { error, fail, redirect } from '@sveltejs/kit';
import { z } from 'zod/v4';
import { writeAuditLog } from '$lib/server/audit';
import { createServiceClient } from '$lib/server/supabase';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params, url }) => {
	if (!locals.profile || locals.profile.role !== 'admin') throw redirect(303, '/app/');
	const supabase = createServiceClient();

	const { data: compte } = await supabase
		.from('profile')
		.select(
			'id, full_name, email, phone, role, status, last_login_at, activated_at, created_at, credential(id, login)'
		)
		.eq('id', params.id)
		.single();
	if (!compte) throw error(404, 'Compte introuvable');

	const { data: ownerships } = await supabase
		.from('ownership')
		.select(
			'id, start_date, end_date, is_primary, property:property_id(id, reference, street_number, street_name)'
		)
		.eq('profile_id', params.id)
		.order('start_date', { ascending: false });

	return {
		session: locals.session,
		profile: locals.profile,
		compte,
		ownerships: ownerships ?? [],
		created: url.searchParams.has('created')
	};
};

const attachSchema = z.object({
	property_reference: z.string().min(1).max(100).trim()
});

const directAttachSchema = z.object({
	property_id: z.string().uuid(),
	entry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
});

const confirmTransferSchema = z.object({
	property_id: z.string().uuid(),
	exit_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
	entry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
});

export const actions: Actions = {
	findProperty: async ({ request, locals, params }) => {
		if (!locals.profile || locals.profile.role !== 'admin')
			return fail(403, { error: 'Non autorisé.' });

		const parsed = attachSchema.safeParse(Object.fromEntries(await request.formData()));
		if (!parsed.success) return fail(400, { error: 'Référence invalide.' });

		const supabase = createServiceClient();
		const { data: prop } = await supabase
			.from('property')
			.select('id, reference, ownership(id, end_date, profile:profile_id(id, full_name))')
			.eq('reference', parsed.data.property_reference)
			.single();

		if (!prop)
			return fail(404, { error: `Propriété "${parsed.data.property_reference}" introuvable.` });

		const ownerships = Array.isArray(prop.ownership) ? prop.ownership : [];
		const active = ownerships.find((ownership: { end_date: string | null }) => !ownership.end_date);

		if (active) {
			const ownerProfile = Array.isArray(active.profile) ? active.profile[0] : active.profile;
			if (ownerProfile?.id === params.id)
				return fail(400, { error: 'Cette propriété est déjà rattachée à ce compte.' });

			return {
				needsConfirmation: true,
				property: { id: prop.id, reference: prop.reference },
				currentOwnerName: ownerProfile?.full_name ?? '—'
			};
		}

		return { needsDirectAttach: true, property: { id: prop.id, reference: prop.reference } };
	},

	attachDirect: async ({ request, locals, params }) => {
		if (!locals.profile || locals.profile.role !== 'admin')
			return fail(403, { error: 'Non autorisé.' });

		const parsed = directAttachSchema.safeParse(Object.fromEntries(await request.formData()));
		if (!parsed.success) return fail(400, { error: 'Données invalides.' });

		const supabase = createServiceClient();
		const { error: err } = await supabase.from('ownership').insert({
			property_id: parsed.data.property_id,
			profile_id: params.id,
			start_date: parsed.data.entry_date,
			is_primary: true
		});
		if (err) return fail(400, { error: err.message });

		await writeAuditLog({
			actorId: locals.profile.id,
			action: 'ownership.add',
			entity: 'ownership',
			payload: {
				property_id: parsed.data.property_id,
				profile_id: params.id,
				start_date: parsed.data.entry_date
			}
		});
		return { attachSuccess: true };
	},

	confirmTransfer: async ({ request, locals, params }) => {
		if (!locals.profile || locals.profile.role !== 'admin')
			return fail(403, { error: 'Non autorisé.' });

		const parsed = confirmTransferSchema.safeParse(Object.fromEntries(await request.formData()));
		if (!parsed.success) return fail(400, { error: 'Dates invalides.' });

		const supabase = createServiceClient();
		const { data: current } = await supabase
			.from('ownership')
			.select('id')
			.eq('property_id', parsed.data.property_id)
			.is('end_date', null)
			.single();

		if (current) {
			await supabase
				.from('ownership')
				.update({ end_date: parsed.data.exit_date })
				.eq('id', current.id);
		}

		await supabase.from('ownership').insert({
			property_id: parsed.data.property_id,
			profile_id: params.id,
			start_date: parsed.data.entry_date,
			is_primary: true
		});

		await writeAuditLog({
			actorId: locals.profile.id,
			action: 'ownership.transfer',
			entity: 'ownership',
			payload: { ...parsed.data, profile_id: params.id }
		});
		return { attachSuccess: true };
	}
};
