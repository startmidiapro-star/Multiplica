-- MULTIPLICA — campaign_options: adiciona coluna price
-- Execute este arquivo no SQL Editor do Supabase Dashboard.
--
-- O que este arquivo faz:
--   Adiciona price NUMERIC(10,2) à tabela campaign_options.
--   Nullable — NULL significa "usar o preço padrão da campanha (campaigns.price)".
--   Um preço definido sobrepõe o valor padrão para aquela variação específica.
--   Ex: Campanha price = R$ 10,00 / Opção "Especial" price = R$ 15,00
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE campaign_options
  ADD COLUMN IF NOT EXISTS price NUMERIC(10, 2);
