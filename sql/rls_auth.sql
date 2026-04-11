-- MULTIPLICA — RLS: Políticas de autenticação para P8
-- Execute este arquivo no SQL Editor do Supabase Dashboard.
--
-- O que este arquivo faz:
--   1. Adiciona coluna user_id em campaigns (vincula campanha ao organizador)
--   2. Adiciona policies de SELECT e UPDATE para organizadores autenticados
--      em campaigns — cobrindo campanhas novas (user_id) e antigas (manager_token)
--   3. Adiciona policies de SELECT e UPDATE para organizadores autenticados
--      em orders — necessário porque quando logado o role vira `authenticated`
--      e as policies existentes (TO anon) deixam de se aplicar
--
-- Políticas anon existentes são mantidas intactas:
--   - campaigns INSERT aberto para anon  (criação sem conta)
--   - campaigns SELECT via x-campaign-id (fluxo de criação)
--   - orders INSERT aberto para anon     (comprador sem conta)
--   - orders SELECT via x-order-id / x-manager-token (comprador e admin por link)
--   - orders UPDATE via x-manager-token  (admin por link)
--
-- Campanhas criadas antes da P8 (sem user_id) continuam acessíveis
-- via Link Mágico (#auth=token) — as policies de fallback garantem isso.
-- ─────────────────────────────────────────────────────────────────────────────


-- =============================================================================
-- 0. REMOVE POLICIES ABERTAS DEMAIS (criadas manualmente no Supabase)
-- =============================================================================

-- campaigns: qualquer usuário podia ler qualquer campanha
DROP POLICY IF EXISTS "Enable read access for all users" ON campaigns;

-- orders: qualquer usuário podia atualizar qualquer pedido
DROP POLICY IF EXISTS "Allow update orders"      ON orders;
DROP POLICY IF EXISTS "manager_update_orders"    ON orders;


-- =============================================================================
-- 1. CAMPAIGNS — policy anon para comprador ler campanha pelo slug
-- =============================================================================
--
-- Esta policy substitui "Enable read access for all users" (removida acima).
-- Concede acesso à LINHA, não à coluna manager_token.
--
-- Por que não usar REVOKE SELECT (manager_token) FROM anon:
--   REVOKE quebraria o fluxo de criação de campanha — criarCampanha() faz um
--   SELECT como anon para recuperar o manager_token gerado pelo banco.
--   A proteção da coluna é feita no frontend: getCampaignBySlug em
--   campaignService.js usa colunas explícitas (sem manager_token).
--
DROP POLICY IF EXISTS "Comprador lê campanha pelo slug" ON campaigns;
CREATE POLICY "Comprador lê campanha pelo slug"
ON campaigns FOR SELECT
TO anon
USING (true);


-- =============================================================================
-- 2. CAMPAIGNS — adiciona coluna user_id
-- =============================================================================

ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Índice para acelerar o JOIN em orders (queries do dashboard)
CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON campaigns(user_id);


-- =============================================================================
-- 3. CAMPAIGNS — policies para organizador autenticado
-- =============================================================================

-- SELECT: lê campanhas próprias (user_id) OU campanhas antigas (manager_token)
DROP POLICY IF EXISTS "Organizador autenticado lê campanhas" ON campaigns;
CREATE POLICY "Organizador autenticado lê campanhas"
ON campaigns FOR SELECT
TO authenticated
USING (
  -- Campanhas criadas após P8: vinculadas ao user_id
  user_id = auth.uid()
  OR
  -- Campanhas criadas antes da P8: acessíveis pelo manager_token (Link Mágico)
  manager_token::text = (
    current_setting('request.headers', true)::json->>'x-manager-token'
  )
);

-- UPDATE: atualiza campanhas próprias OU campanhas antigas (retrocompat.)
DROP POLICY IF EXISTS "Organizador autenticado atualiza campanhas" ON campaigns;
CREATE POLICY "Organizador autenticado atualiza campanhas"
ON campaigns FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid()
  OR
  manager_token::text = (
    current_setting('request.headers', true)::json->>'x-manager-token'
  )
);


-- =============================================================================
-- 4. ORDERS — policies para organizador autenticado
--
-- Motivo: políticas existentes são TO anon. Quando o organizador está logado,
-- o role vira `authenticated` e as políticas anon não se aplicam.
-- Isso impede a contagem de pedidos no dashboard e o uso do painel admin.
--
-- A condição dupla (user_id OU manager_token) garante compatibilidade com
-- campanhas criadas antes da P8 (que não têm user_id na campaign).
-- =============================================================================

-- SELECT: vê pedidos das suas campanhas (por user_id OU por manager_token)
DROP POLICY IF EXISTS "Organizador autenticado lê pedidos" ON orders;
CREATE POLICY "Organizador autenticado lê pedidos"
ON orders FOR SELECT
TO authenticated
USING (
  campaign_id IN (
    SELECT id FROM campaigns
    WHERE user_id = auth.uid()
  )
  OR
  campaign_id IN (
    SELECT id FROM campaigns
    WHERE manager_token::text = (
      current_setting('request.headers', true)::json->>'x-manager-token'
    )
  )
);

-- UPDATE: aprova/rejeita pedidos das suas campanhas
DROP POLICY IF EXISTS "Organizador autenticado atualiza pedidos" ON orders;
CREATE POLICY "Organizador autenticado atualiza pedidos"
ON orders FOR UPDATE
TO authenticated
USING (
  campaign_id IN (
    SELECT id FROM campaigns
    WHERE user_id = auth.uid()
  )
  OR
  campaign_id IN (
    SELECT id FROM campaigns
    WHERE manager_token::text = (
      current_setting('request.headers', true)::json->>'x-manager-token'
    )
  )
)
WITH CHECK (
  campaign_id IN (
    SELECT id FROM campaigns
    WHERE user_id = auth.uid()
  )
  OR
  campaign_id IN (
    SELECT id FROM campaigns
    WHERE manager_token::text = (
      current_setting('request.headers', true)::json->>'x-manager-token'
    )
  )
);
