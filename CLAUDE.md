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
> *"Li os arquivos. Entendi o estado atual do projeto. Pronto para trabalhar."*

Depois responda as três perguntas de alinhamento:
1. Qual é o maior risco de segurança no projeto agora?
2. Qual é a primeira coisa que vamos resolver?
3. O que você **não** vai tocar nesta sessão?

Só prossiga após confirmar as três respostas.

---

## 🎯 Contexto do Projeto

O **MULTIPLICA** é uma plataforma de gestão de pedidos coletivos em comunidades.
Resolve o caos de arrecadações feitas via WhatsApp (pastéis, rifas, doações, vaquinhas).

| Perfil | O que precisa |
|---|---|
| **Organizador** — Dona Neide | Criar campanha, validar comprovantes, cobrar pendentes |
| **Comprador** — Seu João | Fazer pedido, pagar via Pix, enviar comprovante com segurança |

**Estamos no MVP.** Velocidade, simplicidade e foco no essencial.
Não sugira o que não foi pedido. Não adicione complexidade desnecessária.

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologia | Observação |
|---|---|---|
| Frontend | **React + Vite + Tailwind CSS** | Mobile-first |
| Banco de Dados | **Supabase (PostgreSQL)** | RLS ativo em todas as tabelas |
| Storage | **Supabase Storage** | Bucket `comprovantes` — deve ser privado |
| Automação | **Make.com** e **n8n** | Fluxos exportados em `/automations/` |
| Scripts | **JavaScript / Google Apps Script** | Simples, modulares, sem frameworks |
| Hospedagem | **Vercel** | Deploy contínuo via Git |
| Mensageria | **API WhatsApp** | Notificações e cobranças amigáveis |

> Se precisar sugerir tecnologia fora desta lista, **justifique antes de implementar**.

---

## 🔴 Prioridades Atuais — Trabalhe nesta ordem

Não avance para o próximo item sem confirmar que o anterior está resolvido.

### Prioridade 1 — CRÍTICA: Fechar o painel admin

**Problema:** `/admin/:slug?auth=UUID` está completamente público. Qualquer pessoa com a URL acessa e pode aprovar ou rejeitar pedidos.

**O que fazer:**
- Garantir que o campo `manager_token` (UUID) existe na tabela `campaigns`
- Implementar política RLS que restrinja `SELECT` e `UPDATE` em `orders` apenas para o portador do `manager_token` correto, recebido via header `x-manager-token`
- Atualizar `adminService.js` para enviar o token no header — nunca na query string
- Testar que sem o token correto o painel retorna erro e não carrega dados

**Regra:** O token nunca trafega como `?auth=UUID`. Sempre via header `x-manager-token`.

---

### Prioridade 2 — CRÍTICA: Tornar o storage de comprovantes privado

**Problema:** Bucket `comprovantes` está com leitura pública. Comprovantes de Pix contêm nome completo e dados bancários — violação direta da LGPD.

**O que fazer:**
- Alterar o bucket `comprovantes` para privado no Supabase Storage
- Substituir a `proof_url` no banco por path relativo do arquivo
- Criar função em `adminService.js` para gerar URL assinada com expiração (1 hora) ao abrir o modal
- Garantir que o comprador não acessa comprovantes de outros pedidos

---

### Prioridade 3 — ALTA: Mover token para fragmento de URL

**Problema:** Mesmo com header no backend, o token ainda aparece na URL como `?auth=UUID`, ficando exposto em histórico do navegador e ferramentas de analytics.

**O que fazer:**
- Alterar o Link Mágico para usar fragmento: `/admin/:slug#auth=UUID`
- Ler o token via `window.location.hash` no frontend
- O fragmento nunca é enviado ao servidor (comportamento nativo do navegador)
- Limpar o fragmento da URL após capturar o token via `history.replaceState`

---

### Prioridade 4 — MÉDIA: Refinamento de UX do comprador
*(Só após as prioridades 1, 2 e 3 concluídas)*

- Adicionar estado "Enviando..." no botão de upload — desabilitado durante o processo
- Impedir múltiplos envios do mesmo comprovante
- Revisar espaçamentos, cores e tipografia
- Garantir que "Ver Pix novamente" aparece apenas quando `showPix = false`
- Feedback de sucesso/erro que desaparece após 3 segundos

---

### Prioridade 5 — MÉDIA: Validação de comprovante no admin
*(Só após as prioridades anteriores)*

- Impedir aprovação de pedido sem comprovante (`proof_url` nula)
- Exibir alerta claro ao tentar aprovar sem comprovante
- Badge visual "📸 Tem comprovante" nos cards
- Destacar pedidos sem comprovante com borda ou ícone de atenção

---

## 🔒 Estado Atual de Segurança (Referência)

| Item | Estado | Observação |
|---|---|---|
| RLS em `orders` — INSERT | ✅ OK | Aberto para anon com rate limiting |
| RLS em `orders` — SELECT/UPDATE | ⚠️ Público temporário | Prioridade 1 |
| Bucket `comprovantes` | 🔴 Leitura pública | Prioridade 2 |
| Token do admin na URL | 🔴 Query string visível | Prioridade 3 |
| Imutabilidade de pedidos | ✅ OK | Trigger ativo no banco |

---

## ✅ O Que Já Foi Resolvido — Não Toque

| Problema resolvido | Solução aplicada |
|---|---|
| RLS bloqueando INSERT/SELECT | Policies específicas para anon |
| Status não atualizava na tela | Polling a cada 5s + mapeamento de `pending_payment` |
| Dados sumiam após reload | `getOrderById` + estado `order` + localStorage |
| Upload com dois passos | Botão único com label + input hidden |
| Modal abrindo nova aba | Modal com overlay e imagem responsiva |
| Polling parando | Ajuste no array de dependências do useEffect |
| Export duplicado | Remoção do export duplo em `AdminPage.jsx` |

---

## 🏛️ Decisões de Arquitetura — Não Questione

Estas decisões foram tomadas conscientemente. Não sugira alternativas sem ser solicitado.

| Decisão | Motivo |
|---|---|
| **localStorage** para persistência do comprador | Escolha de UX — usuário sem conta quer ver pedido ao reabrir o navegador |
| **Polling de 5s** em vez de Realtime | Aceitável para MVP. ~10 req/s com 50 usuários. Realtime é roadmap futuro |
| **Zero-Auth** para o comprador | Pilar do produto. Nunca sugira login/senha para o comprador |
| **Token UUID** para o organizador | Solução enxuta para MVP, reforçada com header + fragmento de URL |

---

## 📝 Regras de Desenvolvimento

### Idioma
- Comentários → **Português**
- Variáveis e funções → **Português** (camelCase)
- Commits → **Português**

```js
// ✅ Correto
const totalDoPedido = calcularTotal(itensSelecionados);
async function enviarComprovante(idPedido, arquivoComprovante) { }

// ❌ Evitar
const ttl = calc(itns);
async function envComp(id, arq) { }
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
| Prefixo | Quando usar |
|---|---|
| `feat:` | Nova funcionalidade |
| `fix:` | Correção de bug |
| `security:` | Segurança ou LGPD |
| `refactor:` | Melhoria sem mudar comportamento |
| `docs:` | Apenas documentação |

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

*MULTIPLICA — Juntos fazemos mais.*
