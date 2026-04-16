# CLAUDE.md — MULTIPLICA

> Este arquivo é lido automaticamente pelo Claude Code ao iniciar toda sessão.
> Leia-o integralmente antes de qualquer ação.

---

## 🚀 Início de Sessão — Faça isso primeiro

Antes de responder qualquer pergunta ou escrever qualquer código, leia os arquivos abaixo **nesta ordem**:

```
1. src/lib/supabase.js
2. src/services/authService.js
3. src/services/campaignService.js
4. src/services/adminService.js
5. src/services/dashboardService.js
6. src/hooks/useOrder.js
7. src/pages/Home.jsx
8. src/pages/Login.jsx
9. src/pages/Cadastro.jsx
10. src/pages/Dashboard.jsx
11. src/pages/CreateCampaign.jsx
12. src/pages/OrderPage.jsx
13. src/pages/AdminPage.jsx
```

Após a leitura, confirme com:

> _"Li os arquivos. Entendi o estado atual do projeto. Pronto para trabalhar."_

Depois responda as três perguntas de alinhamento:

1. Qual é o maior risco de segurança no projeto agora?
2. Qual é a primeira coisa que vamos resolver?
3. O que você **não** vai tocar nesta sessão?

Só prossiga após confirmar as três respostas.

---

## 🎯 Contexto do Projeto

O **MULTIPLICA** é uma plataforma de gestão de pedidos coletivos em comunidades brasileiras.
Resolve o caos de arrecadações feitas via WhatsApp (pastéis, rifas, doações, vaquinhas).

| Perfil                       | Acesso                                | O que precisa                                  |
| ---------------------------- | ------------------------------------- | ---------------------------------------------- |
| **Organizador** — Dona Neide | Login email + senha → Dashboard       | Criar campanhas, validar pedidos, ver produção |
| **Comprador** — Seu João     | Zero-Auth via link público `/c/:slug` | Fazer pedido, escolher sabores, pagar via Pix  |

**Versão atual: V1.0 — funcionalmente completa. Próxima etapa: testes com usuários reais + deploy.**

---

## 🛠️ Stack Tecnológica

| Camada         | Tecnologia                      | Observação                             |
| -------------- | ------------------------------- | -------------------------------------- |
| Frontend       | **React + Vite + Tailwind CSS** | Mobile-first                           |
| Banco de Dados | **Supabase (PostgreSQL)**       | RLS ativo em todas as tabelas          |
| Autenticação   | **Supabase Auth**               | Email + senha para organizador         |
| Storage        | **Supabase Storage**            | Bucket `comprovantes` — privado        |
| Fonte          | **Quicksand**                   | Google Fonts — cor principal `#5a8fdb` |
| Hospedagem     | **Vercel**                      | Deploy pendente                        |

---

## ✅ Prioridades Concluídas

### P1 — Admin fechado

- RLS em `orders` restrito por `manager_token` via header `x-manager-token`
- Token via fragmento `#auth=UUID` — nunca em query string
- Token salvo em `sessionStorage` antes de limpar hash

### P2 — Storage privado

- Bucket `comprovantes` privado
- `proof_url` salva path relativo no banco
- URLs assinadas com expiração de 1 hora

### P3 — Token no fragmento de URL

- Link Mágico usa `/admin/:slug#auth=UUID`
- Hash limpo após captura via `history.replaceState`

### P4 — UX do comprador

- Botão "Enviando..." durante upload
- Tela de confirmação pós-upload com resumo
- Link WhatsApp pós-upload
- Polling de 5s para atualização de status
- Feedback de erro some após 3s

### P5 — Validação de comprovante no admin

- Aprovação bloqueada sem comprovante
- Confirmação antes de aprovar e rejeitar
- Data nula exibe "Entrega: não definida"

### P6 — Dashboard de criação de campanha

- Rota `/nova-campanha` → `CreateCampaign.jsx`
- `slug` gerado automaticamente com sufixo aleatório
- `manager_token` gerado pelo banco via `gen_random_uuid()`

### P7 — Home + Contador + Compartilhar

- Home redesenhada: Quicksand, `#5a8fdb`, árvore SVG ao fundo
- Headline: "Gerencie vendas e arrecadações da sua comunidade com simplicidade."
- Botões: "Começar Minha Campanha Grátis" → `/cadastro` | "Acessar Minha Campanha" → `/login`
- Contador operacional no admin (total, aprovados, pendentes, rejeitados, itens, valores)
- Botão "Compartilhar no WhatsApp" com mensagem pré-preenchida
- `window.supabase` global removido

### P8 — Autenticação do Organizador

- Supabase Auth — email + senha
- `Cadastro.jsx`, `Login.jsx`, `Dashboard.jsx` criados e funcionando
- `RotaProtegida.jsx` — guarda de rota
- `authService.js`, `dashboardService.js` implementados
- Campanhas vinculadas ao `user_id = auth.uid()`
- RLS blindado para `authenticated`
- `getCampaignBySlug` usa colunas explícitas — `manager_token` nunca exposto ao comprador

