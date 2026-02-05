# DANURI ITSM v2.0 - PDCA Status Tracker

## Current Phase: Phase 2 - Schema Design ✅

---

## Phase 1: Foundation & Scaffolding ✅ COMPLETED

### Checklist
- [x] 디렉토리 구조 생성 (apps/, services/, infra/, docs/)
- [x] Docker Compose 설정 (PostgreSQL 15)
- [x] 환경변수 기반 설정 (No Hardcoding)
- [x] 보안 헤더 설정 (HSTS, XSS, CSP)

### Tech Lead Review
- [x] Java 17 호환성 확인 (`sourceCompatibility = '17'`)
- [x] Feathers.js v5 환경변수 매핑 (`custom-environment-variables.json`)
- [x] Docker 내부 네트워킹 (Client/Server URL 분리)

---

## Phase 2: Schema Design ✅ COMPLETED

### Plan (계획) ✅
- [x] 기존 database-schema.md 분석
- [x] UUID Primary Key 전략 결정
- [x] JSONB 감사로그 설계 방침 수립

### Do (실행) ✅
- [x] DDL 스크립트 작성
  - `infra/docker/init-scripts/001_init_schema.sql`
- [x] Knex 마이그레이션 파일 생성
  - `services/core-api/migrations/20250205000001_initial_schema.ts`
  - `services/core-api/migrations/20250205000002_seed_initial_data.ts`
- [x] knexfile.ts 설정

### Check (검증) ✅

| 요구사항 | 상태 | 구현 내용 |
|---------|------|----------|
| tb_ 접두사 | ✅ | 모든 테이블에 적용 |
| snake_case | ✅ | 모든 컬럼명에 적용 |
| UUID Primary Key | ✅ | Serial → UUID 전환 완료 |
| JSONB 감사로그 | ✅ | tb_ticket_history.changes |
| 공통코드 | ✅ | tb_common_codes 초기데이터 포함 |

### 생성된 테이블 (9개)

| 테이블 | 용도 | Key Features |
|--------|------|--------------|
| tb_sites | 멀티테넌트 | settings JSONB |
| tb_users | 사용자 | preferences JSONB |
| tb_common_codes | 공통코드 | 계층구조 지원 |
| tb_tickets | 티켓 | custom_fields JSONB, tags[] |
| tb_ticket_history | 변경이력 | **changes JSONB** |
| tb_files | 첨부파일 | checksum SHA-256 |
| tb_notifications | 알림 | Real-time support |
| tb_knowledge_base | 지식베이스 | Full-text search |
| tb_audit_logs | 시스템 감사 | Compliance |

---

## Security Compliance Report (Phase 2)

| Rule | Status | Implementation |
|------|--------|----------------|
| UUID Primary Keys | ✅ Pass | `uuid_generate_v4()` |
| JSONB Audit Trail | ✅ Pass | `tb_ticket_history.changes` |
| Password Hashing | ✅ Pass | bcrypt hash only |
| No Magic Numbers | ✅ Pass | `tb_common_codes` 사용 |
| GIN Index for JSONB | ✅ Pass | `idx_history_changes` |

---

## Next Phase: Phase 3 - API Specification

### Pending Tasks
- [ ] Feathers.js 서비스 구현 (users, tickets, etc.)
- [ ] REST API 엔드포인트 정의
- [ ] WebSocket 실시간 이벤트 설계
- [ ] JWT 인증 플로우 구현

---

## History

| Date | Phase | Action | Status |
|------|-------|--------|--------|
| 2025-02-05 | Phase 1 | Foundation & Scaffolding | ✅ Completed |
| 2025-02-05 | Phase 1 | Tech Lead Review (3 Checkpoints) | ✅ Passed |
| 2025-02-05 | Phase 2 | Schema Design (DDL + Migration) | ✅ Completed |

---

*Last Updated: 2025-02-05*
*Methodology: PDCA (Plan-Do-Check-Act)*
