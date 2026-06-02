-- =============================================================================
-- Koloti — Complete schema, RLS helpers, and Row Level Security policies
-- =============================================================================

-- Extensions
create extension if not exists "pgcrypto";

-- =============================================================================
-- ENUMS
-- =============================================================================

create type public.user_role as enum ('admin', 'editor', 'member');
create type public.account_status as enum ('pending', 'active', 'inactive');
create type public.activation_kind as enum ('standard', 'extended');
create type public.document_type as enum (
  'statuts', 'pv_ag', 'budget', 'facture', 'cahier_charges',
  'convocation', 'courrier', 'autre'
);
create type public.visibility_level as enum ('members', 'editors', 'admin');
create type public.assembly_type as enum ('ordinaire', 'extraordinaire');
create type public.assembly_mode as enum ('presentiel', 'en_ligne', 'hybride');
create type public.assembly_status as enum ('draft', 'convened', 'open', 'closed', 'archived');
create type public.attendance_mode as enum ('present', 'represented', 'absent');
create type public.proxy_status as enum ('pending', 'accepted', 'revoked');
create type public.ballot_status as enum ('pending', 'open', 'closed');
create type public.majority_rule as enum ('simple', 'absolue', 'qualifiee_2_3');
create type public.fee_status as enum ('due', 'paid', 'partial', 'overdue');

-- =============================================================================
-- TABLES
-- =============================================================================

-- profile — extends auth.users
create table public.profile (
  id                      uuid        primary key references auth.users(id) on delete cascade,
  email                   text        not null,
  first_name              text        not null,
  last_name               text        not null,
  phone                   text,
  role                    public.user_role    not null default 'member',
  status                  public.account_status not null default 'pending',
  must_change_credentials boolean     not null default false,
  last_login_at           timestamptz,
  activated_at            timestamptz,
  created_at              timestamptz not null default now()
);

comment on table  public.profile                        is 'Profils utilisateurs — étend auth.users';
comment on column public.profile.role                   is 'Rôle : admin (président), editor (membre syndicat), member (coloti)';
comment on column public.profile.status                 is 'pending = invité non activé, active = compte opérationnel, inactive = désactivé';
comment on column public.profile.must_change_credentials is 'Vrai tant que le compte bootstrap doit changer son login et son mot de passe';

-- credential — human login → account (decouples login from email)
create table public.credential (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profile(id) on delete cascade,
  login      text not null unique,
  created_at timestamptz not null default now()
);

comment on table public.credential is 'Login humain (ex. "lot12") → compte ; recommunicable par l''admin, jamais le mdp';

-- activation_link — single-use tokens (stored hashed, never in clear)
create table public.activation_link (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profile(id) on delete cascade,
  token_hash text not null,
  kind       public.activation_kind not null default 'standard',
  expires_at timestamptz not null,
  used_at    timestamptz,
  revoked    boolean not null default false,
  created_by uuid references public.profile(id),
  created_at timestamptz not null default now()
);

comment on table  public.activation_link            is 'Liens d''activation usage unique — token stocké hashé uniquement';
comment on column public.activation_link.token_hash is 'SHA-256 du token ; le token clair n''existe qu''au moment de l''envoi';
comment on column public.activation_link.kind       is 'standard = 72h, extended = durée paramétrable plafonnée à 30j';

-- property — lots (vote carriers)
create table public.property (
  id              uuid primary key default gen_random_uuid(),
  reference       text not null,
  street_number   text,
  street_name     text,
  cadastre_number text,
  vote_weight     int  not null default 1 check (vote_weight > 0),
  created_at      timestamptz not null default now()
);

comment on table public.property is 'Propriétés/lots — une voix par propriété par défaut (vote_weight)';

-- ownership — member ↔ property link (historical, supports co-ownership)
create table public.ownership (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references public.profile(id)  on delete restrict,
  property_id uuid not null references public.property(id) on delete restrict,
  start_date  date not null,
  end_date    date,
  is_primary  boolean not null default true,
  unique (property_id, profile_id, start_date)
);

comment on table  public.ownership            is 'Historique propriétaire <-> propriété ; end_date null = en cours';
comment on column public.ownership.is_primary is 'Contact principal en cas d''indivision';

-- presidency — presidential mandate (historical, separate from admin role)
create table public.presidency (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profile(id) on delete restrict,
  start_date date not null,
  end_date   date
);

