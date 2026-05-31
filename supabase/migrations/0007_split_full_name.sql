-- supabase/migrations/0007_split_full_name.sql
ALTER TABLE public.profile
  ADD COLUMN first_name text,
  ADD COLUMN last_name  text;

UPDATE public.profile
SET
  first_name = CASE
    WHEN position(' ' IN full_name) > 0 THEN split_part(full_name, ' ', 1)
    ELSE ''
  END,
  last_name = CASE
    WHEN position(' ' IN full_name) > 0 THEN trim(substring(full_name FROM position(' ' IN full_name) + 1))
    ELSE full_name
  END;

ALTER TABLE public.profile
  ALTER COLUMN first_name SET NOT NULL,
  ALTER COLUMN last_name  SET NOT NULL;

ALTER TABLE public.profile DROP COLUMN full_name;
