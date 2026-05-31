# Edition du profil utilisateur — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permettre à chaque utilisateur actif de modifier son identité (prénom/nom), email et mot de passe, et à l'admin d'éditer le nom/prénom de n'importe quel compte.

**Architecture:** Migration DB pour séparer `full_name` en `first_name + last_name`, refactoring de tous les usages existants, nouvelle route `(app)/profil` avec 3 formulaires (identité, email, demande de changement de mot de passe), sous-route `/profil/nouveau-mot-de-passe` pour finaliser via lien recovery Supabase, et action `updateName` ajoutée dans la page admin existante `/comptes/[id]/edit`.

**Tech Stack:** SvelteKit 5 (form actions + Zod v4), Supabase SSR (`@supabase/ssr`), `writeAuditLog()`, `sendMail()` (nodemailer), Vitest.

---

## Fichiers créés

| Fichier                                                        | Rôle                                                         |
| -------------------------------------------------------------- | ------------------------------------------------------------ |
| `supabase/migrations/0007_split_full_name.sql`                 | Migration : full_name → first_name + last_name               |
| `src/routes/(app)/profil/+page.server.ts`                      | Actions : updateIdentity, updateEmail, requestPasswordChange |
| `src/routes/(app)/profil/+page.svelte`                         | Page profil personnel (3 formulaires)                        |
| `src/routes/(app)/profil/nouveau-mot-de-passe/+page.server.ts` | Action setPassword (session recovery)                        |
| `src/routes/(app)/profil/nouveau-mot-de-passe/+page.svelte`    | Formulaire nouveau mot de passe                              |
| `src/tests/profil-actions.test.ts`                             | Tests unitaires des actions profil                           |

## Fichiers modifiés (full_name → first_name/last_name)

| Fichier                                                                 | Nature des changements                                 |
| ----------------------------------------------------------------------- | ------------------------------------------------------ |
| `src/lib/types/database.ts`                                             | Types profile Row/Insert/Update                        |
| `src/lib/server/bootstrap-admin.ts`                                     | Insert profile                                         |
| `src/lib/server/bootstrap-admin.test.ts`                                | Mock insert                                            |
| `src/lib/server/info-posts.ts`                                          | Query join author                                      |
| `src/lib/components/Nav.svelte`                                         | Affichage nom + lien Mon profil                        |
| `src/routes/auth/callback/+server.ts`                                   | Inchangé (next= déjà géré)                             |
| `src/routes/(auth)/activate/[token]/+page.server.ts`                    | Query + retour fullName                                |
| `src/routes/api/issue-activation-link/+server.ts`                       | Query + email template                                 |
| `src/routes/(app)/app/+page.svelte`                                     | Affichage bienvenue                                    |
| `src/routes/(app)/comptes/+page.server.ts`                              | Query + sort + search                                  |
| `src/routes/(app)/comptes/+page.svelte`                                 | Affichage liste                                        |
| `src/routes/(app)/comptes/new/+page.server.ts`                          | Schema Zod + insert                                    |
| `src/routes/(app)/comptes/new/+page.svelte`                             | Formulaire (2 champs)                                  |
| `src/routes/(app)/comptes/[id]/view/+page.server.ts`                    | Queries                                                |
| `src/routes/(app)/comptes/[id]/view/+page.svelte`                       | Affichage                                              |
| `src/routes/(app)/comptes/[id]/edit/+page.server.ts`                    | Queries + email templates + nouvelle action updateName |
| `src/routes/(app)/comptes/[id]/edit/+page.svelte`                       | Card "Modifier le nom"                                 |
| `src/routes/(app)/documents/+page.server.ts`                            | Query join uploaded_by                                 |
| `src/routes/(app)/etat-nominatif/+page.server.ts`                       | Query join ownership                                   |
| `src/routes/(app)/etat-nominatif/+page.svelte`                          | Affichage                                              |
| `src/routes/(app)/etat-nominatif/export.csv/+server.ts`                 | Query + CSV                                            |
| `src/routes/(app)/proprietes/[id]/view/+page.server.ts`                 | Query join ownership                                   |
| `src/routes/(app)/proprietes/[id]/view/+page.svelte`                    | Affichage                                              |
| `src/routes/(app)/proprietes/[id]/owners/+page.server.ts`               | Queries + sort                                         |
| `src/routes/(app)/proprietes/[id]/owners/+page.svelte`                  | Affichage + option select                              |
| `src/routes/(app)/informations/+page.svelte`                            | Affichage auteur                                       |
| `src/routes/(app)/informations/[id]/view/+page.server.ts`               | Query join author                                      |
| `src/routes/(app)/informations/[id]/view/+page.svelte`                  | Affichage auteur                                       |
| `src/routes/(app)/informations/page/[num]/+page.svelte`                 | Affichage auteur                                       |
| `src/routes/(app)/assemblees-generales/[id]/emargement/+page.server.ts` | Query join ownership                                   |
| `src/routes/(app)/assemblees-generales/[id]/relancer/+page.server.ts`   | Query + sort                                           |
| `src/routes/(app)/assemblees-generales/[id]/relancer/+page.svelte`      | Affichage                                              |

---

## Task 1 : Migration DB — séparer full_name

**Fichiers :**

- Créer : `supabase/migrations/0007_split_full_name.sql`

- [ ] **Créer le fichier de migration**

```sql
-- supabase/migrations/0007_split_full_name.sql
ALTER TABLE public.profile
  ADD COLUMN first_name text,
  ADD COLUMN last_name  text;

UPDATE public.profile
SET
  first_name = CASE
    WHEN position(' ' IN full_name) > 0 THEN split_part(full_name, ' ', 1)
    ELSE ''
  END,
  last_name = CASE
    WHEN position(' ' IN full_name) > 0 THEN trim(substring(full_name FROM position(' ' IN full_name) + 1))
    ELSE full_name
  END;

ALTER TABLE public.profile
  ALTER COLUMN first_name SET NOT NULL,
  ALTER COLUMN last_name  SET NOT NULL;

ALTER TABLE public.profile DROP COLUMN full_name;
```