comment on table public.presidency is 'Historique des mandats présidentiels (dissocié du rôle admin)';

-- info_post — news feed (markdown, draft/published)
create table public.info_post (
  id           uuid    primary key default gen_random_uuid(),
  title        text    not null,
  body         text    not null,
  category     text,
  is_published boolean not null default false,
  published_at timestamptz,
  author_id    uuid references public.profile(id) on delete set null,
  created_at   timestamptz not null default now()
);

comment on table public.info_post is 'Fil d''actualités markdown — brouillon/publié, lecture membres, écriture éditeur/admin';

-- document — files (PDFs, statutes, minutes, etc.) accessed via signed URLs
create table public.document (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  type         public.document_type     not null,
  description  text,
  year         int,
  storage_path text not null,
  mime_type    text,
  size_bytes   bigint,
  visibility   public.visibility_level  not null default 'members',
  uploaded_by  uuid references public.profile(id) on delete set null,
  created_at   timestamptz not null default now()
);

comment on table public.document is 'Documents (statuts, PV, budgets…) — accès via signed URLs, jamais bucket public';

-- assembly — general meetings: draft → convened → open → closed → archived
create table public.assembly (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  type         public.assembly_type   not null,
  mode         public.assembly_mode   not null,
  scheduled_at timestamptz not null,
  location     text,
  status       public.assembly_status not null default 'draft',
  quorum_pct   int  not null default 50 check (quorum_pct between 1 and 100),
  convened_at  timestamptz,
  opened_at    timestamptz,
  closed_at    timestamptz,
  created_by   uuid references public.profile(id) on delete set null,
  created_at   timestamptz not null default now()
);

comment on table public.assembly is 'AG — cycle : draft → convened → open → closed → archived';

-- agenda_item — meeting agenda points
create table public.agenda_item (
  id            uuid    primary key default gen_random_uuid(),
  assembly_id   uuid    not null references public.assembly(id) on delete cascade,
  position      int     not null,
  title         text    not null,
  description   text,
  requires_vote boolean not null default true,
  unique (assembly_id, position)
);

comment on table public.agenda_item is 'Points d''ordre du jour d''une AG';

-- attendance — meeting roll call (one record per property per assembly)
create table public.attendance (
  id          uuid primary key default gen_random_uuid(),
  assembly_id uuid not null references public.assembly(id) on delete cascade,
  profile_id  uuid not null references public.profile(id)  on delete restrict,
  property_id uuid not null references public.property(id) on delete restrict,
  mode        public.attendance_mode not null,
  recorded_at timestamptz not null default now(),
  unique (assembly_id, property_id)
);

comment on table public.attendance is 'Émargement — une présence par propriété par AG (unique)';

-- proxy — powers of attorney (provisioned, out of MVP)
create table public.proxy (
  id               uuid primary key default gen_random_uuid(),
  assembly_id      uuid not null references public.assembly(id) on delete cascade,
  grantor_profile  uuid not null references public.profile(id)  on delete restrict,
  grantor_property uuid not null references public.property(id) on delete restrict,
  holder_profile   uuid not null references public.profile(id)  on delete restrict,
  status           public.proxy_status not null default 'pending',
  created_at       timestamptz not null default now(),
  unique (assembly_id, grantor_property)
);

comment on table public.proxy is 'Procurations — un mandat par propriété par AG ; plafond 3/mandataire en applicatif';

-- ballot — votes (provisioned, out of MVP Lots 0-2)
create table public.ballot (
  id             uuid primary key default gen_random_uuid(),
  agenda_item_id uuid not null references public.agenda_item(id) on delete cascade,
  question       text not null,
  options        jsonb not null,
  majority_rule  public.majority_rule  not null default 'simple',
  status         public.ballot_status  not null default 'pending',
  opened_at      timestamptz,
  closed_at      timestamptz
);

comment on table public.ballot is 'Scrutins — hors MVP (Lot 3), provisionné dès Lot 0';

-- vote_log — who voted (separate from ballot to preserve vote secrecy)
create table public.vote_log (
  id           uuid primary key default gen_random_uuid(),
  ballot_id    uuid not null references public.ballot(id)   on delete cascade,
  property_id  uuid not null references public.property(id) on delete restrict,
  cast_by      uuid not null references public.profile(id)  on delete restrict,
  on_behalf_of uuid         references public.profile(id)   on delete restrict,
  cast_at      timestamptz not null default now(),
  unique (ballot_id, property_id)
);

