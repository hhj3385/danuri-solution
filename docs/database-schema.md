# Database Schema (Source of Truth)

**Version**: 2.0.0
**Last Updated**: 2025-02-05
**Database**: PostgreSQL 15

> ⚠️ Do not alter without approval. See CLAUDE.md Section 5.

---

## Schema Design Principles

| Principle | Implementation |
|-----------|----------------|
| **Primary Keys** | UUID (`uuid_generate_v4()`) - 예측 불가, 분산 환경 지원 |
| **Naming Convention** | `tb_` 접두사, snake_case 컬럼명 |
| **Audit Trail** | JSONB `changes` 컬럼으로 NoSQL급 유연성 확보 |
| **Multi-tenant** | `site_id` 기반 테넌트 분리 |
| **Timestamps** | `created_at`, `updated_at` with timezone |

---

## Tables Overview

| Table | Description | Key Features |
|-------|-------------|--------------|
| `tb_sites` | Multi-tenant 사이트 | Root entity, settings JSONB |
| `tb_users` | 사용자 정보 | Role-based access, preferences JSONB |
| `tb_tickets` | 서비스 요청/티켓 | Status flow, custom_fields JSONB |
| `tb_ticket_history` | 티켓 변경이력 | **JSONB changes** - NoSQL급 감사로그 |
| `tb_files` | 첨부파일 | Physical path, checksum verification |
| `tb_common_codes` | 공통코드 | Magic number 방지, 계층구조 지원 |
| `tb_notifications` | 사용자 알림 | Real-time push support |
| `tb_knowledge_base` | 지식베이스 | Full-text search, keywords array |
| `tb_audit_logs` | 시스템 감사로그 | Security/compliance logging |

---

## Entity Relationship Diagram

```
┌─────────────┐
│  tb_sites   │ (Multi-tenant Root)
└──────┬──────┘
       │ 1:N
       ▼
┌─────────────┐      ┌──────────────────┐
│  tb_users   │◄────▶│ tb_common_codes  │
└──────┬──────┘      └──────────────────┘
       │
       │ requester_id / assignee_id
       ▼
┌─────────────┐      ┌──────────────────┐
│ tb_tickets  │─────▶│ tb_ticket_history│ (JSONB changes)
└──────┬──────┘      └──────────────────┘
       │
       │ target_id
       ▼
┌─────────────┐      ┌──────────────────┐
│  tb_files   │      │ tb_notifications │
└─────────────┘      └──────────────────┘
```

---

## Table Schemas

### 1. tb_sites (멀티테넌트 루트)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| site_id | UUID | PK, DEFAULT uuid_generate_v4() | 사이트 고유 ID |
| site_code | VARCHAR(20) | NOT NULL, UNIQUE | 사이트 코드 |
| site_name | VARCHAR(100) | NOT NULL | 사이트 명칭 |
| site_domain | VARCHAR(255) | | 도메인 |
| is_active | BOOLEAN | DEFAULT TRUE | 활성화 여부 |
| settings | JSONB | DEFAULT '{}' | 사이트별 설정 |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | 생성일시 |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | 수정일시 |

### 2. tb_users (사용자)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| user_id | UUID | PK | 사용자 ID |
| site_id | UUID | FK → tb_sites, NOT NULL | 소속 사이트 |
| email | VARCHAR(255) | NOT NULL | 이메일 (로그인ID) |
| password_hash | VARCHAR(255) | NOT NULL | 비밀번호 해시 (bcrypt) |
| user_name | VARCHAR(100) | NOT NULL | 사용자명 |
| role_level | VARCHAR(20) | DEFAULT 'USER' | USER/AGENT/TENANT_ADMIN/SUPER_ADMIN |
| account_status | VARCHAR(20) | DEFAULT 'ACTIVE' | ACTIVE/INACTIVE/LOCKED/PENDING |
| preferences | JSONB | DEFAULT '{}' | 사용자 환경설정 |

**Unique Constraint**: `(site_id, email)`

