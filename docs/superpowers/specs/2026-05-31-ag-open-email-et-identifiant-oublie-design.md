# Design : Email à l'ouverture d'AG + Rappel d'identifiant oublié

## Contexte

Deux features distinctes, livrées ensemble car elles partagent l'infrastructure email (`sendMail`, Supabase service role).

1. **Email à l'ouverture d'AG** — quand un admin/éditeur passe une AG en statut `open`, tous les membres actifs doivent recevoir une notification par email. L'envoi doit être asynchrone (fire-and-forget) avec persistance du résultat dans une table dédiée et une page de compte rendu par membre.
2. **Rappel d'identifiant oublié** — un membre qui ne se souvient plus de son login (ex. `lot12`) peut saisir son adresse email sur une page dédiée et recevoir la liste des logins associés.

---

## Feature 1 : Email à l'ouverture d'AG

### Schéma : table `assembly_notification`

```sql
create table assembly_notification (
  id           uuid primary key default gen_random_uuid(),
  assembly_id  uuid not null references assembly(id) on delete cascade,
  profile_id   uuid references profile(id) on delete set null,
  email        text not null,
  full_name    text not null,
  status       text not null default 'pending'
               check (status in ('pending', 'sent', 'failed')),
  error_msg    text,
  sent_at      timestamptz,
  created_at   timestamptz not null default now()
);
```

`email` et `full_name` sont dénormalisés : le compte rendu reste lisible même si un profil est ultérieurement désactivé ou supprimé.

### Edge Function `notify-assembly-open`

Fichier : `supabase/functions/notify-assembly-open/index.ts`