- [ ] **Appliquer la migration en local**

```bash
supabase db push
```

Résultat attendu : `Applying migration 0007_split_full_name.sql...` sans erreur.

- [ ] **Vérifier le backfill**

```bash
supabase db remote get # ou via supabase studio : table profile, colonnes first_name/last_name présentes
```

- [ ] **Commit**

```bash
git add supabase/migrations/0007_split_full_name.sql
git commit -m "feat(db): split full_name into first_name and last_name"
```

---

## Task 2 : Mettre à jour les types TypeScript (database.ts)

**Fichiers :**

- Modifier : `src/lib/types/database.ts`

Option A (Supabase CLI disponible) :

```bash
supabase gen types typescript --local > src/lib/types/database.ts
```

Option B (manuelle) — remplacer dans `src/lib/types/database.ts` les 3 occurrences du bloc profile :

- [ ] **Remplacer la section `profile > Row`** (actuellement lignes ~602-613)

Avant :

```ts
Row: {
	activated_at: string | null;
	created_at: string;
	email: string;
	full_name: string;
	id: string;
	last_login_at: string | null;
	must_change_credentials: boolean;
	phone: string | null;
	role: Database['public']['Enums']['user_role'];
	status: Database['public']['Enums']['account_status'];
}
```

Après :

```ts
Row: {
	activated_at: string | null;
	created_at: string;
	email: string;
	first_name: string;
	last_name: string;
	id: string;
	last_login_at: string | null;
	must_change_credentials: boolean;
	phone: string | null;
	role: Database['public']['Enums']['user_role'];
	status: Database['public']['Enums']['account_status'];
}
```

- [ ] **Remplacer la section `profile > Insert`**

Avant :

```ts
Insert: {
  activated_at?: string | null;
  created_at?: string;
  email: string;
  full_name: string;
  id: string;
  ...
};
```

Après :

```ts
Insert: {
  activated_at?: string | null;
  created_at?: string;
  email: string;
  first_name: string;
  last_name: string;
  id: string;
  ...
};
```

- [ ] **Remplacer la section `profile > Update`**

Avant :

```ts
Update: {
  ...
  full_name?: string;
  ...
};
```

Après :

```ts
Update: {
  ...
  first_name?: string;
  last_name?: string;
  ...
};
```

- [ ] **Vérifier que TypeScript compile**

```bash
pnpm check
```

Résultat attendu : erreurs sur les fichiers utilisant encore `full_name` (résolu en Task 3–5). Pour l'instant, ignorer ces erreurs.

- [ ] **Commit**

```bash
git add src/lib/types/database.ts
git commit -m "feat(types): update profile types for first_name/last_name split"
```

---

## Task 3 : Mettre à jour bootstrap-admin

**Fichiers :**

- Modifier : `src/lib/server/bootstrap-admin.ts`
- Modifier : `src/lib/server/bootstrap-admin.test.ts`

- [ ] **Modifier `bootstrap-admin.ts`**

Remplacer la ligne :

```ts
full_name: BOOTSTRAP_ADMIN_FULL_NAME,
```

par :

```ts
first_name: BOOTSTRAP_ADMIN_FULL_NAME,
last_name: '',
```

- [ ] **Modifier `bootstrap-admin.test.ts`**

Chercher la ligne contenant `full_name: BOOTSTRAP_ADMIN_FULL_NAME` dans le mock et remplacer par :

```ts
first_name: BOOTSTRAP_ADMIN_FULL_NAME,
last_name: '',
```

- [ ] **Lancer les tests**

```bash
pnpm test bootstrap-admin
```

Résultat attendu : tous les tests passent.

- [ ] **Commit**

```bash
git add src/lib/server/bootstrap-admin.ts src/lib/server/bootstrap-admin.test.ts
git commit -m "feat: update bootstrap-admin for first_name/last_name"
```

---

## Task 4 : Mettre à jour les fichiers serveur (queries et templates email)

**Fichiers (tous modifiés dans cette tâche) :**

- `src/lib/server/info-posts.ts`
- `src/routes/(auth)/activate/[token]/+page.server.ts`
- `src/routes/api/issue-activation-link/+server.ts`
- `src/routes/(app)/comptes/+page.server.ts`
- `src/routes/(app)/comptes/new/+page.server.ts`
- `src/routes/(app)/comptes/[id]/view/+page.server.ts`
- `src/routes/(app)/comptes/[id]/edit/+page.server.ts`
- `src/routes/(app)/documents/+page.server.ts`
- `src/routes/(app)/etat-nominatif/+page.server.ts`
- `src/routes/(app)/etat-nominatif/export.csv/+server.ts`
- `src/routes/(app)/proprietes/[id]/view/+page.server.ts`
- `src/routes/(app)/proprietes/[id]/owners/+page.server.ts`
- `src/routes/(app)/informations/[id]/view/+page.server.ts`
- `src/routes/(app)/assemblees-generales/[id]/emargement/+page.server.ts`
- `src/routes/(app)/assemblees-generales/[id]/relancer/+page.server.ts`

**Règles de remplacement :**

| Avant                                               | Après                                                                                       |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `full_name` dans une chaîne select Supabase         | `first_name, last_name`                                                                     |
| `.order('full_name')`                               | `.order('last_name')`                                                                       |
| `.or('full_name.ilike.%${search}%,email.ilike...')` | `.or(\`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%\`)` |
| `profile.full_name` dans un template string email   | `` `${profile.first_name} ${profile.last_name}` ``                                          |
| `profile?.full_name ?? null`                        | `` `${profile?.first_name ?? ''} ${profile?.last_name ?? ''}`.trim() \|\| null ``           |

- [ ] **`src/lib/server/info-posts.ts` ligne 24**

