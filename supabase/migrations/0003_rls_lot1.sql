-- =============================================================================
-- Migration 0003 : RLS complémentaires Lot 1
-- Policies pour info_post, document (visibilité×rôle)
-- Précondition : 0002_rls_base.sql déjà appliqué
-- =============================================================================

-- =============================================================================
-- INFO_POST
-- Membres actifs : lecture des posts publiés (is_published = true)
-- Admin/éditeur  : lecture de tous les posts (brouillons inclus)
-- Écriture       : éditeur/admin uniquement
-- =============================================================================

-- Membres actifs lisent les posts publiés
create policy "info_post: lecture publiée membres"
  on public.info_post for select
  using (
    is_published = true
    and public.is_active_member()
  );

-- Admin et éditeurs lisent également les brouillons
create policy "info_post: lecture brouillon admin_editor"
  on public.info_post for select
  using (public.is_admin_or_editor());

-- Création : éditeur/admin
create policy "info_post: insert admin_editor"
  on public.info_post for insert
  with check (public.is_admin_or_editor());

-- Modification : éditeur/admin
create policy "info_post: update admin_editor"
  on public.info_post for update
  using (public.is_admin_or_editor());

-- Suppression : admin uniquement
create policy "info_post: delete admin"
  on public.info_post for delete
  using (public.is_admin());

-- =============================================================================
-- DOCUMENT
-- Visibilité :
--   'members' → tous les membres actifs
--   'editors' → éditeurs et admins actifs
--   'admin'   → admins actifs uniquement
-- Écriture : éditeur/admin
-- Suppression : éditeur/admin
-- =============================================================================

create policy "document: lecture members"
  on public.document for select
  using (
    visibility = 'members'
    and public.is_active_member()
  );

create policy "document: lecture editors"
  on public.document for select
  using (
    visibility = 'editors'
    and public.is_admin_or_editor()
  );

create policy "document: lecture admin"
  on public.document for select
  using (
    visibility = 'admin'
    and public.is_admin()
  );

-- Upload : éditeur/admin
create policy "document: insert admin_editor"
  on public.document for insert
  with check (public.is_admin_or_editor());

-- Modification (visibilité, métadonnées) : éditeur/admin
create policy "document: update admin_editor"
  on public.document for update
  using (public.is_admin_or_editor());

-- Suppression : éditeur/admin
create policy "document: delete admin_editor"
  on public.document for delete
  using (public.is_admin_or_editor());

-- =============================================================================
-- OWNERSHIP — complément Lot 1
-- Les éditeurs doivent pouvoir voir tous les ownership (pour l'état nominatif)
-- La policy "ownership: lecture admin" dans 0002 ne couvre que l'admin.
-- =============================================================================

create policy "ownership: lecture editor"
  on public.ownership for select
  using (public.is_admin_or_editor());
