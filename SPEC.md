# Spécification — Plateforme ASL (information, présence, vote)

**Version** : 1.0 (finale)
**Date** : 30 mai 2026
**Statut** : Arbitrages tranchés. Reste sous réserve des prérequis statutaires (§0) et des questions ouvertes (§12).
**Périmètre** : Application web pour la gestion d'une Association Syndicale Libre (ASL) de lotissement — information, annuaire, documents, convocations, AG (présentiel et en ligne), émargement, vote, suivi des cotisations.

---

## 0. Prérequis non techniques bloquants

Ces points conditionnent la valeur juridique de l'outil. Ils relèvent des statuts et de l'AG, **pas du développement**. Ils doivent être tranchés avant mise en production.

1. **Autorisation du vote électronique.** La valeur officielle d'un vote en ligne dépend de ce que les statuts de l'ASL autorisent. Si les statuts ne prévoient pas explicitement le vote électronique (et/ou la tenue d'AG dématérialisées), tout vote en ligne est **contestable et potentiellement annulable**. → Décision à prendre en AG. Tant que ce point n'est pas acté, l'outil de vote doit être considéré comme **consultatif** (sondage), pas officiel.
2. **Règles de majorité et pondération.** Le système retient par défaut *une voix par propriété* (et non par personne) et un *quorum à 50 %*. Ces valeurs doivent correspondre aux statuts. Elles sont paramétrables, mais le paramétrage par défaut doit être validé.
3. **Plafond de procurations.** Retenu à 3 mandats maximum par mandataire. À confirmer avec les statuts (le plafond légal/statutaire peut différer).
4. **RGPD.** L'ASL est responsable de traitement. Le registre des traitements, les durées de conservation et l'information des personnes doivent être formalisés (cf. §9).

> **Limite assumée de cette spec** : elle décrit un système *techniquement* auditable et robuste (journal append-only, séparation émargement/bulletin, anti-double-vote). Elle ne garantit pas la *validité juridique* du vote, qui dépend des statuts et, en cas de litige, de l'appréciation d'un juge.

---

## 1. Objectifs et contexte

### 1.1 Objectif

Doter l'ASL d'un espace numérique unique permettant :

- la diffusion d'informations aux colotis ;
- la tenue à jour de l'état nominatif des propriétaires (obligation du président) ;
- la centralisation des documents officiels (statuts, cahier des charges, PV, budgets) ;
- l'organisation des AG (convocation, ordre du jour, émargement, vote) en présentiel et en ligne ;
- le suivi des cotisations (état, appels de fonds).

### 1.2 Contraintes structurantes

| Contrainte | Décision | Conséquence |
|---|---|---|
| Hébergement gratuit | Netlify (front) + Supabase (backend) | Pas de tout-en-un Netlify ; découplage front/BaaS assumé |
| Volumétrie | ~50 comptes max | Très en dessous des free tiers ; pas d'enjeu de scalabilité |
| Authentification | Login + mot de passe (méthode principale) **ou** magic link, au choix du coloti, sur le même compte | À la création, lien d'activation (72h) ; le coloti définit lui-même son mot de passe. Dépend de la délivrabilité email |
| Création de comptes | Par l'administrateur uniquement | Pas d'auto-inscription. L'admin voit les logins (jamais les mots de passe), réémet les identifiants et corrige les emails |
| Vote officiel | Sous réserve statutaire (cf. §0) | Mode consultatif par défaut tant que non acté |

### 1.3 Risque opérationnel à connaître (free tier Supabase)

Le projet Supacase gratuit est **mis en pause après 7 jours d'inactivité**. Pour une app consultée par intermittence (entre deux AG), cela provoque un cold start au premier accès, voire une suspension. **Mitigation** : un *cron de ping* (GitHub Actions planifié, ou Netlify scheduled function) maintient le projet actif. À industrialiser dès le départ. C'est de la dette assumée liée au choix gratuit.

---

## 2. Acteurs et rôles

Trois rôles, hiérarchiques sur les permissions mais distincts fonctionnellement.

| Rôle | Correspondance ASL | Permissions principales |
|---|---|---|
| **Admin** | Président | Tout : gestion comptes, rôles, contenus, AG, votes, cotisations, paramètres, export. Seul à pouvoir clôturer une AG et publier des résultats. |
| **Éditeur** | Membres du syndicat | Création/édition d'informations, documents, convocations, ordre du jour. Pas de gestion des comptes ni des rôles. Ne peut pas altérer les votes. |
| **Membre** | Coloti | Lecture des informations et documents. Déclaration de présence. Vote (sur les scrutins ouverts). Dépôt/réception de procuration. Consultation de ses cotisations. |

Notes :

- Un compte = une personne physique. Un compte peut être rattaché à une ou plusieurs **propriétés** (un coloti possédant plusieurs lots), ce qui détermine le nombre de voix (cf. §6).
- L'admin est un rôle technique ; le **président** est une donnée métier (mandat, dates). Ils coïncident en pratique mais sont modélisés séparément pour gérer les changements de présidence sans recréer de compte.
- Prévoir **au moins deux comptes admin** (président + un suppléant) pour éviter le single point of failure si le président perd l'accès à sa boîte mail (magic link).

---

## 3. Architecture technique

### 3.1 Vue d'ensemble

```
┌─────────────────────┐         ┌──────────────────────────────┐
│   Front (Netlify)   │         │        Supabase                │
│   SvelteKit (SPA)   │◄───────►│  - Auth (magic link)           │
│                     │  HTTPS  │  - Postgres + RLS              │
│                     │         │  - Storage (documents)         │
│                     │         │  - Edge Functions (logique     │
│                     │         │    sensible : vote, exports)   │
└─────────────────────┘         └──────────────────────────────┘
          ▲
          │ cron ping (GitHub Actions) pour éviter la pause free tier
          └──────────────────────────────────────────────────────
```

### 3.2 Choix techniques et justification

| Composant | Choix | Pourquoi | Alternative écartée |
|---|---|---|---|
| Front | **SvelteKit en PWA** (`adapter-static` ou `adapter-netlify`, installable) | Léger, peu de boilerplate, déploiement Netlify natif, bon DX. PWA = installable sur smartphone, base pour les notifications (cf. §3.4) | React/Vite (plus verbeux) ; app native (disproportionné, coût de maintenance et stores) |
| Backend | **Supabase** | Postgres relationnel (cohérent SQL), Auth magic link natif, RLS pour le RBAC en base, storage inclus, free tier suffisant | Firebase (NoSQL, moins naturel), Pocketbase (nécessite un VPS, pas "gratuit Netlify") |
| Contrôle d'accès | **RLS Postgres** + logique Edge Functions | Sécurité au plus près de la donnée ; le front ne peut pas contourner | RBAC applicatif seul (contournable, surface de bug) |
| Logique sensible (vote, clôture, exports) | **Supabase Edge Functions** (Deno) | Côté serveur, non manipulable par le client ; transactions et invariants garantis | Logique côté front (rejetée : un vote ne doit jamais être arbitré par le client) |
| Authentification | **Supabase Auth** : email + mot de passe (méthode principale) et magic link, sur le même compte | Les deux méthodes nativement supportées par compte. Le login humain est un alias (table `credential`) traduit en email avant l'appel Supabase | Identifiant arbitraire natif (non supporté par Supabase Auth) ; email technique (plus lourd) |
| Emails (activation, reset, magic link, convocations) | Supabase Auth + SMTP custom | Mot de passe temporaire, lien d'activation, reset et convocations = emails transactionnels | SMTP Supabase par défaut (délivrabilité insuffisante pour un facteur d'auth) |

