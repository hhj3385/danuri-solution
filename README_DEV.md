# DANURI - 임베더블 AI 챗봇 & 통합 관제 시스템

> **개발자용 아키텍처 문서 (v1.0)**

---

## 목차

1. [프로젝트 개요](#1-프로젝트-개요)
2. [시스템 아키텍처](#2-시스템-아키텍처)
3. [프로젝트 구조](#3-프로젝트-구조)
4. [컴포넌트 상세](#4-컴포넌트-상세)
5. [데이터베이스 스키마](#5-데이터베이스-스키마)
6. [보안 핸드셰이크 (RSA)](#6-보안-핸드셰이크-rsa)
7. [챗봇 인터랙션 흐름](#7-챗봇-인터랙션-흐름)
8. [API 명세](#8-api-명세)
9. [개발 환경 설정](#9-개발-환경-설정)
10. [배포 가이드](#10-배포-가이드)

---

## 1. 프로젝트 개요

### 1.1 핵심 목표

외부 웹사이트에 스크립트 형태로 삽입되는 **DANURI 챗봇 위젯**을 통해 사용자 요청을 접수하고, 중앙 관리자(Admin) 시스템에서 여러 외부 사이트의 티켓(SR)을 통합 처리한다.

### 1.2 주요 기능

| 기능 | 설명 |
|------|------|
| **임베더블 위젯** | 외부 사이트에 `<script>` 태그로 삽입되는 경량 챗봇 |
| **지식베이스 검색** | FAQ/이력 기반 키워드 검색으로 즉시 답변 제공 |
| **SR 등록** | 해결 불가 시 자동으로 서비스 요청 티켓 생성 |
| **실시간 알림** | Socket.io 기반 처리 상태 실시간 푸시 |
| **통합 관제** | 멀티테넌트 SR 통합 관리 대시보드 |

### 1.3 기술 스택

| 레이어 | 기술 |
|--------|------|
| **Widget (SDK)** | Vanilla JS, Rollup, Socket.io-client |
| **API Server** | Node.js, Feathers.js v5, PostgreSQL, Socket.io |
| **Admin Server** | eGovFrame 4.x (Spring Boot), Thymeleaf |
| **Database** | PostgreSQL 15+ |
| **Infra** | Docker, Nginx |

---

## 2. 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              EXTERNAL SITES                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                       │
│  │   Site A     │  │   Site B     │  │   Site C     │                       │
│  │ ┌──────────┐ │  │ ┌──────────┐ │  │ ┌──────────┐ │                       │
│  │ │  Widget  │ │  │ │  Widget  │ │  │ │  Widget  │ │                       │
│  │ └────┬─────┘ │  │ └────┬─────┘ │  │ └────┬─────┘ │                       │
│  └──────┼───────┘  └──────┼───────┘  └──────┼───────┘                       │
└─────────┼─────────────────┼─────────────────┼───────────────────────────────┘
          │ HTTPS + WSS     │                 │
          └─────────────────┼─────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DANURI PLATFORM                                    │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                         Load Balancer (Nginx)                          │ │
│  └────────────────────────────┬───────────────────────────────────────────┘ │
│                               │                                              │
│         ┌─────────────────────┼─────────────────────┐                       │
│         ▼                     ▼                     ▼                       │
│  ┌─────────────┐      ┌─────────────┐      ┌─────────────┐                  │
│  │ API Server  │      │ API Server  │      │ Admin Server│                  │
│  │ (Feathers)  │◄────►│ (Feathers)  │      │ (eGovFrame) │                  │
│  │  :3030      │      │  :3031      │      │  :8080      │                  │
│  └──────┬──────┘      └──────┬──────┘      └──────┬──────┘                  │
│         │                    │                    │                         │
│         └────────────────────┼────────────────────┘                         │
│                              ▼                                               │
│                    ┌─────────────────┐                                       │
│                    │   PostgreSQL    │                                       │
│                    │     :5432       │                                       │
│                    └─────────────────┘                                       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. 프로젝트 구조

```
danuri-solution/
│
├── README_DEV.md                 # 본 문서
├── PLAN.md                       # 설계 계획서
├── .gitignore
├── .env.example                  # 환경변수 템플릿
│
├── packages/
│   │
│   ├── widget/                   # ━━━ 임베더블 챗봇 위젯 (Client SDK) ━━━
│   │   ├── src/
│   │   │   ├── index.js          # 진입점 - DanuriWidget 전역 객체 노출
│   │   │   ├── core/
│   │   │   │   ├── widget.js     # 위젯 초기화 및 라이프사이클
│   │   │   │   ├── chat.js       # 채팅 UI 렌더링 및 메시지 처리
│   │   │   │   └── crypto.js     # RSA 공개키 암호화
│   │   │   ├── api/
│   │   │   │   └── client.js     # REST API 클라이언트
│   │   │   ├── socket/
│   │   │   │   └── realtime.js   # Socket.io 실시간 통신
│   │   │   └── styles/
│   │   │       └── widget.css    # 위젯 스타일 (CSS-in-JS 번들)
│   │   ├── dist/
│   │   │   └── danuri-widget.js  # 배포용 UMD 번들
│   │   ├── rollup.config.js
│   │   └── package.json
│   │
│   ├── api-server/               # ━━━ 백엔드 API 서버 (Node.js/Feathers.js) ━━━
│   │   ├── src/
│   │   │   ├── app.js            # Feathers 앱 설정
│   │   │   ├── index.js          # 서버 시작점
│   │   │   ├── services/
│   │   │   │   ├── index.js      # 서비스 등록
│   │   │   │   ├── sites/        # 외부 사이트(Tenant) 관리
│   │   │   │   ├── api-keys/     # RSA 키쌍 관리
│   │   │   │   ├── tickets/      # SR(티켓) CRUD
│   │   │   │   ├── knowledge/    # FAQ/지식베이스 검색
│   │   │   │   ├── chat/         # 챗봇 메시지 처리
│   │   │   │   ├── auth/         # 인증 (핸드셰이크, JWT)
│   │   │   │   └── mail/         # 아웃바운드 메일 발송
│   │   │   ├── hooks/            # 공통 훅 (로깅, 검증 등)
│   │   │   ├── middleware/
│   │   │   │   └── decrypt.js    # RSA 복호화 미들웨어
│   │   │   ├── channels.js       # Socket.io 채널 설정
│   │   │   └── models/           # DB 모델 정의
│   │   ├── migrations/           # Knex 마이그레이션
│   │   ├── seeds/                # 초기 데이터 시딩
│   │   ├── config/
│   │   │   ├── default.json
│   │   │   └── production.json
│   │   ├── test/                 # 테스트 코드
│   │   └── package.json
│   │
│   └── admin-server/             # ━━━ 관리자 시스템 (eGovFrame/Spring Boot) ━━━
│       ├── src/main/
│       │   ├── java/kr/go/danuri/admin/
│       │   │   ├── DanuriAdminApplication.java
│       │   │   ├── controller/
│       │   │   │   ├── DashboardController.java
│       │   │   │   ├── TicketController.java
│       │   │   │   └── SiteController.java
│       │   │   ├── service/
│       │   │   │   ├── TicketService.java
│       │   │   │   └── SiteService.java
│       │   │   ├── repository/
│       │   │   ├── dto/
│       │   │   └── config/
│       │   │       └── SecurityConfig.java
│       │   └── resources/
│       │       ├── templates/    # Thymeleaf 템플릿
│       │       ├── static/       # 정적 리소스
│       │       └── application.yml
│       ├── build.gradle
│       └── pom.xml
│
├── docker/
│   ├── docker-compose.yml        # 로컬 개발환경
│   ├── docker-compose.prod.yml   # 프로덕션
│   ├── widget.Dockerfile
│   ├── api.Dockerfile
│   └── admin.Dockerfile
│
└── scripts/
    ├── generate-keys.js          # RSA 키쌍 생성 유틸리티
    └── setup-db.sh               # DB 초기화 스크립트
```

---

## 4. 컴포넌트 상세

### 4.1 임베더블 위젯 (Widget/SDK)

**목적:** 외부 웹사이트에 삽입되어 챗봇 UI를 제공

**설계 원칙:**
- **Zero Dependencies:** Vanilla JS로 작성, 외부 프레임워크 의존성 없음
- **경량화:** 번들 크기 50KB 미만 목표 (gzip 압축 시)
- **격리:** Shadow DOM 활용하여 호스트 사이트 스타일 간섭 방지

**사용 예시:**
```html
<!-- 외부 사이트에 삽입 -->
<script src="https://cdn.danuri.go.kr/widget/v1/danuri-widget.js"></script>
<script>
  // 외부 사이트가 사용자 정보를 공개키로 암호화하여 전달
  DanuriWidget.init({
    siteKey: 'sk_live_abc123...',  // 사이트 식별키
    position: 'bottom-right',       // 위젯 위치
    theme: 'light',                 // 테마
    user: {
      // 공개키로 암호화된 사용자 정보
      encryptedPayload: 'eyJhbGciOiJSU0...'
    }
  });
</script>
```

### 4.2 API 서버 (Feathers.js)

**목적:** 모든 비즈니스 로직 처리 및 실시간 통신

**주요 서비스:**

| 서비스 | 경로 | 설명 |
|--------|------|------|
| `auth` | `/api/auth/*` | 핸드셰이크, JWT 발급/검증 |
| `sites` | `/api/sites` | 테넌트(외부 사이트) 관리 |
| `api-keys` | `/api/keys` | RSA 키쌍 생성/관리 |
| `tickets` | `/api/tickets` | SR 생성/조회/수정/삭제 |
| `knowledge` | `/api/knowledge` | FAQ 검색 |
| `chat` | `/api/chat` | 챗봇 메시지 처리 |
| `mail` | 내부 서비스 | 이메일 발송 |

**실시간 이벤트 (Socket.io):**

| 이벤트 | 방향 | 설명 |
|--------|------|------|
| `ticket:created` | Server → Client | SR 생성 알림 |
| `ticket:updated` | Server → Client | SR 상태 변경 알림 |
| `ticket:assigned` | Server → Client | 담당자 배정 알림 |

### 4.3 관리자 시스템 (eGovFrame)

**목적:** 멀티테넌트 SR 통합 관리

**주요 화면:**

| 화면 | 경로 | 설명 |
|------|------|------|
| 대시보드 | `/admin/dashboard` | 전체 현황, 통계 차트 |
| 티켓 목록 | `/admin/tickets` | SR 목록 (필터/검색) |
| 티켓 상세 | `/admin/tickets/{id}` | SR 상세 및 처리 |
| 사이트 관리 | `/admin/sites` | 테넌트 등록/수정 |
| 키 관리 | `/admin/sites/{id}/keys` | API 키 발급/폐기 |

---

## 5. 데이터베이스 스키마

### 5.1 ERD 개요

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   sites     │       │  api_keys   │       │   users     │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ id (PK)     │◄──┬───│ site_id(FK) │   ┌───│ site_id(FK) │
│ name        │   │   │ public_key  │   │   │ email       │
│ domain      │   │   │ private_key │   │   │ name        │
│ status      │   │   │ status      │   │   └─────────────┘
└─────────────┘   │   └─────────────┘   │          │
                  │                     │          │
                  │   ┌─────────────┐   │          │
                  │   │  knowledge  │   │          │
                  │   ├─────────────┤   │          │
                  └───│ site_id(FK) │   │          │
                      │ question    │   │          ▼
                      │ answer      │   │   ┌─────────────┐
                      │ keywords[]  │   │   │   tickets   │
                      └─────────────┘   │   ├─────────────┤
                                        └───│ site_id(FK) │
                                            │ user_id(FK) │───┐
                                            │ ticket_no   │   │
                                            │ title       │   │
                                            │ status      │   │
                                            └─────────────┘   │
                                                   │          │
                                                   ▼          │
                                            ┌─────────────┐   │
                                            │ticket_history   │
                                            ├─────────────┤   │
                                            │ticket_id(FK)│◄──┘
                                            │ action      │
                                            │ old_value   │
                                            │ new_value   │
                                            └─────────────┘
```

### 5.2 테이블 정의

#### sites (외부 사이트/테넌트)
```sql
CREATE TABLE sites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    domain VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_sites_domain ON sites(domain);
CREATE INDEX idx_sites_status ON sites(status);
```

#### api_keys (RSA 키쌍)
```sql
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    key_id VARCHAR(50) NOT NULL UNIQUE,  -- sk_live_xxx, sk_test_xxx
    public_key TEXT NOT NULL,
    private_key TEXT NOT NULL,  -- AES-256 암호화 저장
    key_type VARCHAR(10) DEFAULT 'live' CHECK (key_type IN ('live', 'test')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
    expires_at TIMESTAMP WITH TIME ZONE,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_api_keys_site ON api_keys(site_id);
CREATE INDEX idx_api_keys_key_id ON api_keys(key_id);
```

#### users (챗봇 이용자)
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(100),
    metadata JSONB DEFAULT '{}',
    last_seen_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(site_id, email)
);

CREATE INDEX idx_users_site_email ON users(site_id, email);
```

#### tickets (SR/티켓)
```sql
CREATE TABLE tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES sites(id),
    user_id UUID NOT NULL REFERENCES users(id),
    ticket_no VARCHAR(20) NOT NULL UNIQUE,  -- SR-20260128-0001
    title VARCHAR(200) NOT NULL,
    content TEXT,
    category VARCHAR(50),
    status VARCHAR(20) DEFAULT 'pending'
        CHECK (status IN ('pending', 'in_progress', 'waiting', 'resolved', 'closed')),
    priority VARCHAR(10) DEFAULT 'medium'
        CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    assigned_to UUID,  -- admin_users 테이블 참조 (별도)
    resolution TEXT,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_tickets_site ON tickets(site_id);
CREATE INDEX idx_tickets_user ON tickets(user_id);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_created ON tickets(created_at DESC);

-- 티켓 번호 자동 생성 함수
CREATE OR REPLACE FUNCTION generate_ticket_no()
RETURNS TRIGGER AS $$
DECLARE
    today_count INT;
    today_str VARCHAR(8);
BEGIN
    today_str := TO_CHAR(NOW(), 'YYYYMMDD');
    SELECT COUNT(*) + 1 INTO today_count
    FROM tickets
    WHERE ticket_no LIKE 'SR-' || today_str || '-%';

    NEW.ticket_no := 'SR-' || today_str || '-' || LPAD(today_count::TEXT, 4, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_ticket_no
    BEFORE INSERT ON tickets
    FOR EACH ROW
    EXECUTE FUNCTION generate_ticket_no();
```

#### knowledge (지식베이스/FAQ)
```sql
CREATE TABLE knowledge (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID REFERENCES sites(id) ON DELETE CASCADE,  -- NULL = 공통
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    keywords TEXT[] NOT NULL DEFAULT '{}',
    category VARCHAR(50),
    hit_count INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Full-Text Search 인덱스
CREATE INDEX idx_knowledge_search ON knowledge
    USING GIN (to_tsvector('simple', question || ' ' || answer || ' ' || array_to_string(keywords, ' ')));
CREATE INDEX idx_knowledge_keywords ON knowledge USING GIN (keywords);
```

#### ticket_history (티켓 이력)
```sql
CREATE TABLE ticket_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,  -- created, status_changed, assigned, commented, resolved
    old_value JSONB,
    new_value JSONB,
    comment TEXT,
    created_by UUID,  -- admin or system
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_ticket_history_ticket ON ticket_history(ticket_id);
CREATE INDEX idx_ticket_history_created ON ticket_history(created_at DESC);
```

---

## 6. 보안 핸드셰이크 (RSA)

### 6.1 개요

외부 사이트와 DANURI 간의 안전한 사용자 인증을 위해 RSA 비대칭 암호화를 사용한다.

- **공개키 (Public Key):** 외부 사이트에 배포 → 사용자 정보 암호화용
- **개인키 (Private Key):** DANURI 서버에만 보관 → 복호화용

### 6.2 시퀀스 다이어그램

```mermaid
sequenceDiagram
    autonumber
    participant Admin as DANURI Admin
    participant ExtSite as 외부 사이트 서버
    participant Browser as 사용자 브라우저
    participant Widget as DANURI Widget
    participant API as DANURI API Server
    participant DB as PostgreSQL

    rect rgb(240, 248, 255)
        Note over Admin,DB: Phase 1: 사이트 등록 및 키 발급 (1회)
        Admin->>API: POST /api/sites (사이트 등록)
        API->>API: RSA-2048 키쌍 생성
        API->>DB: 사이트 + 키쌍 저장 (개인키는 AES 암호화)
        API-->>Admin: { siteKey, publicKey }
        Admin-->>ExtSite: 공개키 전달 (안전한 채널)
    end

    rect rgb(255, 250, 240)
        Note over ExtSite,DB: Phase 2: 사용자 세션 초기화
        Browser->>ExtSite: 페이지 요청
        ExtSite->>ExtSite: 로그인된 사용자 정보 확인
        ExtSite->>ExtSite: 사용자 정보를 공개키로 RSA 암호화
        Note right of ExtSite: payload = RSA_Encrypt(publicKey, {<br/>  email: "user@example.com",<br/>  name: "홍길동",<br/>  timestamp: 1706428800<br/>})
        ExtSite-->>Browser: HTML + 암호화된 payload
    end

    rect rgb(240, 255, 240)
        Note over Browser,DB: Phase 3: 위젯 핸드셰이크
        Browser->>Widget: DanuriWidget.init({ siteKey, encryptedPayload })
        Widget->>API: POST /api/auth/handshake<br/>{ siteKey, encryptedPayload }
        API->>DB: siteKey로 개인키 조회
        DB-->>API: 암호화된 개인키
        API->>API: 개인키 복호화 (AES)
        API->>API: payload 복호화 (RSA)
        API->>API: timestamp 유효성 검증 (5분 이내)
        API->>DB: 사용자 조회 or 생성
        DB-->>API: user
        API->>API: JWT 토큰 생성 (1시간 유효)
        API-->>Widget: { token, user: { id, name }, wsToken }
        Widget->>Widget: 토큰 메모리 저장
    end

    rect rgb(255, 240, 245)
        Note over Browser,DB: Phase 4: 실시간 연결 수립
        Widget->>API: WebSocket 연결<br/>auth: { wsToken }
        API->>API: wsToken 검증
        API->>API: 사용자를 site:{siteId} 채널에 조인
        API-->>Widget: connected
    end

    rect rgb(248, 248, 255)
        Note over Browser,DB: Phase 5: API 호출 (이후 모든 요청)
        Widget->>API: GET /api/tickets<br/>Authorization: Bearer {JWT}
        API->>API: JWT 검증
        API->>DB: 쿼리 실행
        DB-->>API: 결과
        API-->>Widget: { data: [...] }
    end
```

### 6.3 암호화 페이로드 구조

**외부 사이트에서 암호화할 데이터:**
```javascript
// 암호화 전 원본
const payload = {
  email: "user@example.com",
  name: "홍길동",
  userId: "ext-user-123",      // 외부 사이트 사용자 ID (선택)
  metadata: { role: "member" }, // 추가 정보 (선택)
  timestamp: Date.now()         // 필수: 재전송 공격 방지
};

// RSA-OAEP로 암호화
const encryptedPayload = rsaEncrypt(publicKey, JSON.stringify(payload));
```

### 6.4 구현 코드 예시

**외부 사이트 (암호화):**
```javascript
// 공개키로 사용자 정보 암호화
async function encryptUserInfo(publicKeyPem, userInfo) {
  const publicKey = await crypto.subtle.importKey(
    'spki',
    pemToArrayBuffer(publicKeyPem),
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    false,
    ['encrypt']
  );

  const payload = JSON.stringify({
    ...userInfo,
    timestamp: Date.now()
  });

  const encrypted = await crypto.subtle.encrypt(
    { name: 'RSA-OAEP' },
    publicKey,
    new TextEncoder().encode(payload)
  );

  return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
}
```

**API 서버 (복호화):**
```javascript
// 개인키로 복호화 및 검증
const crypto = require('crypto');

function decryptUserInfo(privateKeyPem, encryptedPayload) {
  const buffer = Buffer.from(encryptedPayload, 'base64');

  const decrypted = crypto.privateDecrypt(
    {
      key: privateKeyPem,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256'
    },
    buffer
  );

  const payload = JSON.parse(decrypted.toString());

  // timestamp 검증 (5분 이내)
  const now = Date.now();
  if (now - payload.timestamp > 5 * 60 * 1000) {
    throw new Error('Expired payload');
  }

  return payload;
}
```

---

## 7. 챗봇 인터랙션 흐름

### 7.1 시퀀스 다이어그램

```mermaid
sequenceDiagram
    autonumber
    participant User as 사용자
    participant Widget as DANURI Widget
    participant API as API Server
    participant KB as Knowledge Base
    participant Mail as Mail Service
    participant WS as WebSocket

    User->>Widget: 질문 입력<br/>"비밀번호를 잊어버렸어요"

    Widget->>API: POST /api/chat<br/>{ message, sessionId }

    API->>KB: 키워드 검색<br/>SELECT ... WHERE keywords @> ARRAY['비밀번호', '잊어버림']
    KB-->>API: 매칭 결과 (score 기반 정렬)

    alt 답변 발견 (score >= threshold)
        API-->>Widget: {<br/>  type: 'answer',<br/>  content: '비밀번호 재설정은...',<br/>  confidence: 0.85,<br/>  actions: ['resolved', 'more_help']<br/>}
        Widget-->>User: 답변 표시 + 피드백 버튼

        alt 사용자: "해결됨" 클릭
            Widget->>API: POST /api/chat/feedback { helpful: true }
            API->>KB: UPDATE hit_count + 1
        else 사용자: "추가 도움 필요" 클릭
            Widget-->>User: SR 등록 폼 표시
        end

    else 답변 없음 또는 낮은 confidence
        API-->>Widget: {<br/>  type: 'sr_form',<br/>  fields: ['title', 'content', 'category'],<br/>  prefill: { content: '비밀번호를 잊어버렸어요' }<br/>}
        Widget-->>User: SR 등록 폼 표시 (질문 내용 자동 입력)

        User->>Widget: 폼 작성 후 제출
        Widget->>API: POST /api/tickets {<br/>  title: '비밀번호 재설정 요청',<br/>  content: '...',<br/>  category: 'account'<br/>}

        API->>API: SR 번호 생성<br/>SR-20260128-0001
        API->>Mail: 접수 완료 메일 발송
        Mail-->>User: 📧 이메일 수신

        API-->>Widget: {<br/>  ticket: { id, ticketNo, status }<br/>}

        API--)WS: EMIT ticket:created<br/>to: site:{siteId}
        WS--)Widget: ticket:created 이벤트

        Widget-->>User: "SR-20260128-0001 접수 완료" 알림
    end

    Note over User,WS: 이후 SR 상태 변경 시

    API--)WS: EMIT ticket:updated<br/>{ ticketNo, status: 'resolved' }
    WS--)Widget: ticket:updated 이벤트
    Widget-->>User: "SR 처리 완료" 팝업 알림
```

### 7.2 키워드 검색 로직

```sql
-- PostgreSQL Full-Text Search + 키워드 배열 매칭 조합
WITH search_query AS (
  SELECT
    id,
    question,
    answer,
    -- 키워드 배열 매칭 점수
    (SELECT COUNT(*) FROM unnest(keywords) k WHERE k ILIKE ANY(ARRAY['%비밀번호%', '%재설정%', '%잊어버림%'])) AS keyword_score,
    -- Full-Text 매칭 점수
    ts_rank(
      to_tsvector('simple', question || ' ' || answer),
      plainto_tsquery('simple', '비밀번호 잊어버림')
    ) AS text_score
  FROM knowledge
  WHERE
    is_active = true
    AND (site_id IS NULL OR site_id = :siteId)
)
SELECT *,
  (keyword_score * 2 + text_score) AS total_score
FROM search_query
WHERE keyword_score > 0 OR text_score > 0.1
ORDER BY total_score DESC
LIMIT 5;
```

---

## 8. API 명세

### 8.1 인증 API

#### POST /api/auth/handshake
**설명:** 위젯 초기 인증 및 JWT 발급

**Request:**
```json
{
  "siteKey": "sk_live_abc123...",
  "encryptedPayload": "eyJhbGciOiJSU0..."
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "wsToken": "ws_xyz789...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "홍길동"
  },
  "expiresIn": 3600
}
```

### 8.2 채팅 API

#### POST /api/chat
**설명:** 사용자 메시지 처리 및 응답 반환

**Request:**
```json
{
  "message": "비밀번호를 잊어버렸어요",
  "sessionId": "optional-session-id"
}
```

**Response (200) - 답변 발견:**
```json
{
  "type": "answer",
  "content": "비밀번호 재설정은 다음 절차를 따라주세요...",
  "confidence": 0.85,
  "sourceId": "knowledge-uuid",
  "actions": ["resolved", "more_help"]
}
```

**Response (200) - SR 폼 필요:**
```json
{
  "type": "sr_form",
  "message": "문의 내용을 등록해 드릴까요?",
  "fields": [
    { "name": "title", "type": "text", "required": true },
    { "name": "content", "type": "textarea", "required": true },
    { "name": "category", "type": "select", "options": ["account", "technical", "other"] }
  ],
  "prefill": {
    "content": "비밀번호를 잊어버렸어요"
  }
}
```

### 8.3 티켓 API

#### POST /api/tickets
**설명:** SR 생성

**Request:**
```json
{
  "title": "비밀번호 재설정 요청",
  "content": "로그인할 수 없습니다...",
  "category": "account"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "ticketNo": "SR-20260128-0001",
  "status": "pending",
  "createdAt": "2026-01-28T10:30:00Z"
}
```

#### GET /api/tickets
**설명:** 사용자의 SR 목록 조회

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "ticketNo": "SR-20260128-0001",
      "title": "비밀번호 재설정 요청",
      "status": "in_progress",
      "createdAt": "2026-01-28T10:30:00Z"
    }
  ],
  "total": 1
}
```

### 8.4 WebSocket 이벤트

| 이벤트 | 방향 | Payload |
|--------|------|---------|
| `ticket:created` | S→C | `{ ticketNo, title, status }` |
| `ticket:updated` | S→C | `{ ticketNo, status, resolution? }` |
| `ticket:assigned` | S→C | `{ ticketNo, assignee }` |

---

## 9. 개발 환경 설정

### 9.1 사전 요구사항

- Node.js 18+
- PostgreSQL 15+
- Java 17+ (Admin 서버)
- Docker & Docker Compose

### 9.2 초기 설정

```bash
# 저장소 클론
git clone https://github.com/hhj3385/danuri-solution.git
cd danuri-solution

# 환경 변수 설정
cp .env.example .env
# .env 파일 편집

# Docker로 PostgreSQL 실행
docker-compose up -d postgres

# API 서버 설정
cd packages/api-server
npm install
npm run migrate  # DB 마이그레이션
npm run seed     # 초기 데이터

# 위젯 빌드
cd ../widget
npm install
npm run build

# Admin 서버 (Gradle)
cd ../admin-server
./gradlew bootRun
```

### 9.3 개발 서버 실행

```bash
# 터미널 1: API 서버
cd packages/api-server
npm run dev  # http://localhost:3030

# 터미널 2: 위젯 개발
cd packages/widget
npm run dev  # 파일 변경 감지 + 빌드

# 터미널 3: Admin 서버
cd packages/admin-server
./gradlew bootRun  # http://localhost:8080
```

---

## 10. 배포 가이드

### 10.1 Docker 배포

```bash
# 프로덕션 이미지 빌드
docker-compose -f docker/docker-compose.prod.yml build

# 배포
docker-compose -f docker/docker-compose.prod.yml up -d
```

### 10.2 환경 변수 (.env)

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/danuri

# JWT
JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=1h

# RSA (개인키 암호화용)
RSA_PASSPHRASE=your-rsa-passphrase

# Mail (SMTP)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=noreply@danuri.go.kr
SMTP_PASS=smtp-password

# Admin
ADMIN_URL=https://admin.danuri.go.kr
API_URL=https://api.danuri.go.kr
CDN_URL=https://cdn.danuri.go.kr
```

---

## 부록: 참고 자료

- [Feathers.js v5 Documentation](https://feathersjs.com/)
- [eGovFrame 4.x 가이드](https://www.egovframe.go.kr/)
- [PostgreSQL Full-Text Search](https://www.postgresql.org/docs/current/textsearch.html)
- [Socket.io Documentation](https://socket.io/docs/v4/)

---

*Last Updated: 2026-01-28*
