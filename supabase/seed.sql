-- =============================================================================
-- seed.sql — Koloti local development data
-- Applied automatically by `supabase db reset` (see supabase/config.toml)
--
-- Password for ALL accounts: Dev1234!
--
-- Accounts summary:
--   admin@koloti.local   / admin    → admin,  active
--   syndic@koloti.local  / marie    → editor, active
--   jplefebvre@example.com / jplef01 → member, active  (LOT-01)
--   smoreau@example.com    / smor02  → member, active  (LOT-02)
--   abenali@example.com    / abena03 → member, active  (LOT-03 × 2 votes)
--   iroux@example.com      / iroux04 → member, active  (LOT-04)
--   fpetit@example.com     / fpeti05 → member, active  (LOT-05, ex-LOT-03)
--   nsimon@example.com     / nsimo06 → member, active  (LOT-06)
--   tlaurent@example.com   / tlau07  → member, PENDING (LOT-07)
--   cdubois@example.com    / cdubo08 → member, inactive (ex-LOT-08)
--
-- Pending activation URL (Thomas Laurent):
--   http://localhost:5173/activate/000000000000000000000000000000000000000000000000000000000000cafe
-- =============================================================================

-- =============================================================================
-- 1. AUTH USERS
--    encrypted_password = bcrypt('Dev1234!', gen_salt('bf'))
--    Supabase Auth reads email_confirmed_at to know if the account is confirmed.
-- =============================================================================

insert into auth.users (
  id, instance_id, aud, role,
  email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data,
  is_super_admin, is_sso_user,
  created_at, updated_at,
  confirmation_token, recovery_token,
  email_change_token_new, email_change,
  email_change_confirm_status
) values

-- admin
('a0000000-0000-0000-0000-000000000001',
 '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
 'admin@koloti.local', crypt('Dev1234!', gen_salt('bf')),
 '2023-01-10 09:00:00+00',
 '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
 false, false,
 '2023-01-10 09:00:00+00', '2023-01-10 09:00:00+00',
 '', '', '', '', 0),

-- editor (syndic)
('a0000000-0000-0000-0000-000000000002',
 '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
 'syndic@koloti.local', crypt('Dev1234!', gen_salt('bf')),
 '2023-01-15 10:00:00+00',
 '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
 false, false,
 '2023-01-15 10:00:00+00', '2023-01-15 10:00:00+00',
 '', '', '', '', 0),

-- Jean-Pierre Lefebvre — LOT-01
('a0000000-0000-0000-0000-000000000003',
 '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
 'jplefebvre@example.com', crypt('Dev1234!', gen_salt('bf')),
 '2023-02-05 14:30:00+00',
 '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
 false, false,
 '2023-02-01 14:00:00+00', '2023-02-01 14:00:00+00',
 '', '', '', '', 0),

-- Sophie Moreau — LOT-02
('a0000000-0000-0000-0000-000000000004',
 '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
 'smoreau@example.com', crypt('Dev1234!', gen_salt('bf')),
 '2023-02-06 09:15:00+00',
 '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
 false, false,
 '2023-02-01 14:00:00+00', '2023-02-01 14:00:00+00',
 '', '', '', '', 0),

-- Ahmed Benali — LOT-03 (vote_weight=2)
('a0000000-0000-0000-0000-000000000005',
 '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
 'abenali@example.com', crypt('Dev1234!', gen_salt('bf')),
 '2023-06-10 11:45:00+00',
 '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
 false, false,
 '2023-06-08 11:00:00+00', '2023-06-08 11:00:00+00',
 '', '', '', '', 0),

-- Isabelle Roux — LOT-04
('a0000000-0000-0000-0000-000000000006',
 '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
 'iroux@example.com', crypt('Dev1234!', gen_salt('bf')),
 '2023-02-07 16:00:00+00',
 '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
 false, false,
 '2023-02-01 14:00:00+00', '2023-02-01 14:00:00+00',
 '', '', '', '', 0),

-- François Petit — LOT-05 (formerly LOT-03)
('a0000000-0000-0000-0000-000000000007',
 '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
 'fpetit@example.com', crypt('Dev1234!', gen_salt('bf')),
 '2023-02-08 10:20:00+00',
 '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
 false, false,
 '2023-02-01 14:00:00+00', '2023-02-01 14:00:00+00',
 '', '', '', '', 0),

-- Nathalie Simon — LOT-06
('a0000000-0000-0000-0000-000000000008',
 '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
 'nsimon@example.com', crypt('Dev1234!', gen_salt('bf')),
 '2023-02-09 14:00:00+00',
 '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
 false, false,
 '2023-02-01 14:00:00+00', '2023-02-01 14:00:00+00',
 '', '', '', '', 0),

-- Thomas Laurent — LOT-07, PENDING (email not confirmed, awaiting activation)
('a0000000-0000-0000-0000-000000000009',
 '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
 'tlaurent@example.com', crypt('Dev1234!', gen_salt('bf')),
 null,
 '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
 false, false,
 '2025-05-01 09:00:00+00', '2025-05-01 09:00:00+00',
 '', '', '', '', 0),

