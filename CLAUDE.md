# CLAUDE.md — MULTIPLICA

> Este arquivo é lido automaticamente pelo Claude Code ao iniciar toda sessão.
> Leia-o integralmente antes de qualquer ação.

---

## 🚀 Início de Sessão — Faça isso primeiro

Antes de responder qualquer pergunta ou escrever qualquer código, leia os arquivos abaixo **nesta ordem**:
src/lib/supabase.js

src/services/authService.js

src/services/campaignService.js

src/services/adminService.js

src/services/dashboardService.js

src/hooks/useOrder.js

src/pages/Home.jsx

src/pages/Login.jsx

src/pages/Cadastro.jsx

src/pages/Dashboard.jsx

src/pages/CreateCampaign.jsx

src/pages/OrderPage.jsx

src/pages/AdminPage.jsx

text

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

**🌐 Design Responsivo (RWD):** Todo o projeto é construído com **mobile-first** e Tailwind CSS. Todos os componentes, formulários, listas e modais devem funcionar perfeitamente em qualquer tamanho de tela (celular, tablet, desktop). Use `w-full`, flexbox com `flex-col` no mobile, e garanta botões com tamanho mínimo de toque de 44px.

---

## 🛠️ Stack Tecnológica

| Camada         | Tecnologia                      | Observação                             |
| -------------- | ------------------------------- | -------------------------------------- |
| Frontend       | **React + Vite + Tailwind CSS** | **Mobile-first + Responsivo**          |
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
- Tabela `campaign_options` com `label`, `price`, `sort_order` (em uso)
- Campo `items_detail` (JSONB) em `orders`
- Comprador vê lista de sabores com botões +/- por item
- Total calculado dinamicamente: `soma(price × qty)`
- Admin exibe composição: "2× Carne (R$ 10,00), 1× Queijo (R$ 12,00)"
- Contador de produção por variação no admin
- Policy `orders_insert_authenticated` adicionada

---

## 🗄️ Estrutura do Banco de Dados

### Tabela `campaigns`

| Coluna             | Tipo      | Observação                                      |
| ------------------ | --------- | ----------------------------------------------- |
| `id`               | UUID      | PK                                              |
| `user_id`          | UUID      | FK → auth.users                                 |
| `name`             | TEXT      | Nome da campanha (a causa)                      |
| `item_description` | TEXT      | O que está sendo vendido ("Produto/Item")       |
| `price`            | NUMERIC   | Preço (usado apenas no modo 'single')           |
| `pix_key`          | TEXT      | Chave Pix do organizador                        |
| `slug`             | TEXT      | URL amigável com sufixo aleatório               |
| `manager_token`    | UUID      | Acesso via Link Mágico (retrocompatibilidade)   |
| `delivery_at`      | TIMESTAMP | Data de entrega (opcional)                      |
| `contact_whatsapp` | TEXT      | Contato do organizador                          |
| `has_variants`     | BOOLEAN   | Se true, usa sistema de variantes               |
| `variants`         | JSONB     | Array `[{name, price}]` — **price obrigatório** |
| `plan_type`        | TEXT      | 'free' por padrão                               |
| `is_premium`       | BOOLEAN   | false por padrão                                |
| `description`      | TEXT      | **V1.1** Objetivo/motivação da campanha         |
| `recipient_name`   | TEXT      | **V1.1** Nome do titular da chave Pix           |
| `type`             | TEXT      | **V1.1** 'single' ou 'multiple'                 |

### Tabela `campaign_options`

| Coluna        | Tipo    | Observação        |
| ------------- | ------- | ----------------- |
| `id`          | UUID    | PK                |
| `campaign_id` | UUID    | FK → campaigns    |
| `label`       | TEXT    | Nome da opção     |
| `price`       | NUMERIC | Preço da opção    |
| `sort_order`  | INTEGER | Ordem de exibição |

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
| `46b7c39` | V1.0 complete — auth, variantes, páginas legais              |
| `74c116c` | feat: botão Excluir com confirmação no Dashboard             |
| `cdf1546` | fix: exclusão bloqueada silenciosamente por RLS              |
| `b342b72` | feat: botão Copiar Pix e stepper +/- na OrderPage            |

---

## 🏛️ Decisões de Arquitetura — Não Questione

