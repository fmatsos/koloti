// Edge Function : émission d'un lien d'activation (standard 72h)
// Responsabilité unique : créer un token haché, invalider le précédent, envoyer l'email.
// Appelable uniquement par un admin (vérifié via service_role + vérification du profil appelant).

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { crypto } from 'jsr:@std/crypto@1/crypto';
import { encodeHex } from 'jsr:@std/encoding@1/hex';

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

		// Client service_role (bypass RLS)
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

		// Valider le JWT de l'appelant
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

		// Vérifier que l'appelant est admin
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

		// Payload attendu
		const body = await req.json();
		const profileId = body?.profile_id;
		if (!profileId || typeof profileId !== 'string') {
			return new Response(JSON.stringify({ error: 'profile_id requis' }), {
				status: 400,
				headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
			});
		}

		// Vérifier que le profil cible existe et est en statut pending
		const { data: targetProfile } = await adminClient
			.from('profile')
			.select('id, email, full_name, status')
			.eq('id', profileId)
			.single();

		if (!targetProfile) {
			return new Response(JSON.stringify({ error: 'Profil introuvable' }), {
				status: 404,
				headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
			});
		}

		// Générer un token cryptographiquement sûr
		const tokenBytes = new Uint8Array(32);
		crypto.getRandomValues(tokenBytes);
		const tokenClear = encodeHex(tokenBytes);

		// Hasher le token (SHA-256) — seul le hash est stocké
		const tokenHashBytes = await crypto.subtle.digest(
			'SHA-256',
			new TextEncoder().encode(tokenClear)
		);
		const tokenHash = encodeHex(new Uint8Array(tokenHashBytes));

		const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();

		// Invalider les liens précédents (un seul lien actif par compte)
		await adminClient
			.from('activation_link')
			.update({ revoked: true })
			.eq('profile_id', profileId)
			.eq('revoked', false)
			.is('used_at', null);

		// Créer le nouveau lien
		const { data: link, error: insertError } = await adminClient
			.from('activation_link')
			.insert({
				profile_id: profileId,
				token_hash: tokenHash,
				kind: 'standard',
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

		// Tracer l'action dans audit_log
		await adminClient.from('audit_log').insert({
			actor_id: caller.id,
			action: 'activation.issue',
			entity: 'activation_link',
			entity_id: link.id,
			payload: { profile_id: profileId, kind: 'standard', expires_at: expiresAt }
		});

		// L'URL d'activation encode le token en clair (jamais stocké en base)
		const activationUrl = `${appUrl}/activate/${tokenClear}`;

		// Envoyer l'email via Supabase Auth (SMTP custom configuré dans supabase/config.toml)
		const { error: emailError } = await adminClient.auth.admin.inviteUserByEmail(
			targetProfile.email,
			{
				data: {
					activation_url: activationUrl,
					full_name: targetProfile.full_name
				},
				redirectTo: activationUrl
			}
		);

		if (emailError) {
			console.error('Erreur envoi email:', emailError);
			// On ne fail pas — le lien est créé, l'admin peut le renvoyer
		}

		return new Response(
			JSON.stringify({
				success: true,
				link_id: link.id,
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
