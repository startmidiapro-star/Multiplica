-- MULTIPLICA — orders: adiciona coluna items_detail
-- Execute este arquivo no SQL Editor do Supabase Dashboard.
--
-- O que este arquivo faz:
--   Adiciona items_detail JSONB à tabela orders.
--   Armazena o detalhamento por variante quando campaign.has_variants = true.
--   Formato: [{name: string, price: number, qty: number}]
--   Nullable — pedidos de campanhas sem variantes ficam com NULL.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS items_detail JSONB;