**Flux d'exécution :**
1. Reçoit `{ assembly_id }` en POST (invoquée par l'action `open`)
2. Fetch l'AG : `title`, `type`, `scheduled_at` via service role
3. Fetch tous les profils actifs : `id`, `email`, `first_name`, `last_name`
4. Bulk insert dans `assembly_notification` avec `status = 'pending'` pour chaque profil
5. Pour chaque profil, séquentiellement :
   - Tente `sendMail` (SMTP via env vars de la fonction)
   - Met à jour la ligne : `status = 'sent'`, `sent_at = now()` — ou `status = 'failed'`, `error_msg = message d'erreur`
6. Retourne `{ sent: N, failed: N }` (ignoré par l'action appelante, utile pour les logs Supabase)

**Contenu de l'email :**

```
Sujet : L'AG "[titre]" est maintenant ouverte

Bonjour [prénom] [nom],

La séance "[titre]" ([type], le [date formatée]) est désormais ouverte.

Accédez à l'AG : https://[PUBLIC_APP_URL]/assemblees-generales/[id]
```

### Modification de l'action `open`

Fichier : `src/routes/(app)/assemblees-generales/[id]/+page.server.ts`

Après le succès de l'update DB et l'audit log, invocation fire-and-forget :

```typescript
supabase.functions.invoke('notify-assembly-open', {
  body: { assembly_id: params.id }
}).catch((e) => console.error('notify-assembly-open invoke failed:', e));
```

L'action retourne `{ success: true }` sans attendre la fin de l'Edge Function.

### Page de compte rendu

Route : `/assemblees-generales/[id]/notifications`

Fichiers :
- `src/routes/(app)/assemblees-generales/[id]/notifications/+page.server.ts`
- `src/routes/(app)/assemblees-generales/[id]/notifications/+page.svelte`

**Load function :**
- Accès réservé aux `admin` et `editor` (redirect `/` sinon)
- Charge les `assembly_notification` de l'AG triées par `status` (pending → failed → sent) puis `full_name`
- Charge aussi le titre de l'AG pour l'en-tête

**Affichage :**
- En-tête : titre de l'AG + résumé `X envoyés / Y échecs / Z en attente`
- Tableau par membre : nom complet, email, badge de statut (Skeleton UI preset success/error/warning), date d'envoi formatée
- Bouton "Rafraîchir" (rechargement de page) pour suivre la progression si l'Edge Function tourne encore
- Lien `← Retour` vers la page AG

**Accès depuis la page AG :**
Un lien "Voir les notifications d'ouverture" est affiché conditionnellement sur la page AG quand `ag.status === 'open'` et que `isAdminOrEditor` est vrai.

---

## Feature 2 : Rappel d'identifiant oublié

### Nouvelle route

- `src/routes/(auth)/login/identifiant-oublie/+page.svelte`
- `src/routes/(auth)/login/identifiant-oublie/+page.server.ts`

**Action `default` :**

1. Valide l'email (zod, format email)
2. Requête via service role (RLS bloquerait anon) :
   ```typescript
   const { data: profiles } = await serviceClient
     .from('profile')
     .select('first_name, last_name, credential(login)')
     .eq('email', email)
     .eq('status', 'active');
   ```
3. Si des profils actifs sont trouvés avec des logins → `sendMail` (try/catch silencieux, échec ignoré)
4. Toujours retourner `{ success: true }` — aucune énumération d'adresses email

**Contenu de l'email :**

```
Sujet : Vos identifiants Koloti

Bonjour,

Voici les identifiants associés à votre adresse :

  • lot12
  • lot13  (si plusieurs)

Connectez-vous sur : https://[PUBLIC_APP_URL]/login
```

**Page svelte :**
- Même style que `/login` : card centré, Skeleton UI, fond `surface-100-900`
- État initial : champ email + bouton "Recevoir mes identifiants"
- État succès : message "Si cette adresse est connue de notre système, un email vous a été envoyé." (pas de formulaire)
- Erreur uniquement pour validation côté client (format email invalide)

### Modification de la page de login

Fichier : `src/routes/(auth)/login/+page.svelte`

Ajouter un lien discret `Identifiant oublié ?` sous chaque formulaire (mode `password` et mode `magiclink`), pointant vers `/login/identifiant-oublie`. Style texte petit, couleur `surface-500`.

---

## Vérification

### Feature 1
1. Ouvrir une AG en statut `convened` via l'UI → l'action retourne immédiatement
2. Naviguer vers `/assemblees-generales/[id]/notifications` → voir les lignes `pending` puis `sent`/`failed` après quelques secondes (rafraîchir)
3. Vérifier dans Mailpit que chaque membre actif a reçu l'email avec le bon titre et lien

### Feature 2
1. Aller sur `/login/identifiant-oublie`, saisir un email connu → vérifier dans Mailpit que l'email liste le(s) bon(s) login(s)
2. Saisir un email inconnu → aucun email envoyé, UI affiche quand même le message de succès
3. Vérifier que le lien "Identifiant oublié ?" apparaît bien sur la page de login (modes password et magiclink)

---

## Fichiers à créer / modifier

### Nouveaux fichiers
- `supabase/functions/notify-assembly-open/index.ts`
- `src/routes/(app)/assemblees-generales/[id]/notifications/+page.server.ts`
- `src/routes/(app)/assemblees-generales/[id]/notifications/+page.svelte`
- `src/routes/(auth)/login/identifiant-oublie/+page.svelte`
- `src/routes/(auth)/login/identifiant-oublie/+page.server.ts`

### Fichiers modifiés
- `src/routes/(app)/assemblees-generales/[id]/+page.server.ts` — action `open` : ajout invocation EF fire-and-forget
- `src/routes/(app)/assemblees-generales/[id]/+page.svelte` — lien "Voir les notifications" conditionnel
- `src/routes/(auth)/login/+page.svelte` — lien "Identifiant oublié ?"

### Migration SQL
- Création de la table `assembly_notification` avec ses contraintes
- Index : `create index on assembly_notification(assembly_id)` pour les requêtes de la page de compte rendu
- Index : `create index on assembly_notification(assembly_id, status)` pour les agrégats (comptage par statut)
