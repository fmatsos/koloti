import { createClient } from 'jsr:@supabase/supabase-js@2';

const CORS_HEADERS = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Headers':
		'authorization, x-client-info, apikey, content-type, x-koloti-actor-id'
};

function escapeHtml(s: string): string {
	return s
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

async function sendEmail(opts: {
	from: string;
	fromName: string;
	to: string;
	subject: string;
	html: string;
	text: string;
}): Promise<void> {
	const brevoApiKey = Deno.env.get('BREVO_API_KEY');
	if (brevoApiKey) {
		const response = await fetch('https://api.brevo.com/v3/smtp/email', {
			method: 'POST',
			headers: { 'api-key': brevoApiKey, 'Content-Type': 'application/json' },
			body: JSON.stringify({
				sender: { name: opts.fromName, email: opts.from },
				to: [{ email: opts.to }],
				subject: opts.subject,
				htmlContent: opts.html,
				textContent: opts.text
			})
		});
		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`Brevo API error ${response.status}: ${errorText}`);
		}
		return;
	}
	const resendApiKey = Deno.env.get('RESEND_API_KEY');
	if (resendApiKey) {
		const response = await fetch('https://api.resend.com/emails', {
			method: 'POST',
			headers: { Authorization: `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
			body: JSON.stringify({
				from: `${opts.fromName} <${opts.from}>`,
				to: opts.to,
				subject: opts.subject,
				html: opts.html,
				text: opts.text
			})
		});
		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`Resend API error ${response.status}: ${errorText}`);
		}
		return;
	}
	throw new Error('[notify-assembly-open] No email provider configured (BREVO_API_KEY or RESEND_API_KEY required)');
}

Deno.serve(async (req: Request) => {
	if (req.method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS });

	try {
		const supabaseUrl = Deno.env.get('SUPABASE_URL');
		const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

		if (!supabaseUrl || !serviceRoleKey) {
			return new Response(
				JSON.stringify({ error: 'Missing required environment variables: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY' }),
				{ status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
			);
		}

		const appUrl = Deno.env.get('PUBLIC_APP_URL') ?? 'http://localhost:5173';
		const smtpFrom = Deno.env.get('SMTP_FROM') ?? 'noreply@koloti.app';
		const smtpFromName = Deno.env.get('SMTP_FROM_NAME') ?? 'Koloti';

		const authHeader = req.headers.get('Authorization');
		if (!authHeader || authHeader !== `Bearer ${serviceRoleKey}`) {
			return new Response(JSON.stringify({ error: 'Unauthorized' }), {
				status: 401,
				headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
			});
		}

		const body = await req.json();
		const assemblyId = body?.assembly_id as string | undefined;
		if (!assemblyId) {
			return new Response(JSON.stringify({ error: 'assembly_id requis' }), {
				status: 400,
				headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
			});
		}

		const adminClient = createClient(supabaseUrl, serviceRoleKey, {
			auth: { autoRefreshToken: false, persistSession: false }
		});

		// Fetch AG details
		const { data: ag } = await adminClient
			.from('assembly')
			.select('id, title, type, scheduled_at')
			.eq('id', assemblyId)
			.single();

		if (!ag) {
			return new Response(JSON.stringify({ error: 'AG introuvable' }), {
				status: 404,
				headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
			});
		}

		// Fetch all active profiles
		const { data: profiles } = await adminClient
			.from('profile')
			.select('id, email, first_name, last_name')
			.eq('status', 'active');

		const activeProfiles = profiles ?? [];

		// Bulk insert pending rows and capture returned IDs
		const notificationMap = new Map<string, string>();
		if (activeProfiles.length > 0) {
			const { data: inserted, error: insertError } = await adminClient
				.from('assembly_notification')
				.insert(
					activeProfiles.map((p) => ({
						assembly_id: assemblyId,
						profile_id: p.id,
						email: p.email,
						first_name: p.first_name,
						last_name: p.last_name,
						status: 'pending'
					}))
				)
				.select('id, profile_id');

			if (insertError) {
				throw new Error(`Failed to insert assembly notifications: ${insertError.message}`);
			}

			// Build map of profile_id -> notification_id
			if (inserted) {
				for (const row of inserted) {
					notificationMap.set(row.profile_id, row.id);
				}
			}
		}

		const dateStr = new Date(ag.scheduled_at).toLocaleString('fr-FR', {
			day: '2-digit',
			month: 'long',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
		const typeLabel =
			ag.type === 'ordinaire' ? 'Assemblée Générale Ordinaire' : 'Assemblée Générale Extraordinaire';
		const agUrl = `${appUrl}/assemblees-generales/${ag.id}`;

		let sent = 0;
		let failed = 0;

		for (const profile of activeProfiles) {
			const text =
				`Bonjour ${profile.first_name} ${profile.last_name},\n\n` +
				`La séance "${ag.title}" (${typeLabel}, le ${dateStr}) est désormais ouverte.\n\n` +
				`Accédez à l'AG : ${agUrl}`;

			const html =
				`<p>Bonjour ${escapeHtml(profile.first_name)} ${escapeHtml(profile.last_name)},</p>` +
				`<p>La séance <strong>${escapeHtml(ag.title)}</strong> (${escapeHtml(typeLabel)}, le ${escapeHtml(dateStr)}) est désormais ouverte.</p>` +
				`<p><a href="${escapeHtml(agUrl)}">Accédez à l'AG</a></p>`;

			try {
				await sendEmail({
					from: smtpFrom,
					fromName: smtpFromName,
					to: profile.email,
					subject: `L'AG "${escapeHtml(ag.title)}" est maintenant ouverte`,
					text,
					html
				});

				const notifId = notificationMap.get(profile.id);
				if (notifId) {
					await adminClient
						.from('assembly_notification')
						.update({ status: 'sent', sent_at: new Date().toISOString() })
						.eq('id', notifId);
				}

				sent++;
			} catch (e) {
				const errorMsg = e instanceof Error ? e.message : String(e);
				console.error('[notify-assembly-open] Erreur envoi à', profile.email, errorMsg);

				const notifId = notificationMap.get(profile.id);
				if (notifId) {
					await adminClient
						.from('assembly_notification')
						.update({ status: 'failed', error_msg: errorMsg })
						.eq('id', notifId);
				}

				failed++;
			}
		}

		return new Response(
			JSON.stringify({ success: true, sent, failed, total: activeProfiles.length }),
			{ status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
		);
	} catch (err) {
		console.error('[notify-assembly-open] Erreur inattendue:', err);
		return new Response(JSON.stringify({ error: 'Erreur interne' }), {
			status: 500,
			headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
		});
	}
});
