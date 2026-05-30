import { error, fail, redirect } from '@sveltejs/kit';
import { z } from 'zod/v4';
import { createServiceClient } from '$lib/server/supabase';
import { writeAuditLog } from '$lib/server/audit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
	if (!locals.profile || locals.profile.role !== 'admin') throw redirect(303, '/app/');

	const supabase = createServiceClient();
	const { data: compte } = await supabase
		.from('profile')
		.select(
			`
			id, full_name, email, phone, role, status, last_login_at, activated_at, created_at,
			credential(id, login)
		`
		)
		.eq('id', params.id)
		.single();

	if (!compte) throw error(404, 'Compte introuvable');

	return {
		session: locals.session,
		profile: locals.profile,
		compte,
		created: null as boolean | null
	};
};

const updateEmailSchema = z.object({
	email: z.string().email().max(200).toLowerCase().trim()
});

const updateRoleSchema = z.object({
	role: z.enum(['admin', 'editor', 'member'])
});

export const actions: Actions = {
	updateEmail: async ({ request, locals, params }) => {
		if (!locals.profile || locals.profile.role !== 'admin')
			return fail(403, { error: 'Non autorisé.' });

		const formData = Object.fromEntries(await request.formData());
		const parsed = updateEmailSchema.safeParse(formData);
		if (!parsed.success) return fail(400, { error: 'Email invalide.' });

		const { email } = parsed.data;
		const supabase = createServiceClient();

		// Mettre à jour l'email Supabase Auth
		await supabase.auth.admin.updateUserById(params.id, { email });

		// Mettre à jour le profil
		await supabase.from('profile').update({ email }).eq('id', params.id);

		await writeAuditLog({
			actorId: locals.profile.id,
			action: 'account.update_email',
			entity: 'profile',
			entityId: params.id,
			payload: { email }
		});

		return { success: true, action: 'email' };
	},

	updateRole: async ({ request, locals, params }) => {
		if (!locals.profile || locals.profile.role !== 'admin')
			return fail(403, { error: 'Non autorisé.' });

		const formData = Object.fromEntries(await request.formData());
		const parsed = updateRoleSchema.safeParse(formData);
		if (!parsed.success) return fail(400, { error: 'Rôle invalide.' });

		const { role } = parsed.data;
		const supabase = createServiceClient();

		await supabase.from('profile').update({ role }).eq('id', params.id);

		await writeAuditLog({
			actorId: locals.profile.id,
			action: 'account.update_role',
			entity: 'profile',
			entityId: params.id,
			payload: { role }
		});

		return { success: true, action: 'role' };
	},

	toggleStatus: async ({ request, locals, params }) => {
		if (!locals.profile || locals.profile.role !== 'admin')
			return fail(403, { error: 'Non autorisé.' });

		const formData = Object.fromEntries(await request.formData());
		const targetStatus = formData.status === 'inactive' ? 'inactive' : 'active';

		const supabase = createServiceClient();
		await supabase.from('profile').update({ status: targetStatus }).eq('id', params.id);

		await writeAuditLog({
			actorId: locals.profile.id,
			action: `account.${targetStatus === 'inactive' ? 'deactivate' : 'activate'}`,
			entity: 'profile',
			entityId: params.id,
			payload: { status: targetStatus }
		});

		return { success: true, action: 'status' };
	},

	reissueLink: async ({ locals, params, fetch }) => {
		if (!locals.profile || locals.profile.role !== 'admin')
			return fail(403, { error: 'Non autorisé.' });

		try {
			const res = await fetch('/api/admin/issue-activation-link', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ profile_id: params.id })
			});

			if (!res.ok) {
				return fail(500, { error: 'Erreur lors de la réémission du lien.' });
			}
		} catch {
			return fail(500, { error: 'Erreur lors de la réémission du lien.' });
		}

		return { success: true, action: 'reissue' };
	}
};
