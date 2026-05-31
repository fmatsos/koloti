# Design — Édition du profil utilisateur

_Date : 2026-05-31_

## Contexte

L'application Koloti ne proposait aucune page permettant à un utilisateur connecté de modifier ses propres informations. Seul l'admin pouvait modifier les données d'un profil via `/comptes/[id]/edit`. Ce design introduit :

1. Une page `/profil` accessible à tout utilisateur actif pour modifier son identité, son email et demander un changement de mot de passe.
2. La migration du champ `full_name` vers `first_name` + `last_name`.
3. L'extension de la page admin `/comptes/[id]/edit` pour gérer les deux nouveaux champs.

---

## 1. Migration de la base de données

### Nouvelle migration : `supabase/migrations/NNNN_split_full_name.sql`

```sql
ALTER TABLE public.profile
  ADD COLUMN first_name text,
  ADD COLUMN last_name  text;

-- Backfill : premier mot = prénom, reste = nom
UPDATE public.profile
SET
  first_name = split_part(full_name, ' ', 1),
  last_name  = NULLIF(trim(substring(full_name FROM position(' ' IN full_name) + 1)), '');

-- Fallback : si pas d'espace, tout dans last_name
UPDATE public.profile
SET last_name = first_name, first_name = ''
WHERE last_name IS NULL;

ALTER TABLE public.profile
  ALTER COLUMN first_name SET NOT NULL,
  ALTER COLUMN last_name  SET NOT NULL,
  DROP COLUMN full_name;
```

### Impact TypeScript

- Regénérer `src/lib/types/database.ts` via `supabase gen types typescript`.
- Partout où `profile.full_name` est utilisé (Nav.svelte, templates email, pages), remplacer par `` `${profile.first_name} ${profile.last_name}` ``.

---

## 2. Page `/profil` — utilisateur connecté

### Fichiers

| Fichier                                                        | Rôle                                                 |
| -------------------------------------------------------------- | ---------------------------------------------------- |
| `src/routes/(app)/profil/+page.svelte`                         | 3 formulaires indépendants                           |
| `src/routes/(app)/profil/+page.server.ts`                      | 3 actions nommées + load                             |
| `src/routes/(app)/profil/nouveau-mot-de-passe/+page.svelte`    | Formulaire nouveau mdp (post-recovery)               |
| `src/routes/(app)/profil/nouveau-mot-de-passe/+page.server.ts` | load (vérifie session recovery) + action setPassword |

### load()

Retourne `{ profile: locals.profile }` (déjà disponible via `(app)/+layout.server.ts`).

### Formulaire 1 — Identité

**Champs :** `first_name`, `last_name`  
**Action :** `?/updateIdentity`

```ts
const identitySchema = z.object({
	first_name: z.string().trim().min(1, 'Le prénom est requis.').max(100),
	last_name: z.string().trim().min(1, 'Le nom est requis.').max(100)
});
```

Étapes serveur :

1. Valider avec Zod
2. `supabase` (service role) : `UPDATE profile SET first_name, last_name WHERE id = user.id`
3. `writeAuditLog({ action: 'profile.update_identity', entity: 'profile', entityId: user.id })`
4. Retourner `{ success: true, action: 'identity' }`

### Formulaire 2 — Email

**Champ :** `email`  
**Action :** `?/updateEmail`

```ts
const emailSchema = z.object({
	email: z.string().trim().toLowerCase().email('Email invalide.').max(254)
});
```

Étapes serveur :

1. Valider avec Zod
2. Vérifier que l'email n'est pas déjà utilisé dans `profile` (hors utilisateur courant)
3. `auth.admin.updateUserById(user.id, { email })` — met à jour Supabase Auth
4. `UPDATE profile SET email = $1 WHERE id = $2`
5. `writeAuditLog({ action: 'profile.update_email', entity: 'profile', entityId: user.id })`
6. Retourner `{ success: true, action: 'email' }`

### Formulaire 3 — Mot de passe

**Contenu :** texte explicatif + bouton unique "Recevoir un lien de changement"  
**Action :** `?/requestPasswordChange`

Étapes serveur :

1. Appeler `locals.supabase.auth.resetPasswordForEmail(locals.user.email, { redirectTo: '${PUBLIC_APP_URL}/auth/callback?next=/profil/nouveau-mot-de-passe' })`
2. Retourner `{ success: true, action: 'password_reset_sent' }` (toujours — pas d'énumération)

### Sous-route `/profil/nouveau-mot-de-passe`

**load() :** Vérifier que `locals.user` existe et que la session est de type `recovery` (sinon redirect `/profil`).

**Action : `?/setPassword`**

```ts
const setPasswordSchema = z
	.object({
		password: z.string().min(8, 'Au moins 8 caractères.').max(200),
		password_confirm: z.string()
	})
	.refine((d) => d.password === d.password_confirm, {
		message: 'Les mots de passe ne correspondent pas.'
	});
```

Étapes serveur :

1. Valider avec Zod
2. `locals.supabase.auth.updateUser({ password })` (utilise la session recovery active)
3. `writeAuditLog({ action: 'profile.update_password', entity: 'profile', entityId: user.id })`
4. `throw redirect(303, '/profil?password_changed=1')`

---

## 3. Navigation — lien "Mon profil"

Dans `src/lib/components/Nav.svelte`, ajouter un lien vers `/profil` visible pour tous les rôles (admin, editor, member).

---

## 4. Admin — `/comptes/[id]/edit`

### Modifications

- Remplacer le champ `full_name` par deux champs `first_name` et `last_name` dans le formulaire HTML.
- L'action `updateProfile` existante est mise à jour pour accepter et valider les deux nouveaux champs.

```ts
const updateProfileSchema = z.object({
	first_name: z.string().trim().min(1).max(100),
	last_name: z.string().trim().min(1).max(100)
	// email, phone, role restent inchangés
});
```

- `UPDATE profile SET first_name, last_name WHERE id = $params.id`
- Audit log existant inchangé.

---

## 5. Sécurité

- La route `/profil` est protégée par le guard existant `(app)/+layout.server.ts` (seuls les comptes `active` y accèdent).
- `/profil/nouveau-mot-de-passe` vérifie explicitement que la session est de type `recovery` — pas d'accès direct.
- Le changement d'email met à jour Supabase Auth **et** la table `profile` de façon atomique (service role).
- Audit log sur toutes les modifications.

---

## 6. Vérification

1. **Identité :** Modifier prénom/nom sur `/profil`, vérifier la mise à jour dans la Nav et dans `/comptes/[id]/view`.
2. **Email :** Modifier l'email, se déconnecter, se reconnecter avec le nouvel email.
3. **Mot de passe :** Cliquer "Recevoir un lien", vérifier l'email reçu (InBucket sur port 54325 en local), cliquer le lien, saisir un nouveau mdp, se reconnecter.
4. **Admin :** Sur `/comptes/[id]/edit`, modifier prénom/nom d'un utilisateur, vérifier sur sa page profil.
5. **Migration :** Vérifier le backfill sur les profils existants avec des noms composés.
6. **Tests :** Étendre les tests Vitest existants pour couvrir les nouvelles actions.
