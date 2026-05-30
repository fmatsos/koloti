-- =============================================================================
-- Migration 0002 : RLS de base — deny-by-default sur toutes les tables
-- Policies fondamentales pour le Lot 0.
-- Les policies Lot 1 (documents, info_post...) et Lot 2 (assembly, attendance...)
-- sont ajoutées dans les migrations 0003 et 0004.
-- =============================================================================

-- Fonction helper : retourne le rôle de l'utilisateur courant depuis profile
-- (jamais depuis les JWT claims pour éviter la manipulation côté client)
create or replace function public.get_my_role()
returns public.user_role
language sql stable security definer
set search_path = public
as $$
  select role from public.profile where id = auth.uid()
$$;

-- Fonction helper : retourne le statut du compte courant
create or replace function public.get_my_status()
returns public.account_status
language sql stable security definer
set search_path = public
as $$
  select status from public.profile where id = auth.uid()
$$;

-- Fonction helper : vérifie si l'utilisateur est admin
create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists(
    select 1 from public.profile
    where id = auth.uid() and role = 'admin' and status = 'active'
  )
$$;

-- Fonction helper : vérifie si l'utilisateur est admin ou éditeur
create or replace function public.is_admin_or_editor()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists(
    select 1 from public.profile
    where id = auth.uid()
      and role in ('admin', 'editor')
      and status = 'active'
  )
$$;

-- Fonction helper : vérifie si l'utilisateur est un membre actif (tout rôle)
create or replace function public.is_active_member()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists(
    select 1 from public.profile
    where id = auth.uid() and status = 'active'
  )
$$;

-- =============================================================================
-- Activer RLS sur toutes les tables (deny-by-default)
-- Aucune ligne accessible sans policy explicite
-- =============================================================================
alter table public.profile           enable row level security;
alter table public.credential        enable row level security;
alter table public.activation_link   enable row level security;
alter table public.property          enable row level security;
alter table public.ownership         enable row level security;
alter table public.presidency        enable row level security;
alter table public.info_post         enable row level security;
alter table public.document          enable row level security;
alter table public.assembly          enable row level security;
alter table public.agenda_item       enable row level security;
alter table public.attendance        enable row level security;
alter table public.proxy             enable row level security;
alter table public.ballot            enable row level security;
alter table public.vote_log          enable row level security;
alter table public.ballot_vote       enable row level security;
alter table public.fee_call          enable row level security;
alter table public.fee_assignment    enable row level security;
alter table public.audit_log         enable row level security;
alter table public.push_subscription enable row level security;

-- =============================================================================
-- PROFILE
-- =============================================================================

-- Un utilisateur peut lire son propre profil
create policy "profile: lecture propre"
  on public.profile for select
  using (id = auth.uid());

-- Les admins peuvent lire tous les profils
create policy "profile: lecture admin"
  on public.profile for select
  using (public.is_admin());

-- Un utilisateur peut mettre à jour son propre profil (champs non sensibles)
create policy "profile: update propre"
  on public.profile for update
  using (id = auth.uid())
  with check (
    id = auth.uid()
    -- On ne peut pas modifier son propre rôle ou statut (géré en Edge Function)
    and role = (select role from public.profile where id = auth.uid())
    and status = (select status from public.profile where id = auth.uid())
  );

-- Les admins peuvent mettre à jour tous les profils
create policy "profile: update admin"
  on public.profile for update
  using (public.is_admin());

-- Insertion : uniquement via service_role (Edge Functions)
-- (pas de policy insert → uniquement service_role peut insérer)

-- =============================================================================
-- CREDENTIAL
-- =============================================================================

-- Un utilisateur peut voir son propre login (pour se le rappeler)
create policy "credential: lecture propre"
  on public.credential for select
  using (profile_id = auth.uid());

-- Les admins peuvent voir tous les logins
create policy "credential: lecture admin"
  on public.credential for select
  using (public.is_admin());

