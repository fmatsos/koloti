// Edge Function : émission d'un lien d'activation étendu (7/14/30 j, plafond 30 j)
// Réservé aux nouveaux arrivants ; usage unique ; révocable par régénération.

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { crypto } from 'jsr:@std/crypto@1/crypto';
import { encodeHex } from 'jsr:@std/encoding@1/hex';

const CORS_HEADERS = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

const MAX_VALIDITY_DAYS = 30;

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

		// Vérifier l'authentification de l'appelant
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

		// Seul un admin peut émettre des liens étendus
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

		const body = await req.json();
		const profileId = body?.profile_id;
		// validity_days : paramétrable, plafonné à MAX_VALIDITY_DAYS
		const requestedDays = typeof body?.validity_days === 'number' ? body.validity_days : 7;
		const validityDays = Math.min(Math.max(1, requestedDays), MAX_VALIDITY_DAYS);

		if (!profileId || typeof profileId !== 'string') {
			return new Response(JSON.stringify({ error: 'profile_id requis' }), {
				status: 400,
				headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
			});
		}

		const { data: targetProfile } = await adminClient
			.from('profile')
			.select('id, email, first_name, last_name, status')
			.eq('id', profileId)
			.single();

		if (!targetProfile) {
			return new Response(JSON.stringify({ error: 'Profil introuvable' }), {
				status: 404,
				headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
			});
		}

		// Générer token cryptographiquement sûr
		const tokenBytes = new Uint8Array(32);
		crypto.getRandomValues(tokenBytes);
		const tokenClear = encodeHex(tokenBytes);

		const tokenHashBytes = await crypto.subtle.digest(
			'SHA-256',
			new TextEncoder().encode(tokenClear)
		);
		const tokenHash = encodeHex(new Uint8Array(tokenHashBytes));

		const expiresAt = new Date(Date.now() + validityDays * 24 * 60 * 60 * 1000).toISOString();

		// Invalider les liens précédents (un seul lien actif par compte)
		await adminClient
			.from('activation_link')
			.update({ revoked: true })
			.eq('profile_id', profileId)
			.eq('revoked', false)
			.is('used_at', null);

		const { data: link, error: insertError } = await adminClient
			.from('activation_link')
			.insert({
				profile_id: profileId,
				token_hash: tokenHash,
				kind: 'extended',
				expires_at: expiresAt,
				created_by: caller.id
			})
			.select('id')
			.single();

		if (insertError || !link) {
			console.error('Erreur création lien:', insertError);
			return new Response(JSON.stringify({ error: 'Erreur interne' }), {
				status: 500,
				headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
			});
		}

		await adminClient.from('audit_log').insert({
			actor_id: caller.id,
			action: 'activation.issue_extended',
			entity: 'activation_link',
			entity_id: link.id,
			payload: {
				profile_id: profileId,
				kind: 'extended',
				validity_days: validityDays,
				expires_at: expiresAt
			}
		});

		const activationUrl = `${appUrl}/activate/${tokenClear}`;

		const { error: emailError } = await adminClient.auth.admin.inviteUserByEmail(
			targetProfile.email,
			{
				data: {
					activation_url: activationUrl,
					full_name: `${targetProfile.first_name} ${targetProfile.last_name}`,
					validity_days: validityDays
				},
				redirectTo: activationUrl
			}
		);

		if (emailError) {
			console.error('Erreur envoi email:', emailError);
		}

		return new Response(
			JSON.stringify({
				success: true,
				link_id: link.id,
				validity_days: validityDays,
				expires_at: expiresAt
			}),
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
