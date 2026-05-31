-- =============================================================================
-- Migration 0001 : Schéma complet Koloti (SPEC §4)
-- Toutes les tables sont créées ici, y compris celles non exploitées en MVP
-- (proxy, ballot, vote_log, ballot_vote, fee_call, fee_assignment, push_subscription).
-- Les policies RLS sont ajoutées incrémentalement (migrations 0002+).
-- =============================================================================

-- Extensions
create extension if not exists "pgcrypto";

-- =============================================================================
-- TYPES / DOMAINES
-- =============================================================================

-- Rôles utilisateur
create type public.user_role as enum ('admin', 'editor', 'member');

-- Statuts de compte
create type public.account_status as enum ('pending', 'active', 'inactive');

-- Types de lien d'activation
create type public.activation_kind as enum ('standard', 'extended');

-- Types de document
create type public.document_type as enum (
  'statuts', 'pv_ag', 'budget', 'facture', 'cahier_charges',
  'convocation', 'courrier', 'autre'
);

-- Niveaux de visibilité document
create type public.visibility_level as enum ('members', 'editors', 'admin');

-- Types d'AG
create type public.assembly_type as enum ('ordinaire', 'extraordinaire');

-- Modes d'AG
create type public.assembly_mode as enum ('presentiel', 'en_ligne', 'hybride');

-- Statuts d'AG
create type public.assembly_status as enum ('draft', 'convened', 'open', 'closed', 'archived');

-- Modes de présence
create type public.attendance_mode as enum ('present', 'represented', 'absent');

-- Statuts de procuration
create type public.proxy_status as enum ('pending', 'accepted', 'revoked');

-- Statuts de scrutin
create type public.ballot_status as enum ('pending', 'open', 'closed');

-- Règles de majorité
create type public.majority_rule as enum ('simple', 'absolue', 'qualifiee_2_3');

-- Statuts de cotisation
create type public.fee_status as enum ('due', 'paid', 'partial', 'overdue');

-- =============================================================================
-- TABLE : profile
-- Étend auth.users de Supabase
-- =============================================================================
create table public.profile (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text not null,
  full_name     text not null,
  phone         text,
  role          public.user_role not null default 'member',
  status        public.account_status not null default 'pending',
  last_login_at timestamptz,
  activated_at  timestamptz,
  created_at    timestamptz not null default now()
);

comment on table public.profile is 'Profils utilisateurs — étend auth.users';
comment on column public.profile.role is 'Rôle : admin (président), editor (membre syndicat), member (coloti)';
comment on column public.profile.status is 'pending = invité non activé, active = compte opérationnel, inactive = désactivé';

