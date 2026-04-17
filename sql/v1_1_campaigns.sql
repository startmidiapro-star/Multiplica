-- MULTIPLICA — V1.1: Migração campaigns
-- Execute este arquivo no SQL Editor do Supabase Dashboard.
--
-- O que este arquivo faz:
--   1. Adiciona coluna description  — objetivo/motivação da campanha (opcional)
--   2. Adiciona coluna recipient_name — nome do titular da chave Pix (obrigatório no form)
--   3. Adiciona coluna type          — 'single' (preço único) ou 'multiple' (variantes)
--
-- Notas de compatibilidade:
--   - Todas as colunas usam IF NOT EXISTS — seguro re-executar sem erro
--   - item_description é mantido e continua sendo o campo "Produto/Item" do formulário
--   - Campanhas V1.0 (sem type) continuam funcionando — DEFAULT 'single' cobre o fallback
--   - Nenhuma coluna existente é alterada ou removida
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS description    TEXT;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS recipient_name TEXT;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS type           TEXT DEFAULT 'single';