| Decisão                              | Motivo                                                        |
| ------------------------------------ | ------------------------------------------------------------- |
| **Login/senha** para organizador     | Público recorrente — precisa de dashboard seguro              |
| **Zero-Auth** para comprador         | Público eventual — sem atrito, sem cadastro                   |
| **Link Mágico** mantido como atalho  | Retrocompatibilidade                                          |
| **Polling de 5s** em vez de Realtime | Aceitável para MVP                                            |
| **localStorage** para comprador      | Escolha de UX consciente                                      |
| **Pedidos imutáveis** após criação   | `quantity`, `total_price`, `customer_name` nunca mudam        |
| **Supabase Auth nativo**             | Sem construir autenticação do zero                            |
| **~~Fallback de preço~~**            | **❌ REMOVIDO na V1.1** — cada variante tem preço obrigatório |

---

## 🚀 Passos executados anteriormente

| Ordem | O que fazer                                                |
| ----- | ---------------------------------------------------------- |
| 1     | Executar `sql/v1_1_campaigns.sql` no Supabase              |
| 2     | Implementar V1.1 — CreateCampaign refatorado               |
| 3     | Testar fluxo completo com campanha simples e com variantes |
| 4     | Deploy na Vercel                                           |
| 5     | Teste de campo com usuário real                            |

---

### 🔄 Tarefa atual — LoadingScreen + Campos V1.1

**Passo 1 — Verificar SELECT em `getCampaignBySlug`:**
Confirmar que `recipient_name` e `description` estão na lista de colunas
explícitas do SELECT em `campaignService.js`. Se não estiverem, adicionar.

**Passo 2 — Criar `src/components/LoadingScreen.jsx`:**
Componente com spinner centralizado, cor `#5a8fdb`, texto "Carregando..."
e assinatura "Multiplica — Juntos fazemos mais." Usar variáveis CSS do
`App.css` — não usar classes Tailwind inline. Layout responsivo.
Substituir `return <div>Carregando...</div>` por `return <LoadingScreen />`
em: `App.jsx`, `RotaProtegida.jsx`, `OrderPage.jsx`, `AdminPage.jsx`
e `Dashboard.jsx`.

**Passo 3 — Exibir `description` na OrderPage:**
Abaixo do `campaign.name`, adicionar subtítulo condicional:
`{campaign.description && <p className="campaign-description">{campaign.description}</p>}`
Usar estilo discreto — texto menor, cor secundária, itálico opcional.

**Passo 4 — Exibir `recipient_name` na OrderPage:**
Na seção onde a chave Pix é exibida, adicionar bloco de confiança condicional:
`{campaign.recipient_name && <p>✅ O valor será transferido para <strong>{campaign.recipient_name}</strong></p>}`
Posicionar acima da chave Pix ou acima do botão de upload.

**Passo 5 — Exibir ambos no AdminPage:**
No card de informações da campanha no topo:

- `description` como "🎯 Objetivo: ..."
- `recipient_name` como "🏦 Recebedor: ..."
  Ambos condicionais — campanhas antigas sem esses campos continuam funcionando.

**O que NÃO fazer:**

- ❌ Não alterar lógica de autenticação ou aprovação/rejeição
- ❌ Não remover estados de loading
- ❌ Não modificar campanhas existentes

## **Commit:** `feat: LoadingScreen + description e recipient_name nas páginas do comprador e admin`

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

### Fase 4 — Limpeza Automática LGPD (Cron Job)

> ⚠️ **Pendente para V2.0** — implementar via **Supabase Cron Job** (pg_cron).
>
> A `PrivacyPage` já informa ao comprador que dados são retidos por 90 dias após o encerramento da campanha.
> O Cron Job deve excluir, da tabela `orders`, todos os registros cujo `campaign_id` aponte para campanhas
> com `delivery_at` anterior a 90 dias da data de execução. Comprovantes no bucket `comprovantes` também
> devem ser removidos via Storage API antes de deletar o registro.

---

### 🔄 V1.1 — Refatoração CreateCampaign.jsx

**Antes de implementar:** criar `sql/v1_1_campaigns.sql` com:

