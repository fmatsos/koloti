import { z } from 'zod/v4';
import { createServiceClient } from '$lib/server/supabase';
import { sendMail } from '$lib/server/email';
import { PUBLIC_APP_URL } from '$env/static/public';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	return { session: locals.session, profile: locals.profile };
};

const schema = z.object({
	email: z.email()
});

function escapeHtml(s: string): string {
	return s
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

export const actions: Actions = {
	default: async ({ request }) => {
		const parsed = schema.safeParse(Object.fromEntries(await request.formData()));
		// Always return success — no account enumeration, not even for invalid email format
		if (!parsed.success) return { success: true };

		const { email } = parsed.data;
		const serviceClient = createServiceClient();

		// email is not unique — a single address can map to multiple profiles (family lots)
		const { data: profiles } = await serviceClient
			.from('profile')
			.select('first_name, last_name, credential(login)')
			.eq('email', email)
			.eq('status', 'active');

		const logins: string[] = [];
		for (const p of profiles ?? []) {
			const creds = Array.isArray(p.credential) ? p.credential : [];
			for (const c of creds) {
				if (c.login) logins.push(c.login);
			}
		}

		if (logins.length > 0) {
			const listText = logins.map((l) => `  • ${l}`).join('\n');
			const listHtml = logins.map((l) => `<li><strong>${escapeHtml(l)}</strong></li>`).join('');

			try {
				await sendMail({
					to: email,
					subject: 'Vos identifiants Koloti',
					text:
						`Bonjour,\n\n` +
						`Voici les identifiants associés à votre adresse :\n\n${listText}\n\n` +
						`Connectez-vous sur : ${PUBLIC_APP_URL}/login`,
					html:
						`<p>Bonjour,</p>` +
						`<p>Voici les identifiants associés à votre adresse :</p>` +
						`<ul>${listHtml}</ul>` +
						`<p>Connectez-vous sur : <a href="${escapeHtml(PUBLIC_APP_URL)}/login">${escapeHtml(PUBLIC_APP_URL)}/login</a></p>`
				});
			} catch (e) {
				console.error('[identifiant-oublie] sendMail error:', e);
			}
		}

		return { success: true };
	}
};
