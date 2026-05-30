-- =============================================================================
-- Migration 0006 : bootstrap admin credentials
-- Force un changement d'identifiants au premier login pour l'administrateur bootstrap.
-- =============================================================================

alter table public.profile
  add column if not exists must_change_credentials boolean not null default false;

comment on column public.profile.must_change_credentials is
  'Vrai tant que le compte bootstrap doit changer son login et son mot de passe';
