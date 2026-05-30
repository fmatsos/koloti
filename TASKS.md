# TASKS — Tâches atomiques d'implémentation (MVP : Lots 0 → 2)

Décomposition du [`PLAN.md`](./PLAN.md) en **tâches atomiques** : chaque tâche est une unité de travail
livrable et testable indépendamment (idéalement une PR). Numérotation par lot (`T0.x`, `T1.x`, `T2.x`).

**Format** — chaque tâche : 🎯 _Objectif_ · 📁 _Fichiers/composants_ · 🔒 _Sécurité_ · ✅ _Critères
d'acceptation_ · ⛓️ _Dépend de_.

Conventions transverses (s'appliquent à toutes les tâches) : TypeScript strict ; toute action sensible
tracée dans `audit_log` ; toute table touchée a une policy RLS explicite (deny-by-default) ; validation
serveur (zod) de toute entrée ; aucun secret commité.

---

## Lot 0 — Socle

### T0.1 — Initialisation du projet SvelteKit

- 🎯 Bootstrapper SvelteKit (TS strict) avec `adapter-netlify` et l'outillage qualité.
- 📁 `package.json`, `svelte.config.js`, `vite.config.ts`, `tsconfig.json`, `.eslintrc`, `.prettierrc`,
  `.gitignore`, `.nvmrc`, `.editorconfig`.
- 🔒 `tsconfig` strict ; lint interdisant l'import de `$lib/server` côté client.
- ✅ `npm run dev`, `npm run build`, `npm run lint`, `npm run check` passent ; squelette de routes affiché.
- ⛓️ —

### T0.2 — Configuration & secrets (Twelve-Factor)

- 🎯 Centraliser la config par variables d'environnement, sans fuite de secret.
- 📁 `.env.example`, modules `$env/static/public` & `$env/static/private` typés, section README « Config ».
- 🔒 `service_role`, SMTP en `$env/static/private` uniquement ; doc explicite « ne jamais committer `.env` ».
- ✅ App démarre avec `.env` local ; build échoue proprement si une variable requise manque ; aucun
  secret dans le bundle client (vérifié).
- ⛓️ T0.1

### T0.3 — Setup Supabase (CLI, projets, région UE)

- 🎯 Initialiser Supabase local + projets dev/prod, documenter le workflow de migrations.
- 📁 `supabase/config.toml`, `supabase/.gitignore`, doc `README` « Supabase » (région **UE**, link dev/prod).
- 🔒 **Région UE obligatoire** (RGPD, irréversible) ; aucune modification manuelle du schéma prod.
- ✅ `supabase start` fonctionne en local ; procédure dev→prod documentée et reproductible.
- ⛓️ T0.1

### T0.4 — Migration du modèle de données complet

- 🎯 Créer **tout** le schéma de SPEC §4 dans une migration versionnée (y compris tables non MVP).
- 📁 `supabase/migrations/0001_schema.sql`.
- 🔒 Contraintes d'intégrité : `unique(ballot_id, property_id)` (anti-double-vote),
  `unique(assembly_id, grantor_property)` (un mandat/propriété), `check` d'enums (rôle, statut…), FKs.
- ✅ Migration appliquée sans erreur sur une base vierge ; toutes les tables de §4 présentes avec leurs
  contraintes ; rollback documenté.
- ⛓️ T0.3

### T0.5 — RLS de base

- 🎯 Activer la RLS partout (deny-by-default) et poser les policies fondamentales.
- 📁 `supabase/migrations/0002_rls_base.sql`.
- 🔒 RLS activée sur **toutes** les tables ; rôle lu depuis `profile.role` ; `ballot_vote`/`vote_log`
  no-client-write ; `audit_log` insertion serveur-only + lecture admin (cf. SPEC §7.2).
- ✅ Sans policy, aucune ligne accessible ; un membre n'accède qu'à ses données ; tests RLS par rôle verts.
- ⛓️ T0.4

### T0.6 — Génération des types & clients Supabase

- 🎯 Générer les types DB et fournir des clients typés browser/serveur.
- 📁 `src/lib/types/database.ts` (généré), `src/lib/supabase/client.ts` (browser),
  `src/lib/server/supabase.ts` (service_role), script `npm run gen:types`.
- 🔒 Client `service_role` exclusivement dans `lib/server`.
- ✅ Types alignés sur le schéma ; appels Supabase typés ; pas de `any`.
- ⛓️ T0.4

### T0.7 — Session, gardes de routes & en-têtes de sécurité

- 🎯 Gérer la session côté serveur, garder les routes par rôle/statut, poser les en-têtes de sécurité.
- 📁 `src/hooks.server.ts`, `src/app.d.ts`, `src/routes/(app)/+layout.server.ts`,
  `src/routes/(admin)/+layout.server.ts`.
- 🔒 Session via `@supabase/ssr` (cookies httpOnly) ; CSP/HSTS/`X-Content-Type-Options`/`Referrer-Policy` ;
  garde admin/éditeur effective ; redirection des comptes non `active`.
- ✅ Route admin inaccessible à un membre (redirection) ; en-têtes présents dans la réponse ;
  `App.Locals` typé.
- ⛓️ T0.6

### T0.8 — Résolution login → email & flux de connexion

- 🎯 Traduire le `credential.login` en email avant l'appel Supabase Auth ; UI de connexion (mdp + magic link).
- 📁 `supabase/functions/resolve-login/` (ou `src/routes/(auth)/login/+page.server.ts`),
  `src/routes/(auth)/login/+page.svelte`.
- 🔒 Pas d'énumération de comptes (réponse uniforme login inconnu/mauvais mdp) ; rate-limiting basique.
- ✅ Connexion par login+mdp et par magic link fonctionnelles sur le même compte ; login inexistant ne
  révèle rien.
- ⛓️ T0.7

### T0.9 — Edge Function : émission de lien d'activation (72h)

- 🎯 Émettre un lien d'activation usage unique à la création/réémission par l'admin.
- 📁 `supabase/functions/issue-activation-link/`.
- 🔒 `service_role` ; **token hashé** en base (clair seulement dans l'email) ; validité 72h ; **un seul
  lien actif** (régénération invalide le précédent via `revoked`/remplacement) ; action tracée
  (`activation.issue`/`activation.revoke`).
- ✅ Lien envoyé à l'email du coloti ; `activation_link` créé (hash) ; régénération invalide l'ancien ;
  appelable uniquement par un admin.
- ⛓️ T0.5, T0.12

### T0.10 — Page d'activation (coloti)

- 🎯 Permettre au coloti d'activer son compte : définir un mdp (optionnel) ou choisir le magic link seul.
- 📁 `src/routes/(auth)/activate/[token]/+page.server.ts` & `+page.svelte`.
- 🔒 Vérification token (hash) non expiré/non utilisé/non révoqué ; **invariant** : l'admin n'a jamais
  connu de secret ; consommation atomique (`used_at`) ; `pending → active`, `activated_at` renseigné.
- ✅ Lien valide → écran de définition de mot de passe ou activation magic-link ; lien expiré/utilisé →
  message clair + invite à demander une réémission ; statut passe à `active`.
- ⛓️ T0.9

### T0.11 — Mise à jour de `last_login_at`

- 🎯 Renseigner `last_login_at` à chaque connexion réussie.
- 📁 `src/hooks.server.ts` (ou Edge Function/hook d'auth dédié).
- 🔒 Écriture serveur-only.
- ✅ `last_login_at` reflète la dernière connexion ; permet de repérer les comptes dormants.
- ⛓️ T0.8

### T0.12 — SMTP custom & templates d'emails Auth

- 🎯 Configurer un SMTP fiable (Brevo/Resend) et les templates d'emails transactionnels.
- 📁 Config Supabase Auth (SMTP), templates activation/reset/magic link, doc README.
- 🔒 Identifiants SMTP en secret serveur ; pas de fuite de token dans les logs.
- ✅ Email d'activation/reset/magic link reçu hors spam ; templates aux couleurs de l'ASL.
- ⛓️ T0.3

### T0.13 — PWA installable (manifest + service worker minimal)

- 🎯 Rendre l'app installable sur smartphone, sans cache de données sensibles.
- 📁 `static/manifest.webmanifest`, icônes multi-tailles, config `@vite-pwa/sveltekit`, SW minimal.
- 🔒 SW en cache **app-shell uniquement** ; **aucune** donnée sensible (votes/cotisations/documents) en
  cache ; pas de cache-first sur les données.
- ✅ Invite d'installation disponible (Android/iOS installé) ; app fonctionne installée ; SW n'expose
  aucune donnée périmée sensible.
- ⛓️ T0.1

### T0.14 — Cron de ping Supabase

- 🎯 Maintenir le projet Supabase actif (anti-pause free tier).
- 📁 `.github/workflows/ping-supabase.yml`, endpoint léger `src/routes/api/health/+server.ts`.
- 🔒 Endpoint sans donnée sensible ; pas d'authentification requise mais réponse minimale.
- ✅ Workflow planifié s'exécute et obtient 200 ; le projet ne se met pas en pause.
- ⛓️ T0.1

### T0.15 — CI/CD (GitHub Actions + Netlify)

- 🎯 Mettre en place l'intégration continue et le déploiement.
- 📁 `.github/workflows/ci.yml`, `.github/workflows/deploy.yml`, `netlify.toml`.
- 🔒 Secrets en GitHub/Netlify secrets ; application des migrations sur la cible ; en-têtes sécurité Netlify.
- ✅ CI verte (lint, `svelte-check`, tests, build) sur chaque PR ; déploiement Netlify fonctionnel ;
  migrations appliquées automatiquement.
- ⛓️ T0.1, T0.4

### T0.16 — Shell UI & navigation

- 🎯 Layout de base, navigation selon rôle/auth, pages d'erreur, tokens de design.
- 📁 `src/routes/+layout.svelte`, `src/lib/components/` (nav, layout), `src/routes/+error.svelte`.
- 🔒 Navigation conditionnée au rôle ; pas d'exposition d'actions admin aux membres.
- ✅ Navigation cohérente selon le rôle ; pages 401/403/404/500 propres ; design tokens réutilisables.
- ⛓️ T0.7

### T0.17 — Helper d'audit (`audit_log`)

- 🎯 Fournir une fonction serveur réutilisable d'écriture append-only dans `audit_log`.
- 📁 `src/lib/server/audit.ts` (et helper partagé pour les Edge Functions).
- 🔒 Insertion `service_role` uniquement ; **append-only** (aucune route d'update/delete).
- ✅ Toutes les actions sensibles consignent `actor_id`, `action`, `entity`, `entity_id`, `payload`.
- ⛓️ T0.6

---

## Lot 1 — Annuaire, info & documents

### T1.1 — UI admin : liste des comptes

- 🎯 Tableau filtrable des comptes (login, nom, email, rôle, statut, `last_login_at`).
- 📁 `src/routes/(admin)/comptes/+page.server.ts` & `+page.svelte`.
- 🔒 **Jamais de mot de passe affiché** ; accès admin uniquement (RLS + garde).
- ✅ Filtre par statut (`pending`/`active`/`inactive`), tri par dernière connexion ; comptes dormants
  repérables.
- ⛓️ T0.7, T0.16

### T1.2 — Création de compte (admin)

- 🎯 Créer un compte (nom + email + rôle), générer le `login`, déclencher le lien d'activation.
- 📁 `src/routes/(admin)/comptes/nouveau/+page.server.ts` (form action), réutilise T0.9.
- 🔒 Aucun mot de passe généré/transmis ; statut initial `pending` ; pas d'auto-inscription ; tracé.
- ✅ Compte créé en `pending` + `credential.login` unique + email d'activation envoyé.
- ⛓️ T0.9, T1.1

### T1.3 — Actions admin sur un compte

- 🎯 Réémettre le lien, recommuniquer le login, corriger l'email, changer le rôle, activer/désactiver.
- 📁 `src/routes/(admin)/comptes/[id]/+page.server.ts` & `+page.svelte`.
- 🔒 Correction d'email = `profile.email` + email Supabase Auth (Edge Function `service_role`), **login
  inchangé** ; désactivation = `inactive` (jamais de suppression) ; chaque action tracée.
- ✅ Email modifiable sans changer le login ; lien réémis invalide le précédent ; rôle/statut modifiables ;
  désactivation conserve l'historique.
- ⛓️ T1.2

### T1.4 — CRUD propriétés

- 🎯 Gérer les propriétés/lots et leur `vote_weight`.
- 📁 `src/routes/(admin)/proprietes/+page.server.ts` & composants ; migration RLS `property`.
- 🔒 Écriture admin/éditeur ; lecture membre.
- ✅ Création/édition d'une propriété avec référence, adresse, `vote_weight` (défaut 1).
- ⛓️ T0.7

### T1.5 — Gestion ownership (rattachement coloti ↔ propriété)

- 🎯 Rattacher des colotis aux propriétés (multi-lots, indivision), gérer début/fin.
- 📁 `src/routes/(admin)/proprietes/[id]/owners/+page.server.ts` & composants ; RLS `ownership`.
- 🔒 `unique(property_id, profile_id, start_date)` ; vente = `end_date` renseignée + compte `inactive`.
- ✅ Un coloti peut avoir plusieurs lots ; indivision via `is_primary` ; historique conservé.
- ⛓️ T1.4

### T1.6 — État nominatif exportable

- 🎯 Vue exportable (CSV/PDF) : propriétés, propriétaires actuels, contacts, statut cotisation.
- 📁 `src/routes/(admin)/etat-nominatif/+page.server.ts`, util export CSV, Edge Function PDF si besoin.
- 🔒 Accès admin ; données personnelles → pas de cache, génération à la demande.
- ✅ Export CSV et PDF cohérents avec les données courantes (ownership actif).
- ⛓️ T1.5

### T1.7 — Edge Function : lien d'activation étendu

- 🎯 Émettre un lien d'activation à validité étendue (7/14/30 j, plafond 30 j) pour nouvel arrivant.
- 📁 `supabase/functions/issue-extended-link/` (kind `extended`).
- 🔒 Usage unique ; **plafond 30 j** ; révocable (régénération invalide) ; activation tracée ; réservé
  au cas nouvel arrivant.
- ✅ Lien généré avec durée paramétrable plafonnée ; révocable par l'admin ; tracé dans `audit_log`.
- ⛓️ T0.9

### T1.8 — Feuille de bienvenue PDF + QR code

- 🎯 Générer à la volée un A4 imprimable (nom, login, URL d'activation, QR code, expiration, notice).
- 📁 `supabase/functions/welcome-sheet/` (lib PDF + lib QR **locale**).
- 🔒 **Non stockée** (générée à la volée) ; QR encode l'URL d'activation (secret papier) ; lib QR locale
  (pas de service tiers) ; lien usage unique inopérant après activation.
- ✅ PDF téléchargé contenant un QR fonctionnel vers l'activation ; aucune persistance du document.
- ⛓️ T1.7

### T1.9 — Fil d'information (`info_post`)

- 🎯 Publier des actualités markdown (brouillon/publié), lecture membres, CRUD éditeur/admin.
- 📁 `src/routes/(app)/info/`, `src/routes/(admin)/info/`, util markdown assaini ; RLS `info_post`.
- 🔒 Markdown **assaini** (anti-XSS) au rendu ; lecture limitée aux comptes `active` ; écriture
  éditeur/admin (SPEC §7.2).
- ✅ Membre lit les posts publiés ; éditeur/admin crée/édite/publie ; brouillon invisible aux membres.
- ⛓️ T0.7

### T1.10 — Upload de documents

- 🎯 Charger un document vers Storage avec métadonnées (titre, type, description, année, visibilité).
- 📁 `src/routes/(admin)/documents/nouveau/+page.server.ts`, Edge Function/endpoint d'upload ; RLS `document`.
- 🔒 Écriture éditeur/admin ; visibilité décidée à l'upload (`members`/`editors`/`admin`) ; upload tracé ;
  taille bornée (free tier).
- ✅ Document chargé dans Storage + ligne `document` avec métadonnées ; typologie respectée.
- ⛓️ T0.7

### T1.11 — Liste & téléchargement par signed URL

- 🎯 Lister les documents (filtre type/année) et télécharger via **signed URL** selon rôle/visibilité.
- 📁 `src/routes/(app)/documents/+page.server.ts`, `src/routes/(app)/documents/[id]/download/+server.ts`.
- 🔒 **Pas de bucket public** ; signed URL **à durée limitée** générée côté serveur après contrôle RLS de
  visibilité + rôle ; lien non devinable/non partageable durablement ; téléchargement traçable (option).
- ✅ Liste filtrable ; un membre ne télécharge que ce que sa visibilité autorise ; URL expire.
- ⛓️ T1.10

### T1.12 — Gestion visibilité / suppression de document

- 🎯 Modifier la visibilité ou supprimer un document (admin/éditeur).
- 📁 `src/routes/(admin)/documents/[id]/+page.server.ts`.
- 🔒 Changement de visibilité et suppression **tracés** ; suppression du fichier Storage associée.
- ✅ Visibilité modifiable ; suppression effective (DB + Storage) ; actions dans `audit_log`.
- ⛓️ T1.10

### T1.13 — Policies RLS complémentaires (Lot 1)

- 🎯 Compléter la RLS pour `info_post`, `document` (par visibilité/rôle), `property`, `ownership`, gestion `profile`.
- 📁 `supabase/migrations/0003_rls_lot1.sql`.
- 🔒 `document` : lecture par visibilité+rôle (SPEC §7.2) ; `info_post` : lecture publiée par membres
  actifs ; un membre ne voit que ses propres rattachements.
- ✅ Tests RLS par rôle verts pour toutes les tables du Lot 1.
- ⛓️ T1.4, T1.9, T1.10

---

## Lot 2 — AG sans vote

### T2.1 — CRUD assemblée (`draft`)

- 🎯 Préparer une AG (titre, type, mode, date, lieu) en statut `draft`.
- 📁 `src/routes/(admin)/ag/nouvelle/+page.server.ts`, `src/routes/(admin)/ag/[id]/+page.svelte` ; RLS `assembly`.
- 🔒 Création éditeur/admin ; `quorum_pct` paramétrable (défaut 50).
- ✅ AG créée en `draft` avec ses attributs ; éditable tant que `draft`.
- ⛓️ T0.7

### T2.2 — CRUD ordre du jour (`agenda_item`)

- 🎯 Gérer les points d'ordre du jour (position, `requires_vote`).
- 📁 `src/routes/(admin)/ag/[id]/agenda/+page.server.ts` & composants ; RLS `agenda_item`.
- 🔒 Édition éditeur/admin ; cohérence des positions.
- ✅ Points ajoutés/réordonnés/supprimés en `draft` ; `requires_vote` paramétrable.
- ⛓️ T2.1

### T2.3 — Convocation + PDF + email

- 🎯 Passer `draft → convened`, générer le PDF de convocation (ordre du jour inclus) et l'envoyer par email.
- 📁 `supabase/functions/convene-assembly/` (PDF serveur + envoi SMTP), action admin côté route.
- 🔒 Génération **serveur** ; SMTP custom ; `convened_at` renseigné ; action tracée. ⚠️ Délai/forme de
  convocation selon statuts (SPEC §5.3 — hors code).
- ✅ Tous les colotis reçoivent l'email + PDF (ordre du jour) ; statut `convened`.
- ⛓️ T2.2, T0.12

### T2.4 — Renvoi groupé des liens aux comptes `pending`

- 🎯 Au passage `convened`, proposer le renvoi groupé d'un lien d'activation aux comptes `pending`,
  **sur confirmation admin**.
- 📁 `src/routes/(admin)/ag/[id]/relancer/+page.server.ts`, réutilise T0.9 (boucle).
- 🔒 **Semi-automatique** (pas d'envoi silencieux) ; chaque envoi tracé ; régénération invalide les
  liens précédents.
- ✅ Liste des comptes `pending` présentée ; sur confirmation, un nouveau lien est envoyé à chacun ; tracé.
- ⛓️ T2.3, T0.9

### T2.5 — Ouverture de l'AG (`open`)

- 🎯 Passer `convened → open` ; activer l'émargement.
- 📁 Action admin `src/routes/(admin)/ag/[id]/+page.server.ts`.
- 🔒 `opened_at` renseigné ; émargement impossible avant `open` ; action tracée.
- ✅ AG passe en `open` ; l'émargement devient possible.
- ⛓️ T2.3

### T2.6 — Émargement (`attendance`)

- 🎯 Enregistrer la présence par propriété (présent / représenté / absent).
- 📁 `src/routes/(app)/ag/[id]/emargement/+page.server.ts` & composants ; RLS `attendance`.
- 🔒 `unique(assembly_id, property_id)` (une présence par propriété) ; mandant non « présent ET
  représenté » (préparation Lot 3) ; émargement seulement si AG `open`.
- ✅ Présence enregistrée par propriété ; doublon refusé ; modes respectés.
- ⛓️ T2.5

### T2.7 — Calcul & affichage du quorum

- 🎯 Calculer le quorum en temps réel et bloquer si le seuil n'est pas atteint.
- 📁 `src/lib/server/quorum.ts` (calcul pur, testé), affichage `src/routes/(app)/ag/[id]/+page.svelte`.
- 🔒 Calcul **serveur** : `Σ vote_weight (présents/représentés) ÷ Σ vote_weight total ≥ quorum_pct` ;
  **blocage** de l'ouverture des scrutins si `< quorum_pct` (préparation Lot 3).
- ✅ Quorum affiché atteint/non atteint en temps réel ; tests unitaires du calcul (cas limites) verts.
- ⛓️ T2.6

### T2.8 — Policies RLS + audit (Lot 2)

- 🎯 Compléter la RLS et la traçabilité pour `assembly`, `agenda_item`, `attendance`.
- 📁 `supabase/migrations/0004_rls_lot2.sql`.
- 🔒 Lecture membre actif ; écriture éditeur/admin ; transitions de statut tracées (`assembly.convene`,
  `assembly.open`…).
- ✅ Tests RLS par rôle verts ; transitions consignées dans `audit_log`.
- ⛓️ T2.1, T2.6

---

## Récapitulatif des dépendances

```
Lot 0 :
  T0.1 → T0.2, T0.3, T0.13, T0.14, T0.15, T0.16
  T0.3 → T0.4, T0.12
  T0.4 → T0.5, T0.6, T0.15
  T0.6 → T0.7, T0.17
  T0.7 → T0.8, T0.16
  T0.8 → T0.11
  T0.9 (← T0.5, T0.12) → T0.10
Lot 1 :
  T0.7 → T1.1 → T1.2 (← T0.9) → T1.3
  T1.4 → T1.5 → T1.6
  T0.9 → T1.7 → T1.8
  T0.7 → T1.9, T1.10 → T1.11, T1.12
  (T1.4, T1.9, T1.10) → T1.13
Lot 2 :
  T0.7 → T2.1 → T2.2 → T2.3 (← T0.12) → T2.4 (← T0.9)
  T2.3 → T2.5 → T2.6 → T2.7
  (T2.1, T2.6) → T2.8
```

**Hors MVP** (rappel) : clôture/archivage d'AG + PV PDF, scrutins, procurations, Edge Functions de vote
transactionnelles, cotisations, notifications push (Lots 3–5, cf. SPEC §11).
