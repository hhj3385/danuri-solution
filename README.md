# DANURI ITSM Platform v2.0

On-Premise Independent ITSM Portal (Non-SaaS, Non-Widget).

## Architecture

| Layer | Tech | Path |
|-------|------|------|
| User Portal | Next.js 14+ (App Router), Tailwind | `apps/user-portal/` |
| Admin Console | eGovFrame 4.2 (Spring Boot 2.7), Thymeleaf | `apps/admin-console/` |
| Core API | Node.js 20, Feathers.js 5.x (TypeScript) | `services/core-api/` |
| Database | PostgreSQL 15+ | - |
| Infra | Docker Compose, Nginx | `infra/docker/` |

## Quick Start

1. Copy `.env.example` to `.env` and set credentials.
2. Start DB: `docker compose -f infra/docker/docker-compose.yml up -d postgres`
3. Run Core API: `cd services/core-api && npm run dev`
4. Run User Portal: `cd apps/user-portal && npm run dev`
5. Run Admin Console: `cd apps/admin-console && ./gradlew bootRun`

See [CLAUDE.md](./CLAUDE.md) for development rules and schema.