### 3.3 Point de vigilance : authentification et emails

- **Lien d'activation à la création (pas de mot de passe temporaire).** À la création d'un compte, l'admin déclenche la génération d'un login (`credential.login`) et l'envoi d'un **lien d'activation à usage unique, valable 72h**, à l'email du coloti. Implémentation via l'API admin Supabase (`inviteUserByEmail` ou `generateLink` type `invite`). Le compte est en statut `pending`. Aucun mot de passe n'est généré ni transmis : on évite qu'un secret en clair traîne indéfiniment dans une boîte mail.
- **Activation par le coloti.** Le coloti clique sur le lien, atterrit sur un écran où il **définit lui-même son mot de passe** (ou choisit de n'utiliser que le magic link, le mot de passe étant optionnel). Le compte passe en statut `active`, `activated_at` est renseigné. Le secret d'authentification n'est donc connu que du coloti dès le départ. **Invariant critique pour la valeur du vote** : à aucun moment l'admin ne connaît un secret permettant de s'authentifier à la place d'un coloti.
- **Lien expiré ou perdu.** Si le lien n'est pas utilisé dans les 72h (ou est perdu), l'admin **réémet** un nouveau lien d'activation depuis l'interface (le compte reste `pending`). Action idempotente, traçée dans `audit_log`.
- **Magic link** : disponible en parallèle sur le même compte une fois activé. Un coloti peu technique peut ignorer le mot de passe et se connecter uniquement par magic link.
- **Perte de mot de passe (compte déjà actif)** : l'admin recommunique le **login** (qu'il voit) ; le coloti déclenche lui-même une réinitialisation via le flux natif Supabase (lien envoyé à son email). L'admin n'est jamais dans la boucle du secret.
- **Changement d'email** : l'admin peut corriger l'email d'un coloti (`profile.email` + email Supabase Auth via API admin). Le login (`credential.login`) reste inchangé — c'est tout l'intérêt du découplage.
- **SMTP custom obligatoire dès le départ** (Brevo/Sendinblue ou Resend, free tier). Le SMTP Supabase par défaut a une délivrabilité insuffisante : un lien d'activation, de reset ou un magic link en spam = un coloti qui ne peut pas accéder à son compte ni voter. Critique puisque l'email porte tous les flux d'accès.
- **Convocations AG** : email transactionnel avec PJ (PDF convocation + ordre du jour). Même SMTP. La forme/délai de convocation peut être imposée par les statuts (cf. §5.3).

### 3.4 PWA (installation sur smartphone et notifications)

L'app est une **Progressive Web App** : installable sur l'écran d'accueil (iOS/Android) via le navigateur, sans passer par les stores. Cela couvre le besoin « installer le site sur smartphone » sans coût de développement natif ni soumission App Store / Play Store.

Implications techniques :

- **Web App Manifest** (`manifest.webmanifest`) : nom, icônes (plusieurs tailles), `display: standalone`, couleur de thème. Requis pour l'invite d'installation.
- **Service Worker** : nécessaire à l'installabilité et au cache offline. À garder **minimal** au départ (cache de l'app shell, pas de cache des données sensibles comme les votes ou cotisations — risque de données périmées affichées). Le SW est aussi le réceptacle des futures notifications push.
- **HTTPS** : fourni par Netlify nativement.
- **Adapter SvelteKit** : `adapter-static` (app full client + Supabase) ou `adapter-netlify` si des routes serveur sont nécessaires. Le SW s'intègre via un plugin Vite (ex. `@vite-pwa/sveltekit`).

**Notifications push — alerte à connaître dès maintenant (impacte la conception future) :**

- **Android** : push web standard via service worker + Push API. Fonctionne bien, gratuit.
- **iOS/iPadOS** : le push web n'est supporté **que si la PWA est installée sur l'écran d'accueil** (depuis iOS 16.4). Un coloti sur iPhone qui consulte dans Safari sans installer ne recevra **aucune** notification. C'est une contrainte Apple, non contournable côté code. → Conséquence : la notification ne peut pas être le canal d'information *fiable et universel*. **L'email reste le canal officiel** (convocations notamment) ; le push est un confort additionnel.
- **Infrastructure push** : nécessite un service de delivery (clés VAPID pour le Web Push, stockage des abonnements `push_subscription` par compte, et un déclencheur côté serveur — Edge Function ou cron). À provisionner quand le besoin sera activé, pas au départ. Prévoir dès maintenant une table `push_subscription(profile_id, endpoint, keys, created_at)` pour ne pas avoir à remodeler plus tard, mais ne pas l'exploiter en Lot 0.