-- Insertion/modification : uniquement service_role

-- =============================================================================
-- ACTIVATION_LINK
-- =============================================================================

-- Lecture : uniquement admin (pour vérifier l'état) et service_role
create policy "activation_link: lecture admin"
  on public.activation_link for select
  using (public.is_admin());

-- Aucune écriture client (insertion/update/delete via service_role uniquement)

-- =============================================================================
-- PROPERTY
-- =============================================================================

-- Lecture : tous les membres actifs
create policy "property: lecture membres actifs"
  on public.property for select
  using (public.is_active_member());

-- Écriture : admin uniquement
create policy "property: insert admin"
  on public.property for insert
  with check (public.is_admin());

create policy "property: update admin"
  on public.property for update
  using (public.is_admin());

-- Pas de suppression côté client (intégrité des données historiques)

-- =============================================================================
-- OWNERSHIP
-- =============================================================================

-- Un membre peut voir ses propres rattachements
create policy "ownership: lecture propre"
  on public.ownership for select
  using (profile_id = auth.uid());

-- Les admins voient tout
create policy "ownership: lecture admin"
  on public.ownership for select
  using (public.is_admin());

-- Éditeurs et admins peuvent gérer les ownership
create policy "ownership: insert admin_editor"
  on public.ownership for insert
  with check (public.is_admin_or_editor());

create policy "ownership: update admin_editor"
  on public.ownership for update
  using (public.is_admin_or_editor());

-- =============================================================================
-- PRESIDENCY
-- =============================================================================

-- Lecture : tous les membres actifs
create policy "presidency: lecture membres actifs"
  on public.presidency for select
  using (public.is_active_member());

-- Écriture : admin uniquement
create policy "presidency: insert admin"
  on public.presidency for insert
  with check (public.is_admin());

create policy "presidency: update admin"
  on public.presidency for update
  using (public.is_admin());

-- =============================================================================
-- AUDIT_LOG
-- Append-only : insertion serveur uniquement, lecture admin
-- =============================================================================

-- Lecture : admin uniquement
create policy "audit_log: lecture admin"
  on public.audit_log for select
  using (public.is_admin());

-- Insertion : uniquement service_role (pas de policy insert → client bloqué)
-- Update/Delete : jamais autorisés côté client

-- =============================================================================
-- BALLOT_VOTE, VOTE_LOG
-- Pas d'écriture client autorisée — uniquement Edge Functions service_role
-- =============================================================================

-- ballot_vote : lecture admin uniquement (agrégats, résultats)
create policy "ballot_vote: lecture admin"
  on public.ballot_vote for select
  using (public.is_admin());

-- vote_log : lecture admin uniquement
create policy "vote_log: lecture admin"
  on public.vote_log for select
  using (public.is_admin());

-- =============================================================================
-- PUSH_SUBSCRIPTION
-- =============================================================================

-- Un utilisateur gère ses propres abonnements
create policy "push_subscription: lecture propre"
  on public.push_subscription for select
  using (profile_id = auth.uid());

create policy "push_subscription: insert propre"
  on public.push_subscription for insert
  with check (profile_id = auth.uid());

create policy "push_subscription: delete propre"
  on public.push_subscription for delete
  using (profile_id = auth.uid());

-- =============================================================================
-- FEE_CALL, FEE_ASSIGNMENT (hors MVP — policies minimales)
-- =============================================================================

create policy "fee_call: lecture admin"
  on public.fee_call for select
  using (public.is_admin());

create policy "fee_assignment: lecture admin"
  on public.fee_assignment for select
  using (public.is_admin());

-- Lecture membre de ses propres cotisations
create policy "fee_assignment: lecture propre via property"
  on public.fee_assignment for select
  using (
    exists (
      select 1 from public.ownership o
      where o.property_id = fee_assignment.property_id
        and o.profile_id = auth.uid()
        and o.end_date is null
    )
  );