```ts
'id, title, body, is_published, published_at, created_at, author:author_id(first_name, last_name)',
```

- [ ] **`src/routes/(auth)/activate/[token]/+page.server.ts` ligne 87**

```ts
.select('id, first_name, last_name, email')
```

Ligne 98 :

```ts
fullName: profile ? `${profile.first_name} ${profile.last_name}`.trim() : null;
```

- [ ] **`src/routes/api/issue-activation-link/+server.ts` ligne 36**

```ts
.select('id, email, first_name, last_name, status')
```

Lignes 99-100 (templates email) :

```ts
text: `Bonjour ${targetProfile.first_name} ${targetProfile.last_name},\n\nActivez votre compte en cliquant sur le lien suivant :\n${activationUrl}\n\nCe lien est valable ${validityLabel}.`,
html: `<p>Bonjour ${targetProfile.first_name} ${targetProfile.last_name},</p>
```

- [ ] **`src/routes/(app)/comptes/+page.server.ts`**

Ligne 14 : `'id, first_name, last_name, email, role, status, last_login_at, credential(login)'`

Ligne 15 : `.order('last_name')`

Ligne 17 :

```ts
if (search)
	query = query.or(
		`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`
	);
```

- [ ] **`src/routes/(app)/comptes/new/+page.server.ts`**

Remplacer le schéma Zod :

```ts
const newAccountSchema = z.object({
	first_name: z.string().min(1, 'Le prénom est requis.').max(100).trim(),
	last_name: z.string().min(1, 'Le nom est requis.').max(100).trim(),
	email: z.string().email().max(200).toLowerCase().trim(),
	phone: z.string().max(20).trim().optional(),
	role: z.enum(['admin', 'editor', 'member'])
});
```

Ligne 36 :

```ts
const { first_name, last_name, email, phone, role } = parsed.data;
```

Ligne ~67 (insert profile) :

```ts
first_name,
last_name,
```

Ligne ~98 (audit payload) :

```ts
payload: {
	(email, first_name, last_name, role, login);
}
```

- [ ] **`src/routes/(app)/comptes/[id]/view/+page.server.ts`**

Ligne 14 : `'id, first_name, last_name, email, phone, role, status, last_login_at, activated_at, created_at, credential(id, login)'`

Ligne 63 (join ownership) :

```ts
.select('id, reference, ownership(id, end_date, profile:profile_id(id, first_name, last_name))')
```

Ligne 81 :

```ts
currentOwnerName: ownerProfile
	? `${ownerProfile.first_name} ${ownerProfile.last_name}`.trim()
	: '—';
```

- [ ] **`src/routes/(app)/comptes/[id]/edit/+page.server.ts`**

Ligne 17 :

```ts
id, first_name, last_name, email, phone, role, status, last_login_at, activated_at, created_at,
```

Lignes 172, 210 (select pour email) :

```ts
.select('email, first_name, last_name, status')
```

Lignes 181, 219 (templates email) :

```ts
text: `Bonjour ${profile.first_name} ${profile.last_name},\n\nVotre identifiant de connexion a été modifié par un administrateur.\n\nNouvel identifiant : ${login}\n\nSi vous n'êtes pas à l'origine de cette modification, contactez votre administrateur.`;
```

- [ ] **`src/routes/(app)/documents/+page.server.ts` ligne 37**

```ts
'id, title, type, visibility, year, size_bytes, created_at, uploaded_by:uploaded_by(first_name, last_name)';
```

- [ ] **`src/routes/(app)/etat-nominatif/+page.server.ts` ligne 15**

```ts
'id, reference, street_number, street_name, cadastre_number, vote_weight, ownership(id, start_date, end_date, is_primary, profile:profile_id(first_name, last_name, email, phone))';
```

- [ ] **`src/routes/(app)/etat-nominatif/export.csv/+server.ts`**

Ligne 13 :

```ts
'id, reference, street_number, street_name, cadastre_number, vote_weight, ownership(id, start_date, end_date, is_primary, profile:profile_id(first_name, last_name, email, phone))';
```

Ligne 38 :

```ts
profile ? `${profile.first_name} ${profile.last_name}`.trim() : '',
```

- [ ] **`src/routes/(app)/proprietes/[id]/view/+page.server.ts` ligne 17**

```ts
profile:profile_id(id, first_name, last_name, email))
```

- [ ] **`src/routes/(app)/proprietes/[id]/owners/+page.server.ts`**

Ligne 24 :

```ts
'id, profile_id, start_date, end_date, is_primary, profile:profile_id(first_name, last_name, email)';
```

Lignes 31, 45 :

```ts
.select('id, first_name, last_name, email')
```

Lignes 33, 47 :

```ts
.order('last_name')
```

- [ ] **`src/routes/(app)/informations/[id]/view/+page.server.ts` ligne 12**

```ts
.select('id, title, body, is_published, published_at, created_at, author:author_id(first_name, last_name)')
```

- [ ] **`src/routes/(app)/assemblees-generales/[id]/emargement/+page.server.ts`**

Ligne 28 :

```ts
'id, reference, vote_weight, ownership(profile_id, is_primary, end_date, profile:profile_id(first_name, last_name))';
```

Ligne 54 :

```ts
ownerName: profile ? `${profile.first_name} ${profile.last_name}`.trim() : '—',
```

- [ ] **`src/routes/(app)/assemblees-generales/[id]/relancer/+page.server.ts`**

Lignes 23, 45 :

```ts
.select('id, first_name, last_name, email')
```

Lignes 25 :

```ts
.order('last_name')
```

- [ ] **Vérifier TypeScript (partiel)**

```bash
pnpm check 2>&1 | grep "full_name"
```

Résultat attendu : 0 lignes (toutes les références serveur résolues).

- [ ] **Commit**

```bash
git add src/lib/server/info-posts.ts \
  src/routes/\(auth\)/activate/\[token\]/+page.server.ts \
  src/routes/api/issue-activation-link/+server.ts \
  src/routes/\(app\)/comptes/+page.server.ts \
  src/routes/\(app\)/comptes/new/+page.server.ts \
  src/routes/\(app\)/comptes/\[id\]/view/+page.server.ts \
  src/routes/\(app\)/comptes/\[id\]/edit/+page.server.ts \
  src/routes/\(app\)/documents/+page.server.ts \
  src/routes/\(app\)/etat-nominatif/+page.server.ts \
  src/routes/\(app\)/etat-nominatif/export.csv/+server.ts \
  src/routes/\(app\)/proprietes/\[id\]/view/+page.server.ts \
  src/routes/\(app\)/proprietes/\[id\]/owners/+page.server.ts \
  src/routes/\(app\)/informations/\[id\]/view/+page.server.ts \
  src/routes/\(app\)/assemblees-generales/\[id\]/emargement/+page.server.ts \
  src/routes/\(app\)/assemblees-generales/\[id\]/relancer/+page.server.ts