-- Chantal Dubois — ex-LOT-08, inactive (sold property)
('a0000000-0000-0000-0000-000000000010',
 '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
 'cdubois@example.com', crypt('Dev1234!', gen_salt('bf')),
 '2021-01-10 10:30:00+00',
 '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
 false, false,
 '2021-01-01 10:00:00+00', '2024-02-01 08:00:00+00',
 '', '', '', '', 0);

-- =============================================================================
-- 2. PROFILES
-- =============================================================================

insert into public.profile (
  id, email, first_name, last_name, phone,
  role, status, must_change_credentials,
  last_login_at, activated_at, created_at
) values

('a0000000-0000-0000-0000-000000000001',
 'admin@koloti.local', 'Bernard', 'Martin', '06 12 34 56 78',
 'admin', 'active', false,
 now() - interval '1 day',
 '2023-01-10 09:00:00+00', '2023-01-10 09:00:00+00'),

('a0000000-0000-0000-0000-000000000002',
 'syndic@koloti.local', 'Marie', 'Dupont', '06 23 45 67 89',
 'editor', 'active', false,
 now() - interval '3 days',
 '2023-01-15 10:00:00+00', '2023-01-15 10:00:00+00'),

('a0000000-0000-0000-0000-000000000003',
 'jplefebvre@example.com', 'Jean-Pierre', 'Lefebvre', '06 34 56 78 90',
 'member', 'active', false,
 now() - interval '7 days',
 '2023-02-05 14:30:00+00', '2023-02-01 14:00:00+00'),

('a0000000-0000-0000-0000-000000000004',
 'smoreau@example.com', 'Sophie', 'Moreau', '06 45 67 89 01',
 'member', 'active', false,
 now() - interval '5 days',
 '2023-02-06 09:15:00+00', '2023-02-01 14:00:00+00'),

('a0000000-0000-0000-0000-000000000005',
 'abenali@example.com', 'Ahmed', 'Benali', '06 56 78 90 12',
 'member', 'active', false,
 now() - interval '2 days',
 '2023-06-10 11:45:00+00', '2023-06-08 11:00:00+00'),

('a0000000-0000-0000-0000-000000000006',
 'iroux@example.com', 'Isabelle', 'Roux', '06 67 89 01 23',
 'member', 'active', false,
 now() - interval '10 days',
 '2023-02-07 16:00:00+00', '2023-02-01 14:00:00+00'),

('a0000000-0000-0000-0000-000000000007',
 'fpetit@example.com', 'François', 'Petit', '06 78 90 12 34',
 'member', 'active', false,
 now() - interval '4 days',
 '2023-02-08 10:20:00+00', '2023-02-01 14:00:00+00'),

('a0000000-0000-0000-0000-000000000008',
 'nsimon@example.com', 'Nathalie', 'Simon', '06 89 01 23 45',
 'member', 'active', false,
 now() - interval '6 days',
 '2023-02-09 14:00:00+00', '2023-02-01 14:00:00+00'),

-- invited, awaiting activation
('a0000000-0000-0000-0000-000000000009',
 'tlaurent@example.com', 'Thomas', 'Laurent', null,
 'member', 'pending', false,
 null, null, '2025-05-01 09:00:00+00'),

-- sold property → disabled
('a0000000-0000-0000-0000-000000000010',
 'cdubois@example.com', 'Chantal', 'Dubois', '06 90 12 34 56',
 'member', 'inactive', false,
 '2024-01-15 11:00:00+00',
 '2021-01-10 10:30:00+00', '2021-01-01 10:00:00+00');

-- =============================================================================
-- 3. CREDENTIALS
--    Logins are human-readable identifiers communicated by admin.
--    They are independent of email.
-- =============================================================================

