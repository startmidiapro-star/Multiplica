-- MULTIPLICA — RLS: Políticas de segurança para a tabela campaigns
-- Execute este arquivo no SQL Editor do Supabase Dashboard.
-- Pré-requisito: RLS deve estar HABILITADO na tabela campaigns.

-- ─────────────────────────────────────────────
-- 1. Adiciona coluna item_name se não existir
-- ─────────────────────────────────────────────
ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS item_name TEXT;

-- ─────────────────────────────────────────────
-- 2. Habilita RLS na tabela campaigns
-- ─────────────────────────────────────────────
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────
-- 3. Remove políticas anteriores se existirem
-- ─────────────────────────────────────────────
DROP POLICY IF EXISTS "Qualquer um pode criar campanha"    ON campaigns;
DROP POLICY IF EXISTS "Criador pode ler própria campanha"  ON campaigns;

-- ─────────────────────────────────────────────
-- 4. INSERT — qualquer visitante pode criar uma campanha (MVP sem autenticação)
-- ─────────────────────────────────────────────
CREATE POLICY "Qualquer um pode criar campanha"
ON campaigns FOR INSERT
TO anon
WITH CHECK (true);

-- ─────────────────────────────────────────────
-- 5. SELECT — apenas a campanha recém-criada
--
--    O frontend gera o id da campanha antes do INSERT e o
--    armazena em sessionStorage como 'multiplica_campaign_id_temp'.
--    O custom fetch em supabase.js lê esse valor e injeta o header
--    'x-campaign-id' em cada request enquanto o valor existir.
--    Assim o SELECT pós-INSERT retorna somente a linha criada,
--    incluindo o manager_token gerado pelo banco.
--
--    Nenhuma outra campanha é acessível via esta policy.
-- ─────────────────────────────────────────────
CREATE POLICY "Criador pode ler própria campanha"
ON campaigns FOR SELECT
TO anon
USING (
  id::text = (
    current_setting('request.headers', true)::json->>'x-campaign-id'
  )
);
