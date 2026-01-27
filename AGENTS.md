# ECLESYS — Copilot Instructions

You are assisting in the ECLESYS monorepo. Treat this as a real product (not a tutorial). Prefer professional, secure, maintainable solutions.

## Repository structure
- backend/eclesys-api  -> Spring Boot REST API
- frontend/eclesys-web -> Angular Web App (standalone, SSR)
- infra/               -> Docker, compose, configs

## General rules
- Keep changes small and surgical; avoid large refactors unless explicitly requested.
- Follow existing patterns and naming conventions in the codebase.
- Prefer clarity over cleverness. Avoid abbreviations in variable/method names.
- Do not introduce insecure shortcuts (no hardcoded secrets, no bypassing auth).
- Do not invent files/endpoints that don’t exist; when adding something new, do it cleanly and consistently.
- Prefer explicit, typed DTOs and clear boundaries (controller/service/repository).

## API response standard (MUST)
All API responses must follow this envelope:

Success:
{
  "status": "success",
  "data": ...
}

Error:
{
  "status": "error",
  "message": "Clear message"
}

Do not return raw objects directly from controllers.

## Backend (Spring Boot)
- Java 21
- Spring Web + Spring Security (JWT)
- JPA/Hibernate
- Flyway migrations
- PostgreSQL
- Use UUID as identifiers
- Use DTOs for request/response (never expose entities directly)
- Validate inputs (Bean Validation) and return clear error messages
- Keep controllers thin; business logic in services
- Prefer constructor injection
- Write readable, maintainable code

### Security
- JWT-based auth
- Protect endpoints under /api/**
- Principle of least privilege
- Never log passwords or JWT tokens
- Passwords must be hashed (BCrypt)

### Multi-tenancy
- Tenant ID must be present in all domain entities
- Filter by tenant in all queries (prevent data leaks)
- Tenant comes from authenticated user's JWT
- Never allow cross-tenant access

### Environment Variables
- Use UPPER_SNAKE_CASE
- Never commit .env files
- Document required vars in README
- Fail fast on missing required vars

### Logging
- Use SLF4J with appropriate levels
- Log errors with context (user/tenant info when safe)
- Never log: passwords, tokens, PII sensitive data
- Include request IDs for traceability

## Frontend (Angular)
- Angular standalone components
- SSR enabled
- Angular Material (M3)
- Use Signals for state
- Prefer modern Angular patterns (signals/computed/effect)
- Avoid heavy lifecycle-hook patterns where possible (prefer reactive setup)
- Always use external files for components: separate `.ts`, `.html`, and `.scss` (no inline template or styles).
- Layout standard for authenticated pages:
  - page container (.page)
  - header with title/subtitle and actions
  - outlined cards
  - consistent spacing and clean UX

### UX rules
- Snackbar only on success, with clear messages
- Confirm destructive actions with dialog (not snackbar)
- On cancel: immediately revert optimistic UI changes (e.g., toggle states)
- Keep accessibility in mind (labels, aria, tooltips)

## Git / commits
Use Conventional Commits with clear scope:

- feat(api): ...
- fix(api): ...
- chore(api): ...
- feat(web): ...
- fix(web): ...
- chore(infra): ...

Write short imperative subject + concise body when needed.

## Tooling
- Prefer commands runnable from repo root when possible
- Keep dev experience smooth (simple scripts, predictable environment)
- Do not add heavy dependencies without clear justification
