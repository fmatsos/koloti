// Edge Function : convocation d'une AG (draft → convened)
// Génère un PDF de convocation (ordre du jour inclus) et l'envoie par email à tous les colotis actifs.
// Utilise pdf-lib pour le PDF et SMTP Nodemailer-compatible (via fetch SMTP).

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { PDFDocument, rgb, StandardFonts } from 'npm:pdf-lib@1';

const CORS_HEADERS = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Headers':
		'authorization, x-client-info, apikey, content-type, x-koloti-actor-id'
};

async function sendEmail(opts: {
	smtpHost: string;
	smtpPort: number;
	smtpUser: string;
	smtpPass: string;
	from: string;
	fromName: string;
	to: string;
	subject: string;
	html: string;
	attachmentBase64: string;
	attachmentName: string;
}): Promise<void> {
	// Envoi via Supabase Auth admin.generateLink n'est pas adapté pour les emails transactionnels custom.
	// On utilise fetch vers l'API Brevo/Resend (SMTP relay HTTP) si disponible.
	// Pour Brevo SMTP API :
	const brevoApiKey = Deno.env.get('BREVO_API_KEY');
	if (brevoApiKey) {
		await fetch('https://api.brevo.com/v3/smtp/email', {
			method: 'POST',
			headers: { 'api-key': brevoApiKey, 'Content-Type': 'application/json' },
			body: JSON.stringify({
				sender: { name: opts.fromName, email: opts.from },
				to: [{ email: opts.to }],
				subject: opts.subject,
				htmlContent: opts.html,
				attachment: [{ content: opts.attachmentBase64, name: opts.attachmentName }]
			})
		});
		return;
	}
	// Fallback : Resend
	const resendApiKey = Deno.env.get('RESEND_API_KEY');
	if (resendApiKey) {
		await fetch('https://api.resend.com/emails', {
			method: 'POST',
			headers: { Authorization: `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
			body: JSON.stringify({
				from: `${opts.fromName} <${opts.from}>`,
				to: opts.to,
				subject: opts.subject,
				html: opts.html,
				attachments: [{ filename: opts.attachmentName, content: opts.attachmentBase64 }]
			})
		});
		return;
	}
	console.warn('Aucun provider email configuré — email non envoyé à', opts.to);
}

async function generateConvocationPdf(ag: {
	title: string;
	type: string;
	mode: string;
	scheduled_at: string;
	location: string | null;
	quorum_pct: number;
	agenda_item: {
		position: number;
		title: string;
		description: string | null;
		requires_vote: boolean;
	}[];
}): Promise<Uint8Array> {
	const pdfDoc = await PDFDocument.create();
	const page = pdfDoc.addPage([595.28, 841.89]);
	const { width, height } = page.getSize();

	const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
	const fontReg = await pdfDoc.embedFont(StandardFonts.Helvetica);
	const primary = rgb(0.1, 0.45, 0.91);
	const dark = rgb(0.07, 0.1, 0.15);
	const muted = rgb(0.42, 0.45, 0.5);

	// En-tête
	page.drawRectangle({ x: 0, y: height - 70, width, height: 70, color: primary });
	page.drawText('CONVOCATION', {
		x: 40,
		y: height - 30,
		size: 18,
		font: fontBold,
		color: rgb(1, 1, 1)
	});
	page.drawText('Assemblée Générale', {
		x: 40,
		y: height - 52,
		size: 12,
		font: fontReg,
		color: rgb(0.9, 0.95, 1)
	});

	const typeLabel =
		ag.type === 'ordinaire' ? 'Assemblée Générale Ordinaire' : 'Assemblée Générale Extraordinaire';
	const modeLabel =
		ag.mode === 'presentiel' ? 'Présentiel' : ag.mode === 'en_ligne' ? 'En ligne' : 'Hybride';
	const date = new Date(ag.scheduled_at);
	const dateStr = date.toLocaleString('fr-FR', {
		weekday: 'long',
		day: '2-digit',
		month: 'long',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	});

	let y = height - 110;
	page.drawText(ag.title, { x: 40, y, size: 14, font: fontBold, color: dark });
	y -= 22;
	page.drawText(typeLabel, { x: 40, y, size: 11, font: fontReg, color: muted });
	y -= 30;

	const infos: [string, string][] = [
		['Date', dateStr],
		['Mode', modeLabel],
		['Lieu', ag.location ?? 'À préciser'],
		['Quorum requis', `${ag.quorum_pct} %`]
	];
	for (const [label, value] of infos) {
		page.drawText(`${label} :`, { x: 40, y, size: 10, font: fontBold, color: dark });
		page.drawText(value, { x: 140, y, size: 10, font: fontReg, color: dark });
		y -= 18;
	}

	y -= 16;
	page.drawLine({ start: { x: 40, y }, end: { x: width - 40, y }, thickness: 0.5, color: muted });
	y -= 20;
	page.drawText('ORDRE DU JOUR', { x: 40, y, size: 12, font: fontBold, color: primary });
	y -= 20;

	const sortedItems = [...ag.agenda_item].sort((a, b) => a.position - b.position);
	for (const item of sortedItems) {
		if (y < 80) break; // simple débordement prévenu
		page.drawText(`${item.position}. ${item.title}`, {
			x: 40,
			y,
			size: 10,
			font: fontBold,
			color: dark
		});
		if (item.requires_vote) {
			page.drawText('(vote)', { x: width - 80, y, size: 9, font: fontReg, color: muted });
		}
		y -= 15;
		if (item.description) {
			const lines = item.description.match(/.{1,90}/g) ?? [];
			for (const line of lines.slice(0, 3)) {
				page.drawText(line, { x: 56, y, size: 9, font: fontReg, color: muted });
				y -= 13;
			}
		}
		y -= 6;
	}

	// Pied de page
	page.drawText('Document généré par Koloti — ' + new Date().toLocaleDateString('fr-FR'), {
		x: 40,
		y: 28,
		size: 8,
		font: fontReg,
		color: muted
	});

	return await pdfDoc.save();
}

Deno.serve(async (req: Request) => {
	if (req.method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS });

	try {
		const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
		const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
		const appUrl = Deno.env.get('PUBLIC_APP_URL') ?? 'http://localhost:5173';
		const smtpFrom = Deno.env.get('SMTP_FROM') ?? 'noreply@koloti.app';
		const smtpFromName = Deno.env.get('SMTP_FROM_NAME') ?? 'Koloti';

		const adminClient = createClient(supabaseUrl, serviceRoleKey, {
			auth: { autoRefreshToken: false, persistSession: false }
		});

		const authHeader = req.headers.get('Authorization');
		if (!authHeader)
			return new Response(JSON.stringify({ error: 'Unauthorized' }), {
				status: 401,
				headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
			});

		let caller: { id: string } | null = null;
		if (authHeader === `Bearer ${serviceRoleKey}`) {
			const actorId = req.headers.get('x-koloti-actor-id');
			caller = actorId ? { id: actorId } : null;
		} else {
			const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
			const callerClient = createClient(supabaseUrl, anonKey, {
				global: { headers: { Authorization: authHeader } }
			});
			const {
				data: { user }
			} = await callerClient.auth.getUser();
			caller = user;
		}

		if (!caller)
			return new Response(JSON.stringify({ error: 'Unauthorized' }), {
				status: 401,
				headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
			});

		const { data: callerProfile } = await adminClient
			.from('profile')
			.select('role, status')
			.eq('id', caller.id)
			.single();
		if (
			!callerProfile ||
			!['admin', 'editor'].includes(callerProfile.role) ||
			callerProfile.status !== 'active'
		) {
			return new Response(JSON.stringify({ error: 'Forbidden' }), {
				status: 403,
				headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
			});
		}

		const body = await req.json();
		const assemblyId = body?.assembly_id;
		if (!assemblyId)
			return new Response(JSON.stringify({ error: 'assembly_id requis' }), {
				status: 400,
				headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
			});

		// Charger l'AG avec son ordre du jour
		const { data: ag } = await adminClient
			.from('assembly')
			.select('*, agenda_item(position, title, description, requires_vote)')
			.eq('id', assemblyId)
			.single();

		if (!ag)
			return new Response(JSON.stringify({ error: 'AG introuvable' }), {
				status: 404,
				headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
			});
		if (ag.status !== 'draft')
			return new Response(
				JSON.stringify({ error: "L'AG doit être en statut draft pour être convoquée." }),
				{ status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
			);

		// Générer le PDF
		const pdfBytes = await generateConvocationPdf({
			...ag,
			agenda_item: Array.isArray(ag.agenda_item) ? ag.agenda_item : []
		});
		const pdfBase64 = btoa(String.fromCharCode(...pdfBytes));
		const pdfFilename = `convocation-${ag.title.replace(/\s+/g, '-').toLowerCase()}.pdf`;

		// Mettre à jour le statut
		await adminClient
			.from('assembly')
			.update({ status: 'convened', convened_at: new Date().toISOString() })
			.eq('id', assemblyId);

		// Récupérer tous les profils actifs
		const { data: profiles } = await adminClient
			.from('profile')
			.select('id, email, full_name')
			.eq('status', 'active');

		const date = new Date(ag.scheduled_at);
		const dateStr = date.toLocaleString('fr-FR', {
			day: '2-digit',
			month: 'long',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});

		let sent = 0;
		for (const profile of profiles ?? []) {
			const html = `
				<p>Bonjour ${profile.full_name},</p>
				<p>Vous êtes convoqué(e) à l'<strong>${ag.title}</strong> qui se tiendra le <strong>${dateStr}</strong>${ag.location ? ` (${ag.location})` : ''}.</p>
				<p>Veuillez trouver la convocation et l'ordre du jour en pièce jointe.</p>
				<p>Vous pouvez accéder à votre espace en ligne : <a href="${appUrl}">${appUrl}</a></p>
				<p>Cordialement,<br>Le bureau</p>
			`;
			try {
				await sendEmail({
					smtpHost: Deno.env.get('SMTP_HOST') ?? '',
					smtpPort: parseInt(Deno.env.get('SMTP_PORT') ?? '587'),
					smtpUser: Deno.env.get('SMTP_USER') ?? '',
					smtpPass: Deno.env.get('SMTP_PASS') ?? '',
					from: smtpFrom,
					fromName: smtpFromName,
					to: profile.email,
					subject: `Convocation — ${ag.title} — ${dateStr}`,
					html,
					attachmentBase64: pdfBase64,
					attachmentName: pdfFilename
				});
				sent++;
			} catch (e) {
				console.error('Erreur envoi à', profile.email, e);
			}
		}

		await adminClient.from('audit_log').insert({
			actor_id: caller.id,
			action: 'assembly.convene',
			entity: 'assembly',
			entity_id: assemblyId,
			payload: { recipients: sent, title: ag.title }
		});

		return new Response(
			JSON.stringify({ success: true, convened_at: new Date().toISOString(), recipients: sent }),
			{
				status: 200,
				headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
			}
		);
	} catch (err) {
		console.error('Erreur inattendue:', err);
		return new Response(JSON.stringify({ error: 'Erreur interne' }), {
			status: 500,
			headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
		});
	}
});