**Recommandation** : livrer la PWA installable dès le Lot 0 (manifest + SW minimal, coût marginal), et **différer les notifications** à un lot ultérieur dédié, une fois l'usage installé. Ne pas bâtir de fonctionnalité critique (ex. alerte de vote) sur le push tant que la couverture iOS dépend de l'installation manuelle.

### 3.5 Environnements

- **Production** : projet Supabase prod + site Netlify prod.
- **Préprod/dev** : projet Supabase dev distinct (le free tier autorise 2 projets actifs). Migrations SQL versionnées (Supabase CLI) et rejouées de dev vers prod. **Ne jamais modifier le schéma prod à la main via l'UI.**

---

## 4. Modèle de données

Schéma relationnel cible (Postgres). Clés et contraintes simplifiées pour lisibilité.

### 4.1 Entités

```sql
-- Personnes / comptes (étend auth.users de Supabase)
profile (
  id            uuid PK = auth.users.id,
  email         text not null,        -- email réel du coloti (notifications, activation, reset)
  full_name     text not null,
  phone         text null,
  role          text not null check (role in ('admin','editor','member')),
  status        text not null check (status in ('pending','active','inactive'))
                  default 'pending',  -- pending = invité, pas encore activé son compte
  last_login_at timestamptz null,
  activated_at  timestamptz null,     -- date de première activation (clic sur le lien)
  created_at    timestamptz default now()
)

-- Mapping login humain -> compte. Découple l'identifiant de connexion de l'email.
-- L'email peut changer sans que le login bouge. L'admin voit le login, jamais le mdp.
credential (
  id            uuid PK,
  profile_id    uuid FK -> profile unique,
  login         text not null unique,        -- ex. "lot12" ; recommunicable par l'admin
  created_at    timestamptz default now()
)

-- Liens d'activation (usage unique). Un seul lien actif par compte à la fois :
-- régénérer invalide le précédent. Le token n'est PAS stocké en clair (hash only).
activation_link (
  id            uuid PK,
  profile_id    uuid FK -> profile,
  token_hash    text not null,               -- hash du token ; le token clair n'existe qu'à l'envoi
  kind          text not null check (kind in ('standard','extended')), -- 72h vs validité étendue
  expires_at    timestamptz not null,
  used_at       timestamptz null,            -- null = non utilisé ; renseigné à l'activation
  revoked       boolean not null default false,
  created_by    uuid FK -> profile,
  created_at    timestamptz default now()
)

-- Propriétés / lots (porteurs du droit de vote)
property (
  id            uuid PK,
  reference     text not null,          -- ex. "Lot 12" / "Parcelle AB-45"
  address       text null,
  vote_weight   int not null default 1, -- nb de voix (1 voix/propriété par défaut)
  created_at    timestamptz default now()
)

-- Rattachement coloti <-> propriété (un coloti peut avoir plusieurs lots ; indivision possible)
ownership (
  id            uuid PK,
  profile_id    uuid FK -> profile,
  property_id   uuid FK -> property,
  start_date    date not null,
  end_date      date null,             -- null = en cours ; vente => date de fin
  is_primary    boolean default true,  -- contact principal en cas d'indivision
  unique(property_id, profile_id, start_date)
)

-- Mandat de président (historisé)
presidency (
  id            uuid PK,
  profile_id    uuid FK -> profile,
  start_date    date not null,
  end_date      date null
)

-- Catégories d'information
info_post (
  id            uuid PK,
  title         text not null,
  body          text not null,         -- markdown
  category      text null,
  is_published  boolean default false,
  published_at  timestamptz null,
  author_id     uuid FK -> profile,
  created_at    timestamptz default now()
)

-- Documents mis à disposition par l'admin/éditeurs
-- (statuts, comptes rendus d'AG, factures, budgets, cahier des charges...)
document (
  id            uuid PK,
  title         text not null,
  type          text not null,         -- 'statuts','pv_ag','budget','facture','cahier_charges','convocation','courrier','autre'
  description   text null,             -- note libre (ex. objet de la facture, exercice concerné)
  year          int null,              -- exercice / année de référence, pour le classement
  storage_path  text not null,         -- chemin Supabase Storage
  mime_type     text null,
  size_bytes    bigint null,
  visibility    text not null default 'members'
                  check (visibility in ('members','editors','admin')),
  uploaded_by   uuid FK -> profile,
  created_at    timestamptz default now()
)

-- Assemblées générales
assembly (
  id            uuid PK,
  title         text not null,
  type          text not null check (type in ('ordinaire','extraordinaire')),
  mode          text not null check (mode in ('presentiel','en_ligne','hybride')),
  scheduled_at  timestamptz not null,
  location      text null,
  status        text not null check (status in ('draft','convened','open','closed','archived')),
  quorum_pct    int not null default 50,
  convened_at   timestamptz null,
  opened_at     timestamptz null,
  closed_at     timestamptz null,
  created_by    uuid FK -> profile
)

-- Points d'ordre du jour
agenda_item (
  id            uuid PK,
  assembly_id   uuid FK -> assembly,
  position      int not null,
  title         text not null,
  description   text null,
  requires_vote boolean default true
)

-- Émargement / présence (qui participe à l'AG)
attendance (
  id            uuid PK,
  assembly_id   uuid FK -> assembly,
  profile_id    uuid FK -> profile,
  property_id   uuid FK -> property,    -- une présence par propriété représentée
  mode          text not null check (mode in ('present','represented','absent')),
  recorded_at   timestamptz default now(),
  unique(assembly_id, property_id)
)

-- Procurations / pouvoirs
proxy (
  id              uuid PK,
  assembly_id     uuid FK -> assembly,
  grantor_profile uuid FK -> profile,  -- mandant (absent)
  grantor_property uuid FK -> property,
  holder_profile  uuid FK -> profile,  -- mandataire
  status          text not null check (status in ('pending','accepted','revoked')),
  created_at      timestamptz default now(),
  unique(assembly_id, grantor_property)        -- une propriété = un seul mandat
)
-- Contrainte applicative : count(holder_profile) par assembly <= 3 (cf. Edge Function)

-- Scrutins (un par agenda_item à voter)
ballot (
  id            uuid PK,
  agenda_item_id uuid FK -> agenda_item,
  question      text not null,
  options       jsonb not null,        -- ex. ["pour","contre","abstention"]
  majority_rule text not null default 'simple', -- 'simple','absolue','qualifiee_2_3'...
  status        text not null check (status in ('pending','open','closed')),
  opened_at     timestamptz null,
  closed_at     timestamptz null
)

-- Émargement de vote (QUI a voté) — séparé du bulletin pour le secret
vote_log (
  id            uuid PK,
  ballot_id     uuid FK -> ballot,
  property_id   uuid FK -> property,   -- la propriété qui s'exprime
  cast_by       uuid FK -> profile,    -- qui a matériellement voté (titulaire ou mandataire)
  on_behalf_of  uuid FK -> profile null, -- mandant si vote par procuration
  cast_at       timestamptz default now(),
  unique(ballot_id, property_id)       -- anti-double-vote au niveau propriété
)

-- Bulletins (LE CHOIX) — sans lien direct nominatif fort si secret requis
ballot_vote (
  id            uuid PK,
  ballot_id     uuid FK -> ballot,
  choice        text not null,         -- doit appartenir à ballot.options
  weight        int not null default 1,
  cast_at       timestamptz default now()
)

-- Cotisations
fee_call (                              -- appel de fonds
  id            uuid PK,
  label         text not null,         -- ex. "Cotisation 2026"
  amount        numeric(10,2) not null,
  due_date      date not null,
  created_by    uuid FK -> profile,
  created_at    timestamptz default now()
)

fee_assignment (                        -- ce que doit chaque propriété
  id            uuid PK,
  fee_call_id   uuid FK -> fee_call,
  property_id   uuid FK -> property,
  amount_due    numeric(10,2) not null,
  status        text not null check (status in ('due','paid','partial','overdue')),
  paid_at       date null,
  unique(fee_call_id, property_id)
)

-- Journal d'audit (append-only, jamais modifié ni supprimé)
audit_log (
  id            uuid PK,
  actor_id      uuid null,
  action        text not null,         -- 'ballot.open','vote.cast','assembly.close','activation.issue','activation.revoke','activation.used'...
  entity        text not null,
  entity_id     uuid null,
  payload       jsonb null,
  created_at    timestamptz default now()
)

-- Abonnements Web Push (provisionné en Lot 0, exploité en Lot 5 uniquement)
push_subscription (
  id            uuid PK,
  profile_id    uuid FK -> profile,
  endpoint      text not null,
  keys          jsonb not null,        -- p256dh + auth (Web Push)
  user_agent    text null,
  created_at    timestamptz default now(),
  unique(profile_id, endpoint)
)
```