insert into public.credential (id, profile_id, login, created_at) values
('e0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'admin',   '2023-01-10 09:00:00+00'),
('e0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 'marie',   '2023-01-15 10:00:00+00'),
('e0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000003', 'jplef01', '2023-02-05 14:30:00+00'),
('e0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000004', 'smor02',  '2023-02-06 09:15:00+00'),
('e0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000005', 'abena03', '2023-06-10 11:45:00+00'),
('e0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000006', 'iroux04', '2023-02-07 16:00:00+00'),
('e0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000007', 'fpeti05', '2023-02-08 10:20:00+00'),
('e0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000008', 'nsimo06', '2023-02-09 14:00:00+00'),
('e0000000-0000-0000-0000-000000000009', 'a0000000-0000-0000-0000-000000000009', 'tlau07',  '2025-05-01 09:00:00+00'),
('e0000000-0000-0000-0000-000000000010', 'a0000000-0000-0000-0000-000000000010', 'cdubo08', '2021-01-10 10:30:00+00');

-- =============================================================================
-- 4. ACTIVATION LINKS
--    token_hash = SHA-256 of the raw hex token sent in the URL.
--    The app hashes the URL token with crypto.createHash('sha256').update(token).digest('hex').
-- =============================================================================

insert into public.activation_link (
  id, profile_id, token_hash, kind,
  expires_at, used_at, revoked, created_by, created_at
) values

-- Thomas Laurent: valid pending link (expires in 72h from seed time)
('f0000000-0000-0000-0000-000000000001',
 'a0000000-0000-0000-0000-000000000009',
 encode(digest('000000000000000000000000000000000000000000000000000000000000cafe', 'sha256'), 'hex'),
 'standard',
 now() + interval '72 hours',
 null, false,
 'a0000000-0000-0000-0000-000000000001',
 now() - interval '30 minutes'),

-- Chantal Dubois: historical used link (account is now inactive)
('f0000000-0000-0000-0000-000000000010',
 'a0000000-0000-0000-0000-000000000010',
 encode(digest('0000000000000000000000000000000000000000000000000000000000000010', 'sha256'), 'hex'),
 'standard',
 '2021-01-15 09:00:00+00',
 '2021-01-10 10:30:00+00',
 false,
 'a0000000-0000-0000-0000-000000000001',
 '2021-01-10 09:00:00+00');

-- =============================================================================
-- 5. PROPERTIES (lots)
--    LOT-03 has vote_weight=2 (larger lot — double electoral weight).
--    Total vote weight across active lots: 9 (1+1+2+1+1+1+1+1).
--    LOT-08 has no current owner (Chantal sold and was deactivated).
-- =============================================================================

insert into public.property (
  id, reference, street_number, street_name,
  cadastre_number, vote_weight, created_at
) values
('b0000000-0000-0000-0000-000000000001', 'LOT-01', '1', 'allée des Chênes', 'AX-001', 1, '2023-01-10 09:00:00+00'),
('b0000000-0000-0000-0000-000000000002', 'LOT-02', '2', 'allée des Chênes', 'AX-002', 1, '2023-01-10 09:00:00+00'),
('b0000000-0000-0000-0000-000000000003', 'LOT-03', '3', 'allée des Chênes', 'AX-003', 2, '2023-01-10 09:00:00+00'),
('b0000000-0000-0000-0000-000000000004', 'LOT-04', '4', 'allée des Chênes', 'AX-004', 1, '2023-01-10 09:00:00+00'),
('b0000000-0000-0000-0000-000000000005', 'LOT-05', '5', 'allée des Chênes', 'AX-005', 1, '2023-01-10 09:00:00+00'),
('b0000000-0000-0000-0000-000000000006', 'LOT-06', '6', 'allée des Chênes', 'AX-006', 1, '2023-01-10 09:00:00+00'),
('b0000000-0000-0000-0000-000000000007', 'LOT-07', '7', 'allée des Chênes', 'AX-007', 1, '2023-01-10 09:00:00+00'),
('b0000000-0000-0000-0000-000000000008', 'LOT-08', '8', 'allée des Chênes', 'AX-008', 1, '2023-01-10 09:00:00+00');

-- =============================================================================
-- 6. OWNERSHIPS
--    LOT-03 changed hands: François Petit → Ahmed Benali (June 2023).
--    LOT-05 is François Petit's current lot (acquired June 2023).
--    LOT-08 has no current owner (end_date set, not re-assigned).
-- =============================================================================

insert into public.ownership (
  id, profile_id, property_id,
  start_date, end_date, is_primary
) values

-- LOT-01 — Jean-Pierre Lefebvre (current)
('10000000-0000-0000-0000-000000000001',
 'a0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001',
 '2020-04-01', null, true),

-- LOT-02 — Sophie Moreau (current)
('10000000-0000-0000-0000-000000000002',
 'a0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000002',
 '2019-09-15', null, true),

-- LOT-03 — François Petit (former owner, sold June 2023)
('10000000-0000-0000-0000-000000000003',
 'a0000000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000003',
 '2018-03-01', '2023-05-31', true),

-- LOT-03 — Ahmed Benali (current owner since June 2023)
('10000000-0000-0000-0000-000000000004',
 'a0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000003',
 '2023-06-01', null, true),

-- LOT-04 — Isabelle Roux (current)
('10000000-0000-0000-0000-000000000005',
 'a0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000004',
 '2021-11-20', null, true),

-- LOT-05 — François Petit (current, acquired when he sold LOT-03)
('10000000-0000-0000-0000-000000000006',
 'a0000000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000005',
 '2023-06-01', null, true),

-- LOT-06 — Nathalie Simon (current)
('10000000-0000-0000-0000-000000000007',
 'a0000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000006',
 '2022-07-10', null, true),

-- LOT-07 — Thomas Laurent (current, pending activation)
('10000000-0000-0000-0000-000000000008',
 'a0000000-0000-0000-0000-000000000009', 'b0000000-0000-0000-0000-000000000007',
 '2025-04-15', null, true),

-- LOT-08 — Chantal Dubois (former, sold Jan 2024)
('10000000-0000-0000-0000-000000000009',
 'a0000000-0000-0000-0000-000000000010', 'b0000000-0000-0000-0000-000000000008',
 '2018-06-01', '2024-01-31', true);

-- =============================================================================
-- 7. PRESIDENCY
-- =============================================================================

insert into public.presidency (id, profile_id, start_date, end_date) values
('20000000-0000-0000-0000-000000000001',
 'a0000000-0000-0000-0000-000000000001', '2023-01-10', null);

-- =============================================================================
-- 8. ASSEMBLIES
--    Five lifecycle stages covered:
--      archived  — AG Ordinaire 2022 (completed long ago)
--      closed    — AG Ordinaire 2023 (recently ended)
--      open      — AG Extraordinaire Travaux 2024 (in progress)
--      convened  — AG Ordinaire 2024 (upcoming, convocations sent)
--      draft     — AG Ordinaire 2025 (being prepared)
-- =============================================================================

insert into public.assembly (
  id, title, type, mode,
  scheduled_at, location,
  status, quorum_pct,
  convened_at, opened_at, closed_at,
  created_by, created_at
) values

('c0000000-0000-0000-0000-000000000001',
 'AG Ordinaire 2022', 'ordinaire', 'presentiel',
 '2022-06-15 18:00:00+00', 'Salle de réunion Koloti — bâtiment A',
 'archived', 50,
 '2022-05-25 09:00:00+00', '2022-06-15 18:10:00+00', '2022-06-15 21:30:00+00',
 'a0000000-0000-0000-0000-000000000001', '2022-05-10 10:00:00+00'),

('c0000000-0000-0000-0000-000000000002',
 'AG Ordinaire 2023', 'ordinaire', 'hybride',
 '2023-06-20 18:30:00+00', 'Salle de réunion Koloti + lien visio',
 'closed', 50,
 '2023-05-30 10:00:00+00', '2023-06-20 18:40:00+00', '2023-06-20 21:00:00+00',
 'a0000000-0000-0000-0000-000000000001', '2023-05-15 09:00:00+00'),

('c0000000-0000-0000-0000-000000000003',
 'AG Extraordinaire — Travaux clôture 2024', 'extraordinaire', 'presentiel',
 '2024-03-15 19:00:00+00', 'Salle de réunion Koloti — bâtiment A',
 'open', 33,
 '2024-02-28 10:00:00+00', '2024-03-15 19:10:00+00', null,
 'a0000000-0000-0000-0000-000000000001', '2024-02-15 14:00:00+00'),

('c0000000-0000-0000-0000-000000000004',
 'AG Ordinaire 2024', 'ordinaire', 'presentiel',
 '2025-06-18 18:30:00+00', 'Salle de réunion Koloti — bâtiment A',
 'convened', 50,
 '2025-05-20 10:00:00+00', null, null,
 'a0000000-0000-0000-0000-000000000001', '2025-05-05 09:00:00+00'),

('c0000000-0000-0000-0000-000000000005',
 'AG Ordinaire 2025', 'ordinaire', 'presentiel',
 '2026-06-17 18:30:00+00', null,
 'draft', 50,
 null, null, null,
 'a0000000-0000-0000-0000-000000000001', '2025-05-28 11:00:00+00');

-- =============================================================================
-- 9. AGENDA ITEMS
-- =============================================================================

-- AG 2022 — 4 items
insert into public.agenda_item (id, assembly_id, position, title, description, requires_vote) values
('d0000000-0000-0000-0001-000000000001', 'c0000000-0000-0000-0000-000000000001', 1,
 'Approbation du PV de l''AG 2021', null, true),
('d0000000-0000-0000-0001-000000000002', 'c0000000-0000-0000-0000-000000000001', 2,
 'Rapport de gestion 2021–2022',
 'Présentation des actions menées et du bilan de l''exercice écoulé.', false),
('d0000000-0000-0000-0001-000000000003', 'c0000000-0000-0000-0000-000000000001', 3,
 'Approbation des comptes 2021–2022', null, true),
('d0000000-0000-0000-0001-000000000004', 'c0000000-0000-0000-0000-000000000001', 4,
 'Questions diverses', null, false);

-- AG 2023 — 3 items
insert into public.agenda_item (id, assembly_id, position, title, description, requires_vote) values
('d0000000-0000-0000-0002-000000000001', 'c0000000-0000-0000-0000-000000000002', 1,
 'Approbation du PV de l''AG 2022', null, true),
('d0000000-0000-0000-0002-000000000002', 'c0000000-0000-0000-0000-000000000002', 2,
 'Approbation des comptes 2022–2023 et fixation des cotisations 2024', null, true),
('d0000000-0000-0000-0002-000000000003', 'c0000000-0000-0000-0000-000000000002', 3,
 'Renouvellement du bureau — élection du président', null, true);

-- AG Extraordinaire 2024 (open) — 2 items
insert into public.agenda_item (id, assembly_id, position, title, description, requires_vote) values
('d0000000-0000-0000-0003-000000000001', 'c0000000-0000-0000-0000-000000000003', 1,
 'Présentation du devis travaux — clôture périmétrique',
 'Devis de 28 400 € TTC pour la réfection complète de la clôture. Entreprise Verdier BTP.', true),
('d0000000-0000-0000-0003-000000000002', 'c0000000-0000-0000-0000-000000000003', 2,
 'Vote du budget et désignation du maître d''ouvrage délégué',
 'Décision sur le financement, le calendrier et le suivi des travaux.', true);

-- AG Ordinaire 2024 (convened) — 5 items
insert into public.agenda_item (id, assembly_id, position, title, description, requires_vote) values
('d0000000-0000-0000-0004-000000000001', 'c0000000-0000-0000-0000-000000000004', 1,
 'Approbation du PV de l''AG Ordinaire 2023', null, true),
('d0000000-0000-0000-0004-000000000002', 'c0000000-0000-0000-0000-000000000004', 2,
 'Approbation du PV de l''AG Extraordinaire Travaux 2024', null, true),
('d0000000-0000-0000-0004-000000000003', 'c0000000-0000-0000-0000-000000000004', 3,
 'Rapport de gestion 2023–2024',
 'Présentation du bilan annuel, état d''avancement des travaux clôture.', false),
('d0000000-0000-0000-0004-000000000004', 'c0000000-0000-0000-0000-000000000004', 4,
 'Approbation des comptes 2023–2024 et fixation des cotisations 2025', null, true),
('d0000000-0000-0000-0004-000000000005', 'c0000000-0000-0000-0000-000000000004', 5,
 'Questions diverses', null, false);

-- AG Ordinaire 2025 (draft) — 3 items
insert into public.agenda_item (id, assembly_id, position, title, description, requires_vote) values
('d0000000-0000-0000-0005-000000000001', 'c0000000-0000-0000-0000-000000000005', 1,
 'Approbation du PV de l''AG Ordinaire 2024', null, true),
('d0000000-0000-0000-0005-000000000002', 'c0000000-0000-0000-0000-000000000005', 2,
 'Rapport de gestion 2024–2025', null, false),
('d0000000-0000-0000-0005-000000000003', 'c0000000-0000-0000-0000-000000000005', 3,
 'Approbation des comptes 2024–2025', null, true);

-- =============================================================================
-- 10. ATTENDANCE (émargement)
--
--  Vote weights at AG 2022:
--    LOT-01=1, LOT-02=1, LOT-03=2 (François, ex-owner), LOT-04=1,
--    LOT-06=1, LOT-08=1 → 7 weighted votes represented at that meeting.
--    LOT-05 had no seated owner in 2022. LOT-07 had no member yet.
--    Quorum threshold (50% of 7) = 3.5 → need 4. Present+represented = 6 → ✓
--
--  Vote weights at AG 2023:
--    8 lots fully seeded; total weight = 9.
--    LOT-03 now owned by Ahmed. François attends on LOT-05.
--    Quorum (50% of 9) = 4.5 → need 5. Present+represented = 7 → ✓
--
--  Vote weights at open AG Extraordinaire 2024:
--    Quorum reduced to 33% (3 weighted votes needed).
--    4 lots recorded so far: LOT-01=1, LOT-02=1, LOT-03=2, LOT-05=1 → 5 → ✓
-- =============================================================================

-- AG 2022 (archived)
insert into public.attendance (id, assembly_id, profile_id, property_id, mode, recorded_at) values
('30000000-0000-0000-0001-000000000001', 'c0000000-0000-0000-0000-000000000001',
 'a0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001',
 'present', '2022-06-15 18:15:00+00'),
('30000000-0000-0000-0001-000000000002', 'c0000000-0000-0000-0000-000000000001',
 'a0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000002',
 'present', '2022-06-15 18:12:00+00'),
-- François Petit was still owner of LOT-03 in June 2022
('30000000-0000-0000-0001-000000000003', 'c0000000-0000-0000-0000-000000000001',
 'a0000000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000003',
 'present', '2022-06-15 18:08:00+00'),
('30000000-0000-0000-0001-000000000004', 'c0000000-0000-0000-0000-000000000001',
 'a0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000004',
 'present', '2022-06-15 18:20:00+00'),
-- Nathalie Simon sent a representative
('30000000-0000-0000-0001-000000000005', 'c0000000-0000-0000-0000-000000000001',
 'a0000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000006',
 'represented', '2022-06-15 18:10:00+00'),
-- Chantal Dubois was absent
('30000000-0000-0000-0001-000000000006', 'c0000000-0000-0000-0000-000000000001',
 'a0000000-0000-0000-0000-000000000010', 'b0000000-0000-0000-0000-000000000008',
 'absent', '2022-06-15 18:30:00+00');

-- AG 2023 (closed)
insert into public.attendance (id, assembly_id, profile_id, property_id, mode, recorded_at) values
('30000000-0000-0000-0002-000000000001', 'c0000000-0000-0000-0000-000000000002',
 'a0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001',
 'present', '2023-06-20 18:45:00+00'),
('30000000-0000-0000-0002-000000000002', 'c0000000-0000-0000-0000-000000000002',
 'a0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000002',
 'present', '2023-06-20 18:42:00+00'),
-- Ahmed Benali is now owner of LOT-03 (transferred June 2023)
('30000000-0000-0000-0002-000000000003', 'c0000000-0000-0000-0000-000000000002',
 'a0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000003',
 'present', '2023-06-20 18:50:00+00'),
-- Isabelle sent a representative
('30000000-0000-0000-0002-000000000004', 'c0000000-0000-0000-0000-000000000002',
 'a0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000004',
 'represented', '2023-06-20 18:40:00+00'),
-- François now attends on his new lot (LOT-05)
('30000000-0000-0000-0002-000000000005', 'c0000000-0000-0000-0000-000000000002',
 'a0000000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000005',
 'present', '2023-06-20 18:48:00+00'),
('30000000-0000-0000-0002-000000000006', 'c0000000-0000-0000-0000-000000000002',
 'a0000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000006',
 'present', '2023-06-20 18:44:00+00'),
-- Chantal absent again
('30000000-0000-0000-0002-000000000007', 'c0000000-0000-0000-0000-000000000002',
 'a0000000-0000-0000-0000-000000000010', 'b0000000-0000-0000-0000-000000000008',
 'absent', '2023-06-20 19:00:00+00');

-- AG Extraordinaire 2024 (open — partial, meeting still in progress)
insert into public.attendance (id, assembly_id, profile_id, property_id, mode, recorded_at) values
('30000000-0000-0000-0003-000000000001', 'c0000000-0000-0000-0000-000000000003',
 'a0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001',
 'present', '2024-03-15 19:15:00+00'),
('30000000-0000-0000-0003-000000000002', 'c0000000-0000-0000-0000-000000000003',
 'a0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000002',
 'present', '2024-03-15 19:12:00+00'),
('30000000-0000-0000-0003-000000000003', 'c0000000-0000-0000-0000-000000000003',
 'a0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000003',
 'present', '2024-03-15 19:10:00+00'),
-- François represented (couldn't attend in person)
('30000000-0000-0000-0003-000000000004', 'c0000000-0000-0000-0000-000000000003',
 'a0000000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000005',
 'represented', '2024-03-15 19:20:00+00');
-- LOT-04, LOT-06, LOT-07 not yet recorded (emargement en cours)

-- =============================================================================
-- 11. INFO POSTS
-- =============================================================================

insert into public.info_post (
  id, title, body, category,
  is_published, published_at,
  author_id, created_at
) values

(gen_random_uuid(),
 'Travaux clôture : AG Extraordinaire convoquée',
 E'**Suite aux dégradations constatées sur la clôture périmétrique**, une AG Extraordinaire a été convoquée le 15 mars 2024 à 19h.\n\nLe devis retenu s''élève à **28 400 € TTC**. La contribution par lot sera calculée proportionnellement aux tantièmes.\n\nLa convocation complète avec le devis détaillé vous a été envoyée par email.',
 'urgent', true, '2024-02-28 10:30:00+00',
 'a0000000-0000-0000-0000-000000000001', '2024-02-28 10:25:00+00'),

(gen_random_uuid(),
 'AG Ordinaire 2024 — Convocation envoyée',
 E'La convocation pour l''**AG Ordinaire 2024** a été envoyée à tous les membres.\n\n**Date :** mercredi 18 juin 2025 à 18h30\n**Lieu :** Salle de réunion Koloti, bâtiment A\n\nL''ordre du jour et les documents afférents sont disponibles dans la section Documents.',
 'event', true, '2025-05-20 10:30:00+00',
 'a0000000-0000-0000-0000-000000000002', '2025-05-20 10:20:00+00'),

(gen_random_uuid(),
 'Rappel : entretien des espaces verts communs',
 E'Conformément au règlement de l''ASL, chaque propriétaire est responsable de l''entretien de la partie des espaces verts attenante à son lot.\n\nUn prestataire commun intervient pour les **haies mitoyennes** et les **allées principales**. Cette prestation est financée par la cotisation annuelle.\n\nPour toute question, contactez le syndic.',
 null, true, '2024-09-10 14:00:00+00',
 'a0000000-0000-0000-0000-000000000002', '2024-09-10 13:45:00+00'),

(gen_random_uuid(),
 'Résultats AG Ordinaire 2023',
 E'L''AG Ordinaire du 20 juin 2023 s''est tenue en mode hybride.\n\n**Résolutions adoptées :**\n- Approbation des comptes 2022–2023 ✓\n- Cotisation 2024 fixée à 450 € par lot ✓\n- Renouvellement du bureau — Bernard Martin réélu président ✓\n\nLe procès-verbal signé est disponible dans l''espace Documents.',
 null, true, '2023-07-01 10:00:00+00',
 'a0000000-0000-0000-0000-000000000001', '2023-07-01 09:45:00+00'),

-- Draft post, not yet published
(gen_random_uuid(),
 'Projet vidéosurveillance entrée principale — consultation en cours',
 E'*Brouillon — ne pas publier avant validation du bureau*\n\nLe bureau étudie l''installation d''un système de vidéosurveillance à l''entrée principale du lotissement.\n\nUn appel d''offres est en cours auprès de trois prestataires. Les résultats seront présentés lors de la prochaine AG.',
 null, false, null,
 'a0000000-0000-0000-0000-000000000001', '2025-05-28 09:00:00+00');

-- =============================================================================
-- 12. DOCUMENTS
--    storage_path values are placeholders — no actual files in Supabase Storage.
--    Visibility: members (all active), editors (editor+admin), admin (admin only).
-- =============================================================================

insert into public.document (
  id, title, type, description, year,
  storage_path, mime_type, size_bytes,
  visibility, uploaded_by, created_at
) values

('40000000-0000-0000-0000-000000000001',
 'Statuts de l''ASL Koloti', 'statuts',
 'Statuts constitutifs de l''Association Syndicale Libre du lotissement Koloti.',
 2018, 'statuts/statuts-asl-koloti-2018.pdf',
 'application/pdf', 245120, 'members',
 'a0000000-0000-0000-0000-000000000001', '2023-01-12 10:00:00+00'),

('40000000-0000-0000-0000-000000000002',
 'PV AG Ordinaire 2022', 'pv_ag',
 'Procès-verbal de l''AG Ordinaire du 15 juin 2022, signé par le président.',
 2022, 'pv/pv-ag-ordinaire-2022.pdf',
 'application/pdf', 189440, 'members',
 'a0000000-0000-0000-0000-000000000001', '2022-07-10 14:00:00+00'),

('40000000-0000-0000-0000-000000000003',
 'PV AG Ordinaire 2023', 'pv_ag',
 'Procès-verbal de l''AG Ordinaire du 20 juin 2023.',
 2023, 'pv/pv-ag-ordinaire-2023.pdf',
 'application/pdf', 201728, 'members',
 'a0000000-0000-0000-0000-000000000001', '2023-07-15 11:30:00+00'),

('40000000-0000-0000-0000-000000000004',
 'Budget prévisionnel 2024–2025', 'budget',
 'Budget prévisionnel voté lors de l''AG Ordinaire 2023.',
 2024, 'budget/budget-previsionnel-2024-2025.pdf',
 'application/pdf', 156672, 'members',
 'a0000000-0000-0000-0000-000000000001', '2023-07-20 09:00:00+00'),

('40000000-0000-0000-0000-000000000005',
 'Devis travaux clôture — Verdier BTP', 'facture',
 'Devis 28 400 € TTC pour la réfection complète de la clôture périmétrique.',
 2024, 'devis/devis-cloture-verdier-2024.pdf',
 'application/pdf', 98304, 'members',
 'a0000000-0000-0000-0000-000000000001', '2024-02-20 15:00:00+00'),

('40000000-0000-0000-0000-000000000006',
 'Cahier des charges entretien espaces verts 2024', 'cahier_charges',
 'CDC pour la prestation entretien des espaces verts communs — exercice 2024.',
 2024, 'cahier-charges/cc-espaces-verts-2024.pdf',
 'application/pdf', 134144, 'editors',
 'a0000000-0000-0000-0000-000000000002', '2024-01-15 10:00:00+00'),

('40000000-0000-0000-0000-000000000007',
 'Convocation AG Ordinaire 2024 (avec pouvoirs)', 'convocation',
 'Convocation officielle incluant formulaire de pouvoir et ordre du jour détaillé.',
 2024, 'convocations/convocation-ag-ordinaire-2024.pdf',
 'application/pdf', 78848, 'admin',
 'a0000000-0000-0000-0000-000000000001', '2025-05-20 11:00:00+00');

-- =============================================================================
-- 13. FEE CALLS & ASSIGNMENTS (Lot 4 — provisioned)
--     Covers all statuses: paid, partial, overdue, due.
--     LOT-03 pays proportionally to its vote_weight (×2).
-- =============================================================================

insert into public.fee_call (
  id, label, amount, due_date, created_by, created_at
) values
('50000000-0000-0000-0000-000000000001',
 'Cotisation annuelle 2024', 450.00, '2024-04-30',
 'a0000000-0000-0000-0000-000000000001', '2024-01-20 09:00:00+00');

insert into public.fee_assignment (
  id, fee_call_id, property_id,
  amount_due, status, paid_at
) values
('50000000-0000-0000-0001-000000000001',
 '50000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
 450.00, 'paid', '2024-03-15'),
('50000000-0000-0000-0001-000000000002',
 '50000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002',
 450.00, 'paid', '2024-02-28'),
-- LOT-03 has vote_weight=2 → double contribution
('50000000-0000-0000-0001-000000000003',
 '50000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003',
 900.00, 'paid', '2024-04-01'),
-- Isabelle paid partially
('50000000-0000-0000-0001-000000000004',
 '50000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000004',
 450.00, 'partial', null),
('50000000-0000-0000-0001-000000000005',
 '50000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000005',
 450.00, 'paid', '2024-03-20'),
-- Nathalie is overdue
('50000000-0000-0000-0001-000000000006',
 '50000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000006',
 450.00, 'overdue', null),
-- Thomas (pending) — not yet paid
('50000000-0000-0000-0001-000000000007',
 '50000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000007',
 450.00, 'due', null),
-- LOT-08 unowned — still due
('50000000-0000-0000-0001-000000000008',
 '50000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000008',
 450.00, 'due', null);

-- =============================================================================
-- 14. ASSEMBLY NOTIFICATIONS
--     Convocation emails for AG Ordinaire 2024.
--     Thomas Laurent: failed (account pending).
-- =============================================================================

insert into public.assembly_notification (
  id, assembly_id, profile_id, email,
  first_name, last_name,
  status, error_msg, sent_at, created_at
) values
(gen_random_uuid(), 'c0000000-0000-0000-0000-000000000004',
 'a0000000-0000-0000-0000-000000000003', 'jplefebvre@example.com',
 'Jean-Pierre', 'Lefebvre',
 'sent', null, '2025-05-20 10:05:00+00', '2025-05-20 10:04:00+00'),
(gen_random_uuid(), 'c0000000-0000-0000-0000-000000000004',
 'a0000000-0000-0000-0000-000000000004', 'smoreau@example.com',
 'Sophie', 'Moreau',
 'sent', null, '2025-05-20 10:05:00+00', '2025-05-20 10:04:00+00'),
(gen_random_uuid(), 'c0000000-0000-0000-0000-000000000004',
 'a0000000-0000-0000-0000-000000000005', 'abenali@example.com',
 'Ahmed', 'Benali',
 'sent', null, '2025-05-20 10:05:00+00', '2025-05-20 10:04:00+00'),
(gen_random_uuid(), 'c0000000-0000-0000-0000-000000000004',
 'a0000000-0000-0000-0000-000000000006', 'iroux@example.com',
 'Isabelle', 'Roux',
 'sent', null, '2025-05-20 10:06:00+00', '2025-05-20 10:04:00+00'),
(gen_random_uuid(), 'c0000000-0000-0000-0000-000000000004',
 'a0000000-0000-0000-0000-000000000007', 'fpetit@example.com',
 'François', 'Petit',
 'sent', null, '2025-05-20 10:06:00+00', '2025-05-20 10:04:00+00'),
(gen_random_uuid(), 'c0000000-0000-0000-0000-000000000004',
 'a0000000-0000-0000-0000-000000000008', 'nsimon@example.com',
 'Nathalie', 'Simon',
 'sent', null, '2025-05-20 10:06:00+00', '2025-05-20 10:04:00+00'),
-- Thomas account not active → delivery failed
(gen_random_uuid(), 'c0000000-0000-0000-0000-000000000004',
 'a0000000-0000-0000-0000-000000000009', 'tlaurent@example.com',
 'Thomas', 'Laurent',
 'failed', 'Account not active', null, '2025-05-20 10:04:00+00');

-- =============================================================================
-- 15. AUDIT LOG (sample entries — append-only, inserted as service_role)
-- =============================================================================

insert into public.audit_log (
  id, actor_id, action, entity, entity_id, payload, created_at
) values

(gen_random_uuid(),
 'a0000000-0000-0000-0000-000000000001',
 'account.create', 'profile', 'a0000000-0000-0000-0000-000000000003',
 '{"login":"jplef01","email":"jplefebvre@example.com","role":"member"}'::jsonb,
 '2023-02-01 14:00:00+00'),

(gen_random_uuid(),
 'a0000000-0000-0000-0000-000000000001',
 'account.create', 'profile', 'a0000000-0000-0000-0000-000000000009',
 '{"login":"tlau07","email":"tlaurent@example.com","role":"member"}'::jsonb,
 '2025-05-01 09:00:00+00'),

(gen_random_uuid(),
 'a0000000-0000-0000-0000-000000000001',
 'activation.issue', 'activation_link', 'f0000000-0000-0000-0000-000000000001',
 '{"profile_id":"a0000000-0000-0000-0000-000000000009","kind":"standard","email":"tlaurent@example.com"}'::jsonb,
 now() - interval '30 minutes'),

(gen_random_uuid(),
 'a0000000-0000-0000-0000-000000000001',
 'property.create', 'property', 'b0000000-0000-0000-0000-000000000001',
 '{"reference":"LOT-01","street_number":"1","street_name":"allée des Chênes"}'::jsonb,
 '2023-01-10 09:30:00+00'),

(gen_random_uuid(),
 'a0000000-0000-0000-0000-000000000001',
 'ownership.transfer', 'ownership', '10000000-0000-0000-0000-000000000004',
 '{"property":"LOT-03","from_login":"fpeti05","to_login":"abena03","date":"2023-06-01"}'::jsonb,
 '2023-06-01 09:00:00+00'),

(gen_random_uuid(),
 'a0000000-0000-0000-0000-000000000001',
 'assembly.convene', 'assembly', 'c0000000-0000-0000-0000-000000000004',
 '{"title":"AG Ordinaire 2024","scheduled_at":"2025-06-18T18:30:00Z","members_notified":6,"failed":1}'::jsonb,
 '2025-05-20 10:00:00+00'),

(gen_random_uuid(),
 'a0000000-0000-0000-0000-000000000001',
 'assembly.open', 'assembly', 'c0000000-0000-0000-0000-000000000003',
 '{"title":"AG Extraordinaire — Travaux clôture 2024"}'::jsonb,
 '2024-03-15 19:10:00+00'),

(gen_random_uuid(),
 'a0000000-0000-0000-0000-000000000001',
 'profile.deactivate', 'profile', 'a0000000-0000-0000-0000-000000000010',
 '{"login":"cdubo08","reason":"property sold"}'::jsonb,
 '2024-02-01 08:00:00+00');
