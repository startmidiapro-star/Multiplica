# CLAUDE.md — MULTIPLICA

> Este arquivo é lido automaticamente pelo Claude Code ao iniciar toda sessão.
> Leia-o integralmente antes de qualquer ação.

---

## 🚀 Início de Sessão — Faça isso primeiro

Antes de responder qualquer pergunta ou escrever qualquer código, leia os arquivos abaixo **nesta ordem**:

```
1. src/lib/supabase.js
2. src/services/campaignService.js
3. src/services/adminService.js
4. src/hooks/useOrder.js
5. src/pages/OrderPage.jsx
6. src/pages/AdminPage.jsx
7. src/pages/Home.jsx
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

O **MULTIPLICA** é uma plataforma de gestão de pedidos coletivos em comunidades.
Resolve o caos de arrecadações feitas via WhatsApp (pastéis, rifas, doações, vaquinhas).

| Perfil                       | O que precisa                                                 |
| ---------------------------- | ------------------------------------------------------------- |
| **Organizador** — Dona Neide | Criar campanha, validar comprovantes, cobrar pendentes        |
| **Comprador** — Seu João     | Fazer pedido, pagar via Pix, enviar comprovante com segurança |

**Estamos no MVP.** Velocidade, simplicidade e foco no essencial.
Não sugira o que não foi pedido. Não adicione complexidade desnecessária.

---

## 🛠️ Stack Tecnológica

| Camada         | Tecnologia                          | Observação                               |
| -------------- | ----------------------------------- | ---------------------------------------- |
| Frontend       | **React + Vite + Tailwind CSS**     | Mobile-first                             |
| Banco de Dados | **Supabase (PostgreSQL)**           | RLS ativo em todas as tabelas            |
| Storage        | **Supabase Storage**                | Bucket `comprovantes` — deve ser privado |
| Automação      | **Make.com** e **n8n**              | Fluxos exportados em `/automations/`     |
| Scripts        | **JavaScript / Google Apps Script** | Simples, modulares, sem frameworks       |
| Hospedagem     | **Vercel**                          | Deploy contínuo via Git                  |
| Mensageria     | **API WhatsApp**                    | Notificações e cobranças amigáveis       |

> Se precisar sugerir tecnologia fora desta lista, **justifique antes de implementar**.

---

## 🔴 Prioridades Atuais — Trabalhe nesta ordem

Não avance para o próximo item sem confirmar que o anterior está resolvido.

### ✅ Prioridade 1 — CONCLUÍDA: Fechar o painel admin

_(Concluída em 2026-03-31)_

- `manager_token UUID` garantido na tabela `campaigns`
- RLS em `orders`: SELECT restrito por token ou order_id; UPDATE restrito ao admin com token válido
- `supabase.js`: token lido de `window.location.hash`, injetado via `x-manager-token`
- Token persistido em `sessionStorage` para requests após limpeza do hash
- `AdminPage.jsx`: lê hash, limpa com `history.replaceState`, bloqueia acesso sem token
- SQL: `sql/rls_orders.sql`

---

### ✅ Prioridade 2 — CONCLUÍDA: Storage de comprovantes privado

_(Concluída em 2026-03-31)_

- Bucket `comprovantes` alterado para `public = false`
- `proof_url` no banco salva path relativo — nunca URL pública
- `adminService.js`: `gerarUrlAssinadaComprovante(path)` com expiração de 1 hora
- `AdminPage.jsx`: URL assinada gerada ao abrir o modal, nunca antes
- `supabase.js`: `x-order-id` injetado via localStorage para RLS do comprador
- SQL: `sql/storage_privado.sql`

---

### ✅ Prioridade 3 — CONCLUÍDA: Token via fragmento de URL

_(Concluída junto com P1 em 2026-03-31)_

- Link Mágico usa `/admin/:slug#auth=UUID`
- Token lido via `window.location.hash` — nunca da query string
- Fragmento limpo com `history.replaceState` após captura

---

### ✅ Prioridade 4 — CONCLUÍDA: Refinamento de UX do comprador

- proof_url salvo como path relativo ✅
- Botão "Enviando..." desabilitado durante upload ✅
- Múltiplos envios impedidos ✅
- Tela de confirmação pós-upload ✅
- Link WhatsApp pós-upload ✅
- Feedback de sucesso/erro some após 3s ✅
- Botão "Ver Pix novamente" condicional ✅
- Revisão visual completa — compatível com modo escuro/claro ✅