### 4.2 Décisions de modélisation et trade-offs

- **Séparation `vote_log` / `ballot_vote`.** C'est le point central pour concilier *anti-double-vote* (il faut savoir qui a voté → `vote_log`) et *secret du vote* (le choix ne doit pas être nominativement attribuable → `ballot_vote`). Les deux tables sont écrites dans la **même transaction** (Edge Function), mais sans clé étrangère reliant un bulletin à un votant.
  - **Trade-off** : ce secret est *organisationnel*, pas cryptographique. L'admin Supabase (super-utilisateur DB) pourrait théoriquement corréler les timestamps. Pour une ASL de 50 colotis, un secret cryptographique fort (vote homomorphe, mixnets) est disproportionné. **Le secret repose donc sur la confiance dans l'administrateur de la base + le journal d'audit.** À assumer explicitement. Si le secret strict est une exigence statutaire forte, cette architecture ne suffit pas et il faut un prestataire de vote spécialisé.
- **`vote_weight` sur la propriété, pas sur le coloti.** Implémente "une voix par propriété". Un coloti possédant 3 lots vote 3 fois (une par propriété). Modifiable si les statuts prévoient une pondération aux tantièmes (changer `vote_weight`).
- **Procurations plafonnées en applicatif, pas en contrainte SQL pure.** La limite "≤3 mandats par mandataire et par AG" est un invariant vérifié dans l'Edge Function d'acceptation de procuration (un `check` SQL ne sait pas compter par groupe simplement sans trigger). Trigger possible mais ajoute de la complexité ; la validation applicative centralisée est plus lisible.
- **`audit_log` append-only.** Aucune route d'édition/suppression. Permissions RLS : insertion par les fonctions serveur uniquement, lecture admin. C'est la pièce qui donne la traçabilité ("valeur probante" relative).

---

## 5. Fonctionnalités détaillées

### 5.1 Gestion des comptes (Admin)

- **Création de compte** : l'admin saisit nom + email + rôle. Le système génère un **login** (`credential.login`, ex. `lot12`) et envoie un **lien d'activation à usage unique valable 72h** à l'email du coloti. Compte en statut `pending`. Pas de mot de passe transmis. Pas d'auto-inscription.
- **Vue liste des comptes (admin)** : tableau filtrable affichant pour chaque compte le login, le nom, l'email, le rôle, le **statut** (`pending` / `active` / `inactive`) et la **date de dernière connexion** (`last_login_at`). Filtres sur le statut (notamment actifs vs inactifs) et tri par dernière connexion. Cela répond directement au besoin de distinguer les comptes actifs des inactifs et de repérer les comptes jamais utilisés ou dormants. **Jamais de mot de passe affiché.**
  - `pending` : invité, lien d'activation non encore utilisé.
  - `active` : compte activé et utilisable.
  - `inactive` : compte désactivé par l'admin (ex. coloti ayant vendu).
