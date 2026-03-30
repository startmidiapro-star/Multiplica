# MULTIPLICA
### *Juntos fazemos mais.*

> Gestão de pedidos coletivos em comunidades — sem cadastro, sem caos, sem comprovante perdido.

---

## 📌 1. Resumo do Negócio

### O Problema

Campanhas de arrecadação em comunidades — vendas de pastel, rifas, doações, vaquinhas — são organizadas hoje via WhatsApp puro. O resultado é sempre o mesmo: listas copiadas e coladas, comprovantes enterrados no chat, conferência manual exaustiva e dados bancários expostos em grupos públicos.

### A Solução

O **Multiplica** é uma plataforma de gestão de pedidos coletivos que atua como ponte entre o desejo de ajudar e a necessidade de organizar. Sem exigir cadastro ou senha, ele digitaliza o processo de arrecadação com foco em duas experiências:

| Perfil | Dor resolvida |
|---|---|
| **Organizador** (ex: Dona Neide) | Criar e gerenciar campanhas, validar comprovantes e cobrar pendentes — tudo em um painel simples |
| **Comprador** (ex: Seu João) | Fazer o pedido, pagar via Pix e enviar o comprovante com segurança, sem expor dados bancários |

### Diferenciais

- **Zero-Auth**: acesso via Link Mágico com token UUID — sem e-mail, sem senha, sem atrito
- **Dados Imutáveis**: pedidos não podem ser alterados após criação, garantindo integridade da lista
- **Privacidade**: comprovantes armazenados de forma privada, fora de grupos públicos
- **Painel Semáforo**: status visual de cada pedido (Pendente → Enviado → Confirmado)
- **Cobrança Amigável**: disparo automático via WhatsApp para quem esqueceu de enviar o comprovante

---

## 🛠️ 2. Stack Técnica

### Frontend
| Tecnologia | Uso |
|---|---|
| **React** | Interface do organizador e do comprador |
| **Vite** | Bundler e servidor de desenvolvimento (com HMR) |
| **@vitejs/plugin-react** | Compilação React via Oxc |
| **Tailwind CSS** | Estilização mobile-first |

### Backend & Banco de Dados
| Tecnologia | Uso |
|---|---|
| **Supabase (PostgreSQL)** | Banco de dados relacional principal |
| **Supabase Storage** | Armazenamento privado de comprovantes |
| **Supabase RLS** | Row Level Security — isolamento de dados por campanha |
| **Supabase Edge Functions** | Validações server-side e rate limiting |

### Automação & Integrações
| Tecnologia | Uso |
|---|---|
| **Make (Integromat)** | Automação de fluxos entre sistemas |
| **n8n** | Automação self-hosted para fluxos sensíveis |
| **API WhatsApp** | Notificações para organizador e comprador; cobranças amigáveis |
| **Pix (chave manual)** | Pagamento externo referenciado na campanha |

### Hospedagem & Deploy
| Tecnologia | Uso |
|---|---|
| **Vercel** | Hospedagem do frontend com deploy contínuo |

### Linguagens
- **JavaScript** — lógica do frontend e scripts de automação
- **SQL** — definição de tabelas, triggers e políticas RLS
- **Python** *(secundário)* — scripts utilitários e automações no n8n

---

## 🔄 3. Fluxos Principais

### Fluxo do Organizador

```
1. Criar campanha
   └── Informa: nome da campanha, item, preço e chave Pix

2. Receber Link Mágico de Gestão
   └── Token UUID gerado pelo banco → enviado por e-mail ou WhatsApp

3. Compartilhar Link Público com compradores
   └── Link sem token → qualquer pessoa pode acessar e fazer pedido

4. Gerenciar pelo Painel
   └── Visualiza pedidos por status: 🔴 Pendente | 🟡 Enviado | 🟢 Confirmado
   └── Confirma comprovantes recebidos
   └── Dispara cobrança amigável via WhatsApp para pendentes

5. Encerrar campanha
   └── Exporta lista de produção consolidada
```

### Fluxo do Comprador

```
1. Acessar link público da campanha
   └── Visualiza: nome da campanha, item, preço e recebedor do Pix

2. Selecionar itens e quantidade
   └── Interface conversacional — sem formulários técnicos

3. Realizar pagamento externo via Pix
   └── Chave Pix exibida na tela para cópia

4. Enviar comprovante
   └── Upload de print direto da galeria (compressão automática client-side)
   └── Dados armazenados de forma privada — fora do grupo de WhatsApp

5. Receber confirmação
   └── Notificação via WhatsApp ao ter o pedido confirmado pelo organizador
   └── Link de acompanhamento enviado para consulta futura
```

### Pipeline de Dados

```
Criação       → Organizador define campanha → DB gera slug + manager_token
Captação      → Comprador acessa → Seleciona → Paga → Faz upload do comprovante
Gestão        → Organizador valida no painel → Dispara notificações via WhatsApp
Encerramento  → Dados retidos por 90 dias → Exclusão automática (conformidade LGPD)
```

---

## 📁 4. Estrutura de Pastas

