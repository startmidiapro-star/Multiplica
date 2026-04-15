-- MULTIPLICA — campaigns: adiciona coluna has_variants
-- Execute este arquivo no SQL Editor do Supabase Dashboard.
--
-- O que este arquivo faz:
--   Adiciona has_variants BOOLEAN DEFAULT false à tabela campaigns.
--   true  = campanha tem sabores/variantes com seleção individual por item
--   false = campanha tem quantidade única (comportamento original)
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS has_variants BOOLEAN DEFAULT false;
