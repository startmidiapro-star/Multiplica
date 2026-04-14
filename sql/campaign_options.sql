-- MULTIPLICA — campaign_options: Opções/variações de uma campanha
-- Execute este arquivo no SQL Editor do Supabase Dashboard.
--
-- O que este arquivo faz:
--   1. Cria a tabela campaign_options (id, campaign_id, label, sort_order)
--   2. Habilita RLS
--   3. Policy anon + authenticated: SELECT livre (comprador precisa ver as opções)
--   4. Policy authenticated: INSERT restrito ao dono da campanha
--   5. Policy authenticated: DELETE restrito ao dono da campanha
-- ─────────────────────────────────────────────────────────────────────────────


-- =============================================================================
-- 1. TABELA
-- =============================================================================

CREATE TABLE IF NOT EXISTS campaign_options (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID        NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  label       TEXT        NOT NULL,
  sort_order  INTEGER     NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índice para acelerar busca por campanha
CREATE INDEX IF NOT EXISTS idx_campaign_options_campaign_id
  ON campaign_options(campaign_id);

ALTER TABLE campaign_options ENABLE ROW LEVEL SECURITY;


-- =============================================================================
-- 2. RLS — SELECT (compradores anon e organizadores autenticados)
-- =============================================================================

DROP POLICY IF EXISTS "Lê opções da campanha" ON campaign_options;
CREATE POLICY "Lê opções da campanha"
ON campaign_options FOR SELECT
TO anon, authenticated
USING (true);


-- =============================================================================
-- 3. RLS — INSERT (organizador autenticado, dono da campanha)
-- =============================================================================

DROP POLICY IF EXISTS "Organizador insere opções" ON campaign_options;
CREATE POLICY "Organizador insere opções"
ON campaign_options FOR INSERT
TO authenticated
WITH CHECK (
  campaign_id IN (
    SELECT id FROM campaigns
    WHERE user_id = auth.uid()
  )
);


-- =============================================================================
-- 4. RLS — DELETE (organizador autenticado, dono da campanha)
-- =============================================================================

DROP POLICY IF EXISTS "Organizador remove opções" ON campaign_options;
CREATE POLICY "Organizador remove opções"
ON campaign_options FOR DELETE
TO authenticated
USING (
  campaign_id IN (
    SELECT id FROM campaigns
    WHERE user_id = auth.uid()
  )
);