### P9 — Variantes e Carrinho

- Checkbox "Produto com sabores/variantes" no `CreateCampaign.jsx`
- Campo `has_variants` (BOOLEAN) e `variants` (JSONB) em `campaigns`
- Tabela `campaign_options` com `label`, `price`, `sort_order`
- Campo `items_detail` (JSONB) em `orders`
- Comprador vê lista de sabores com botões +/- por item
- Total calculado dinamicamente: `soma(price × qty)`
- Admin exibe composição: "2× Carne (R$ 10,00), 1× Queijo (R$ 12,00)"
- Contador de produção por variação no admin
- Policy `orders_insert_authenticated` adicionada

---

## 🗄️ Estrutura do Banco de Dados

### Tabela `campaigns`

| Coluna             | Tipo      | Observação                                    |
| ------------------ | --------- | --------------------------------------------- |
| `id`               | UUID      | PK                                            |
| `user_id`          | UUID      | FK → auth.users                               |
| `name`             | TEXT      | Nome da campanha (a causa)                    |
| `item_description` | TEXT      | O que está sendo vendido                      |
| `price`            | NUMERIC   | Preço padrão (fallback)                       |
| `pix_key`          | TEXT      | Chave Pix do organizador                      |
| `slug`             | TEXT      | URL amigável com sufixo aleatório             |
| `manager_token`    | UUID      | Acesso via Link Mágico (retrocompatibilidade) |
| `delivery_at`      | TIMESTAMP | Data de entrega (opcional)                    |
| `contact_whatsapp` | TEXT      | Contato do organizador                        |
| `has_variants`     | BOOLEAN   | Se true, usa sistema de variantes             |
| `variants`         | JSONB     | Array `[{name, price}]`                       |
| `plan_type`        | TEXT      | 'free' por padrão                             |
| `is_premium`       | BOOLEAN   | false por padrão                              |

### Tabela `campaign_options`

| Coluna        | Tipo    | Observação                                                |
| ------------- | ------- | --------------------------------------------------------- |
| `id`          | UUID    | PK                                                        |
| `campaign_id` | UUID    | FK → campaigns                                            |
| `label`       | TEXT    | Nome da opção                                             |
| `price`       | NUMERIC | Preço da opção (nullable — fallback para campaigns.price) |
| `sort_order`  | INTEGER | Ordem de exibição                                         |

### Tabela `orders`

| Coluna            | Tipo    | Observação                                      |
| ----------------- | ------- | ----------------------------------------------- |
| `id`              | UUID    | PK                                              |
| `campaign_id`     | UUID    | FK → campaigns                                  |
| `customer_name`   | TEXT    | **Imutável após criação**                       |
| `whatsapp`        | TEXT    | **Imutável após criação**                       |
| `quantity`        | INTEGER | Total de unidades — **imutável**                |
| `total_price`     | NUMERIC | **Imutável após criação**                       |
| `selected_option` | TEXT    | Opção única (campanha sem variantes)            |
| `items_detail`    | JSONB   | `[{name, price, qty}]` (campanha com variantes) |
| `status`          | TEXT    | pending_payment / approved / rejected           |
| `proof_url`       | TEXT    | Path relativo do comprovante                    |

---

## 🔒 Estado Atual de Segurança

| Item                                      | Estado                                     |
| ----------------------------------------- | ------------------------------------------ |
| RLS em `orders` — INSERT anon             | ✅ Aberto para comprador                   |
| RLS em `orders` — INSERT authenticated    | ✅ Policy adicionada na P9                 |
| RLS em `orders` — SELECT/UPDATE           | ✅ Restrito por token/order-id/user_id     |
| RLS em `campaigns` — INSERT               | ✅ Apenas authenticated                    |
| RLS em `campaigns` — SELECT anon          | ✅ Policy por slug sem expor manager_token |
| RLS em `campaigns` — SELECT authenticated | ✅ Filtra por user_id via RLS              |
| RLS em `campaign_options` — SELECT        | ✅ Aberto para anon e authenticated        |
| RLS em `campaign_options` — INSERT/DELETE | ✅ Apenas organizador dono                 |
| Bucket `comprovantes`                     | ✅ Privado com URLs assinadas 1h           |
| Token admin na URL                        | ✅ Fragmento `#auth=UUID`                  |
| `window.supabase` global                  | ✅ Removido                                |
| `manager_token` exposto ao comprador      | ✅ Resolvido — colunas explícitas          |

---

## 📋 Commits Relevantes