git commit -m "feat: update all server queries from full_name to first_name/last_name"
```

---

## Task 5 : Mettre à jour les templates Svelte (affichage)

**Règle de remplacement dans les templates :**

| Avant (Svelte)                                              | Après                                                                       |
| ----------------------------------------------------------- | --------------------------------------------------------------------------- | --- | ----- |
| `{compte.full_name}`                                        | `{compte.first_name} {compte.last_name}`                                    |
| `{profile?.full_name ?? '—'}`                               | `{[profile?.first_name, profile?.last_name].filter(Boolean).join(' ')       |     | '—'}` |
| `{profile.full_name}`                                       | `{profile.first_name} {profile.last_name}`                                  |
| `{author?.full_name}`                                       | `{[author?.first_name, author?.last_name].filter(Boolean).join(' ')}`       |
| `data.profile?.full_name ? \`, ${data.profile.full_name}\`` | `data.profile ? \`, ${data.profile.first_name} ${data.profile.last_name}\`` |

- [ ] **`src/lib/components/Nav.svelte` ligne 39**

```svelte
<span class="nav-username" title={`Rôle : ${profile.role}`}
	>{profile.first_name} {profile.last_name}</span
>
```

- [ ] **`src/routes/(app)/app/+page.svelte` ligne 12**

```svelte
<h1>Bienvenue{data.profile ? `, ${data.profile.first_name} ${data.profile.last_name}` : ''}</h1>
```

- [ ] **`src/routes/(app)/comptes/+page.svelte` ligne 57**

```svelte
<td>{compte.first_name} {compte.last_name}</td>
```

- [ ] **`src/routes/(app)/comptes/new/+page.svelte`**

Remplacer le champ `full_name` unique par deux champs :

```svelte
<div class="field">
	<label for="first_name">Prénom <span class="required">*</span></label>
	<input
		id="first_name"
		name="first_name"
		type="text"
		value={form?.values?.first_name ?? ''}
		required
		maxlength="100"
	/>
</div>
<div class="field">
	<label for="last_name">Nom <span class="required">*</span></label>
	<input
		id="last_name"
		name="last_name"
		type="text"
		value={form?.values?.last_name ?? ''}
		required
		maxlength="100"
	/>
</div>
```

- [ ] **`src/routes/(app)/comptes/[id]/view/+page.svelte`**

Lignes 33 et 38 :

```svelte
<svelte:head><title>{compte.first_name} {compte.last_name} — Koloti</title></svelte:head>
...
<h1>{compte.first_name} {compte.last_name}</h1>
```

- [ ] **`src/routes/(app)/comptes/[id]/edit/+page.svelte`**

Lignes 13 et 18 :

```svelte
<title>Modifier {compte.first_name} {compte.last_name} — Koloti</title>
...
<h1>Modifier {compte.first_name} {compte.last_name}</h1>
```

- [ ] **`src/routes/(app)/etat-nominatif/+page.svelte` ligne 49**

```svelte
{[profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || '—'}
```

- [ ] **`src/routes/(app)/proprietes/[id]/view/+page.svelte`**

Lignes 48 et 69 :

```svelte
<strong
	><a href="/comptes/{profile?.id}/view"
		>{[profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || '—'}</a
	></strong
>
...
<strong>{[profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || '—'}</strong>
```

- [ ] **`src/routes/(app)/proprietes/[id]/owners/+page.svelte`**

Ligne 29 :

```svelte
<strong>{[profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || '—'}</strong>
```

Ligne 55 :

```svelte
<option value={p.id}>{p.first_name} {p.last_name} ({p.email})</option>
```

- [ ] **`src/routes/(app)/informations/+page.svelte` ligne 45**

```svelte
{#if author?.first_name || author?.last_name}<span class="author"
		>· {author?.first_name} {author?.last_name}</span
	>{/if}
```

- [ ] **`src/routes/(app)/informations/[id]/view/+page.svelte` ligne 30**

```svelte
{#if author?.first_name || author?.last_name}<span>· {author?.first_name} {author?.last_name}</span
	>{/if}
```

- [ ] **`src/routes/(app)/informations/page/[num]/+page.svelte` ligne 41**

```svelte
{#if author?.first_name || author?.last_name}<span class="author"
		>· {author?.first_name} {author?.last_name}</span
	>{/if}
```

- [ ] **`src/routes/(app)/assemblees-generales/[id]/relancer/+page.svelte` ligne 31**

```svelte
<li><strong>{p.first_name} {p.last_name}</strong> <span class="muted">— {p.email}</span></li>
```

- [ ] **Vérifier TypeScript complet**

```bash
pnpm check
```

Résultat attendu : 0 erreurs TypeScript.

- [ ] **Commit**

