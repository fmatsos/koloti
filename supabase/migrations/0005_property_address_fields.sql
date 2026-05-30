-- Adresse structuree et reference cadastrale sur la table property
ALTER TABLE public.property
  ADD COLUMN IF NOT EXISTS street_number TEXT,
  ADD COLUMN IF NOT EXISTS street_name TEXT,
  ADD COLUMN IF NOT EXISTS cadastre_number TEXT,
  DROP COLUMN IF EXISTS address;
