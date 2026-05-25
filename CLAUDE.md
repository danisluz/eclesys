# ECLESYS — Claude Code Instructions

Sistema SaaS multi-tenant de gestão eclesiástica em produção contínua.
**Toda comunicação deve ser em português. Todo código, commits e identificadores devem ser em inglês.**

---

## Estrutura do Monorepo

```
eclesys/
├── backend/eclesys-api/     # Spring Boot 3.5.0, Java 21
├── frontend/eclesys-web/    # Angular 21 com SSR
└── infra/dev/               # docker-compose com PostgreSQL, API e Frontend
```

---

## Comandos de Desenvolvimento

### Subir infraestrutura

```bash
cd infra/dev && docker compose up -d
```

### Backend

```bash
cd backend/eclesys-api
mvn spring-boot:run
# API disponível em http://localhost:8080
```

### Frontend

```bash
cd frontend/eclesys-web
npm run dev
# App disponível em http://localhost:4200
```

---

## Backend — Spring Boot

### Stack

- Java 21, Spring Boot 3.5.0
- Spring Security (JWT com JJWT 0.11.5)
- Spring Data JPA + Hibernate + PostgreSQL
- Flyway (migrations em `src/main/resources/db/migration/`)
- Bucket4j (rate limiting no login)
- OpenPDF (geração de PDF)
- Lombok

### Estrutura por feature

```
features/
├── auth/
├── users/
├── organizations/
├── church-roles/
├── function-roles/
├── members/
├── transfers/
├── communion/        # Hexagonal Architecture (Use Cases + Ports/Adapters)
├── tenants/
├── dashboard/
├── onboarding/
└── me/
```

### Padrão de resposta da API

```json
// Sucesso
{ "status": "success", "data": { ... } }

// Erro
{ "status": "error", "message": "Mensagem clara" }
```

### Segurança

- JWT stateless. Todos os endpoints `/api/**` exigem token, exceto:
  - `POST /api/auth/login`
  - `POST /api/public/onboarding`
  - `GET /api/public/**`
  - `GET /actuator/health`
- Rate limiting no login via Bucket4j
- Cloudflare Turnstile CAPTCHA (opcional, modo dev desabilitado)

### Multi-tenancy

- Toda entidade tem `tenant_id`
- `CurrentUserService` resolve o tenant do token JWT
- Nunca consultar dados sem filtrar por tenant

### Flyway — Migrations

Atualmente em V35. Sempre criar nova migration (`VN+1__descricao.sql`), **nunca alterar migrations existentes**.

---

## Frontend — Angular

### Stack

- Angular 21 standalone com SSR (Express)
- Angular Material (M3)
- Signals (estado reativo)
- Tailwind CSS 3.4
- RxJS 7.8
- ngx-mask (máscaras de input)
- Chart.js + ng2-charts
- Vitest (testes)

### Estrutura de rotas

**Públicas:**
- `/` — Landing page
- `/login` — Login
- `/signup` — Cadastro/Onboarding
- `/pricing` — Planos

**Protegidas (authGuard):**
- `/app/dashboard`
- `/app/members`
- `/app/organizations`
- `/app/church-roles`
- `/app/function-roles`
- `/app/users` (lazy-loaded)
- `/app/santa-ceia` (lazy-loaded)
- `/app/pending-approvals`
- `/app/profile`

### Padrão de componente

```
component-name/
├── component-name.component.ts
├── component-name.component.html
└── component-name.component.scss
```

### Serviços compartilhados

- `notification.service.ts` — Toasts/snackbars
- `cep-lookup.service.ts` — Busca de endereço por CEP (Brasil)
- `api-client.service.ts` — HTTP client base com interceptor JWT

---

## Domínios do Sistema

### Conceitos fundamentais (nunca confundir)

| Conceito | O que é | Exemplo |
|---|---|---|
| **ChurchRole** | Cargo eclesiástico | Membro, Diácono, Presbítero, Pastor |
| **FunctionRole** | Função organizacional | Líder, Tesoureiro, Secretário |
| **System Permission** | Permissão no software | Acesso a usuários, relatórios |

Os três são **completamente separados** e não se implicam.

### Hierarquia organizacional

```
Church (CHURCH)
└── Sector (SECTOR)   ← labels configuráveis por tenant
    └── Congregation (CONGREGATION)
```

Labels são configuráveis: o tenant define como chamar "Sector" e "Congregation".

### Ciclo de vida do membro

1. Cadastro com número de registro sequencial (por tenant)
2. Atribuição de cargo eclesiástico (ChurchRole)
3. Histórico de posições (`MemberPositionHistory`)
4. Transferências com fluxo de aprovação (`TransferStatus`: PENDING → APPROVED/REJECTED)

### Módulo Communion (Santa Ceia) — Hexagonal Architecture

Este módulo usa arquitetura hexagonal (ports & adapters). **Não misturar com o padrão das demais features.**

Fluxo de status do evento:
```
DRAFT → OPEN → CLOSED
```

Use Cases disponíveis: criação, abertura, fechamento, listagem, marcação de presença (batch e por número de registro), geração de lista em PDF.

---

## Banco de Dados

- PostgreSQL 16
- UUID como PK em todas as entidades
- Endereço armazenado como JSONB no `Member`
- Dados históricos (transferências, histórico de cargos) **nunca deletados**

### Migrations existentes (V1–V35)

V1 (UUID ext) → V2 (tenants) → V3 (users) → V4 (org units) → V6 (church roles) → V7 (members) → V8 (transfers) → V10 (function roles) → V22 (family relationships) → V25 (user org roles) → V27 (CPF + position history) → V32 (registration numbers) → V33-V34 (communion events + attendance) → V35 (org unit contacts)

---

## Git e Commits

Conventional Commits obrigatório:

```
feat(api): descrição
fix(api): descrição
feat(web): descrição
fix(web): descrição
chore(infra): descrição
```

---

## Regras Críticas

1. **Nunca alterar migrations Flyway existentes** — criar nova sempre
2. **Nunca consultar dados sem filtro de tenant**
3. **Dados históricos não são deletados** (transfers, position history)
4. **CPF é único por tenant**, não globalmente
5. **Módulo communion usa hexagonal** — não quebrar as abstrações de port/adapter
6. **Pagamento governa acesso** — há tabelas de billing (plans, subscriptions) no schema
7. Mudanças devem ser **pequenas e cirúrgicas**
8. **Não inventar abstrações** que o código ainda não precisa