comment on table public.vote_log is 'Émargement vote (qui a voté) — pas de FK vers ballot_vote (secret du vote)';

-- ballot_vote — the actual choice (no strong nominative link)
create table public.ballot_vote (
  id        uuid primary key default gen_random_uuid(),
  ballot_id uuid not null references public.ballot(id) on delete cascade,
  choice    text not null,
  weight    int  not null default 1 check (weight > 0),
  cast_at   timestamptz not null default now()
);

comment on table public.ballot_vote is 'Bulletins de vote — pas de lien nominatif direct (secret organisationnel)';

-- fee_call — funding calls / contributions (provisioned, out of MVP)
create table public.fee_call (
  id         uuid primary key default gen_random_uuid(),
  label      text           not null,
  amount     numeric(10,2)  not null check (amount > 0),
  due_date   date           not null,
  created_by uuid references public.profile(id) on delete set null,
  created_at timestamptz not null default now()
);

comment on table public.fee_call is 'Appels de fonds — hors MVP (Lot 4), provisionné dès Lot 0';

-- fee_assignment — what each property owes (out of MVP)
create table public.fee_assignment (
  id          uuid          primary key default gen_random_uuid(),
  fee_call_id uuid          not null references public.fee_call(id)   on delete cascade,
  property_id uuid          not null references public.property(id)   on delete restrict,
  amount_due  numeric(10,2) not null check (amount_due >= 0),
  status      public.fee_status not null default 'due',
  paid_at     date,
  unique (fee_call_id, property_id)
);

comment on table public.fee_assignment is 'Cotisations dues par propriété — hors MVP (Lot 4)';

-- audit_log — append-only audit trail (server-side insert only)
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

-- push_subscription — Web Push (provisioned for Lot 5)
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

-- assembly_notification — email tracking for assembly open / forgot-username flows
create table public.assembly_notification (
  id          uuid primary key default gen_random_uuid(),
  assembly_id uuid not null references public.assembly(id) on delete cascade,
  profile_id  uuid          references public.profile(id)  on delete set null,
  email       text not null,
  first_name  text not null,
  last_name   text not null,
  status      text not null default 'pending' check (status in ('pending', 'sent', 'failed')),
  error_msg   text,
  sent_at     timestamptz,
  created_at  timestamptz not null default now()
);

comment on table public.assembly_notification is 'Tracks email notifications for assembly open and forgot-username flows';

-- =============================================================================
-- INDEXES
-- =============================================================================

create index idx_profile_status                    on public.profile(status);
create index idx_profile_role                      on public.profile(role);
create index idx_credential_login                  on public.credential(login);
create index idx_activation_profile               on public.activation_link(profile_id);
create index idx_ownership_profile                on public.ownership(profile_id);
create index idx_ownership_property               on public.ownership(property_id);
create index idx_ownership_active                 on public.ownership(property_id) where end_date is null;
create index idx_info_post_published              on public.info_post(published_at) where is_published = true;
create index idx_document_type_year               on public.document(type, year);
create index idx_assembly_status                  on public.assembly(status);
create index idx_audit_log_actor                  on public.audit_log(actor_id);
create index idx_audit_log_entity                 on public.audit_log(entity, entity_id);
create index idx_audit_log_created                on public.audit_log(created_at);
create index idx_assembly_notification_assembly   on public.assembly_notification(assembly_id);
create index idx_assembly_notification_status     on public.assembly_notification(assembly_id, status);

-- =============================================================================
-- RLS HELPER FUNCTIONS
-- (security definer — never rely on JWT claims to avoid client-side spoofing)
-- =============================================================================

create or replace function public.get_my_role()
returns public.user_role
language sql stable security invoker
as $$
  select role from public.profile where id = auth.uid()
$$;

create or replace function public.get_my_status()
returns public.account_status
language sql stable security invoker
as $$
  select status from public.profile where id = auth.uid()
$$;

create or replace function public.is_admin()
returns boolean
language sql stable security invoker
as $$
  select exists(
    select 1 from public.profile
    where id = auth.uid() and role = 'admin' and status = 'active'
  )