-- =============================================================================
-- TABLE : credential
-- Mapping login humain -> compte (découple login de l'email)
-- =============================================================================
create table public.credential (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profile(id) on delete cascade,
  login      text not null unique,
  created_at timestamptz not null default now()
);

comment on table public.credential is 'Login humain (ex. "lot12") → compte ; recommunicable par l''admin, jamais le mdp';

-- =============================================================================
-- TABLE : activation_link
-- Liens d'activation usage unique — token hashé (jamais en clair en base)
-- =============================================================================
create table public.activation_link (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references public.profile(id) on delete cascade,
  token_hash  text not null,
  kind        public.activation_kind not null default 'standard',
  expires_at  timestamptz not null,
  used_at     timestamptz,
  revoked     boolean not null default false,
  created_by  uuid references public.profile(id),
  created_at  timestamptz not null default now()
);

comment on table public.activation_link is 'Liens d''activation usage unique — token stocké hashé uniquement';
comment on column public.activation_link.token_hash is 'SHA-256 du token ; le token clair n''existe qu''au moment de l''envoi';
comment on column public.activation_link.kind is 'standard = 72h, extended = durée paramétrable plafonnée à 30j';

-- =============================================================================
-- TABLE : property
-- Propriétés / lots — porteurs du droit de vote
-- =============================================================================
create table public.property (
  id          uuid primary key default gen_random_uuid(),
  reference   text not null,
  address     text,
  vote_weight int not null default 1 check (vote_weight > 0),
  created_at  timestamptz not null default now()
);

comment on table public.property is 'Propriétés/lots — une voix par propriété par défaut (vote_weight)';

-- =============================================================================
-- TABLE : ownership
-- Rattachement coloti <-> propriété (multi-lots, indivision, historique)
-- =============================================================================
create table public.ownership (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references public.profile(id) on delete restrict,
  property_id uuid not null references public.property(id) on delete restrict,
  start_date  date not null,
  end_date    date,
  is_primary  boolean not null default true,
  unique (property_id, profile_id, start_date)
);

comment on table public.ownership is 'Historique propriétaire <-> propriété ; end_date null = en cours';
comment on column public.ownership.is_primary is 'Contact principal en cas d''indivision';

-- =============================================================================
-- TABLE : presidency
-- Mandat de président (historisé — séparé du rôle admin)
-- =============================================================================
create table public.presidency (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profile(id) on delete restrict,
  start_date date not null,
  end_date   date
);

comment on table public.presidency is 'Historique des mandats présidentiels (dissocié du rôle admin)';

-- =============================================================================
-- TABLE : info_post
-- Fil d'actualités — markdown, brouillon/publié
-- =============================================================================
create table public.info_post (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  body         text not null,
  category     text,
  is_published boolean not null default false,
  published_at timestamptz,
  author_id    uuid references public.profile(id) on delete set null,
  created_at   timestamptz not null default now()
);

comment on table public.info_post is 'Fil d''actualités markdown — brouillon/publié, lecture membres, écriture éditeur/admin';

-- =============================================================================
-- TABLE : document
-- Documents mis à disposition (PDF, statuts, PV, etc.)
-- =============================================================================
create table public.document (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  type         public.document_type not null,
  description  text,
  year         int,
  storage_path text not null,
  mime_type    text,
  size_bytes   bigint,
  visibility   public.visibility_level not null default 'members',
  uploaded_by  uuid references public.profile(id) on delete set null,
  created_at   timestamptz not null default now()
);

comment on table public.document is 'Documents (statuts, PV, budgets…) — accès via signed URLs, jamais bucket public';

-- =============================================================================
-- TABLE : assembly
-- Assemblées générales — cycle de vie draft→convened→open→closed→archived
-- =============================================================================
create table public.assembly (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  type         public.assembly_type not null,
  mode         public.assembly_mode not null,
  scheduled_at timestamptz not null,
  location     text,
  status       public.assembly_status not null default 'draft',
  quorum_pct   int not null default 50 check (quorum_pct between 1 and 100),
  convened_at  timestamptz,
  opened_at    timestamptz,
  closed_at    timestamptz,
  created_by   uuid references public.profile(id) on delete set null,
  created_at   timestamptz not null default now()
);

comment on table public.assembly is 'AG — cycle : draft → convened → open → closed → archived';

-- =============================================================================
-- TABLE : agenda_item
-- Points d'ordre du jour
-- =============================================================================
create table public.agenda_item (
  id           uuid primary key default gen_random_uuid(),
  assembly_id  uuid not null references public.assembly(id) on delete cascade,
  position     int not null,
  title        text not null,
  description  text,
  requires_vote boolean not null default true,
  unique (assembly_id, position)
);

comment on table public.agenda_item is 'Points d''ordre du jour d''une AG';

-- =============================================================================
-- TABLE : attendance
-- Émargement / présence
-- =============================================================================
create table public.attendance (
  id          uuid primary key default gen_random_uuid(),
  assembly_id uuid not null references public.assembly(id) on delete cascade,
  profile_id  uuid not null references public.profile(id) on delete restrict,
  property_id uuid not null references public.property(id) on delete restrict,
  mode        public.attendance_mode not null,
  recorded_at timestamptz not null default now(),
  unique (assembly_id, property_id)
);

comment on table public.attendance is 'Émargement — une présence par propriété par AG (unique)';

-- =============================================================================
-- TABLE : proxy
-- Procurations / pouvoirs (hors MVP, provisionné)
-- =============================================================================
create table public.proxy (
  id               uuid primary key default gen_random_uuid(),
  assembly_id      uuid not null references public.assembly(id) on delete cascade,
  grantor_profile  uuid not null references public.profile(id) on delete restrict,
  grantor_property uuid not null references public.property(id) on delete restrict,
  holder_profile   uuid not null references public.profile(id) on delete restrict,
  status           public.proxy_status not null default 'pending',
  created_at       timestamptz not null default now(),
  unique (assembly_id, grantor_property)
);

comment on table public.proxy is 'Procurations — un mandat par propriété par AG ; plafond 3/mandataire en applicatif';

-- =============================================================================
-- TABLE : ballot
-- Scrutins (hors MVP Lots 0-2, provisionné)
-- =============================================================================
create table public.ballot (
  id             uuid primary key default gen_random_uuid(),
  agenda_item_id uuid not null references public.agenda_item(id) on delete cascade,
  question       text not null,
  options        jsonb not null,
  majority_rule  public.majority_rule not null default 'simple',
  status         public.ballot_status not null default 'pending',
  opened_at      timestamptz,
  closed_at      timestamptz
);

comment on table public.ballot is 'Scrutins — hors MVP (Lot 3), provisionné dès Lot 0';

-- =============================================================================
-- TABLE : vote_log
-- Émargement de vote (QUI a voté) — séparé du bulletin pour le secret
-- =============================================================================
create table public.vote_log (
  id           uuid primary key default gen_random_uuid(),
  ballot_id    uuid not null references public.ballot(id) on delete cascade,
  property_id  uuid not null references public.property(id) on delete restrict,
  cast_by      uuid not null references public.profile(id) on delete restrict,
  on_behalf_of uuid references public.profile(id) on delete restrict,
  cast_at      timestamptz not null default now(),
  unique (ballot_id, property_id)
);

comment on table public.vote_log is 'Émargement vote (qui a voté) — pas de FK vers ballot_vote (secret du vote)';

-- =============================================================================
-- TABLE : ballot_vote
-- Bulletins (LE CHOIX) — sans lien direct nominatif fort
-- =============================================================================
create table public.ballot_vote (
  id        uuid primary key default gen_random_uuid(),
  ballot_id uuid not null references public.ballot(id) on delete cascade,
  choice    text not null,
  weight    int not null default 1 check (weight > 0),
  cast_at   timestamptz not null default now()
);

comment on table public.ballot_vote is 'Bulletins de vote — pas de lien nominatif direct (secret organisationnel)';

-- =============================================================================
-- TABLE : fee_call
-- Appels de fonds / cotisations (hors MVP Lot 0-2, provisionné)
-- =============================================================================
create table public.fee_call (
  id         uuid primary key default gen_random_uuid(),
  label      text not null,
  amount     numeric(10,2) not null check (amount > 0),
  due_date   date not null,
  created_by uuid references public.profile(id) on delete set null,
  created_at timestamptz not null default now()
);

comment on table public.fee_call is 'Appels de fonds — hors MVP (Lot 4), provisionné dès Lot 0';

-- =============================================================================
-- TABLE : fee_assignment
-- Ce que doit chaque propriété (hors MVP)
-- =============================================================================
create table public.fee_assignment (
  id          uuid primary key default gen_random_uuid(),
  fee_call_id uuid not null references public.fee_call(id) on delete cascade,
  property_id uuid not null references public.property(id) on delete restrict,
  amount_due  numeric(10,2) not null check (amount_due >= 0),
  status      public.fee_status not null default 'due',
  paid_at     date,
  unique (fee_call_id, property_id)
);

comment on table public.fee_assignment is 'Cotisations dues par propriété — hors MVP (Lot 4)';

-- =============================================================================
-- TABLE : audit_log
-- Journal d'audit append-only — jamais modifié ni supprimé
-- =============================================================================
create table public.audit_log (
  id         uuid primary key default gen_random_uuid(),
  actor_id   uuid references public.profile(id) on delete set null,
  action     text not null,
  entity     text not null,
  entity_id  uuid,
  payload    jsonb,
  created_at timestamptz not null default now()
);

comment on table public.audit_log is 'Journal d''audit append-only — aucune route d''édition/suppression ; insertion serveur uniquement';

-- =============================================================================
-- TABLE : push_subscription
-- Abonnements Web Push (hors MVP, provisionné pour Lot 5)
-- =============================================================================
create table public.push_subscription (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profile(id) on delete cascade,
  endpoint   text not null,
  keys       jsonb not null,
  user_agent text,
  created_at timestamptz not null default now(),
  unique (profile_id, endpoint)
);

comment on table public.push_subscription is 'Abonnements Web Push — hors MVP (Lot 5), provisionné dès Lot 0';

-- =============================================================================
-- INDEX (performances courantes)
-- =============================================================================
create index idx_profile_status       on public.profile(status);
create index idx_profile_role         on public.profile(role);
create index idx_credential_login     on public.credential(login);
create index idx_activation_profile   on public.activation_link(profile_id);
create index idx_ownership_profile    on public.ownership(profile_id);
create index idx_ownership_property   on public.ownership(property_id);
create index idx_ownership_active     on public.ownership(property_id) where end_date is null;
create index idx_info_post_published  on public.info_post(published_at) where is_published = true;
create index idx_document_type_year   on public.document(type, year);
create index idx_assembly_status      on public.assembly(status);
create index idx_audit_log_actor      on public.audit_log(actor_id);
create index idx_audit_log_entity     on public.audit_log(entity, entity_id);
create index idx_audit_log_created    on public.audit_log(created_at);
