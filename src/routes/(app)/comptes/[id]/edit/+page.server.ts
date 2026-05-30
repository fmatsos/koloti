import { error, fail, redirect } from '@sveltejs/kit';
import { z } from 'zod/v4';
import { createServiceClient } from '$lib/server/supabase';
import { writeAuditLog } from '$lib/server/audit';
import { generateUniqueLogin } from '$lib/server/generate-login';
import { sendMail } from '$lib/server/email';
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

const updateLoginSchema = z.object({
	login: z
		.string()
		.min(3, 'Le login doit faire au moins 3 caractères.')
		.max(20, 'Le login ne peut pas dépasser 20 caractères.')
		.regex(/^[a-z0-9]+$/, 'Le login ne peut contenir que des lettres minuscules et des chiffres.')
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
			const res = await fetch('/api/issue-activation-link', {
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
	},

	updateLogin: async ({ request, locals, params }) => {
		if (!locals.profile || locals.profile.role !== 'admin')
			return fail(403, { error: 'Non autorisé.' });

		const formData = Object.fromEntries(await request.formData());
		const parsed = updateLoginSchema.safeParse(formData);
		if (!parsed.success) return fail(400, { error: parsed.error.issues[0]?.message ?? 'Login invalide.' });

		const { login } = parsed.data;
		const supabase = createServiceClient();

		// Vérifier l'unicité (hors l'utilisateur courant)
		const { data: conflict } = await supabase
			.from('credential')
			.select('profile_id')
			.eq('login', login)
			.neq('profile_id', params.id)
			.maybeSingle();

		if (conflict) return fail(400, { error: 'Ce login est déjà utilisé par un autre compte.' });

		await supabase.from('credential').update({ login }).eq('profile_id', params.id);

		// Notifier l'utilisateur si son compte est actif
		const { data: profile } = await supabase
			.from('profile')
			.select('email, full_name, status')
			.eq('id', params.id)
			.single();

		if (profile?.status === 'active') {
			try {
				await sendMail({
					to: profile.email,
					subject: 'Votre identifiant de connexion a changé',
					text: `Bonjour ${profile.full_name},\n\nVotre identifiant de connexion a été modifié par un administrateur.\n\nNouvel identifiant : ${login}\n\nSi vous n'êtes pas à l'origine de cette modification, contactez votre administrateur.`
				});
			} catch (e) {
				console.error('Erreur envoi email login:', e);
			}
		}

		await writeAuditLog({
			actorId: locals.profile.id,
			action: 'account.update_login',
			entity: 'profile',
			entityId: params.id,
			payload: { login }
		});

		return { success: true, action: 'login' };
	},

	regenerateLogin: async ({ locals, params }) => {
		if (!locals.profile || locals.profile.role !== 'admin')
			return fail(403, { error: 'Non autorisé.' });

		const supabase = createServiceClient();
		const login = await generateUniqueLogin(supabase);

		await supabase.from('credential').update({ login }).eq('profile_id', params.id);

		const { data: profile } = await supabase
			.from('profile')
			.select('email, full_name, status')
			.eq('id', params.id)
			.single();

		if (profile?.status === 'active') {
			try {
				await sendMail({
					to: profile.email,
					subject: 'Votre identifiant de connexion a changé',
					text: `Bonjour ${profile.full_name},\n\nVotre identifiant de connexion a été modifié par un administrateur.\n\nNouvel identifiant : ${login}\n\nSi vous n'êtes pas à l'origine de cette modification, contactez votre administrateur.`
				});
			} catch (e) {
				console.error('Erreur envoi email login:', e);
			}
		}

		await writeAuditLog({
			actorId: locals.profile.id,
			action: 'account.regenerate_login',
			entity: 'profile',
			entityId: params.id,
			payload: { login }
		});

		return { success: true, action: 'login' };
	}
};
