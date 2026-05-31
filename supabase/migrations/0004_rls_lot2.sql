-- =============================================================================
-- Migration 0004 : RLS Lot 2
-- Policies pour assembly, agenda_item, attendance
-- Précondition : 0003_rls_lot1.sql déjà appliqué
-- =============================================================================

-- =============================================================================
-- ASSEMBLY
-- Lecture : membres actifs (tous statuts sauf draft pour les membres)
-- Draft   : visible admin/éditeur uniquement
-- Écriture : éditeur/admin (création, modification en draft)
-- Transitions de statut (convened, open) : uniquement via service_role ou admin
-- =============================================================================

-- Membres actifs voient les AG convoquées, ouvertes, clôturées et archivées
create policy "assembly: lecture membres (non-draft)"
  on public.assembly for select
  using (
    status <> 'draft'
    and public.is_active_member()
  );

-- Admin et éditeurs voient toutes les AG y compris les brouillons
create policy "assembly: lecture admin_editor (draft inclus)"
  on public.assembly for select
  using (public.is_admin_or_editor());

-- Création : éditeur/admin
create policy "assembly: insert admin_editor"
  on public.assembly for insert
  with check (public.is_admin_or_editor());

-- Modification : éditeur/admin (draft seulement est géré côté applicatif)
create policy "assembly: update admin_editor"
  on public.assembly for update
  using (public.is_admin_or_editor());

-- Suppression : admin uniquement (cas exceptionnel)
create policy "assembly: delete admin"
  on public.assembly for delete
  using (public.is_admin());

-- =============================================================================
-- AGENDA_ITEM
-- Lecture : membres actifs (si AG non-draft)
-- Lecture draft : éditeur/admin uniquement
-- Écriture : éditeur/admin (et uniquement si AG en draft)
-- =============================================================================

create policy "agenda_item: lecture membres (AG non-draft)"
  on public.agenda_item for select
  using (
    public.is_active_member()
    and exists (
      select 1 from public.assembly a
      where a.id = agenda_item.assembly_id
        and a.status <> 'draft'
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

-- =============================================================================
-- ATTENDANCE
-- Lecture : membres actifs (voient leur propre présence)
-- Lecture admin/éditeur : toutes les présences
-- Écriture : éditeur/admin uniquement (enregistrement émargement)
-- =============================================================================

-- Un membre voit sa propre présence
create policy "attendance: lecture propre"
  on public.attendance for select
  using (profile_id = auth.uid());

-- Admin/éditeur voit tout
create policy "attendance: lecture admin_editor"
  on public.attendance for select
  using (public.is_admin_or_editor());

-- Enregistrement d'une présence : éditeur/admin
create policy "attendance: insert admin_editor"
  on public.attendance for insert
  with check (public.is_admin_or_editor());

-- Mise à jour (changement de mode) : éditeur/admin
create policy "attendance: update admin_editor"
  on public.attendance for update
  using (public.is_admin_or_editor());

-- Suppression : admin uniquement
create policy "attendance: delete admin"
  on public.attendance for delete
  using (public.is_admin());

-- =============================================================================
-- PROXY (hors MVP — policy minimale pour ne pas bloquer)
-- =============================================================================

-- Lecture : admin uniquement pour l'instant
create policy "proxy: lecture admin"
  on public.proxy for select
  using (public.is_admin());

-- =============================================================================
-- BALLOT (hors MVP — policy minimale)
-- =============================================================================

-- Lecture : membres actifs (pour consultation des scrutins publiés)
create policy "ballot: lecture admin"
  on public.ballot for select
  using (public.is_admin());