$$;

create or replace function public.is_admin_or_editor()
returns boolean
language sql stable security invoker
as $$
  select exists(
    select 1 from public.profile
    where id = auth.uid()
      and role in ('admin', 'editor')
      and status = 'active'
  )
$$;

create or replace function public.is_active_member()
returns boolean
language sql stable security invoker
as $$
  select exists(
    select 1 from public.profile
    where id = auth.uid() and status = 'active'
  )
$$;

-- =============================================================================
-- ROW LEVEL SECURITY — enable on all tables (deny-by-default)
-- =============================================================================

alter table public.profile               enable row level security;
alter table public.credential            enable row level security;
alter table public.activation_link       enable row level security;
alter table public.property              enable row level security;
alter table public.ownership             enable row level security;
alter table public.presidency            enable row level security;
alter table public.info_post             enable row level security;
alter table public.document              enable row level security;
alter table public.assembly              enable row level security;
alter table public.agenda_item           enable row level security;
alter table public.attendance            enable row level security;
alter table public.proxy                 enable row level security;
alter table public.ballot                enable row level security;
alter table public.vote_log              enable row level security;
alter table public.ballot_vote           enable row level security;
alter table public.fee_call              enable row level security;
alter table public.fee_assignment        enable row level security;
alter table public.audit_log             enable row level security;
alter table public.push_subscription     enable row level security;
alter table public.assembly_notification enable row level security;

-- =============================================================================
-- RLS POLICIES
-- Insert on most tables is intentionally left to service_role (Edge Functions).
-- =============================================================================

-- --- profile ---

create policy "profile: lecture propre"
  on public.profile for select
  using (id = auth.uid());

create policy "profile: lecture admin"
  on public.profile for select
  using (public.is_admin());

-- Self-update is allowed but role and status cannot be changed by the user
create policy "profile: update propre"
  on public.profile for update
  using (id = auth.uid())
  with check (
    id = auth.uid()
    and role   = (select role   from public.profile where id = auth.uid())
    and status = (select status from public.profile where id = auth.uid())
  );

create policy "profile: update admin"
  on public.profile for update
  using (public.is_admin());

-- --- credential ---

create policy "credential: lecture propre"
  on public.credential for select
  using (profile_id = auth.uid());

create policy "credential: lecture admin"
  on public.credential for select
  using (public.is_admin());

-- --- activation_link ---

create policy "activation_link: lecture admin"
  on public.activation_link for select
  using (public.is_admin());

-- --- property ---

create policy "property: lecture membres actifs"
  on public.property for select
  using (public.is_active_member());

create policy "property: insert admin"
  on public.property for insert
  with check (public.is_admin());

create policy "property: update admin"
  on public.property for update
  using (public.is_admin());

-- --- ownership ---

create policy "ownership: lecture propre"
  on public.ownership for select
  using (profile_id = auth.uid());

-- Covers both admin and editor (is_admin_or_editor includes admin)
create policy "ownership: lecture admin_editor"
  on public.ownership for select
  using (public.is_admin_or_editor());

create policy "ownership: insert admin_editor"
  on public.ownership for insert
  with check (public.is_admin_or_editor());

create policy "ownership: update admin_editor"
  on public.ownership for update
  using (public.is_admin_or_editor());

-- --- presidency ---

create policy "presidency: lecture membres actifs"
  on public.presidency for select
  using (public.is_active_member());

create policy "presidency: insert admin"
  on public.presidency for insert
  with check (public.is_admin());

create policy "presidency: update admin"
  on public.presidency for update
  using (public.is_admin());

-- --- info_post ---

create policy "info_post: lecture publiée membres"
  on public.info_post for select
  using (is_published = true and public.is_active_member());

-- Draft posts visible to admin and editors
create policy "info_post: lecture brouillon admin_editor"
  on public.info_post for select
  using (public.is_admin_or_editor());

create policy "info_post: insert admin_editor"
  on public.info_post for insert
  with check (public.is_admin_or_editor());

create policy "info_post: update admin_editor"
  on public.info_post for update
  using (public.is_admin_or_editor());

create policy "info_post: delete admin"
  on public.info_post for delete
  using (public.is_admin());

-- --- document ---
-- Visibility levels: members → all active members; editors → editor+; admin → admin only

