-- Marchés cibles : liste des pays depuis lesquels les clients peuvent commander.
-- Par défaut, tous les 6 pays couverts par Bictorys sont activés.
ALTER TABLE shops
  ADD COLUMN IF NOT EXISTS target_countries JSONB
  DEFAULT '["SN","CI","BJ","TG","ML","BF"]'::jsonb;