- **Actions admin sur un compte** :
  - réémettre un lien d'activation (compte `pending` dont le lien a expiré ou est perdu) — voir gestion des liens ci-dessous ;
  - recommuniquer le login (lecture seule) ;
  - corriger l'email (le login reste inchangé) ;
  - changer le rôle ;
  - désactiver / réactiver (`status`).
- **Côté coloti** : à l'activation, écran de définition de son propre mot de passe (ou choix du magic link seul). En cas d'oubli ultérieur, le coloti déclenche lui-même un reset via lien email (flux natif Supabase). Connexion par magic link possible à tout moment en alternative.
- **`last_login_at`** : mis à jour à chaque connexion réussie (hook d'auth / Edge Function). Permet à l'admin d'identifier les comptes dormants (ex. relancer un coloti qui ne s'est jamais connecté avant une AG).
- Rattachement du compte à une ou plusieurs propriétés (`ownership`).
- Désactivation (vente) : `status = 'inactive'` + `ownership.end_date` renseignée. On **ne supprime pas** le compte, pour conserver l'historique des AG/votes.
- **État nominatif** (obligation du président) : vue exportable (CSV/PDF) listant propriétés, propriétaires actuels, contacts, statut cotisation.

#### 5.1.1 Gestion des liens d'activation (comptes `pending`)

Trois mécanismes distincts couvrent le cycle de vie d'un lien d'activation.

1. **Réémission manuelle unitaire.** Pour tout compte `pending`, l'admin peut régénérer un lien d'activation depuis la fiche du compte (lien expiré, perdu, email mal acheminé). Le nouveau lien invalide le précédent (un seul lien actif à la fois par compte). Action tracée dans `audit_log`.

2. **Renvoi groupé avant AG (semi-automatique).** Au passage d'une AG en statut `convened` (cf. §5.4), l'interface présente à l'admin la liste des comptes `pending` et propose de leur renvoyer un lien d'activation. **Sur confirmation de l'admin** (pas d'envoi totalement silencieux), un nouveau lien est généré et envoyé à chacun. Objectif : maximiser le nombre de comptes `active` avant un vote, pour ne pas fausser le quorum. Chaque envoi est tracé. Choix de conception : semi-automatique plutôt que pleinement automatique, car la convocation est une action sensible dont l'admin doit rester maître (timing, contenu).

3. **Lien à validité étendue pour nouvel arrivant (feuille de bienvenue).** Pour un coloti qui vient d'acquérir un bien et n'est pas joignable immédiatement par email fiable, l'admin peut générer un lien d'activation à **durée de validité étendue, paramétrable (7 / 14 / 30 jours), plafonnée à 30 jours**. Ce lien sert à produire une **feuille de bienvenue imprimable** (cf. §8) distribuée par courrier ou en main propre.
   - **Trade-off sécurité assumé** : plus la validité est longue, plus la fenêtre d'exploitation est grande si la feuille est perdue ou interceptée. Mitigations : usage unique, plafond à 30 jours, activation tracée dans `audit_log`, possibilité pour l'admin de révoquer le lien à tout moment (régénération qui invalide le précédent). Le lien étendu reste réservé à ce cas d'usage précis ; le lien standard (72h) demeure le défaut.

### 5.2 Espace information

- Fil d'actualités (`info_post`), markdown, catégorisable, brouillon/publié.
- Lecture par tous les membres ; rédaction par éditeurs et admin.
- Pas de commentaires (exclu du périmètre).

### 5.3 Documents

L'admin (et les éditeurs) chargent des documents pour les mettre à disposition des colotis : statuts de l'ASL, comptes rendus et PV d'AG, factures, budgets, cahier des charges, courriers, convocations, et tout autre document utile.

- **Chargement** : upload (admin/éditeur) vers Supabase Storage. À l'upload, l'utilisateur renseigne le titre, le type, une description optionnelle, l'année/exercice de référence et le niveau de visibilité. Formats courants acceptés (PDF principalement ; images et bureautique tolérés). Taille bornée par le free tier Storage (1 Go total — largement suffisant pour des PV et factures, à surveiller si beaucoup de scans volumineux).
- **Typologie** (`document.type`) : `statuts`, `pv_ag`, `budget`, `facture`, `cahier_charges`, `convocation`, `courrier`, `autre`. Le champ `year` permet le classement par exercice (ex. toutes les factures 2025, tous les PV par année).
- **Visibilité** (trois niveaux) :
  - `members` : tous les colotis connectés. Cas par défaut pour les documents collectifs (statuts, PV d'AG, cahier des charges, budgets votés).
  - `editors` : éditeurs et admin uniquement. Pour les documents de travail non encore diffusables.
  - `admin` : président/admin uniquement. Pour les pièces les plus sensibles.
- **Cas des factures — point de vigilance.** Les factures peuvent contenir des données de tiers (prestataires, coordonnées, RIB) ou des informations contractuelles. Évaluer la visibilité au cas par cas plutôt que de tout exposer en `members` par défaut. La transparence financière vis-à-vis des colotis est légitime (ils financent les charges), mais une facture brute peut comporter des éléments à ne pas diffuser largement. Décision à laisser à l'admin à l'upload, avec `members` possible mais non imposé.
- **Sécurité de l'accès aux fichiers** : pas de bucket public. Les fichiers sont servis via des *signed URLs* à durée limitée, générées à la demande selon la visibilité du document et le rôle du demandeur (contrôle RLS sur la table `document` + génération de l'URL signée côté serveur). Un lien de téléchargement ne doit jamais être devinable ni partageable durablement.
- **Traçabilité** : upload, modification de visibilité et suppression tracés dans `audit_log`. Téléchargement traçable optionnellement.
- **Organisation côté UI** : liste filtrable par type et par année, tri par date. Pas d'arborescence de dossiers complexe au départ (la typologie + l'année suffisent pour la volumétrie d'une ASL) ; à réévaluer seulement si le volume le justifie.