```bash
git add src/lib/components/Nav.svelte \
  src/routes/\(app\)/app/+page.svelte \
  src/routes/\(app\)/comptes/+page.svelte \
  src/routes/\(app\)/comptes/new/+page.svelte \
  src/routes/\(app\)/comptes/\[id\]/view/+page.svelte \
  src/routes/\(app\)/comptes/\[id\]/edit/+page.svelte \
  src/routes/\(app\)/etat-nominatif/+page.svelte \
  src/routes/\(app\)/proprietes/\[id\]/view/+page.svelte \
  src/routes/\(app\)/proprietes/\[id\]/owners/+page.svelte \
  src/routes/\(app\)/informations/+page.svelte \
  src/routes/\(app\)/informations/\[id\]/view/+page.svelte \
  src/routes/\(app\)/informations/page/\[num\]/+page.svelte \
  src/routes/\(app\)/assemblees-generales/\[id\]/relancer/+page.svelte
git commit -m "feat: update Svelte templates from full_name to first_name/last_name"
```

---

## Task 6 : Tests TDD pour les actions /profil

**Fichiers :**

- Créer : `src/tests/profil-actions.test.ts`

- [ ] **Écrire les tests**

```ts
// src/tests/profil-actions.test.ts
import { beforeEach, describe, expect, it, vi } from 'vitest';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mockClient: any;
let mockSupabaseAuth: { resetPasswordForEmail: ReturnType<typeof vi.fn> };

vi.mock('$lib/server/supabase', () => ({
  createServiceClient: () => mockClient
}));

vi.mock('$env/static/public', () => ({
  PUBLIC_APP_URL: 'http://localhost:5173'
}));

import { actions } from '../routes/(app)/profil/+page.server';

function buildMockClient() {
  const state = {
    profileUpdates: [] as Array<Record<string, unknown>>
  };

  const profileBuilder = {
    update: vi.fn((payload: Record<string, unknown>) => {
      state.profileUpdates.push(payload);
      return { eq: vi.fn(async () => ({ error: null })) };
    }),
    select: vi.fn(() => profileBuilder),
    eq: vi.fn(() => profileBuilder),
    maybeSingle: vi.fn(async () => ({ data: null, error: null }))
  };

  mockSupabaseAuth = {
    resetPasswordForEmail: vi.fn(async () => ({ error: null }))
  };

  const client = {
    from: vi.fn((table: string) => {
      if (table === 'profile') return profileBuilder;
      throw new Error(`Unexpected table: ${table}`);
    }),
    auth: { admin: { updateUserById: vi.fn(async () => ({ data: null, error: null })) } }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { client: client as any, state };
}

const baseLocals = {
  user: { id: 'user-id', email: 'user@example.com' },
  profile: { id: 'user-id', first_name: 'Jean', last_name: 'Dupont', email: 'user@example.com' },
  supabase: null as unknown // sera remplacé par mockSupabaseAuth par test
};

beforeEach(() => {
  const mock = buildMockClient();
  mockClient = mock.client;
});

describe('profil : updateIdentity', () => {
  it('rejette si prénom manquant', async () => {
    const formData = new FormData();
    formData.set('first_name', '');
    formData.set('last_name', 'Dupont');

    const result = (await actions.updateIdentity({
      request: { formData: async () => formData } as Request,
      locals: { ...baseLocals, supabase: { auth: mockSupabaseAuth } }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)) as any;

    expect(result.status).toBe(400);
    expect(result.data.error).toBeTruthy();
  });

  it('met à jour first_name et last_name', async () => {
    const mock = buildMockClient();
    mockClient = mock.client;

    const formData = new FormData();
    formData.set('first_name', 'Marie');
    formData.set('last_name', 'Curie');

    const result = (await actions.updateIdentity({
      request: { formData: async () => formData } as Request,
      locals: { ...baseLocals, supabase: { auth: mockSupabaseAuth } }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)) as any;

    expect(result).toEqual({ success: true, action: 'identity' });
    expect(mock.state.profileUpdates).toEqual([{ first_name: 'Marie', last_name: 'Curie' }]);
  });
});

describe('profil : updateEmail', () => {
  it('rejette un email invalide', async () => {
    const formData = new FormData();
    formData.set('email', 'pas-un-email');

    const result = (await actions.updateEmail({
      request: { formData: async () => formData } as Request,
      locals: { ...baseLocals, supabase: { auth: mockSupabaseAuth } }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)) as any;

    expect(result.status).toBe(400);
    expect(result.data.error).toBeTruthy();
  });

  it('retourne succès pour un email valide sans conflit', async () => {
    const mock = buildMockClient();
    mockClient = mock.client;

    const formData = new FormData();
    formData.set('email', 'nouvelle@example.com');

    const result = (await actions.updateEmail({
      request: { formData: async () => formData } as Request,
      locals: { ...baseLocals, supabase: { auth: mockSupabaseAuth } }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)) as any;

    expect(result).toEqual({ success: true, action: 'email' });
  });
});

describe('profil : requestPasswordChange', () => {
  it('retourne toujours succès (pas d'énumération)', async () => {
    const supabaseMock = {
      auth: { resetPasswordForEmail: vi.fn(async () => ({ error: null })) }
    };

    const result = (await actions.requestPasswordChange({
      request: { formData: async () => new FormData() } as Request,
      locals: { ...baseLocals, supabase: supabaseMock }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)) as any;

    expect(result).toEqual({ success: true, action: 'password_reset_sent' });
    expect(supabaseMock.auth.resetPasswordForEmail).toHaveBeenCalledWith(
      'user@example.com',
      expect.objectContaining({ redirectTo: expect.stringContaining('/profil/nouveau-mot-de-passe') })
    );
  });
});
```

- [ ] **Lancer les tests pour confirmer qu'ils échouent**

```bash
pnpm test profil-actions
```

Résultat attendu : erreur `Cannot find module '../routes/(app)/profil/+page.server'`

- [ ] **Commit**

```bash
git add src/tests/profil-actions.test.ts
git commit -m "test: add failing tests for /profil actions"
```

---

## Task 7 : Implémenter /profil/+page.server.ts

**Fichiers :**

