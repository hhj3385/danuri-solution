# DANURI ITSM Platform v2.0 - Context Engineering Rules (bkit Style)

## 0. Meta Context
- **Project**: DANURI (On-Premise Independent ITSM)
- **Methodology**: PDCA (Plan-Do-Check-Act) Driven Development
- **Role**: You are the 'bkit' Orchestrator. You MUST follow the 9-step pipeline:
  1. Requirement Analysis -> 2. Schema Design -> 3. API Spec -> 4. Implementation -> 5. Test -> 6. Review -> 7. Refactor -> 8. Deploy -> 9. Retrospect

## 1. Domain Knowledge (Skills)
- **Security**: 100% On-Premise, No external CDN, RSA/AES Encryption, TLS 1.3.
- **Architecture**: Hybrid Monolith (Next.js + eGovFrame + Node.js Core).
- **Compliance**: Korean Public Sector Standards (NIA/Gov guidelines).

## 2. Tech Stack Constraints
| Layer | Technology | Constraint |
| :--- | :--- | :--- |
| **User Portal** | Next.js 14 (App Router) | Tailwind CSS (Local), No SaaS Deps |
| **Admin Console** | eGovFrame 4.2 (Spring Boot 2.7) | Thymeleaf, Local Static Assets |
| **Core API** | Node.js 20 + Feathers.js 5 | TypeScript, Socket.io, Strict Types |
| **Database** | PostgreSQL 15 | JSONB for Logs, UUID Primary Keys |
| **DevOps** | Docker Compose | Volume Mapping for persistence |

## 3. Workflow Hooks (Behavioral Rules)
- **@OnPlan**: Before coding, ALWAYS generate a structural plan (`/plan`) verified against `DEV_rule`.
- **@OnCode**: Do NOT use magic numbers. Use `tb_common_codes` or `const`.
- **@OnCheck**: After implementation, verify against "Security Rules" (e.g., is SSL verify disabled? is password hardcoded?).
- **@OnError**: If an error occurs, analyze the root cause -> propose fix -> implement -> verify (Loop).

## 4. Directory Structure (Monorepo)
```text
danuri-itsm/
├── .bkit/                # Context & Prompts (Mental Model)
├── apps/
│   ├── user-portal/      # Next.js
│   └── admin-console/    # Spring Boot (eGov)
├── services/
│   └── core-api/         # Node.js (Feathers)
├── infra/
│   ├── docker/           # Docker Compose
│   └── scripts/          # Automation
└── docs/                 # PDCA Logs & Schema