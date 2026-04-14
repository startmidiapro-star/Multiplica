-- MULTIPLICA — campaigns: adiciona coluna item_description
-- Execute este arquivo no SQL Editor do Supabase Dashboard.
--
-- O que este arquivo faz:
--   Separa o nome da campanha (arrecadação/objetivo) do produto vendido.
--   Ex: name = "Bancos da Igreja", item_description = "Pastéis de Feira"
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS item_description TEXT;
