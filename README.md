# Eclesys

Eclesys is a multi-tenant SaaS for church management: members, congregations, ministry roles, reference/transfer letters, events, attendance, and more.

## Tech Stack
- **Backend:** Spring Boot (Java 21), Flyway, PostgreSQL
- **Frontend:** Angular (standalone)
- **Infrastructure:** Docker / Docker Compose
- **Deployment target:** Oracle Cloud VM (later stage)

## Monorepo Structure
- `backend/` Spring Boot API
- `frontend/` Angular web app
- `infra/` Docker Compose and infrastructure configuration

## Run Locally (Development)

### 1) Database (PostgreSQL)
```bash
cd infra/dev
docker compose up -d