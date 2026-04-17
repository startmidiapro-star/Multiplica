-- MULTIPLICA — RLS: Políticas de DELETE para campaigns e orders
-- Execute este arquivo no SQL Editor do Supabase Dashboard.
--
-- Problema resolvido:
--   O Supabase retorna { error: null, count: 0 } quando o DELETE é bloqueado
--   por RLS — sem este arquivo, a exclusão de campanha falha silenciosamente.
--
-- O que este arquivo faz:
--   1. DELETE em campaigns  — organizador autenticado pode excluir a própria campanha
--   2. DELETE em orders     — organizador autenticado pode excluir pedidos das suas campanhas
--   3. DELETE em campaign_options já existe (campaign_options.sql) — incluído aqui para referência
--
-- Pré-requisito: rls_auth.sql já executado (garante user_id em campaigns).
-- ─────────────────────────────────────────────────────────────────────────────


-- =============================================================================
-- 1. CAMPAIGNS — DELETE restrito ao dono da campanha
-- =============================================================================

DROP POLICY IF EXISTS "Organizador exclui própria campanha" ON campaigns;
CREATE POLICY "Organizador exclui própria campanha"
ON campaigns FOR DELETE
TO authenticated
USING (user_id = auth.uid());


-- =============================================================================
-- 2. ORDERS — DELETE restrito ao organizador dono da campanha vinculada
--
-- Motivo: ao excluir uma campanha, todos os pedidos associados devem ser
-- removidos (dados pessoais do comprador — conformidade LGPD).
-- A condição dupla (user_id OU manager_token) mantém compatibilidade com
-- campanhas criadas antes da P8 (sem user_id).
-- =============================================================================

DROP POLICY IF EXISTS "Organizador exclui pedidos da campanha" ON orders;
CREATE POLICY "Organizador exclui pedidos da campanha"
ON orders FOR DELETE
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


-- =============================================================================
-- 3. CAMPAIGN_OPTIONS — DELETE (já existe em campaign_options.sql)
--    Incluído aqui apenas para referência e idempotência.
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
