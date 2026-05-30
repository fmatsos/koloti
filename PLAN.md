# PLAN — Plan d'implémentation Koloti (MVP : Lots 0 → 2)

**Projet** : Koloti — plateforme web de gestion d'une Association Syndicale Libre (ASL) de lotissement.
**Référence métier** : [`SPEC.md`](./SPEC.md) (spec finale v1.0). Ce document ne réécrit pas la spec ;
il en dérive le **plan technique** et renvoie aux sections (`§`) pour le détail fonctionnel.
**Portée de ce plan** : **Lots 0, 1 et 2** (socle, annuaire/info/documents, AG sans vote). Le vote
(Lot 3), les cotisations (Lot 4) et les notifications push (Lot 5) sont **hors périmètre** de ce
document, mais le **modèle de données est créé en totalité dès le Lot 0** (cf. §7).
**Décompte des tâches** : voir [`TASKS.md`](./TASKS.md).

---

## 1. Contexte & objectifs

L'ASL doit disposer d'un espace numérique unique pour informer les colotis, tenir l'état nominatif des
propriétaires, centraliser les documents officiels, organiser les AG (présentiel/en ligne) et suivre les
cotisations (cf. SPEC §1).

Le MVP (Lots 0–2) livre **un socle sécurisé et installable**, **la communication + la gestion
documentaire + l'annuaire**, et **l'organisation des AG sans vote** (cycle de vie, convocation,
émargement, quorum). C'est la base à faible risque juridique, livrable avant l'arbitrage statutaire sur
le vote (cf. SPEC §0 et §11, recommandation : livrer Lots 0–2 d'abord).

## 2. Prérequis non techniques (rappel bloquant — SPEC §0)

Ces points conditionnent la mise en production, pas le développement :

- **Région UE Supabase** à sélectionner **à la création du projet** — irréversible sans migration (§9).
- **≥ 2 comptes admin** (président + suppléant) pour éviter le single point of failure email.
- **Vote** : tant que les statuts ne l'actent pas, le vote reste **consultatif** (hors MVP de toute façon).
- **RGPD** : registre des traitements, durées de conservation, information des personnes à formaliser (§9).

## 3. Décisions d'architecture

| Aspect | Décision | Justification (SPEC) |
|---|---|---|
| Front | **SvelteKit PWA**, `adapter-netlify` | Léger, déploiement Netlify natif, routes serveur disponibles (§3.2) |
| Backend | **Supabase** (Postgres/RLS, Auth, Storage, Edge Functions Deno) | BaaS gratuit suffisant, SQL relationnel, RLS au plus près de la donnée (§3.2) |
| Contrôle d'accès | **RLS Postgres** partout + logique en **Edge Functions** | Le front ne peut pas contourner (§3.2, §7.1) |
| Logique sensible | **Edge Functions `service_role`** exclusivement | Non manipulable par le client ; transactions/invariants garantis (§7.1) |
| Auth | Lien d'activation usage unique 72h → le coloti définit son mdp (optionnel) + magic link, sur le même compte ; login humain via table `credential` | Aucun secret transmis en clair ; découplage login↔email (§3.3, §7.3) |
| Emails | **SMTP custom (Brevo/Resend)** dès le départ | Délivrabilité : l'email porte tous les flux d'accès (§3.3) |
| Disponibilité | **Cron de ping** (GitHub Actions planifié) | Évite la pause free tier après 7 j d'inactivité (§1.3) |

**Principe directeur** : KISS/SRP. Une Edge Function = une responsabilité (émettre un lien, générer une
signed URL, convoquer…). Pas de logique métier dans les composants Svelte. `lib/server` n'est **jamais**
importé côté client (garantie de non-fuite du `service_role`).

## 4. Structure du projet (arborescence cible)

```
koloti/
├── src/
│   ├── routes/
│   │   ├── (auth)/                  # login, activation, magic-link, reset
│   │   ├── (app)/                   # espace connecté : info, documents, annuaire, AG
│   │   └── (admin)/                 # gestion comptes, propriétés, AG (admin/éditeur)
│   │       └── +layout.server.ts    # garde de rôle
│   ├── lib/
│   │   ├── server/                  # SERVEUR UNIQUEMENT : client service_role, audit, garde-fous
│   │   ├── supabase/                # clients browser/server (@supabase/ssr)
│   │   ├── components/              # UI réutilisable (SRP)
│   │   ├── stores/                  # état client
│   │   ├── types/                   # database.ts (généré) + types métier
│   │   └── utils/                   # validation (zod), formatage, markdown assaini
│   ├── hooks.server.ts              # session, garde de routes, en-têtes sécurité (CSP/HSTS)
│   └── app.d.ts                     # typage App.Locals
├── supabase/
│   ├── migrations/                  # SQL versionné (jamais d'édition manuelle du schéma prod)
│   ├── functions/                   # Edge Functions Deno (une responsabilité par fonction)
│   └── config.toml
├── static/                          # manifest.webmanifest, icônes PWA
├── tests/                           # Vitest (unit) + Playwright (e2e)
├── .github/workflows/               # ci.yml, deploy.yml, ping-supabase.yml
├── netlify.toml
├── .env.example
├── PLAN.md
├── TASKS.md
└── SPEC.md
```

## 5. Configuration & secrets (Twelve-Factor)

- **Toute la config par variables d'environnement** ; aucun secret commité ; `.env.example` documenté.
- `$env/static/public` : `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY` (exposables au client).
- `$env/static/private` (serveur uniquement) : `SUPABASE_SERVICE_ROLE_KEY`, identifiants SMTP, (clés
  VAPID en Lot 5). **Le `service_role` ne doit jamais entrer dans un bundle client** — garde via
  `lib/server` + revue de build.
- Parité dev/prod : deux projets Supabase distincts (free tier autorise 2), schéma identique rejoué via
  migrations versionnées (SPEC §3.5).

## 6. Principes de sécurité (synthèse SPEC §7)

- **RLS activée sur toutes les tables**, deny-by-default ; aucune table accessible sans policy explicite.
- Le **rôle** est lu depuis `profile.role` (jamais d'un claim modifiable côté client).
- **Logique sensible 100 % Edge Functions `service_role`** ; le client n'a aucun droit d'écriture sur
  `audit_log`, `ballot_vote`, `vote_log`.
- **Tokens d'activation hashés en base** (jamais en clair), **usage unique**, **un seul lien actif** par
  compte (régénération invalide le précédent).
- **Signed URLs** à durée limitée pour les documents ; **jamais de bucket public** ; lien non devinable
  ni partageable durablement.
- **`audit_log` append-only** : aucune route d'édition/suppression ; insertion par fonctions serveur,
  lecture admin.
- **En-têtes de sécurité** (CSP, HSTS, `X-Content-Type-Options`, `Referrer-Policy`) posés dans
  `hooks.server.ts`.
- **Validation systématique côté serveur** (zod) sur toute entrée ; assainissement du markdown
  (anti-XSS) au rendu de `info_post`.
- **Service Worker** : cache app-shell uniquement, **jamais** de donnée sensible (votes, cotisations) —
  pas de stratégie cache-first sur les données (SPEC §3.4, §10).
- **Secret du vote** : organisationnel, non cryptographique — limite assumée et documentée (SPEC §4.2).

## 7. Modèle de données

Le **schéma relationnel complet de SPEC §4** est créé **dès le Lot 0**, dans une migration versionnée
unique — y compris les tables non encore exploitées en MVP (`proxy`, `ballot`, `vote_log`,
`ballot_vote`, `fee_call`, `fee_assignment`, `push_subscription`). Raison : éviter tout remodelage
ultérieur (exigence du Lot 0, SPEC §11). Les **policies RLS** et les **fonctionnalités** sont, elles,
ajoutées **incrémentalement** lot par lot.

Tables exploitées par le MVP : `profile`, `credential`, `activation_link`, `property`, `ownership`,
`presidency`, `info_post`, `document`, `assembly`, `agenda_item`, `attendance`, `audit_log`.

## 8. Bonnes pratiques SvelteKit / TypeScript

- **TypeScript strict** ; types Supabase **générés** (`database.ts`) ; pas de `any`.
- **`load` serveur** (`+page.server.ts`) pour toute donnée protégée ; **form actions** pour les
  mutations (CSRF géré par SvelteKit) ; endpoints `+server.ts` pour les proxys (ex. signed URL).
- **Session** centralisée dans `hooks.server.ts` + `App.Locals` typé ; gardes de route par groupe
  (`(admin)`, `(app)`).
- **SRP** : composants de présentation sans logique métier ; logique dans `lib` ; effets de bord serveur
  dans `lib/server`.
- Importation interdite de `lib/server` depuis le code client (vérifié par convention + lint).

## 9. DevOps & CI/CD

- **Supabase CLI** : `supabase init`, migrations versionnées, application dev → prod (jamais d'édition
  manuelle du schéma prod).
- **GitHub Actions** :
  - `ci.yml` : lint, `svelte-check` (typecheck), tests (Vitest + tests RLS + Deno), build.
  - `deploy.yml` : déploiement Netlify + application des migrations Supabase sur la cible.
  - `ping-supabase.yml` : **cron planifié** appelant un endpoint léger pour maintenir le projet actif.
- **SMTP custom** (Brevo/Resend, free tier) configuré dès le Lot 0.
- **Netlify** : `netlify.toml` (build SvelteKit `adapter-netlify`, en-têtes sécurité, HTTPS natif).

## 10. Stratégie de test

| Niveau | Outil | Cible |
|---|---|---|
| Unitaire | **Vitest** | utils, validation zod, calcul du quorum, garde-fous purs |
| Sécurité | Client Supabase de test | **policies RLS** par rôle (membre/éditeur/admin, deny-by-default) |
| Edge Functions | **Deno test** | émission/consommation de lien, génération signed URL, convocation |
| E2E | **Playwright** | parcours activation, login mdp + magic link, upload/download document, cycle AG (draft→convened→open + émargement + quorum) |

**Definition of Done (par tâche)** : code typé, testé (niveau pertinent), policies RLS en place si la
tâche touche une table, action sensible tracée dans `audit_log`, revue de non-fuite de secret.

## 11. Découpage en lots (MVP)

| Lot | Contenu | Valeur |
|---|---|---|
| **Lot 0 — Socle** | Setup Supabase (région UE) + Netlify, auth par lien d'activation 72h + mdp défini par le coloti + magic link, `credential`, statuts de compte + `last_login_at`, **PWA installable**, **modèle de données complet**, RLS de base, cron de ping, SMTP custom | Fondations + app installable |
| **Lot 1 — Annuaire, info & documents** | Comptes/rôles, propriétés, ownership, état nominatif, lien étendu + feuille de bienvenue PDF (QR), fil d'info, gestion documentaire (visibilité 3 niveaux, signed URLs) | Communication + documents + onboarding |
| **Lot 2 — AG sans vote** | Cycle de vie AG, convocation + PDF, renvoi groupé des liens aux comptes `pending`, ordre du jour, émargement, quorum | Organisation des AG |

Détail tâche par tâche : [`TASKS.md`](./TASKS.md).

## 12. Vérification de bout en bout (MVP)

1. **Setup** : projet Supabase UE créé, SMTP custom opérationnel (email d'activation reçu hors spam).
2. **Auth** : un compte créé par l'admin reçoit un lien d'activation 72h ; le coloti définit son mot de
   passe **ou** se connecte par magic link ; `pending → active`, `activated_at` renseigné ;
   `last_login_at` mis à jour ; le lien est inopérant après usage et après régénération.
3. **PWA** : l'app s'installe sur l'écran d'accueil (manifest + SW) ; le SW ne sert aucune donnée sensible.
4. **Annuaire/docs** : création de propriétés + ownership ; export de l'état nominatif ; upload de
   document avec visibilité ; téléchargement via signed URL respectant rôle/visibilité ; feuille de
   bienvenue PDF/QR générée à la volée (non stockée).
5. **AG** : cycle `draft → convened → open` ; convocation PDF envoyée par email ; renvoi groupé des liens
   aux comptes `pending` sur confirmation admin ; émargement par propriété ; quorum calculé en temps réel
   et **blocage** sous le seuil.
6. **Sécurité** : tests RLS verts (deny-by-default, isolation par rôle) ; aucune écriture client sur
   `audit_log` ; `service_role` absent du bundle client.
7. **CI/CD** : pipeline vert (lint, typecheck, tests, build) ; cron de ping fonctionnel.
