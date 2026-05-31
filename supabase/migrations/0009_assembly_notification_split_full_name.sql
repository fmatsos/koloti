-- =============================================================================
-- Migration 0009 : Split full_name into first_name and last_name in assembly_notification
-- =============================================================================

ALTER TABLE public.assembly_notification
  ADD COLUMN first_name text,
  ADD COLUMN last_name text;

UPDATE public.assembly_notification
SET
  first_name = CASE
    WHEN position(' ' IN full_name) > 0 THEN split_part(full_name, ' ', 1)
    ELSE ''
  END,
  last_name = CASE
    WHEN position(' ' IN full_name) > 0 THEN trim(substring(full_name FROM position(' ' IN full_name) + 1))
    ELSE full_name
  END;

ALTER TABLE public.assembly_notification
  ALTER COLUMN first_name SET NOT NULL,
  ALTER COLUMN last_name SET NOT NULL;

ALTER TABLE public.assembly_notification DROP COLUMN full_name;