### 5.4 Assemblées générales

Cycle de vie (`assembly.status`) :

```
draft → convened → open → closed → archived
```

1. **draft** : l'éditeur/admin prépare l'AG (titre, type, mode, date, ordre du jour, points à voter).
2. **convened** : l'admin convoque. Génère un **PDF de convocation** (ordre du jour inclus) et envoie par email à tous les colotis. ⚠️ **Vérifier le délai et la forme de convocation imposés par les statuts** (souvent 15 jours, parfois recommandé). L'envoi par email vaut-il convocation valable ? → dépend des statuts (cf. §0). **À ce moment, l'interface propose le renvoi groupé d'un lien d'activation aux comptes encore `pending`** (semi-automatique, sur confirmation de l'admin — cf. §5.1.1), afin de maximiser le nombre de comptes `active` avant le vote.
3. **open** : le jour J, l'admin ouvre l'AG. À ce moment :
   - l'émargement (`attendance`) devient possible (présence / représenté / absent) ;
   - le **quorum** est calculé en temps réel : `somme(vote_weight des propriétés présentes ou représentées) / somme(vote_weight total)`. Si `< quorum_pct`, les scrutins ne peuvent pas s'ouvrir (blocage). Affichage clair du quorum atteint/non atteint.
4. **closed** : l'admin clôture. Plus aucun vote ni émargement possible. Les résultats sont figés.
5. **archived** : génération du **PV d'AG** (PDF) reprenant présence, quorum, résultats par scrutin. Stocké dans `document`.

### 5.5 Procurations

- Un coloti absent (`grantor`) donne procuration à un autre coloti (`holder`) pour une AG donnée.
- Workflow : le mandant crée la procuration (status `pending`) → le mandataire accepte (`accepted`).
- **Invariants** (Edge Function) :
  - une propriété ne peut donner qu'un seul mandat par AG (`unique(assembly_id, grantor_property)`) ;
  - un mandataire ne peut détenir plus de **3** procurations par AG ;
  - le mandant ne peut pas être présent et représenté simultanément.
- À l'ouverture du scrutin, le mandataire vote pour lui-même + ses mandants (`vote_log.on_behalf_of` renseigné).

### 5.6 Vote

