-- MULTIPLICA — orders: adiciona coluna selected_option
-- Execute este arquivo no SQL Editor do Supabase Dashboard.
--
-- O que este arquivo faz:
--   1. Adiciona selected_option TEXT à tabela orders
--      Armazena a variação escolhida pelo comprador (ex: "Carne", "Queijo")
--      Nullable — pedidos de campanhas sem opções ficam com NULL
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS selected_option TEXT;