- Créer : `src/routes/(app)/profil/+page.server.ts`

- [ ] **Créer le fichier**

```ts
// src/routes/(app)/profil/+page.server.ts
import { fail } from '@sveltejs/kit';
import { z } from 'zod/v4';
import { createServiceClient } from '$lib/server/supabase';
import { writeAuditLog } from '$lib/server/audit';
import { PUBLIC_APP_URL } from '$env/static/public';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	return { profile: locals.profile };
};

const identitySchema = z.object({
	first_name: z.string().trim().min(1, 'Le prénom est requis.').max(100),
	last_name: z.string().trim().min(1, 'Le nom est requis.').max(100)
});

const emailSchema = z.object({
	email: z.string().trim().toLowerCase().email('Email invalide.').max(254)
});

export const actions: Actions = {
	updateIdentity: async ({ request, locals }) => {
		if (!locals.user || !locals.profile) return fail(401, { error: 'Non authentifié.' });

		const formData = Object.fromEntries(await request.formData());
		const parsed = identitySchema.safeParse(formData);
		if (!parsed.success)
			return fail(400, { error: parsed.error.issues[0]?.message ?? 'Données invalides.' });

		const { first_name, last_name } = parsed.data;
		const supabase = createServiceClient();

		await supabase.from('profile').update({ first_name, last_name }).eq('id', locals.user.id);

		await writeAuditLog({
			actorId: locals.profile.id,
			action: 'profile.update_identity',
			entity: 'profile',
			entityId: locals.user.id,
			payload: { first_name, last_name }
		});

		return { success: true, action: 'identity' };
	},

	updateEmail: async ({ request, locals }) => {
		if (!locals.user || !locals.profile) return fail(401, { error: 'Non authentifié.' });

		const formData = Object.fromEntries(await request.formData());
		const parsed = emailSchema.safeParse(formData);
		if (!parsed.success)
			return fail(400, { error: parsed.error.issues[0]?.message ?? 'Email invalide.' });

		const { email } = parsed.data;
		const supabase = createServiceClient();

		const { data: conflict } = await supabase
			.from('profile')
			.select('id')
			.eq('email', email)
			.neq('id', locals.user.id)
			.maybeSingle();

		if (conflict) return fail(400, { error: 'Cet email est déjà utilisé.' });

		await supabase.auth.admin.updateUserById(locals.user.id, { email });
		await supabase.from('profile').update({ email }).eq('id', locals.user.id);

		await writeAuditLog({
			actorId: locals.profile.id,
			action: 'profile.update_email',
			entity: 'profile',
			entityId: locals.user.id,
			payload: { email }
		});

		return { success: true, action: 'email' };
	},

	requestPasswordChange: async ({ locals }) => {
		if (!locals.user || !locals.profile) return fail(401, { error: 'Non authentifié.' });

		await locals.supabase.auth.resetPasswordForEmail(locals.user.email!, {
			redirectTo: `${PUBLIC_APP_URL}/auth/callback?next=/profil/nouveau-mot-de-passe`
		});

		return { success: true, action: 'password_reset_sent' };
	}
};
```

- [ ] **Lancer les tests**

```bash
pnpm test profil-actions
```

Résultat attendu : tous les tests passent.

- [ ] **Commit**

```bash
git add src/routes/\(app\)/profil/+page.server.ts
git commit -m "feat: add /profil page server actions (identity, email, password reset)"
```

---

## Task 8 : Créer /profil/+page.svelte

**Fichiers :**

- Créer : `src/routes/(app)/profil/+page.svelte`

- [ ] **Créer la page**

```svelte
<script lang="ts">
	import { page } from '$app/state';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const passwordChanged = $derived(page.url.searchParams.get('password_changed') === '1');
</script>

<svelte:head>
	<title>Mon profil — Koloti</title>
</svelte:head>

<div class="page-header">
	<h1>Mon profil</h1>
</div>

{#if form?.error}
	<div class="alert alert-error">{form.error}</div>
{/if}

{#if passwordChanged}
	<div class="alert alert-success">Mot de passe modifié avec succès.</div>
{:else if form?.success}
	<div class="alert alert-success">
		{#if form.action === 'identity'}Identité mise à jour.
		{:else if form.action === 'email'}Email mis à jour.
		{:else if form.action === 'password_reset_sent'}Un lien de changement de mot de passe vous a été
			envoyé par email.
		{/if}
	</div>
{/if}

<div class="profile-grid">
	<!-- Identité -->
	<div class="card">
		<h3>Identité</h3>
		<form method="POST" action="?/updateIdentity">
			<div class="field">
				<label for="first_name">Prénom</label>
				<input
					id="first_name"
					name="first_name"
					type="text"
					value={data.profile?.first_name ?? ''}
					maxlength="100"
					required
				/>
			</div>
			<div class="field">
				<label for="last_name">Nom</label>
				<input
					id="last_name"
					name="last_name"
					type="text"
					value={data.profile?.last_name ?? ''}
					maxlength="100"
					required
				/>
			</div>
			<button type="submit" class="btn-sm">Enregistrer</button>
		</form>
	</div>

	<!-- Email -->
	<div class="card">
		<h3>Adresse email</h3>
		<form method="POST" action="?/updateEmail">
			<div class="field">
				<label for="email">Nouvel email</label>
				<input
					id="email"
					name="email"
					type="email"
					value={data.profile?.email ?? ''}
					maxlength="254"
					required
				/>
			</div>
			<button type="submit" class="btn-sm">Enregistrer</button>
		</form>
	</div>

	<!-- Mot de passe -->
	<div class="card">
		<h3>Mot de passe</h3>
		<p class="hint">
			Pour changer votre mot de passe, cliquez sur le bouton ci-dessous. Vous recevrez un email avec
			un lien sécurisé.
		</p>
		<form method="POST" action="?/requestPasswordChange">
			<button type="submit" class="btn-sm">Recevoir un lien de changement</button>
		</form>
	</div>
</div>

<style>
	.page-header {
		margin-bottom: 1.5rem;
	}
	h1 {
		margin: 0;
		font-size: 1.5rem;
	}
	h3 {
		margin: 0 0 1rem;
		font-size: 1rem;
	}

	.profile-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 1rem;
		align-items: start;
	}

	.card {
		background: white;
		border-radius: var(--radius, 0.375rem);
		border: 1px solid var(--color-border, #e5e7eb);
		padding: 1.25rem;
	}

	.field {
		margin-bottom: 0.75rem;
	}
	label {
		display: block;
		font-size: 0.8125rem;
		font-weight: 500;
		margin-bottom: 0.25rem;
	}
	input {
		width: 100%;
		padding: 0.4rem 0.625rem;
		border: 1px solid var(--color-border, #e5e7eb);
		border-radius: 0.25rem;
		font-size: 0.875rem;
		box-sizing: border-box;
	}
	.hint {
		font-size: 0.75rem;
		color: var(--color-text-muted, #6b7280);
		margin: 0 0 0.75rem;
	}

	.btn-sm {
		padding: 0.375rem 0.875rem;
		background: var(--color-primary, #1a73e8);
		color: white;
		border: none;
		border-radius: 0.25rem;
		font-size: 0.8125rem;
		cursor: pointer;
	}

	.alert {
		padding: 0.75rem 1rem;
		border-radius: var(--radius, 0.375rem);
		margin-bottom: 1rem;
		font-size: 0.875rem;
	}
	.alert-success {
		background: #f0fdf4;
		color: #16a34a;
		border: 1px solid #bbf7d0;
	}
	.alert-error {
		background: #fef2f2;
		color: #dc2626;
		border: 1px solid #fecaca;
	}
</style>
```