### ✅ Prioridade 5 — CONCLUÍDA: Validação de comprovante no admin

- Aprovação bloqueada sem comprovante ✅
- Confirmação antes de aprovar (com nome e valor) ✅
- Confirmação antes de rejeitar ✅
- Badge redundante removido ✅
- Data nula exibe "Entrega: não definida" ✅
- WhatsApp vazio tratado corretamente ✅

markdown### ✅ Prioridade 6 — CONCLUÍDA: Dashboard de criação de campanha

- Rota `/nova-campanha` → `CreateCampaign.jsx` ✅
- Home atualizada com dois botões ✅
- Formulário com campos obrigatórios e opcionais ✅
- slug gerado automaticamente com sufixo aleatório ✅
- manager_token gerado pelo banco — nunca pelo frontend ✅
- Tela de confirmação com links e aviso de guardar ✅
- RLS em `campaigns` — INSERT aberto, SELECT restrito via `x-campaign-id` ✅

---

### 🟡 Prioridade 7 — PRÓXIMA: Home + Contador + Compartilhar

**Arquivos envolvidos:** `Home.jsx`, `App.css`, `AdminPage.jsx`

### 🎨 P7.1 — Identidade Visual da Home (executar primeiro na P7)

**Arquivo:** `src/pages/Home.jsx` e CSS correspondente. Não altere mais nada.

**Cor principal unificada:** `#5a8fdb` em toda a página — título, ícones, bordas, assinatura, divisor. Exceção: árvore de fundo mantém cor e opacidade atuais, sem alteração.

**Símbolo acima do título:** círculo central `#5a8fdb` de 12px com animação de pulso discreta (`animation: pulse 2s infinite ease-in-out` — sutil, sem distrair). Dois anéis concêntricos ao redor: 20px e 30px de diâmetro, mesma cor, opacidade decrescente. Representa o ponto do "i" expandido.

**Título:** fonte Georgia ou similar com serifa. Estrutura: "multi" em `#1a1a2e` + "plica" em `#5a8fdb` itálico. O ponto do "i" em "multi" deve ser destacado em `#5a8fdb` e levemente maior — usar `<span>` com `position: relative` e pseudo-elemento `::after` para substituir o ponto original.

**Botões:**

- Largura máxima igual à largura total dos 3 cards abaixo em desktop
- Em mobile: largura 100% para facilitar o toque
- Texto sempre visível sem hover — contraste total
- Primário: fundo `#5a8fdb`, texto branco, borda `#5a8fdb`
- Secundário: fundo branco, texto `#5a8fdb`, borda `1.5px solid #5a8fdb`
- Hover em ambos: fundo `#5a8fdb`, texto branco
- Transition: `0.2s ease`

**Cards:** manter layout 3 colunas. Ícones internos em `#5a8fdb`.

**Assinatura:** "Juntos fazemos mais." em `#5a8fdb`, itálico, font-weight 700.

**Headline:** "Gerencie vendas e arrecadações da sua comunidade com simplicidade."

**Subheadline:** "Pedidos, comprovantes e confirmações em um só lugar."

**Restrições:** não alterar lógica, rotas, outros componentes ou a árvore de fundo.

**7.2 Contador operacional no topo do admin**

Bloco de resumo abaixo do header da campanha em `AdminPage.jsx`.
Calculado a partir do array `orders` já carregado — sem requisição extra.
Visual em cards ou badges — não texto corrido.

Exibir:

- Pedidos recebidos (total)
- Aprovados
- Pendentes de análise
- Rejeitados
- Total de itens a produzir (soma de `quantity` dos `approved`)
- Valor confirmado (soma de `total_price` dos `approved`)
- Valor pendente (soma de `total_price` dos `pending_payment`)

Exemplo de layout:
┌─────────────┬─────────────┬─────────────┬─────────────┐
│ Total: 12 │ Aprovados:8 │ Pendentes:3 │Rejeitados:1 │
└─────────────┴─────────────┴─────────────┴─────────────┘
Itens a produzir: 46
Confirmados: R$ 460,00 | Pendentes: R$ 120,00

**7.3 Botão compartilhar campanha no WhatsApp**