```sql
-- V1.1 — Migração campaigns
-- item_description mantido para retrocompatibilidade
-- O campo "Produto/Item" do formulário V1.1 salva exatamente neste campo

ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS recipient_name TEXT;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'single';
Mostrar SQL antes de executar. Após confirmação, implementar o formulário.

Estrutura do formulário:

🌐 Responsivo: todo o formulário deve usar w-full, flexbox com flex-col no mobile, inputs com largura total, botões com tamanho mínimo de toque de 44px.

Seção 1 — Campos básicos:

Nome da campanha (obrigatório) — placeholder: "Ex: Pastelada de Outubro ou Rifa do Dia das Crianças" — microcopy: "Use um nome que facilite sua organização."

Objetivo/motivação (opcional, textarea) — placeholder: "Ex: Arrecadar fundos para a pintura da fachada da igreja." — microcopy: "Conte brevemente por que as pessoas devem ajudar."

Produto/Item (obrigatório) — placeholder: "Ex: Pastel, Rifas, Ingressos ou Marmitas"

Seção 2 — Tipo de campanha (radio, obrigatório, mutuamente exclusivo):

Opção A (padrão): "Vou vender produto de preço único" → exibe campo Preço por unidade (number, step=0.01, obrigatório)

Opção B: "Produto tem sabores ou preços diferentes" → exibe lista de variantes:

Cada variante: nome (input, obrigatório) + preço (number, step=0.01, obrigatório) + botão "✖" para remover

Botão "+ Adicionar item" abaixo da lista

Mínimo de 1 variante (validação)

⚠️ Campo preço é obrigatório em cada variante — sem fallback, sem herança

Reset de estado: ao alternar entre A e B, limpar completamente os campos da opção anterior

Seção 3 — Pagamento e contato:

Chave Pix (obrigatório) — placeholder: "CPF, e-mail, telefone ou chave aleatória"

Nome do recebedor (obrigatório) — placeholder: "Nome que aparecerá no banco (Ex: Paróquia São Mateus)"

Data de entrega (date, obrigatório)

WhatsApp (obrigatório) — placeholder: "(00) 00000-0000"

Footer:

Checkbox "Li e concordo com os Termos de Responsabilidade do Organizador" (obrigatório)

Botões: "Voltar" e "Criar campanha"

Persistência no Supabase:

Opção A: type = 'single', price = valor, variants = []

Opção B: type = 'multiple', price = null, variants = [{name, price}] — cada price é obrigatório

Salvar também: description, recipient_name, pix_key, delivery_at, contact_whatsapp, user_id

item_description (campo "Produto/Item" do formulário) — mantido como está

O que NÃO fazer:

❌ Não referenciar herança de preço, fallback ou "deixar em branco"

❌ Não permitir variante sem preço no modo múltiplo

❌ Não alterar estilos globais fora do escopo desta tarefa

Commit: refactor: V1.1 - nova estrutura CreateCampaign com tipo, variantes com preço obrigatório e campos de confiança

✅ O Que Já Foi Resolvido — Não Toque
Problema resolvido	Solução aplicada
RLS bloqueando INSERT/SELECT	Policies específicas para anon e authenticated
Status não atualizava na tela	Polling a cada 5s
Dados sumiam após reload	getOrderById + localStorage
Upload com dois passos	Botão único com label + input hidden
Modal abrindo nova aba	Modal com overlay e imagem responsiva
Painel admin público	RLS com manager_token + header
Token exposto na query string	Fragmento #auth=UUID + sessionStorage
Comprovantes com URL pública	Bucket privado + URL assinada 1h
Comprador só escolhia um sabor	Carrinho com +/- por variante
INSERT authenticated bloqueado	Policy orders_insert_authenticated
⛔ O Que Você Nunca Deve Fazer
❌ Alterar quantity, total_price ou customer_name de pedido existente

❌ Expor manager_token em query string ou resposta ao comprador

❌ Deixar comprovantes acessíveis por URL pública

❌ Adicionar dependência nova sem justificar

❌ Reescrever algo que já funciona sem motivo explícito

❌ Avançar para próxima prioridade sem confirmar que a atual está resolvida

❌ Escrever valores reais de API keys ou tokens no código

❌ Permitir variante sem preço no modo múltiplo (V1.1)

✅ Checklist Antes de Entregar Qualquer Código
Código comentado em português?

Nomes de variáveis e funções descritivos em português?

Nenhuma chave ou token hardcoded?

Solução mais simples possível para o problema?

Dados sensíveis do comprador protegidos?

Imutabilidade dos pedidos respeitada?

Arquivo no lugar certo na estrutura do projeto?

Design responsivo testado em mobile? (RWD)

MULTIPLICA — Juntos fazemos mais.
Última atualização: 17 de abril de 2026
```