- [ ] **Commit**

```bash
git add src/routes/\(app\)/profil/+page.svelte
git commit -m "feat: add /profil page with identity, email and password forms"
```

---

## Task 9 : Créer /profil/nouveau-mot-de-passe

**Fichiers :**

- Créer : `src/routes/(app)/profil/nouveau-mot-de-passe/+page.server.ts`
- Créer : `src/routes/(app)/profil/nouveau-mot-de-passe/+page.svelte`

- [ ] **Créer le server**

```ts
// src/routes/(app)/profil/nouveau-mot-de-passe/+page.server.ts
import { fail, redirect } from '@sveltejs/kit';
import { z } from 'zod/v4';
import { writeAuditLog } from '$lib/server/audit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	return { profile: locals.profile };
};

const setPasswordSchema = z
	.object({
		password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères.').max(200),
		password_confirm: z.string()
	})
	.refine((d) => d.password === d.password_confirm, {
		message: 'Les mots de passe ne correspondent pas.',
		path: ['password_confirm']
	});

export const actions: Actions = {
	default: async ({ request, locals }) => {
		if (!locals.user || !locals.profile) return fail(401, { error: 'Non authentifié.' });

		const formData = Object.fromEntries(await request.formData());
		const parsed = setPasswordSchema.safeParse(formData);
		if (!parsed.success)
			return fail(400, { error: parsed.error.issues[0]?.message ?? 'Données invalides.' });

		const { error } = await locals.supabase.auth.updateUser({ password: parsed.data.password });

		if (error)
			return fail(400, {
				error: 'Impossible de modifier le mot de passe. Le lien a peut-être expiré.'
			});

		await writeAuditLog({
			actorId: locals.profile.id,
			action: 'profile.update_password',
			entity: 'profile',
			entityId: locals.user.id
		});

		throw redirect(303, '/profil?password_changed=1');
	}
};
```

- [ ] **Créer la page Svelte**

```svelte
<!-- src/routes/(app)/profil/nouveau-mot-de-passe/+page.svelte -->
<script lang="ts">
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
</script>

<svelte:head>
	<title>Nouveau mot de passe — Koloti</title>
</svelte:head>

<div class="page-header">
	<a href="/profil" class="back-link">← Mon profil</a>
	<h1>Définir un nouveau mot de passe</h1>
</div>

{#if form?.error}
	<div class="alert alert-error">{form.error}</div>
{/if}

<div class="card">
	<form method="POST">
		<div class="field">
			<label for="password">Nouveau mot de passe</label>
			<input
				id="password"
				name="password"
				type="password"
				minlength="8"
				maxlength="200"
				required
				autocomplete="new-password"
			/>
			<span class="hint">Au moins 8 caractères.</span>
		</div>
		<div class="field">
			<label for="password_confirm">Confirmer le mot de passe</label>
			<input
				id="password_confirm"
				name="password_confirm"
				type="password"
				minlength="8"
				maxlength="200"
				required
				autocomplete="new-password"
			/>
		</div>
		<button type="submit" class="btn">Enregistrer le nouveau mot de passe</button>
	</form>
</div>

<style>
	.page-header {
		margin-bottom: 1.5rem;
	}
	.back-link {
		display: inline-block;
		margin-bottom: 0.5rem;
		font-size: 0.875rem;
		text-decoration: none;
		color: var(--color-text-muted, #6b7280);
	}
	h1 {
		margin: 0;
		font-size: 1.5rem;
	}
	.card {
		background: white;
		border-radius: var(--radius, 0.375rem);
		border: 1px solid var(--color-border, #e5e7eb);
		padding: 1.25rem;
		max-width: 400px;
	}
	.field {
		margin-bottom: 0.75rem;
	}
	label {
		display: block;
		font-size: 0.8125rem;
		font-weight: 500;
		margin-bottom: 0.25rem;
	}
	input {
		width: 100%;
		padding: 0.4rem 0.625rem;
		border: 1px solid var(--color-border, #e5e7eb);
		border-radius: 0.25rem;
		font-size: 0.875rem;
		box-sizing: border-box;
	}
	.hint {
		font-size: 0.75rem;
		color: var(--color-text-muted, #6b7280);
	}
	.btn {
		margin-top: 0.5rem;
		padding: 0.5rem 1rem;
		background: var(--color-primary, #1a73e8);
		color: white;
		border: none;
		border-radius: 0.25rem;
		font-size: 0.875rem;
		cursor: pointer;
	}
	.alert {
		padding: 0.75rem 1rem;
		border-radius: var(--radius, 0.375rem);
		margin-bottom: 1rem;
		font-size: 0.875rem;
	}
	.alert-error {
		background: #fef2f2;
		color: #dc2626;
		border: 1px solid #fecaca;
	}
</style>
```

