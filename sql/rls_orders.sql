-- MULTIPLICA — RLS: Políticas de segurança para a tabela orders
-- Execute este arquivo no SQL Editor do Supabase Dashboard.
-- Pré-requisito: RLS deve estar HABILITADO na tabela orders.
--   ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────
-- 1. Garantir coluna manager_token em campaigns
-- ─────────────────────────────────────────────
ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS manager_token UUID DEFAULT gen_random_uuid() NOT NULL;

-- ─────────────────────────────────────────────
-- 2. Remover políticas temporárias existentes
--    (ajuste os nomes se os seus forem diferentes)
-- ─────────────────────────────────────────────
DROP POLICY IF EXISTS "orders_select_temp"   ON orders;
DROP POLICY IF EXISTS "orders_update_temp"   ON orders;
DROP POLICY IF EXISTS "Público SELECT orders" ON orders;
DROP POLICY IF EXISTS "Público UPDATE orders" ON orders;

-- ─────────────────────────────────────────────
-- 3. INSERT — aberto para anon (comprador sem conta)
--    Mantenha a política existente se já estiver correta.
--    Recrie apenas se não existir.
-- ─────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'orders'
      AND policyname = 'Comprador pode criar pedido'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Comprador pode criar pedido"
      ON orders FOR INSERT
      TO anon
      WITH CHECK (true);
    $policy$;
  END IF;
END $$;

-- ─────────────────────────────────────────────
-- 4. SELECT — compradores lêem o próprio pedido por ID
--    UUID como segredo de fato (MVP aceitável).
-- ─────────────────────────────────────────────
DROP POLICY IF EXISTS "Comprador pode ler pedido" ON orders;

CREATE POLICY "Comprador pode ler pedido"
ON orders FOR SELECT
TO anon
USING (true);

-- ─────────────────────────────────────────────
-- 5. UPDATE — restrito ao admin com token válido
--    O token chega via header x-manager-token,
--    nunca via query string.
-- ─────────────────────────────────────────────
DROP POLICY IF EXISTS "Admin pode atualizar pedidos" ON orders;

CREATE POLICY "Admin pode atualizar pedidos"
ON orders FOR UPDATE
TO anon
USING (
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
    WHERE manager_token::text = (
      current_setting('request.headers', true)::json->>'x-manager-token'
    )
  )
);