- Un scrutin (`ballot`) par point d'ordre du jour à voter.
- L'admin ouvre le scrutin (status `open`) → les colotis présents/représentés votent → l'admin ferme (`closed`).
- **Garde-fous (Edge Function `cast-vote`, transactionnelle)** :
  - le compte est en statut `active` (compte activé via le lien d'invitation) — un compte `pending` ou `inactive` ne peut pas voter ;
  - le scrutin est `open` ;
  - le quorum est atteint ;
  - la propriété n'a pas déjà voté (`unique(ballot_id, property_id)`) ;
  - le votant a le droit de voter pour cette propriété (titulaire actif ou mandataire accepté) ;
  - écriture simultanée `vote_log` (qui) + `ballot_vote` (choix) + `audit_log`.
- **Résultats** : agrégation par choix, pondérée par `weight`. Application de `majority_rule`. Calcul du résultat (adopté/rejeté).
- **Mode consultatif** (tant que le vote électronique n'est pas acté statutairement, cf. §0) : même mécanique, mais les résultats sont marqués "indicatifs" et le PV mentionne que le vote officiel s'est tenu autrement.

### 5.7 Cotisations

Périmètre retenu : **gestion financière légère** (pas de paiement en ligne, pas de rapprochement bancaire).

- Création d'un appel de fonds (`fee_call`) : libellé, montant, échéance.
- Répartition (`fee_assignment`) par propriété (montant égal par défaut, ajustable).
- Suivi de statut : dû / payé / partiel / en retard. Mise à jour manuelle par l'admin (le président encaisse hors ligne, pointe ici).
- Le coloti voit l'état de **ses** cotisations uniquement.
- Vue admin : tableau de bord des impayés (utile pour l'attestation "à jour de cotisations" lors d'une vente).

---

## 6. Calcul des voix et du quorum (règles)

- **Unité de vote** : la propriété (`property`).
- **Poids** : `property.vote_weight` (défaut 1).
- **Voix d'un coloti** : somme des `vote_weight` de ses propriétés actives.
- **Quorum** : `Σ vote_weight (propriétés présentes OU représentées) / Σ vote_weight (toutes propriétés) ≥ quorum_pct`.
- **Majorité d'un scrutin** :
  - `simple` : choix majoritaire parmi les votes exprimés (hors abstention selon convention statutaire — à préciser) ;
  - `absolue` : > 50 % des voix totales ;
  - `qualifiee_2_3` : ≥ 2/3 des voix exprimées.
- ⚠️ Le **traitement des abstentions** (comptées ou non dans le dénominateur) doit être fixé selon les statuts. Paramétrable par scrutin.

---

## 7. Sécurité et contrôle d'accès

### 7.1 Principes

- **RLS activée sur toutes les tables.** Aucune table accessible sans politique explicite.
- Le rôle est lu depuis `profile.role` (jamais depuis un claim modifiable côté client).
- La logique sensible (vote, ouverture/clôture de scrutin, acceptation de procuration, clôture d'AG) passe **exclusivement par des Edge Functions** avec `service_role`, jamais par des écritures directes du client. Le client n'a pas de droit d'écriture sur `ballot_vote`, `vote_log`, `audit_log`.

### 7.2 Exemples de politiques RLS

```sql
-- info_post : lecture par tout membre actif, écriture éditeur/admin
create policy "read_published" on info_post for select
  using ( is_published = true and auth.uid() in (select id from profile where status = 'active') );

create policy "write_editor_admin" on info_post for all
  using ( (select role from profile where id = auth.uid()) in ('editor','admin') );

-- ballot_vote : aucune écriture client (Edge Function uniquement) ; lecture agrégée seulement
create policy "no_client_write" on ballot_vote for all
  using ( false ) with check ( false );

-- document : lecture selon visibilité et rôle ; écriture éditeur/admin
create policy "read_by_visibility" on document for select
  using (
    (select status from profile where id = auth.uid()) = 'active'
    and (
      visibility = 'members'
      or ( visibility = 'editors' and (select role from profile where id = auth.uid()) in ('editor','admin') )
      or ( visibility = 'admin'   and (select role from profile where id = auth.uid()) = 'admin' )
    )
  );

create policy "write_editor_admin_doc" on document for all
  using ( (select role from profile where id = auth.uid()) in ('editor','admin') );

-- fee_assignment : un coloti ne voit que ses propriétés
create policy "own_fees" on fee_assignment for select
  using ( property_id in (
    select property_id from ownership
    where profile_id = auth.uid() and end_date is null
  ) );
```

### 7.3 Points durs

- **Pas de secret transmis en clair.** À la création, aucun mot de passe n'est généré ni envoyé : seul un lien d'activation à usage unique (72h) transite. Le coloti définit lui-même son mot de passe à l'activation. **Invariant critique pour la valeur du vote** : à aucun moment l'admin ne connaît un secret permettant de s'authentifier à la place du coloti. Seuls les comptes `active` peuvent voter (cf. §5.6).
- **L'admin ne manipule jamais de mot de passe.** Ni génération, ni affichage, ni stockage. L'interface admin n'expose que login + statut + dernière connexion. Les actions admin sur l'accès se limitent à : réémettre un lien d'activation, recommuniquer le login, corriger l'email.
- **Reset hors boucle admin.** La réinitialisation passe par le flux natif Supabase (lien vers l'email du coloti). L'admin recommunique le login, jamais un secret.
- **Lien d'activation à durée limitée et usage unique.** Standard : 72h. Étendu (nouvel arrivant, feuille de bienvenue) : paramétrable jusqu'à 30 jours. Régénérer un lien invalide le précédent (un seul actif par compte). Le token n'est jamais stocké en clair (hash en base). Réémission manuelle, renvoi groupé avant AG, ou lien étendu pour impression — cf. §5.1.1.
- **Email = canal d'accès unique.** Lien d'activation, reset et magic link transitent tous par l'email. Perte d'accès email = perte d'accès compte. Mitigations : ≥2 admins, réémission de lien et correction d'email par l'admin, SMTP custom fiable.
- **Pas de secret cryptographique du vote** (cf. §4.2). Limite assumée.
- **Signed URLs** pour les documents, jamais de bucket public.

---

## 8. Génération de documents (PDF)

Quatre PDF à générer :

1. **Convocation** (ordre du jour, date, lieu/lien, modalités de vote).
2. **PV d'AG** (présence, quorum atteint, résultats par scrutin, décisions).
3. **Attestation de cotisation** (à jour / impayés) pour une vente.
4. **Feuille de bienvenue** (nouvel arrivant) : document A4 imprimable contenant le nom du coloti, son **login**, l'URL d'activation en clair, un **QR code** encodant cette même URL, la date d'expiration du lien, et une courte notice d'explication (à quoi sert l'espace, comment activer le compte, comment installer la PWA sur smartphone). Destinée à être distribuée par courrier ou en main propre.

Implémentation : génération côté Edge Function (Deno) avec une lib PDF, ou côté front (jsPDF / pdfmake) pour les cas non sensibles. **Le PV étant un document officiel, le générer côté serveur** à partir des données figées après clôture (pas de recomposition côté client).

**Feuille de bienvenue — points de conception :**

- Générée à la demande de l'admin pour un compte `pending`, à partir d'un lien d'activation à validité étendue (cf. §5.1.1). La feuille n'est pas stockée : elle est générée à la volée et téléchargée pour impression, afin d'éviter de conserver un document contenant un secret d'accès.
- Le QR code encode l'URL d'activation. **Conséquence sécurité** : la feuille porte un secret d'accès en clair. Elle ne doit pas être laissée traîner, et le lien étant à usage unique, il devient inopérant dès la première activation. Si plusieurs feuilles sont imprimées pour le même compte, seule la dernière émise est valide (régénération invalide les précédentes).
- Lib QR code côté génération (ex. `qrcode` en JS/Deno) ; pas de dépendance à un service tiers (un service externe verrait passer des liens d'activation).

---

## 9. RGPD

L'ASL est **responsable de traitement**. À formaliser :

| Élément | Contenu |
|---|---|
| **Finalités** | Gestion de l'association, organisation des AG, appels de cotisations, communication aux colotis. |
| **Base légale** | Intérêt légitime / obligation légale de l'ASL (tenue de l'état nominatif, gestion des charges) + exécution de mission statutaire. |
| **Données collectées** | Identité, coordonnées (email, tél), propriété(s), statut de cotisation, participation et votes aux AG. |
| **Durées de conservation** | Données de compte : durée d'appartenance à l'ASL + archivage légal. PV et votes : durée de conservation des décisions de l'association (plusieurs années). À borner explicitement. |
| **Destinataires** | Président, syndicat (selon rôle). Sous-traitants : Supabase (hébergement DB/auth, **vérifier localisation des données — région UE à sélectionner à la création du projet**), Netlify, fournisseur SMTP. |
| **Droits** | Accès, rectification, effacement (sous réserve des obligations légales de conservation), opposition. Procédure de demande à documenter (contact président). |
| **Registre des traitements** | À tenir (obligation du responsable de traitement). |
| **Secret du vote** | Limite technique documentée (cf. §4.2) à porter à la connaissance des colotis. |

> **Point dur** : choisir la **région UE** lors de la création du projet Supabase. Par défaut, des régions hors UE peuvent être proposées, ce qui complique la conformité (transferts hors UE). À traiter dès le setup, irréversible sans migration.

---

## 10. Limites, dette et risques assumés

| Risque / limite | Impact | Mitigation |
|---|---|---|
| Pause Supabase free tier (7j inactivité) | Cold start, voire suspension | Cron de ping (GitHub Actions) |
| Magic link / email = canal d'accès unique | Verrouillage de compte si perte email | ≥2 admins, réémission de lien d'activation et correction d'email par l'admin |
| Lien d'activation intercepté (email compromis) | Usurpation de compte avant activation par le coloti | Usage unique, expiration 72h, réémission par l'admin ; vote réservé aux comptes `active` |
| Lien d'activation expiré / perdu | Coloti bloqué à l'inscription | Réémission unitaire par l'admin, ou renvoi groupé semi-automatique avant AG (compte reste `pending`) |
| Lien étendu (feuille de bienvenue) perdu/intercepté | Fenêtre d'exploitation longue (jusqu'à 30j) | Usage unique, plafond 30j, révocation/régénération possible, activation tracée ; réservé au cas nouvel arrivant |
| Feuille de bienvenue = secret d'accès sur papier | Accès si la feuille traîne | Lien usage unique inopérant après activation ; feuille non stockée, générée à la volée |
| Diffusion de factures contenant des données de tiers | Exposition de coordonnées/RIB de prestataires à tous les colotis | Visibilité par document décidée à l'upload ; `members` possible mais non imposé ; caviardage recommandé avant upload |
| Quota Storage free tier (1 Go) | Saturation si nombreux scans volumineux | Privilégier PDF compressés ; surveiller le volume ; purge des documents obsolètes selon durées RGPD |
| Délivrabilité email | Activation / reset / magic link / convocation en spam | SMTP custom (Brevo/Resend) dès le départ |
| Secret du vote non cryptographique | Corrélation théorique par l'admin DB | Acceptation organisationnelle + audit log ; sinon prestataire dédié |
| Valeur juridique du vote en ligne | Annulation possible si non prévu aux statuts | Décision AG préalable (cf. §0) ; mode consultatif par défaut |
| Free tier = pas de SLA | Indisponibilité ponctuelle | Acceptable pour l'usage ; ne pas dépendre de l'outil le jour J sans plan B papier |
| Évolution Supabase/Netlify (changement free tier) | Coût futur possible | Schéma SQL standard Postgres = portable ; éviter le lock-in sur fonctions propriétaires non essentielles |
| Push iOS conditionné à l'installation PWA | Coloti iPhone non-installé = aucune notification | Email reste le canal officiel ; push = confort. Inciter à l'installation, ne jamais en faire un canal critique |
| Service Worker servant des données périmées | Affichage de votes/cotisations obsolètes | SW en cache app-shell uniquement, jamais les données sensibles (network-first ou no-cache) |

---

## 11. Découpage en lots de livraison (MVP → complet)

| Lot | Contenu | Valeur |
|---|---|---|
| **Lot 0 — Socle** | Setup Supabase (région UE) + Netlify, auth par lien d'activation (`activation_link`, 72h, usage unique) + mdp défini par le coloti + magic link (mdp optionnel), réémission unitaire de lien, mapping `credential`, statuts de compte (`pending`/`active`/`inactive`) + `last_login_at`, **PWA installable (manifest + SW minimal)**, modèle de données (incl. `push_subscription` non exploitée), RLS de base, cron de ping, SMTP custom | Fondations + app installable sur smartphone |
| **Lot 1 — Annuaire & info** | Comptes/rôles, propriétés, ownership, état nominatif, **lien étendu + feuille de bienvenue PDF (QR code)**, fil d'info, **gestion documentaire (upload admin/éditeur, typologie, visibilité à 3 niveaux, signed URLs)** | Communication de base + mise à disposition des documents + onboarding nouvel arrivant |
| **Lot 2 — AG sans vote** | Cycle de vie AG, convocation + PDF, **renvoi groupé des liens aux comptes `pending`**, ordre du jour, émargement, quorum | Organisation des AG |
| **Lot 3 — Vote** | Scrutins, procurations, Edge Functions transactionnelles, résultats, audit log, PV PDF | Cœur sensible — à activer en mode officiel seulement après décision AG |
| **Lot 4 — Cotisations** | Appels de fonds, suivi, attestation | Gestion financière légère |
| **Lot 5 — Notifications push** | Exploitation de `push_subscription`, clés VAPID, abonnement côté SW, déclencheurs serveur | Confort additionnel — **jamais canal critique** (couverture iOS conditionnée à l'installation PWA) |

Recommandation : livrer Lots 0–2 d'abord (valeur immédiate, faible risque), traiter le Lot 3 (vote) une fois la question statutaire tranchée. Le mode consultatif permet de tester le vote sans enjeu juridique entre-temps.

---

## 12. Questions ouvertes à trancher

1. **Statuts** : le vote électronique et les AG dématérialisées sont-ils autorisés ? (bloquant pour le mode officiel) — **en attente**, prérequis avant tout développement du Lot 3.
2. **Abstentions** : comptées dans le dénominateur des majorités ? (par scrutin) — **en attente**, dépend du point 1.
3. **Délai et forme de convocation** imposés par les statuts (l'email suffit-il ?) — en attente.
4. **Indivision** : comment vote une propriété en indivision (un représentant désigné ?) — en attente.
5. **Pondération des voix** : 1 voix/propriété confirmé, ou prorata de tantièmes/surface ?
6. ~~**Framework front**~~ → **tranché : SvelteKit, en PWA installable** (cf. §3.5).
7. **Conservation** : durées précises à fixer pour le registre RGPD.
8. ~~**Magic link et premier accès**~~ → **tranché : le mot de passe est optionnel**. Un coloti peut n'utiliser que le magic link. À l'activation (clic sur le lien d'invitation), il choisit de définir un mot de passe ou non.