- [ ] **Commit**

```bash
git add src/routes/\(app\)/profil/nouveau-mot-de-passe/
git commit -m "feat: add /profil/nouveau-mot-de-passe page for password recovery flow"
```

---

## Task 10 : Admin — action updateName dans /comptes/[id]/edit

**Fichiers :**

- Modifier : `src/routes/(app)/comptes/[id]/edit/+page.server.ts`
- Modifier : `src/routes/(app)/comptes/[id]/edit/+page.svelte`

- [ ] **Ajouter le schéma et l'action dans `+page.server.ts`**

Ajouter après les imports, le schéma :

```ts
const updateNameSchema = z.object({
	first_name: z.string().trim().min(1, 'Le prénom est requis.').max(100),
	last_name: z.string().trim().min(1, 'Le nom est requis.').max(100)
});
```

Ajouter dans `export const actions` :

```ts
updateName: async ({ request, locals, params }) => {
  if (!locals.profile || locals.profile.role !== 'admin')
    return fail(403, { error: 'Non autorisé.' });

  const formData = Object.fromEntries(await request.formData());
  const parsed = updateNameSchema.safeParse(formData);
  if (!parsed.success) return fail(400, { error: parsed.error.issues[0]?.message ?? 'Données invalides.' });

  const { first_name, last_name } = parsed.data;
  const supabase = createServiceClient();

  await supabase.from('profile').update({ first_name, last_name }).eq('id', params.id);

  await writeAuditLog({
    actorId: locals.profile.id,
    action: 'account.update_name',
    entity: 'profile',
    entityId: params.id,
    payload: { first_name, last_name }
  });

  return { success: true, action: 'name' };
},
```

- [ ] **Ajouter un message de succès dans `+page.svelte`**

Dans le bloc `{#if form?.success}`, ajouter :

```svelte
{:else if form.action === 'name'}Nom mis à jour.
```

- [ ] **Ajouter la card "Modifier le nom" dans `+page.svelte`**

Dans `.actions-col`, ajouter en premier :

```svelte
<!-- Modifier le nom -->
<div class="card">
	<h3>Modifier le nom</h3>
	<form method="POST" action="?/updateName">
		<div class="field">
			<label for="first_name">Prénom</label>
			<input
				id="first_name"
				name="first_name"
				type="text"
				value={compte.first_name}
				maxlength="100"
				required
			/>
		</div>
		<div class="field">
			<label for="last_name">Nom</label>
			<input
				id="last_name"
				name="last_name"
				type="text"
				value={compte.last_name}
				maxlength="100"
				required
			/>
		</div>
		<button type="submit" class="btn-sm">Enregistrer</button>
	</form>
</div>
```

- [ ] **Commit**

```bash
git add src/routes/\(app\)/comptes/\[id\]/edit/+page.server.ts src/routes/\(app\)/comptes/\[id\]/edit/+page.svelte
git commit -m "feat(admin): add updateName action in /comptes/[id]/edit"
```

---

## Task 11 : Nav — lien "Mon profil"

**Fichiers :**

- Modifier : `src/lib/components/Nav.svelte`

- [ ] **Ajouter le lien dans `.nav-user`**

Remplacer le bloc `.nav-user` dans `Nav.svelte` :

```svelte
<div class="nav-user">
	{#if profile}
		<a href="/profil" class="nav-profile">{profile.first_name} {profile.last_name}</a>
		<form method="POST" action="/logout">
			<button type="submit" class="nav-logout">Déconnexion</button>
		</form>
	{/if}
</div>
```

Et dans `<style>`, remplacer `.nav-username` par `.nav-profile` :

```css
.nav-profile {
	font-size: 0.875rem;
	color: #6b7280;
	white-space: nowrap;
	text-decoration: none;
}
.nav-profile:hover {
	color: var(--color-primary, #1a73e8);
}
```

- [ ] **Commit**

```bash
git add src/lib/components/Nav.svelte
git commit -m "feat: add Mon profil link in Nav"
```

---

## Task 12 : Vérification end-to-end

- [ ] **Lancer le serveur de dev**

```bash
pnpm dev
```

- [ ] **Vérifier l'affichage des noms existants**

Naviguer vers `/comptes`, `/app`, `/informations` — vérifier que les noms s'affichent correctement (prénom + nom, sans `undefined`).

- [ ] **Tester l'édition d'identité**

Se connecter, aller sur `/profil`, modifier prénom/nom → vérifier le changement dans la Nav.

- [ ] **Tester l'édition d'email**

Sur `/profil`, changer l'email → vérifier le succès. Tenter un email déjà utilisé → vérifier le message d'erreur.

- [ ] **Tester le changement de mot de passe**

Sur `/profil`, cliquer "Recevoir un lien" → vérifier l'email dans InBucket (`http://localhost:54325`) → cliquer le lien → saisir un nouveau mdp → vérifier la redirection vers `/profil?password_changed=1`.

- [ ] **Tester la partie admin**

Sur `/comptes/[id]/edit`, modifier prénom/nom d'un utilisateur → vérifier la mise à jour sur `/comptes/[id]/view`.

- [ ] **Lancer tous les tests**

```bash
pnpm test
```

Résultat attendu : tous les tests passent.

- [ ] **Commit final si besoin**

```bash
git add -p
git commit -m "feat: user profile editing complete"
```
