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

### 🟡 Prioridade 4 — PRÓXIMA: Refinamento de UX do comprador

**Antes de começar:** verificar se o upload está salvando `proof_url`
como path relativo (ex: `pedidos/abc123.jpg`) e não como URL completa.
Corrigir se necessário antes de qualquer outra alteração.

**Ordem de execução:**

1. Botão "Enviando..." — desabilitado durante o upload, reativado ao concluir
2. Impedir múltiplos envios do mesmo comprovante
3. Tela de confirmação pós-upload — exibir resumo do pedido, order ID e data/hora
4. Link de acompanhamento enviado via WhatsApp após upload bem-sucedido
5. Feedback de sucesso/erro que desaparece após 3 segundos
6. Botão "Ver Pix novamente" apenas quando `showPix = false`
7. Revisão visual — espaçamentos, cores e tipografia

**Princípio guia:** A interface precisa parecer uma conversa, não um formulário.
O comprador já sabe mandar print — ele faz isso no WhatsApp todo dia.
A UX deve tornar o processo tão familiar que não pareça novo.

---

### Prioridade 5 — MÉDIA: Validação de comprovante no admin

_(Só após P4 concluída)_

- Impedir aprovação de pedido sem comprovante (`proof_url` nula)
- Exibir alerta claro ao tentar aprovar sem comprovante
- Badge visual "📸 Tem comprovante" nos cards
- Destacar pedidos sem comprovante com borda ou ícone de atenção

---

## 🔒 Estado Atual de Segurança (Referência)

| Item                     | Estado | Observação                                   |
| ------------------------ | ------ | -------------------------------------------- |
| RLS em `orders` — INSERT | ✅ OK  | Aberto para anon com rate limiting           |
| RLS em `orders` — SELECT | ✅ OK  | Admin via token; comprador via order_id      |
| RLS em `orders` — UPDATE | ✅ OK  | Restrito ao portador do `manager_token`      |
| Bucket `comprovantes`    | ✅ OK  | Privado — URLs assinadas com expiração de 1h |
| Token do admin na URL    | ✅ OK  | Fragmento `#auth=UUID`, limpo após captura   |
| Imutabilidade de pedidos | ✅ OK  | Trigger ativo no banco                       |

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