### 3. tb_tickets (티켓/서비스요청)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| ticket_id | UUID | PK | 티켓 ID |
| site_id | UUID | FK → tb_sites, NOT NULL | 사이트 |
| ticket_no | VARCHAR(30) | NOT NULL | 티켓번호 (YYYYMMDD-NNNN) |
| ticket_type | VARCHAR(20) | DEFAULT 'SR' | SR/INCIDENT/PROBLEM/CHANGE/TASK |
| title | VARCHAR(500) | NOT NULL | 제목 |
| description | TEXT | | 상세내용 |
| status | VARCHAR(20) | DEFAULT 'RECEIVED' | 상태 |
| priority | VARCHAR(10) | DEFAULT 'MEDIUM' | LOW/MEDIUM/HIGH/URGENT |
| requester_id | UUID | FK → tb_users, NOT NULL | 요청자 |
| assignee_id | UUID | FK → tb_users | 담당자 |
| custom_fields | JSONB | DEFAULT '{}' | 동적 커스텀 필드 |
| tags | TEXT[] | | 태그 배열 |

**Unique Constraint**: `(site_id, ticket_no)`

### 4. tb_ticket_history (티켓 변경이력 - JSONB)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| history_id | UUID | PK | 이력 ID |
| ticket_id | UUID | FK → tb_tickets, NOT NULL | 티켓 ID |
| action_type | VARCHAR(30) | NOT NULL | 액션 유형 |
| **changes** | **JSONB** | NOT NULL, DEFAULT '{}' | **변경내역 (NoSQL 구조)** |
| memo | TEXT | | 메모/코멘트 |
| actor_id | UUID | FK → tb_users | 수행자 |
| actor_ip | INET | | 클라이언트 IP |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | 생성일시 |

**JSONB `changes` 예시**:
```json
{
  "field": "status",
  "old_value": "RECEIVED",
  "new_value": "PROCESSING",
  "reason": "담당자 배정 완료"
}
```

**Action Types**:
- `CREATED` - 티켓 생성
- `STATUS_CHANGED` - 상태 변경
- `ASSIGNED` - 담당자 배정
- `UPDATED` - 내용 수정
- `COMMENTED` - 코멘트 추가
- `FILE_ATTACHED` / `FILE_DELETED` - 파일 첨부/삭제
- `RESOLVED` - 해결 완료
- `REOPENED` - 재오픈
- `ESCALATED` - 에스컬레이션

---

## SR Status Flow

```
                    ┌───────────┐
                    │ RECEIVED  │ (접수)
                    └─────┬─────┘
                          │ Assign Assignee
                          ▼
                    ┌───────────┐
          ┌────────│ PROCESSING│────────┐
          │        │  (처리중)  │        │
          │        └─────┬─────┘        │
          │              │              │
          ▼              │              ▼
    ┌───────────┐        │        ┌───────────┐
    │  ON_HOLD  │        │        │ CANCELLED │
    │   (보류)   │────────┤        │   (취소)   │
    └───────────┘        │        └───────────┘
                         │ Resolve (Require Resolution)
                         ▼
                    ┌───────────┐
                    │ COMPLETED │ (완료)
                    └───────────┘
```

**Transition Rules**:
- `RECEIVED` → `PROCESSING`: **Assignee 필수**
- `PROCESSING` → `COMPLETED`: **Resolution 필수**
- `ON_HOLD` → `PROCESSING`: 보류 해제
- `COMPLETED` → `PROCESSING`: 재오픈 (REOPENED 이력 기록)

---

## Indexes

### Performance Indexes
```sql
-- Tickets
CREATE INDEX idx_tickets_site ON tb_tickets(site_id);
CREATE INDEX idx_tickets_status ON tb_tickets(status);
CREATE INDEX idx_tickets_created ON tb_tickets(created_at DESC);

-- Ticket History (JSONB)
CREATE INDEX idx_history_changes ON tb_ticket_history USING GIN(changes);

-- Full-text Search (Knowledge Base)
CREATE INDEX idx_kb_fulltext ON tb_knowledge_base
  USING GIN(to_tsvector('simple', title || ' ' || content));
```

---

## Migration Files

| File | Description |
|------|-------------|
| `20250205000001_initial_schema.ts` | 테이블/인덱스/트리거 생성 |
| `20250205000002_seed_initial_data.ts` | 초기 데이터 (사이트, 공통코드, 관리자) |

**실행 방법**:
```bash
cd services/core-api
npm run migrate
```

---

## Security Notes

1. **Password Storage**: bcrypt 해시만 저장 (평문 절대 금지)
2. **Audit Logging**: 모든 데이터 변경은 `tb_ticket_history` 또는 `tb_audit_logs`에 기록
3. **UUID**: 순차적 ID 대신 UUID 사용으로 예측 공격 방지
4. **JSONB Indexes**: GIN 인덱스로 JSONB 필드 검색 성능 확보

---

*Schema Version: 2.0.0*
