# DANURI ITSM v2.0 - Architecture Document

## Overview

DANURI ITSM은 100% On-Premise 환경에서 운영되는 하이브리드 아키텍처 기반 IT 서비스 관리 시스템입니다.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        DANURI ITSM v2.0                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐                    │
│  │   User Portal   │    │  Admin Console  │                    │
│  │  (Next.js 14)   │    │ (Spring Boot)   │                    │
│  │   Port: 3000    │    │  Port: 8080     │                    │
│  └────────┬────────┘    └────────┬────────┘                    │
│           │                      │                              │
│           └──────────┬───────────┘                              │
│                      │                                          │
│           ┌──────────▼──────────┐                              │
│           │     Core API        │                              │
│           │  (Feathers.js v5)   │                              │
│           │   Port: 3030        │                              │
│           │   WebSocket/REST    │                              │
│           └──────────┬──────────┘                              │
│                      │                                          │
│           ┌──────────▼──────────┐                              │
│           │   PostgreSQL 15     │                              │
│           │    Port: 5432       │                              │
│           │   UUID + JSONB      │                              │
│           └─────────────────────┘                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| User Portal | Next.js (App Router) | 14.x | 사용자 웹 인터페이스 |
| Admin Console | Spring Boot + eGovFrame | 2.7.x + 4.2 | 관리자 콘솔 |
| Core API | Feathers.js + TypeScript | 5.x | REST/WebSocket API |
| Database | PostgreSQL | 15.x | 데이터 저장 |
| Container | Docker Compose | 3.8 | 컨테이너 오케스트레이션 |

## Security Constraints

### On-Premise Requirements
- ✅ No external CDN dependencies
- ✅ No SaaS service connections
- ✅ All static assets served locally
- ✅ TLS 1.3 for all communications

### Secure Coding Standards
- ✅ No hardcoded credentials (environment variables only)
- ✅ No magic numbers (use constants or tb_common_codes)
- ✅ UUID for primary keys
- ✅ JSONB for audit logs

## Directory Structure

```
danuri-itsm/
├── .bkit/                    # Context & Prompts
├── apps/
│   ├── user-portal/          # Next.js 14 (App Router)
│   │   ├── src/
│   │   │   ├── app/          # App Router pages
│   │   │   ├── components/   # React components
│   │   │   └── lib/          # Utilities
│   │   ├── package.json
│   │   └── tailwind.config.ts
│   │
│   └── admin-console/        # Spring Boot (eGovFrame)
│       ├── src/main/java/
│       ├── src/main/resources/
│       └── build.gradle
│
├── services/
│   └── core-api/             # Feathers.js v5
│       ├── src/
│       │   ├── services/     # Feathers services
│       │   ├── hooks/        # Feathers hooks
│       │   └── models/       # Database models
│       ├── package.json
│       └── tsconfig.json
│
├── infra/
│   ├── docker/
│   │   ├── docker-compose.yml
│   │   └── .env.example
│   └── scripts/
│
├── docs/
│   └── ARCHITECTURE.md
│
└── CLAUDE.md                 # AI Context Rules
```

## Communication Flow

1. **User Portal ↔ Core API**
   - REST API for CRUD operations
   - WebSocket (Socket.io) for real-time updates

2. **Admin Console ↔ Core API**
   - REST API calls via Spring WebClient
   - JWT authentication

3. **Core API ↔ PostgreSQL**
   - Knex.js query builder
   - Connection pooling via pg

## Environment Configuration

All sensitive configuration via environment variables:

| Variable | Description | Required |
|----------|-------------|----------|
| `POSTGRES_PASSWORD` | Database password | Yes |
| `JWT_SECRET` | JWT signing secret (min 32 chars) | Yes |
| `SPRING_DATASOURCE_PASSWORD` | Spring DB password | Yes |

## Deployment

```bash
# 1. Copy environment file
cp infra/docker/.env.example infra/docker/.env

# 2. Configure environment variables
vi infra/docker/.env

# 3. Start services
docker compose --env-file infra/docker/.env -f infra/docker/docker-compose.yml up -d
```

---
*Document Version: 1.0.0*
*Last Updated: Phase 1 - Foundation & Scaffolding*