create policy "document: lecture members"
  on public.document for select
  using (visibility = 'members' and public.is_active_member());

create policy "document: lecture editors"
  on public.document for select
  using (visibility = 'editors' and public.is_admin_or_editor());

create policy "document: lecture admin"
  on public.document for select
  using (visibility = 'admin' and public.is_admin());

create policy "document: insert admin_editor"
  on public.document for insert
  with check (public.is_admin_or_editor());

create policy "document: update admin_editor"
  on public.document for update
  using (public.is_admin_or_editor());

create policy "document: delete admin_editor"
  on public.document for delete
  using (public.is_admin_or_editor());

-- --- assembly ---

-- Members see all assemblies except drafts
create policy "assembly: lecture membres (non-draft)"
  on public.assembly for select
  using (status <> 'draft' and public.is_active_member());

create policy "assembly: lecture admin_editor (draft inclus)"
  on public.assembly for select
  using (public.is_admin_or_editor());

create policy "assembly: insert admin_editor"
  on public.assembly for insert
  with check (public.is_admin_or_editor());

create policy "assembly: update admin_editor"
  on public.assembly for update
  using (public.is_admin_or_editor());

create policy "assembly: delete admin"
  on public.assembly for delete
  using (public.is_admin());

-- --- agenda_item ---

create policy "agenda_item: lecture membres (AG non-draft)"
  on public.agenda_item for select
  using (
    public.is_active_member()
    and exists (
      select 1 from public.assembly a
      where a.id = agenda_item.assembly_id and a.status <> 'draft'
    )
  );

create policy "agenda_item: lecture admin_editor"
  on public.agenda_item for select
  using (public.is_admin_or_editor());

create policy "agenda_item: insert admin_editor"
  on public.agenda_item for insert
  with check (public.is_admin_or_editor());

create policy "agenda_item: update admin_editor"
  on public.agenda_item for update
  using (public.is_admin_or_editor());

create policy "agenda_item: delete admin_editor"
  on public.agenda_item for delete
  using (public.is_admin_or_editor());

-- --- attendance ---

create policy "attendance: lecture propre"
  on public.attendance for select
  using (profile_id = auth.uid());

create policy "attendance: lecture admin_editor"
  on public.attendance for select
  using (public.is_admin_or_editor());

create policy "attendance: insert admin_editor"
  on public.attendance for insert
  with check (public.is_admin_or_editor());

create policy "attendance: update admin_editor"
  on public.attendance for update
  using (public.is_admin_or_editor());

create policy "attendance: delete admin"
  on public.attendance for delete
  using (public.is_admin());

-- --- proxy (out of MVP — minimal policy) ---

create policy "proxy: lecture admin"
  on public.proxy for select
  using (public.is_admin());

-- --- ballot (out of MVP — minimal policy) ---

create policy "ballot: lecture admin"
  on public.ballot for select
  using (public.is_admin());

-- --- vote_log / ballot_vote ---

create policy "vote_log: lecture admin"
  on public.vote_log for select
  using (public.is_admin());

create policy "ballot_vote: lecture admin"
  on public.ballot_vote for select
  using (public.is_admin());

-- --- fee_call / fee_assignment (out of MVP) ---

create policy "fee_call: lecture admin"
  on public.fee_call for select
  using (public.is_admin());

create policy "fee_assignment: lecture admin"
  on public.fee_assignment for select
  using (public.is_admin());

-- Members can see their own fee assignments via current ownership
create policy "fee_assignment: lecture propre via property"
  on public.fee_assignment for select
  using (
    exists (
      select 1 from public.ownership o
      where o.property_id = fee_assignment.property_id
        and o.profile_id  = auth.uid()
        and o.end_date    is null
    )
  );

-- --- audit_log ---

create policy "audit_log: lecture admin"
  on public.audit_log for select
  using (public.is_admin());

-- --- push_subscription ---

create policy "push_subscription: lecture propre"
  on public.push_subscription for select
  using (profile_id = auth.uid());

create policy "push_subscription: insert propre"
  on public.push_subscription for insert
  with check (profile_id = auth.uid());

create policy "push_subscription: delete propre"
  on public.push_subscription for delete
  using (profile_id = auth.uid());

-- --- assembly_notification ---

create policy "assembly_notification: lecture admin"
  on public.assembly_notification for select
  using (public.is_admin());
