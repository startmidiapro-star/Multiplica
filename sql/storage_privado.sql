-- MULTIPLICA — Storage: tornar bucket comprovantes privado
-- Execute no SQL Editor do Supabase Dashboard.
-- Após executar, o bucket só aceita URLs assinadas — nunca URLs públicas.

-- ─────────────────────────────────────────────
-- 1. Tornar o bucket privado
-- ─────────────────────────────────────────────
UPDATE storage.buckets
SET public = false
WHERE name = 'comprovantes';

-- ─────────────────────────────────────────────
-- 2. Remover políticas de storage existentes (se houver)
-- ─────────────────────────────────────────────
DROP POLICY IF EXISTS "Leitura pública comprovantes"  ON storage.objects;
DROP POLICY IF EXISTS "Upload público comprovantes"    ON storage.objects;
DROP POLICY IF EXISTS "Comprador faz upload"           ON storage.objects;
DROP POLICY IF EXISTS "Admin lê comprovantes"          ON storage.objects;

-- ─────────────────────────────────────────────
-- 3. INSERT — comprador pode fazer upload
--    Qualquer anon pode subir arquivo para o bucket
--    (o orderId no nome do arquivo já vincula ao pedido)
-- ─────────────────────────────────────────────
CREATE POLICY "Comprador faz upload"
ON storage.objects FOR INSERT
TO anon
WITH CHECK (bucket_id = 'comprovantes');

-- ─────────────────────────────────────────────
-- 4. SELECT — apenas admin com token válido pode ler
--    Necessário para gerar URLs assinadas (createSignedUrl)
--    Token validado via header x-manager-token
-- ─────────────────────────────────────────────
CREATE POLICY "Admin lê comprovantes"
ON storage.objects FOR SELECT
TO anon
USING (
  bucket_id = 'comprovantes'
  AND (
    current_setting('request.headers', true)::json->>'x-manager-token'
  ) IN (
    SELECT manager_token::text FROM campaigns
  )
);
