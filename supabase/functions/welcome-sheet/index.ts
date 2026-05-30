// Edge Function : génération à la volée d'une feuille de bienvenue PDF avec QR code.
// Aucune persistance — le document est généré et retourné directement.
// Lib QR locale (qrcode-generator, pure JS) + pdf-lib.

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { PDFDocument, rgb, StandardFonts } from 'npm:pdf-lib@1';
// @ts-expect-error — qrcode-generator est une lib CJS sans types Deno
import qrcode from 'npm:qrcode-generator@1';

const CORS_HEADERS = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

Deno.serve(async (req: Request) => {
	if (req.method === 'OPTIONS') {
		return new Response(null, { headers: CORS_HEADERS });
	}

	try {
		const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
		const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
		const appUrl = Deno.env.get('PUBLIC_APP_URL') ?? 'http://localhost:5173';

		const adminClient = createClient(supabaseUrl, serviceRoleKey, {
			auth: { autoRefreshToken: false, persistSession: false }
		});

		// Vérifier l'appelant
		const authHeader = req.headers.get('Authorization');
		if (!authHeader) {
			return new Response(JSON.stringify({ error: 'Unauthorized' }), {
				status: 401,
				headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
			});
		}

		const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
		const callerClient = createClient(supabaseUrl, anonKey, {
			global: { headers: { Authorization: authHeader } }
		});
		const {
			data: { user: caller }
		} = await callerClient.auth.getUser();
		if (!caller) {
			return new Response(JSON.stringify({ error: 'Unauthorized' }), {
				status: 401,
				headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
			});
		}

		const { data: callerProfile } = await adminClient
			.from('profile')
			.select('role, status')
			.eq('id', caller.id)
			.single();

		if (!callerProfile || callerProfile.role !== 'admin' || callerProfile.status !== 'active') {
			return new Response(JSON.stringify({ error: 'Forbidden' }), {
				status: 403,
				headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
			});
		}

		// Paramètres attendus
		const body = await req.json();
		const profileId = body?.profile_id;
		if (!profileId || typeof profileId !== 'string') {
			return new Response(JSON.stringify({ error: 'profile_id requis' }), {
				status: 400,
				headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
			});
		}

		// Récupérer le profil + dernier lien d'activation actif
		const { data: targetProfile } = await adminClient
			.from('profile')
			.select('id, full_name, email')
			.eq('id', profileId)
			.single();

		if (!targetProfile) {
			return new Response(JSON.stringify({ error: 'Profil introuvable' }), {
				status: 404,
				headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
			});
		}

		const { data: link } = await adminClient
			.from('activation_link')
			.select('id, token_hash, expires_at, kind')
			.eq('profile_id', profileId)
			.eq('revoked', false)
			.is('used_at', null)
			.order('created_at', { ascending: false })
			.limit(1)
			.single();

		if (!link) {
			return new Response(JSON.stringify({ error: "Aucun lien d'activation actif" }), {
				status: 404,
				headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
			});
		}

		// Récupérer le login depuis credential
		const { data: credential } = await adminClient
			.from('credential')
			.select('login')
			.eq('profile_id', profileId)
			.single();

		// token_hash est le hash SHA-256. Pour la feuille de bienvenue on ne peut pas
		// reconstruire le token clair depuis le hash — on affiche l'URL de gestion
		// si token clair non disponible. Note : en pratique l'admin génère d'abord le lien
		// via issue-extended-link ou issue-activation-link, qui retourne le token clair.
		// Si fourni dans body.token_clear, on l'utilise ; sinon on invite à utiliser l'email.
		const tokenClear: string | null = body?.token_clear ?? null;
		const activationUrl = tokenClear
			? `${appUrl}/activate/${tokenClear}`
			: `${appUrl}/activate/(voir-email)`;

		const expiresDate = new Date(link.expires_at);
		const expiresStr = expiresDate.toLocaleDateString('fr-FR', {
			day: '2-digit',
			month: 'long',
			year: 'numeric'
		});

		// --- Génération du QR code ---
		// qrcode-generator produit une matrice (modules) sans dépendance canvas
		const qr = qrcode(0, 'M');
		qr.addData(activationUrl);
		qr.make();

		const moduleCount = qr.getModuleCount();

		// --- Génération du PDF ---
		const pdfDoc = await PDFDocument.create();
		const page = pdfDoc.addPage([595.28, 841.89]); // A4 points
		const { width, height } = page.getSize();

		const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
		const fontReg = await pdfDoc.embedFont(StandardFonts.Helvetica);

		const primary = rgb(0.1, 0.45, 0.91); // #1a73e8 approx
		const dark = rgb(0.07, 0.1, 0.15);
		const muted = rgb(0.42, 0.45, 0.5);
		const lightBg = rgb(0.96, 0.97, 0.99);

		// En-tête
		page.drawRectangle({ x: 0, y: height - 80, width, height: 80, color: primary });
		page.drawText('Koloti — Feuille de bienvenue', {
			x: 40,
			y: height - 52,
			size: 22,
			font: fontBold,
			color: rgb(1, 1, 1)
		});

		// Bloc infos compte
		const boxY = height - 200;
		page.drawRectangle({ x: 40, y: boxY, width: width - 80, height: 100, color: lightBg });
		page.drawText('Bienvenue dans votre espace copropriétaire', {
			x: 56,
			y: boxY + 72,
			size: 13,
			font: fontBold,
			color: dark
		});
		page.drawText(`Nom : ${targetProfile.full_name}`, {
			x: 56,
			y: boxY + 50,
			size: 11,
			font: fontReg,
			color: dark
		});
		if (credential?.login) {
			page.drawText(`Identifiant : ${credential.login}`, {
				x: 56,
				y: boxY + 32,
				size: 11,
				font: fontReg,
				color: dark
			});
		}
		page.drawText(`Lien valable jusqu'au : ${expiresStr}`, {
			x: 56,
			y: boxY + 14,
			size: 11,
			font: fontReg,
			color: muted
		});

		// Titre section QR
		page.drawText('Scannez ce QR code pour activer votre compte :', {
			x: 40,
			y: boxY - 32,
			size: 12,
			font: fontBold,
			color: dark
		});

		// Dessin du QR code (grille de modules)
		const qrSize = 180;
		const moduleSize = qrSize / moduleCount;
		const qrX = 40;
		const qrY = boxY - 32 - qrSize - 16;

		// Fond blanc du QR
		page.drawRectangle({
			x: qrX - 4,
			y: qrY - 4,
			width: qrSize + 8,
			height: qrSize + 8,
			color: rgb(1, 1, 1)
		});

		for (let row = 0; row < moduleCount; row++) {
			for (let col = 0; col < moduleCount; col++) {
				if (qr.isDark(row, col)) {
					page.drawRectangle({
						x: qrX + col * moduleSize,
						y: qrY + (moduleCount - 1 - row) * moduleSize,
						width: moduleSize,
						height: moduleSize,
						color: rgb(0, 0, 0)
					});
				}
			}
		}

		// URL textuelle sous le QR (si token disponible)
		if (tokenClear) {
			const urlDisplay =
				activationUrl.length > 70 ? activationUrl.substring(0, 70) + '…' : activationUrl;
			page.drawText(urlDisplay, {
				x: qrX,
				y: qrY - 20,
				size: 7.5,
				font: fontReg,
				color: muted
			});
		}

		// Notice de sécurité
		const noticeY = qrY - 60;
		page.drawText('Instructions :', { x: 40, y: noticeY, size: 11, font: fontBold, color: dark });
		const instructions = [
			"1. Scannez le QR code ou saisissez l'URL ci-dessus dans votre navigateur.",
			'2. Choisissez votre mot de passe lors de la première connexion.',
			'3. Ce document est confidentiel — ne le partagez pas.',
			"4. Le lien ne peut être utilisé qu'une seule fois.",
			"5. Après activation, connectez-vous via l'application avec votre identifiant."
		];
		instructions.forEach((line, i) => {
			page.drawText(line, {
				x: 56,
				y: noticeY - 18 - i * 17,
				size: 10,
				font: fontReg,
				color: dark
			});
		});

		// Pied de page
		page.drawText(
			'Généré le ' + new Date().toLocaleDateString('fr-FR') + ' · Koloti — Gestion de copropriété',
			{
				x: 40,
				y: 28,
				size: 8,
				font: fontReg,
				color: muted
			}
		);

		const pdfBytes = await pdfDoc.save();

		return new Response(pdfBytes, {
			status: 200,
			headers: {
				...CORS_HEADERS,
				'Content-Type': 'application/pdf',
				'Content-Disposition': `attachment; filename="bienvenue-${targetProfile.full_name.replace(/\s+/g, '-')}.pdf"`,
				'Cache-Control': 'no-store'
			}
		});
	} catch (err) {
		console.error('Erreur inattendue:', err);
		return new Response(JSON.stringify({ error: 'Erreur interne' }), {
			status: 500,
			headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
		});
	}
});