| Hash      | O que contém                                                 |
| --------- | ------------------------------------------------------------ |
| `7e331ff` | Estado inicial antes das implementações de segurança         |
| `a89280f` | P1 e P3 — token, RLS, hash                                   |
| `017e8c3` | P2 — storage privado                                         |
| `1617a88` | P6 — dashboard de criação de campanha                        |
| `e0c7704` | P7.3 e P7.4 — compartilhar WhatsApp e remove window.supabase |
| `7580cc3` | P7.1 — fonte Quicksand e identidade visual                   |
| `823a5ce` | P8 — dashboard filtra por user_id via RLS                    |
| `24b1f86` | P8 — botão Acessar redireciona para /login                   |
| `ade8507` | P9 — exibe opção nos pedidos e breakdown no contador         |
| `e15fb68` | P9 — fix INSERT authenticated em orders                      |
| `f547ee7` | P9 — checkbox variantes no CreateCampaign                    |
| `fb61854` | P9 — modo variantes com +/- por sabor na OrderPage           |
| `1c74c4b` | P9 — exibe items_detail formatado no admin                   |

---

## 🏛️ Decisões de Arquitetura — Não Questione

| Decisão                              | Motivo                                                 |
| ------------------------------------ | ------------------------------------------------------ |
| **Login/senha** para organizador     | Público recorrente — precisa de dashboard seguro       |
| **Zero-Auth** para comprador         | Público eventual — sem atrito, sem cadastro            |
| **Link Mágico** mantido como atalho  | Retrocompatibilidade                                   |
| **Polling de 5s** em vez de Realtime | Aceitável para MVP                                     |
| **localStorage** para comprador      | Escolha de UX consciente                               |
| **Pedidos imutáveis** após criação   | `quantity`, `total_price`, `customer_name` nunca mudam |
| **Supabase Auth nativo**             | Sem construir autenticação do zero                     |
| **Fallback de preço**                | Se opção sem preço → usa `price` da campanha           |

---

## 🗺️ Roadmap V2.0 — Pós-MVP

### Fase 1 — Pix Automático

Integração via Webhook com PSP (Efí, Mercado Pago ou OpenPix).
Pedido confirmado em < 2 segundos. Fim da conferência manual de comprovantes.

### Fase 2 — Modo Cozinha (KDS)

Nova interface `KitchenView.jsx` com agregação de `items_detail`.
Visão consolidada: "Fritar 15× Carne | 10× Queijo".
Base técnica já existe com `items_detail`.

### Fase 3 — Logística de Entrega

Botão "Marcar como entregue" no admin.
QR Code único por pedido como evolução futura (V3).

---

## 🚀 Próximos Passos Imediatos

| Ordem | O que fazer                                                                        |
| ----- | ---------------------------------------------------------------------------------- |
| 1     | Teste com usuário real — Dona Neide cria campanha, compradores reais fazem pedidos |
| 2     | Deploy na Vercel                                                                   |
| 3     | Monitorar erros em produção antes de V2.0                                          |

---

## ✅ O Que Já Foi Resolvido — Não Toque

| Problema resolvido             | Solução aplicada                               |
| ------------------------------ | ---------------------------------------------- |
| RLS bloqueando INSERT/SELECT   | Policies específicas para anon e authenticated |
| Status não atualizava na tela  | Polling a cada 5s                              |
| Dados sumiam após reload       | `getOrderById` + localStorage                  |
| Upload com dois passos         | Botão único com label + input hidden           |
| Modal abrindo nova aba         | Modal com overlay e imagem responsiva          |
| Painel admin público           | RLS com `manager_token` + header               |
| Token exposto na query string  | Fragmento `#auth=UUID` + sessionStorage        |
| Comprovantes com URL pública   | Bucket privado + URL assinada 1h               |
| Comprador só escolhia um sabor | Carrinho com +/- por variante                  |
| INSERT authenticated bloqueado | Policy `orders_insert_authenticated`           |

---

## ⛔ O Que Você Nunca Deve Fazer

- ❌ Alterar `quantity`, `total_price` ou `customer_name` de pedido existente
- ❌ Expor `manager_token` em query string ou resposta ao comprador
- ❌ Deixar comprovantes acessíveis por URL pública
- ❌ Adicionar dependência nova sem justificar
- ❌ Reescrever algo que já funciona sem motivo explícito
- ❌ Avançar para próxima prioridade sem confirmar que a atual está resolvida
- ❌ Escrever valores reais de API keys ou tokens no código

---

## ✅ Checklist Antes de Entregar Qualquer Código

- [ ] Código comentado em português?
- [ ] Nomes de variáveis e funções descritivos em português?
- [ ] Nenhuma chave ou token hardcoded?
- [ ] Solução mais simples possível para o problema?
- [ ] Dados sensíveis do comprador protegidos?
- [ ] Imutabilidade dos pedidos respeitada?
- [ ] Arquivo no lugar certo na estrutura do projeto?

---

_MULTIPLICA — Juntos fazemos mais._
_Última atualização: 14 de abril de 2026_