Mesmo bloco do contador. Botão "Compartilhar no WhatsApp" abre
`https://wa.me/?text={mensagem codificada}` com texto pré-preenchido:

📣 Nossa campanha já está a todo vapor!
Já temos [X] itens aprovados 🙌
Se você ainda não fez seu pedido, ainda dá tempo:
[LINK DA CAMPANHA /c/:slug]
🕒 Entrega: [data de entrega — omitir linha se delivery_at for nulo]
Compartilhe com quem puder 💛

[X] = soma de `quantity` dos pedidos `approved`.

**7.4 Remover `window.supabase` global**

Em `src/lib/supabase.js`, remover exposição global antes do deploy.
Verificar se algum outro arquivo depende de `window.supabase` antes de remover.

## 🔒 Estado Atual de Segurança (Referência)

| Item                        | Estado      | Observação                                   |
| --------------------------- | ----------- | -------------------------------------------- |
| RLS em `orders` — INSERT    | ✅ OK       | Aberto para anon com rate limiting           |
| RLS em `orders` — SELECT    | ✅ OK       | Admin via token; comprador via order_id      |
| RLS em `orders` — UPDATE    | ✅ OK       | Restrito ao portador do `manager_token`      |
| RLS em `campaigns` — INSERT | ✅ OK       | Aberto para anon                             |
| RLS em `campaigns` — SELECT | ✅ OK       | Restrito via `x-campaign-id`                 |
| Bucket `comprovantes`       | ✅ OK       | Privado — URLs assinadas com expiração de 1h |
| Token do admin na URL       | ✅ OK       | Fragmento `#auth=UUID`, limpo após captura   |
| Imutabilidade de pedidos    | ✅ OK       | Trigger ativo no banco                       |
| `window.supabase` global    | ⚠️ Pendente | Remover antes do deploy — P7 item 4          |

---

## ✅ O Que Já Foi Resolvido — Não Toque

| Problema resolvido            | Solução aplicada                                                   |
| ----------------------------- | ------------------------------------------------------------------ |
| RLS bloqueando INSERT/SELECT  | Policies específicas para anon                                     |
| Status não atualizava na tela | Polling a cada 5s + mapeamento de `pending_payment`                |
| Dados sumiam após reload      | `getOrderById` + estado `order` + localStorage                     |
| Upload com dois passos        | Botão único com label + input hidden                               |
| Modal abrindo nova aba        | Modal com overlay e imagem responsiva                              |
| Polling parando               | Ajuste no array de dependências do useEffect                       |
| Export duplicado              | Remoção do export duplo em `AdminPage.jsx`                         |
| Painel admin público          | RLS com `manager_token` + token via `x-manager-token` header       |
| Token exposto na query string | Fragmento `#auth=UUID` + `history.replaceState` + `sessionStorage` |
| Comprovantes com URL pública  | Bucket privado + path relativo no banco + URL assinada 1h          |

---

## 🏛️ Decisões de Arquitetura — Não Questione

Estas decisões foram tomadas conscientemente. Não sugira alternativas sem ser solicitado.

| Decisão                                         | Motivo                                                                   |
| ----------------------------------------------- | ------------------------------------------------------------------------ |
| **localStorage** para persistência do comprador | Escolha de UX — usuário sem conta quer ver pedido ao reabrir o navegador |
| **Polling de 5s** em vez de Realtime            | Aceitável para MVP. ~10 req/s com 50 usuários. Realtime é roadmap futuro |
| **Zero-Auth** para o comprador                  | Pilar do produto. Nunca sugira login/senha para o comprador              |
| **Token UUID** para o organizador               | Solução enxuta para MVP, reforçada com header + fragmento de URL         |

---

## 📝 Regras de Desenvolvimento

### Idioma

- Comentários → **Português**
- Variáveis e funções → **Português** (camelCase)
- Commits → **Português**

```js
// ✅ Correto
const totalDoPedido = calcularTotal(itensSelecionados);
async function enviarComprovante(idPedido, arquivoComprovante) {}

// ❌ Evitar
const ttl = calc(itns);
async function envComp(id, arq) {}
```

### Segurança — inegociável

Nunca escreva chaves, tokens ou senhas no código.

```js
// ✅ Correto
const supabaseUrl = process.env.SUPABASE_URL;

// ❌ NUNCA
const supabaseUrl = "https://xyzcompany.supabase.co";
```