```
multiplica/
│
├── src/                        # Código-fonte do frontend (React)
│   ├── pages/
│   │   ├── CampaignPage.jsx    # Página pública do comprador
│   │   ├── ManagerDashboard.jsx # Painel do organizador (acesso via token)
│   │   └── CreateCampaign.jsx  # Formulário de criação de campanha
│   ├── components/             # Componentes reutilizáveis
│   └── utils/                  # Helpers (compressão de imagem, formatação, etc.)
│
├── scripts/                    # Automações e scripts utilitários
│   ├── whatsapp-notify.js      # Disparo de notificações via API WhatsApp
│   ├── friendly-reminder.js    # Cobrança amigável automatizada
│   └── compress-upload.js      # Compressão client-side de comprovantes
│
├── sql/                        # Definições de banco de dados (Supabase)
│   ├── schema.sql              # Criação de tabelas e relacionamentos
│   ├── rls-policies.sql        # Políticas de Row Level Security
│   ├── triggers.sql            # Trigger de imutabilidade de pedidos
│   └── functions.sql           # Funções auxiliares (ex: get_manager_token)
│
├── docs/                       # Documentação e regras de negócio
│   ├── arquitetura.md          # Decisões técnicas e trade-offs
│   ├── fluxos.md               # Diagramas de fluxo detalhados
│   ├── lgpd.md                 # Política de privacidade e retenção de dados
│   └── protótipo/              # Arquivos de design e wireframes
│
├── automations/                # Fluxos Make e n8n (exportados em JSON)
│   ├── make/
│   └── n8n/
│
├── .env.example                # Exemplo de variáveis de ambiente (sem valores reais)
├── .gitignore
├── package.json
└── README.md
```

---

## 🔐 5. Variáveis de Ambiente

Copie `.env.example` para `.env` e preencha com seus valores reais. **Nunca versione o arquivo `.env`.**

```env
# Supabase
SUPABASE_URL=                   # URL do seu projeto Supabase
SUPABASE_ANON_KEY=              # Chave pública (anon) do Supabase
SUPABASE_SERVICE_ROLE_KEY=      # Chave privada — usar SOMENTE no backend

# WhatsApp
WHATSAPP_API_TOKEN=             # Token da API de WhatsApp (ex: Z-API, Twilio ou Meta)
WHATSAPP_INSTANCE_ID=           # ID da instância (se aplicável ao provedor)

# Pix
PIX_KEY=                        # Chave Pix padrão do organizador (substituída por campanha)

# Aplicação
NEXT_PUBLIC_APP_URL=            # URL pública do app (ex: https://multiplica.app)
MANAGER_TOKEN_SECRET=           # Segredo para assinatura de tokens (se aplicável)
```

> ⚠️ **Segurança**: `SUPABASE_SERVICE_ROLE_KEY` concede acesso irrestrito ao banco. Use exclusivamente em funções server-side (Edge Functions ou backend próprio). Nunca exponha no frontend.

---

## 🔒 6. Segurança & Conformidade

### Arquitetura de Segurança

- **Zero-Auth via Token UUID**: o `manager_token` é transmitido via header HTTP customizado (`x-manager-token`), nunca como query string visível em logs
- **RLS (Row Level Security)**: cada campanha é isolada logicamente — um organizador jamais acessa dados de outra campanha
- **Imutabilidade via Trigger**: a função `prevent_order_data_change()` bloqueia alterações em `quantity`, `item_price` e `customer_name` após a criação do pedido
- **Validação server-side de uploads**: tipos aceitos (JPEG, PNG, PDF) e limite de tamanho validados nas políticas do Supabase Storage — independentemente do frontend
- **Rate limiting**: Edge Functions aplicam limite de requisições por IP no endpoint de `INSERT` público, prevenindo abuso e poluição de campanhas

### Conformidade LGPD

- Comprovantes e dados pessoais são armazenados de forma privada e criptografada
- Aviso de privacidade exibido no fluxo do comprador antes do upload
- Política de retenção: dados excluídos automaticamente **90 dias após o encerramento da campanha**
- Nenhum dado sensível (CPF, dados bancários) é exposto em grupos públicos

---

## 🚀 7. Roadmap

### MVP (Lançamento)
- [x] Criação de campanha com Link Mágico
- [x] Fluxo do comprador com upload de comprovante
- [x] Painel Semáforo do organizador
- [x] Cobrança amigável via WhatsApp
- [ ] Recuperação do Link Mágico por WhatsApp
- [ ] Notificação automática ao organizador ao receber comprovante
- [ ] Link de acompanhamento para o comprador (substitui localStorage)
- [ ] Política de privacidade e conformidade LGPD

### Pós-MVP
- [ ] Histórico de pedidos por comprador (múltiplas campanhas)
- [ ] Suporte a múltiplas campanhas simultâneas por organizador
- [ ] Exportação de lista de produção (PDF/CSV)
- [ ] Modelo freemium: campanhas básicas gratuitas + funcionalidades premium

---

## 📄 Licença

Este projeto está sob licença privada. Todos os direitos reservados.

---

*Multiplica — Juntos fazemos mais.*
