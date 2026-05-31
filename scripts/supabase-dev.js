#!/usr/bin/env node
/**
 * Lance Supabase en local et génère .env.development à partir de sa sortie.
 * Appelé automatiquement par `npm run dev`.
 */
import { execFileSync, spawnSync } from 'child_process';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

// Lance supabase start (visible dans le terminal), ignore l'erreur si déjà lancé
try {
	execFileSync('supabase', ['start'], { stdio: 'inherit', cwd: ROOT });
} catch {
	// Déjà en cours — on récupère le statut juste après
}

// Récupère le statut courant (parseable)
const { stdout, stderr, status } = spawnSync('supabase', ['status'], {
	encoding: 'utf8',
	stdio: 'pipe',
	cwd: ROOT
});

if (status !== 0) {
	console.error('supabase status a échoué :', stderr);
	process.exit(1);
}

function extract(pattern) {
	return stdout.match(pattern)?.[1]?.trim() ?? '';
}

const supabaseUrl = extract(/Project URL\s*│\s*(\S+)/);
// Nouveau format CLI : Publishable / Secret
const anonKey = extract(/Publishable\s*│\s*(\S+)/) || extract(/anon key\s*│\s*(\S+)/i);
const serviceKey = extract(/Secret\s*│\s*(\S+)/) || extract(/service_role key\s*│\s*(\S+)/i);

if (!supabaseUrl || !anonKey) {
	console.error("Impossible de parser la sortie de 'supabase status' :");
	console.error(stdout);
	process.exit(1);
}

const env = `\
# Généré automatiquement par npm run dev — ne pas éditer manuellement
# Source : supabase start / supabase status (${new Date().toISOString()})

# ------------------------------------------------------------------------------
# Supabase local
# ------------------------------------------------------------------------------
PUBLIC_SUPABASE_URL=${supabaseUrl}
PUBLIC_SUPABASE_ANON_KEY=${anonKey}
SUPABASE_SERVICE_ROLE_KEY=${serviceKey}

# ------------------------------------------------------------------------------
# SMTP — Mailpit (capte tous les emails, interface : http://127.0.0.1:54324)
# Nécessite smtp_port = 54325 dans supabase/config.toml
# ------------------------------------------------------------------------------
SMTP_HOST=127.0.0.1
SMTP_PORT=54325
SMTP_USER=
SMTP_PASS=
SMTP_FROM=noreply@koloti.local
SMTP_FROM_NAME=Koloti Dev

# ------------------------------------------------------------------------------
# Application
# ------------------------------------------------------------------------------
PUBLIC_APP_URL=http://localhost:5173
NODE_ENV=development
`;

writeFileSync(join(ROOT, '.env.development'), env, 'utf8');
console.log(`✓ .env.development généré (${supabaseUrl})`);