### Cabeçalho em todo arquivo novo

```js
/**
 * MULTIPLICA — [Nome do Módulo]
 * Responsabilidade: [O que este arquivo faz]
 * Dependências: [Variáveis de ambiente ou módulos externos]
 */
```

### Simplicidade

- Sem frameworks fora da stack listada
- Funções pequenas com uma responsabilidade
- Sem dependências novas sem justificativa

---

## 🔄 Fluxos de Negócio

### Fluxo do Comprador

```
Acessar link público → Selecionar itens → Ver chave Pix e valor total
→ Pagar externamente → Enviar print do comprovante
→ Receber confirmação + link de acompanhamento via WhatsApp
```

### Fluxo do Organizador

```
Criar campanha → Receber Link Mágico (manager_token via fragmento #)
→ Compartilhar link público → Receber notificação de novo comprovante
→ Validar no painel Semáforo → Confirmar ou rejeitar pedido
→ Disparar cobrança amigável para pendentes
```

### Regras críticas de negócio

- Pedidos são **imutáveis** após criação — `quantity`, `item_price`, `customer_name` nunca mudam
- `manager_token` **nunca** aparece em query string — sempre header `x-manager-token`
- INSERT de pedidos é público, mas com rate limiting por IP
- Comprovantes são **sempre privados** — nunca URL pública, sempre URL assinada com expiração

---

## 📁 Estrutura de Pastas

```
multiplica/
├── src/
│   ├── components/             → Componentes reutilizáveis
│   ├── pages/
│   │   ├── Home.jsx
│   │   ├── OrderPage.jsx       → Fluxo do comprador
│   │   └── AdminPage.jsx       → Painel do organizador
│   ├── hooks/
│   │   └── useOrder.js         → Hook principal do fluxo do comprador
│   ├── services/
│   │   ├── campaignService.js  → Serviço de campanhas
│   │   └── adminService.js     → Serviço do painel
│   ├── lib/
│   │   └── supabase.js         → Configuração do cliente Supabase
│   ├── utils/
│   ├── routes/
│   ├── App.jsx
│   └── main.jsx
├── sql/                        → Schema, RLS, triggers, funções
├── automations/                → Fluxos Make e n8n em JSON
├── docs/                       → Regras de negócio, fluxos, LGPD
├── .env.example                → Variáveis necessárias (sem valores reais)
├── README.md                   → Visão geral do projeto
└── CLAUDE.md                   → Este arquivo
```

---

## 📋 Comandos Frequentes

```bash
# Iniciar o projeto localmente
npm run dev

# Rodar um script utilitário
node scripts/nome_do_arquivo.js

# Status do repositório
git status

# Commit com prefixo correto
git commit -m "security: implementa validação do token no RLS"
git commit -m "fix: corrige polling de status no OrderPage"
git commit -m "feat: adiciona estado enviando no upload de comprovante"
```

### Prefixos de commit

| Prefixo     | Quando usar                      |
| ----------- | -------------------------------- |
| `feat:`     | Nova funcionalidade              |
| `fix:`      | Correção de bug                  |
| `security:` | Segurança ou LGPD                |
| `refactor:` | Melhoria sem mudar comportamento |
| `docs:`     | Apenas documentação              |

---

## ⛔ O Que Você Nunca Deve Fazer

- ❌ Sugerir login/senha para o comprador
- ❌ Expor `manager_token` em query string ou log
- ❌ Alterar `quantity`, `item_price` ou `customer_name` de um pedido existente
- ❌ Deixar comprovantes acessíveis por URL pública
- ❌ Adicionar dependência nova sem justificar
- ❌ Reescrever algo que já funciona sem motivo explícito
- ❌ Avançar para a próxima prioridade sem confirmar que a atual está resolvida
- ❌ Escrever valores reais de API keys ou tokens no código

---

## ✅ Checklist Antes de Entregar Qualquer Código

- [ ] Código comentado em português?
- [ ] Nomes de variáveis e funções descritivos?
- [ ] Nenhuma chave ou token hardcoded?
- [ ] Solução mais simples possível para o problema?
- [ ] Dados sensíveis do comprador protegidos?
- [ ] Imutabilidade dos pedidos respeitada?
- [ ] Arquivo no lugar certo na estrutura do projeto?

---

_MULTIPLICA — Juntos fazemos mais._
