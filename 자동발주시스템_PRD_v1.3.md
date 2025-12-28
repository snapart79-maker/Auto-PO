# 자동발주 시스템 PRD

## Automated Purchase Order Management System

### Product Requirements Document (PRD) v1.3

---

| 항목 | 내용 |
|------|------|
| **문서 버전** | v1.3 |
| **작성일** | 2025년 12월 27일 |
| **작성자** | 생산관리실 |
| **대상 시스템** | Wire Harness 자동발주 관리 시스템 |

---

## 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| v1.0 | 2025-12-26 | 최초 작성 |
| v1.1 | 2025-12-26 | 파일 구조, 대시보드 KPI 상세화 |
| v1.2 | 2025-12-26 | 차종/거래처 일괄등록, 고정환율 적용 |
| v1.3 | 2025-12-27 | 회사정보 관리, 고급 업로드 검증, 이원화 공급, 베트남 발주 특수성, 감사 로그, MCP 활용 계획 추가 |

---

## 목차

1. [개요](#1-개요)
2. [기술 스택 및 아키텍처](#2-기술-스택-및-아키텍처)
3. [MCP 서버 활용 계획](#3-mcp-서버-활용-계획)
4. [데이터 구조 및 파일 형식](#4-데이터-구조-및-파일-형식)
5. [기능 요구사항](#5-기능-요구사항)
6. [대시보드 및 KPI](#6-대시보드-및-kpi)
7. [알림 시스템](#7-알림-시스템)
8. [MRP 계산 로직](#8-mrp-계산-로직)
9. [데이터베이스 설계](#9-데이터베이스-설계)
10. [개발 일정](#10-개발-일정)
11. [첨부 파일 목록](#11-첨부-파일-목록)

---

## 1. 개요

### 1.1 프로젝트 배경

경림테크(주)는 Wire Harness 제조 전문기업으로, SL, 현대모비스 등 주요 완성차 OEM에 부품을 공급하고 있습니다. 현재 수동으로 진행되는 발주 및 재고 관리 프로세스의 효율화를 위해 자동발주 시스템 구축이 필요합니다.

Wire Harness 산업의 특성상, JIT(Just-In-Time) 납품 체계와 다품종 소량 생산 환경에서 정확한 수요 예측과 재고 관리가 매우 중요합니다. 본 시스템은 MRP(Material Requirements Planning) 기반의 자동화된 발주 계획 수립을 통해 이러한 과제를 해결하고자 합니다.

특히 경림테크는 국내 협력사뿐만 아니라 베트남 현지 생산 법인을 운영하고 있어, **이원화된 조달 체계(Dual Sourcing)**를 효과적으로 관리할 수 있는 시스템이 필요합니다.

### 1.2 프로젝트 목적

- 고객사 출고 실적 분석을 통한 장단기 계획 수립 자동화
- 협력사 및 베트남 해외공장 발주의 정확성 향상
- **국내/베트남 이원화 공급 비율 관리**
- 안전재고 및 리드타임 기반의 최적 재고 수준 유지
- MES 데이터 연동을 통한 실시간 재고 현황 파악
- **고급 데이터 검증을 통한 업로드 오류 사전 차단**
- 수작업 오류 감소 및 업무 효율성 증대

### 1.3 프로젝트 범위

**Phase 1 (MVP)**
- 회사 정보 관리 (발주서 발급 주체)
- 입고/출고 실적 관리 (MES Excel 파일 업로드)
- **고급 업로드 검증** (참조 무결성, 인라인 수정)
- 출고 계획 관리 (일간/주간/월간/연간)
- 매입 계획 자동 산출 (협력사, 베트남 공장)
- **이원화 공급 비율 관리** (국내/베트남 분할 발주)
- **베트남 발주 특수성** (주간 통합 발주, 선적일 선택)
- 안전재고 및 리드타임 기반 발주량 계산
- 발주서 생성 (Excel, PDF)
- **발주 이력 관리** (감사 로그)
- 대시보드 및 알림 (시스템 내)
- 마스터 데이터 일괄 등록 기능 (차종, 거래처)

**Phase 2 (고도화)**
- 차종/사양 마스터 및 연간 계획 자동화
- Slack 알림 연동
- Notion 연동
- 고급 분석 리포트
- 직인 이미지 자동 날인

---

## 2. 기술 스택 및 아키텍처

### 2.1 기술 스택 개요

| 구분 | 기술 | 비고 |
|------|------|------|
| **Frontend** | React + TypeScript | SPA 웹 애플리케이션 |
| **UI Framework** | shadcn/ui + TanStack Table | 고품질 UI 컴포넌트, 유연한 테이블 |
| **Backend** | Supabase (Full Stack) | DB, Auth, Edge Functions, Realtime |
| **Database** | PostgreSQL (Supabase) | 관계형 DB, Row Level Security |
| **PDF 변환** | pypdf, reportlab (Python) | 발주서 PDF 출력 |
| **Architecture** | The Clean Architecture | 계층 분리, 의존성 역전 |

### 2.2 Clean Architecture 구조

Clean Architecture를 적용하여 비즈니스 로직(MRP 계산)을 프레임워크(React, Supabase)와 분리합니다. 이를 통해 기술 변경 시에도 핵심 로직을 그대로 유지할 수 있습니다.

```
src/
├── domain/                    # 💎 핵심 (의존성 없음)
│   ├── entities/
│   │   ├── Product.ts         # 제품 엔티티
│   │   ├── Partner.ts         # 거래처 엔티티
│   │   ├── Order.ts           # 발주 엔티티
│   │   ├── Inventory.ts       # 재고 엔티티
│   │   └── Company.ts         # 회사 정보 엔티티
│   └── repositories/          # 인터페이스만 정의
│       ├── IProductRepository.ts
│       └── IOrderRepository.ts
│
├── application/               # 🎯 유스케이스 (domain만 의존)
│   ├── usecases/
│   │   ├── CalculateOrderQuantity.ts    # MRP 계산
│   │   ├── GeneratePurchasePlan.ts      # 발주 계획 생성
│   │   ├── SplitOrderByRatio.ts         # 이원화 분할 발주
│   │   ├── ValidateUploadData.ts        # 업로드 검증
│   │   └── UploadInventoryData.ts       # 입출고 업로드
│   └── services/
│       └── MRPCalculationService.ts
│
├── interface/                 # 🔌 어댑터 (application 의존)
│   ├── controllers/
│   │   └── OrderController.ts
│   ├── presenters/
│   │   └── DashboardPresenter.ts
│   └── gateways/
│       └── SupabaseProductRepository.ts  # 구현체
│
└── infrastructure/            # 🔧 프레임워크 (가장 바깥)
    ├── supabase/
    │   └── client.ts
    ├── react/
    │   └── components/
    └── external/
        ├── ExcelParser.ts
        └── PdfGenerator.ts
```

**핵심 원칙:**
- `domain/` 폴더는 React, Supabase를 전혀 모름
- MRP 계산 로직 테스트 시 DB 연결 없이 가능
- 의존성은 항상 안쪽(domain)으로 향함

---

## 3. MCP 서버 활용 계획

### 3.1 MCP 서버 목록

| MCP 서버 | 용도 | 활용 단계 |
|----------|------|----------|
| **context7** | React, TypeScript, TanStack 등 라이브러리 문서 참조 | 전체 개발 |
| **supabase** | DB 스키마, Auth, RLS, Edge Functions | 백엔드 구축 |
| **postgres** | SQL 쿼리 최적화, 인덱스 설계, 복잡한 집계 | DB 튜닝 |
| **shadcn** | UI 컴포넌트 생성 (버튼, 폼, 다이얼로그 등) | 화면 개발 |
| **magic** | 대시보드, 차트 등 고품질 UI 컴포넌트 | 대시보드 개발 |
| **figma** | UI/UX 디자인 초안, 와이어프레임 | 설계 단계 |
| **playwright** | E2E 테스트 자동화, UI 검증 | 테스트 |
| **sequential-thinking** | MRP 알고리즘, 복잡한 비즈니스 로직 설계 | 로직 설계 |

### 3.2 개발 단계별 MCP 활용

#### 1단계: 설계 (1주차)
```
figma              → UI/UX 와이어프레임 작성
sequential-thinking → MRP 계산 로직, 이원화 발주 알고리즘 설계
```

#### 2단계: DB/백엔드 구축 (2주차)
```
supabase           → 프로젝트 생성, 테이블 스키마, Auth 설정
postgres           → 복잡한 쿼리 (재고 집계, 발주 현황), 인덱스 최적화
context7           → Supabase 문서 참조
```

#### 3단계: 마스터/업로드 화면 (3-4주차)
```
shadcn             → 폼, 테이블, 다이얼로그 컴포넌트
context7           → React, TanStack Table 문서 참조
magic              → 엑셀 업로드 UI, 오류 하이라이팅 컴포넌트
```

#### 4단계: 대시보드/발주 (5-6주차)
```
magic              → KPI 카드, 차트, 그래프 컴포넌트
shadcn             → 발주서 생성 폼, 상태 관리 UI
sequential-thinking → 안전재고 계산, 분할 발주 로직 구현
postgres           → 대시보드용 집계 쿼리 최적화
```

#### 5단계: 테스트/마무리 (7-8주차)
```
playwright         → E2E 테스트 (업로드 → 검증 → 발주 플로우)
context7           → 테스트 라이브러리 문서 참조
```

### 3.3 MCP 조합 활용 예시

**대시보드 개발 시:**
1. `figma` → 대시보드 레이아웃 디자인
2. `magic` → KPI 카드, 차트 컴포넌트 생성
3. `postgres` → 긴급발주 품목 집계 쿼리 작성
4. `supabase` → Realtime 알림 구현
5. `playwright` → 대시보드 로딩 테스트

**MRP 계산 구현 시:**
1. `sequential-thinking` → 알고리즘 단계별 설계
2. `context7` → TypeScript 문서 참조
3. `postgres` → 재고/입출고 집계 쿼리
4. `playwright` → MRP 결과 검증 테스트

---

## 4. 데이터 구조 및 파일 형식

### 4.1 입고 데이터 구조 (MES 연동)

**파일명:** `입고마감관리-YYYYMMDD.xlsx`

| 컬럼명 | 타입 | 필수 | 설명/예시 |
|--------|------|------|-----------|
| 입고일 | Date | Y | 2025-12-01 |
| 거래처코드 | String | Y | 협력사 코드 (사용자 지정) |
| 공급사 | String | Y | (주)엠에스파트너스 |
| 고객품번 | String | Y | 334614 (품목 코드) |
| 품명 | String | Y | NX4 PE STD LPL BULT IN... |
| 수량 | Integer | Y | 200 |
| 적용단가 | Decimal | Y | 6830.0 (KRW 단가) |
| 공급가액 | Decimal | Y | 1366000.0 |
| 화폐단위 | String | Y | KRW, USD |
| 총금액 | Decimal | Y | 1502600.0 (VAT 포함) |

### 4.2 출고 데이터 구조 (MES 연동)

**파일명:** `출고마감관리-YYYYMMDD.xlsx`

| 컬럼명 | 타입 | 필수 | 설명/예시 |
|--------|------|------|-----------|
| 출하일 | Date | Y | 2025-12-23 |
| 거래처코드 | String | Y | 고객사 코드 (사용자 지정) |
| 공급사 | String | Y | SL AP(판매팀) |
| 고객품번 | String | Y | 344282 |
| 품명 | String | Y | GL436-02121 |
| 수량 | Integer | Y | 2000 |
| 적용단가 | Decimal | Y | 0.075 (USD) |
| 공급가액 | Decimal | Y | 150.0 |
| 화폐단위 | String | Y | USD, KRW |
| 환율 | Decimal | N | **고정 환율 적용** (시스템 설정값) |
| 총금액 | Decimal | Y | 246457.2 (KRW 환산) |
| 품목유형 | String | N | 원재료, 반제품, 완제품 |

### 4.3 환율 관리 방식

> ⚠️ **고정 환율 방식 적용**

- 시스템 설정에서 화폐별 고정 환율을 관리
- 환율 변경 시 관리자가 수동으로 업데이트
- 환율 변경 이력 저장 (변경일시, 변경자, 이전값, 신규값)

| 화폐 | 기본 환율 | 비고 |
|------|----------|------|
| USD | 1,400.00 | 관리자가 수시 변경 가능 |
| EUR | 1,500.00 | 필요 시 추가 |
| VND | 0.055 | 베트남 동 |

---

## 5. 기능 요구사항

### 5.1 회사 정보 관리 (신규)

발주서 발급 주체인 경림테크의 정보를 동적으로 관리합니다.

| 항목 | 설명 |
|------|------|
| 회사명 (국문) | 경림테크(주) |
| 회사명 (영문) | Kyungrim Tech Co., Ltd. |
| 대표이사명 | 변경 시 관리자 화면에서 수정 |
| 사업자등록번호 | 000-00-00000 |
| 주소 (국문/영문) | 본사 주소 |
| 전화/팩스 | 대표 연락처 |

**활용:**
- 발주서 헤더/푸터에 자동 반영
- 대표이사 변경 시 코드 수정 없이 관리자 화면에서 변경

### 5.2 마스터 데이터 관리

#### 5.2.1 차종 마스터

| 기능 | 설명 |
|------|------|
| 개별 등록 | 차종코드, 차종명, 설명, 사용여부 입력 |
| 일괄 등록 | Excel 업로드를 통한 대량 등록 |
| 수정/삭제 | 기존 차종 정보 수정 및 삭제 |
| 조회/검색 | 차종코드, 차종명으로 검색 |

#### 5.2.2 거래처 마스터

| 기능 | 설명 |
|------|------|
| 개별 등록 | 거래처코드(사용자 지정), 거래처명, 유형, 통화 등 |
| 일괄 등록 | Excel 업로드를 통한 대량 등록 |
| 수정/삭제 | 기존 거래처 정보 수정 및 삭제 |
| 조회/검색 | 거래처코드, 거래처명, 유형으로 검색 |

> 📌 **거래처코드는 사용자가 직접 지정**하며, 시스템에서 자동 생성하지 않습니다.

**거래처 유형:**
- `SUPPLIER` - 협력사 (국내 부품 입고)
- `CUSTOMER` - 고객사 (제품 출고)
- `VIETNAM` - 베트남 공장 (해외 발주)

#### 5.2.3 제품 마스터

| 기능 | 설명 |
|------|------|
| 개별 등록 | 품번, 품명, 차종, 리드타임, 주공급처, **이원화 비율** 등 |
| 일괄 등록 | Excel 업로드를 통한 대량 등록 |
| 거래처 연결 | 제품별 공급 가능 거래처 매핑 |

**이원화 공급 설정 (신규):**

| 필드 | 설명 |
|------|------|
| primary_supplier | DOMESTIC / VIETNAM / BOTH |
| main_partner_id | 국내 거래처 ID |
| sub_partner_id | 베트남 거래처 ID (BOTH일 경우) |
| domestic_ratio | 국내 비율 (0~100%, 예: 70) |

### 5.3 엑셀 업로드 및 검증 (고급)

MES에서 추출한 Excel 파일을 업로드하고, **고급 검증 기능**을 통해 오류를 사전에 차단합니다.

#### 5.3.1 검증 레벨

| 레벨 | 검증 항목 |
|------|----------|
| 기본 | 필수값 체크, 중복 체크 |
| 참조 무결성 | 거래처코드, 품번, 차종코드가 마스터에 존재하는지 확인 |
| 환율 검증 | USD 거래 시 해당 기간 환율 등록 여부 확인 |

#### 5.3.2 업로드 프로세스

```
[업로드 플로우]

Excel 선택 → 파싱 → 프리뷰 화면 (스테이징)
                        ↓
              ┌─────────────────────────┐
              │  검증 결과               │
              │  ✅ 정상: 95건           │
              │  ❌ 오류: 3건            │
              │  ├ 2행: 거래처코드 없음  │ ← 빨간 하이라이팅
              │  ├ 5행: 품번 없음        │ ← 클릭 시 수정 가능
              │  └ 8행: 환율 미등록      │
              └─────────────────────────┘
                        ↓
              인라인 수정 → 재검증 → 저장
```

#### 5.3.3 오류 처리 UI

- **프리뷰 기능:** 파일 저장 전 브라우저에서 데이터 그리드로 표시
- **오류 하이라이팅:** 오류 행은 빨간색 배경 + 툴팁으로 에러 메시지 표시
- **인라인 수정:** 화면에서 직접 수정 후 재검증 가능 (매번 엑셀 수정 불필요)

### 5.4 이원화 공급 (Split Sourcing) (신규)

주공급처가 'BOTH'인 품목에 대해 **국내/베트남 자동 분할 발주**를 지원합니다.

#### 5.4.1 분할 로직

```
[예시: 품목 A, 총 소요량 1,000개, 국내 비율 70%]

┌─────────────────────────────────────┐
│  제품 마스터 설정                    │
│  ├ 주공급처: BOTH                   │
│  ├ 국내 거래처: (주)엠에스파트너스   │
│  ├ 베트남 거래처: 경림테크 베트남    │
│  └ 국내 비율: 70%                   │
└─────────────────────────────────────┘
                ↓ MRP 계산
┌─────────────────────────────────────┐
│  발주서 자동 생성 (2건)              │
│  ├ 국내 발주: 700개 (리드타임 3일)  │
│  └ 베트남 발주: 300개 (리드타임 21일)│
└─────────────────────────────────────┘
```

#### 5.4.2 계산 공식

```
총 소요량: Q_total
국내 비율: R (0~100%)

국내 발주량 = Round(Q_total × R / 100)
베트남 발주량 = Q_total - 국내 발주량
```

### 5.5 베트남 발주 특수성 (신규)

베트남 법인 발주는 해상 운송 특성을 반영하여 **별도 로직**을 적용합니다.

#### 5.5.1 국내 vs 베트남 비교

| 항목 | 국내 | 베트남 |
|------|------|--------|
| 발주 방식 | 일일 발주 가능 | **주간 통합 발주** |
| 리드타임 | 3~7일 | 14~21일 (해상 운송) |
| 안전재고 계수 | 1.2 | **1.5** (운송 변동성 반영) |
| 선적일 | 해당 없음 | **사용자가 날짜 선택** |

#### 5.5.2 주간 통합 발주

```
월~목: MRP 계산 → 발주 권고 누적
금요일(또는 지정일): 주간 누적 물량 → 통합 발주서 생성
```

#### 5.5.3 선적 예정일 선택

```
[발주 생성 화면 - 베트남]

┌─────────────────────────────────────┐
│  베트남 통합 발주                    │
│                                     │
│  발주 품목: 15건                     │
│  총 금액: $12,500                   │
│                                     │
│  선적 예정일: [2025-01-03 📅]        │
│                                     │
│  예상 입고일: 2025-01-24 (21일 후)   │
│                                     │
│  [발주 생성]                         │
└─────────────────────────────────────┘
```

- 날짜 선택 방식 (Date Picker)
- 공휴일, 특수 상황에 유연하게 대응 가능

### 5.6 발주 관리

#### 5.6.1 발주서 생성

- MRP 결과 또는 수기 입력을 통해 발주 데이터 생성
- 거래처별 발주서 자동 생성
- Excel 다운로드
- PDF 출력 (A4 사이즈) - 회사 정보 자동 반영

#### 5.6.2 발주 상태 관리

| 상태 | 설명 |
|------|------|
| DRAFT | 초안 (수정 가능) |
| CONFIRMED | 확정 |
| SENT | 발송 완료 |
| PARTIAL | 부분 입고 |
| COMPLETED | 완료 |
| CANCELLED | 취소 |

### 5.7 발주 이력 관리 (감사 로그) (신규)

발주서의 상태 변경 이력을 기록하여 추적 가능하게 합니다.

#### 5.7.1 기록 내용

| 항목 | 설명 |
|------|------|
| 발주 ID | 대상 발주서 |
| 이전 상태 | 변경 전 상태 |
| 변경 상태 | 변경 후 상태 |
| 변경자 | 누가 변경했는지 |
| 변경일시 | 언제 변경했는지 |
| 비고 | 메모 (선택) |

#### 5.7.2 이력 조회 화면

```
[발주서 상세 화면 - 이력 탭]

┌─────────────────────────────────────────────────┐
│  발주번호: PO-20250103-001                       │
│  [기본정보]  [품목]  [이력]                       │
├─────────────────────────────────────────────────┤
│  변경일시          상태변경         변경자        │
│  ─────────────────────────────────────────────  │
│  2025-01-03 09:00  초안 생성        김대리       │
│  2025-01-03 10:30  초안 → 확정      박과장       │
│  2025-01-03 11:00  확정 → 발송      김대리       │
│  2025-01-10 14:00  발송 → 부분입고   시스템      │
└─────────────────────────────────────────────────┘
```

---

## 6. 대시보드 및 KPI

### 6.1 핵심 KPI 상세

#### 6.1.1 긴급발주 필요 품목 (차종별)

| 항목 | 내용 |
|------|------|
| 표시 형태 | 차종별 카드 형태, 긴급 품목 수 표시 |
| 상세 조회 | 클릭 시 해당 차종의 긴급발주 품목 리스트 팝업 |
| 긴급 기준 | 현재고 < 안전재고의 50% |
| 색상 코드 | 🔴 빨강(긴급), 🟡 노랑(주의), 🟢 초록(정상) |

#### 6.1.2 재고 부족 예상 품목 (Top 5)

| 항목 | 내용 |
|------|------|
| 표시 형태 | 테이블 (품번/품명/현재고/부족예상일/부족수량) |
| 상세 보기 | 별도 상세 팝업 (재고 추이 그래프, 입출고 이력) |
| 출력 기능 | Excel/PDF 내보내기 |

#### 6.1.3 입고율 / 출고율

| 기간 | 계산 |
|------|------|
| 일간 | 오늘 실적 / 오늘 계획 |
| 주간 | 금주 누적 / 금주 계획 |
| 월간 | 금월 누적 / 금월 계획 |
| 시각화 | Progress Bar + 백분율 |

#### 6.1.4 거래처별 입출고 현황 그래프

| 항목 | 내용 |
|------|------|
| 협력사별 입고 | Bar Chart (수량 + 금액 dual axis) |
| 고객사별 출고 | Bar Chart (수량 + 금액 dual axis) |
| 기간 선택 | 일간/주간/월간 토글 |
| 금액 표시 | KRW 기준 환산 (고정 환율 적용) |

---

## 7. 알림 시스템

### 7.1 Phase 1: 시스템 내 알림

| 항목 | 내용 |
|------|------|
| 알림 센터 | 헤더 영역 벨 아이콘, 읽지 않은 알림 수 배지 |
| 알림 유형 | 긴급발주 필요, 재고부족 경고, 납기임박, 업로드 완료 |
| 알림 이력 | 최근 100건 보관 |
| 실시간 알림 | Supabase Realtime 활용 |

### 7.2 Phase 2: Slack/Notion 연동

- Slack: 긴급 알림 채널, 일일 리포트 자동 발송
- Notion: 발주 이력 DB, 주간/월간 리포트 저장

---

## 8. MRP 계산 로직

### 8.1 핵심 공식

**순소요량(Net Requirements) 계산:**
```
순소요량 = 총소요량 - 현재고 - 기발주량(미입고) + 안전재고
```

**안전재고(Safety Stock) 계산:**
```
국내: 안전재고 = 일평균 출하량 × 리드타임 × 1.2
베트남: 안전재고 = 일평균 출하량 × 리드타임 × 1.5
```

**발주 시점(Reorder Point):**
```
발주점 = 안전재고 + (일평균 소비량 × 리드타임)
```

### 8.2 이중 리드타임 처리

| 구분 | 리드타임 | 안전재고 계수 | 발주 방식 |
|------|---------|-------------|----------|
| 국내 협력사 | 3-7일 | 1.2 | 일일 발주 |
| 베트남 공장 | 14-21일 | 1.5 | 주간 통합 발주 |

### 8.3 이원화 공급 발주량 계산 예시

**조건:**
- 품목: NX4 HMSL
- 총 소요량: 1,000개
- 주공급처: BOTH
- 국내 비율: 70%

**계산:**
1. 국내 발주량 = Round(1,000 × 70%) = **700개**
2. 베트남 발주량 = 1,000 - 700 = **300개**
3. 발주서 2건 생성 (국내 1건, 베트남 1건)

---

## 9. 데이터베이스 설계

### 9.1 ERD 개요

```
┌─────────────────┐
│ company_configs │ (신규)
│ (회사 정보)      │
└─────────────────┘

┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  partners   │     │  products   │     │ vehicle_    │
│ (거래처)    │     │  (제품)     │     │  models     │
└─────────────┘     └─────────────┘     │ (차종)      │
       │                   │            └─────────────┘
       │                   │                   │
       ▼                   ▼                   │
┌─────────────┐     ┌─────────────┐            │
│ inventory_  │     │ shipment_   │◄───────────┘
│ transactions│     │ plans       │
│ (입출고)    │     │ (출고계획)  │
└─────────────┘     └─────────────┘
       │
       ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ purchase_   │────▶│ purchase_   │     │ exchange_   │
│ orders      │     │ order_logs  │     │ rates       │
│ (발주)      │     │ (이력-신규) │     │ (환율)      │
└─────────────┘     └─────────────┘     └─────────────┘
```

### 9.2 주요 테이블

#### company_configs (회사 정보 - 신규)
```sql
CREATE TABLE company_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name_kr VARCHAR(100) NOT NULL,     -- 경림테크(주)
    company_name_en VARCHAR(100),              -- Kyungrim Tech Co., Ltd.
    ceo_name VARCHAR(50) NOT NULL,             -- 대표이사명
    business_number VARCHAR(20) NOT NULL,      -- 사업자등록번호
    address_kr VARCHAR(200) NOT NULL,          -- 국문 주소
    address_en VARCHAR(200),                   -- 영문 주소
    phone VARCHAR(20),
    fax VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### vehicle_models (차종 마스터)
```sql
CREATE TABLE vehicle_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_code VARCHAR(20) UNIQUE NOT NULL,
    vehicle_name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### partners (거래처 마스터)
```sql
CREATE TABLE partners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_code VARCHAR(20) UNIQUE NOT NULL,
    partner_name VARCHAR(200) NOT NULL,
    partner_type VARCHAR(20) NOT NULL,         -- SUPPLIER, CUSTOMER, VIETNAM
    business_number VARCHAR(20),
    address TEXT,
    contact_person VARCHAR(100),
    contact_phone VARCHAR(20),
    contact_email VARCHAR(100),
    currency VARCHAR(3) DEFAULT 'KRW',         -- 기본 결제 통화
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### products (제품 마스터)
```sql
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_code VARCHAR(50) UNIQUE NOT NULL,
    product_name VARCHAR(200) NOT NULL,
    vehicle_model_id UUID REFERENCES vehicle_models(id),
    
    -- 리드타임
    domestic_lead_time INTEGER DEFAULT 3,
    overseas_lead_time INTEGER DEFAULT 21,
    
    -- 이원화 공급 설정
    primary_supplier VARCHAR(20) DEFAULT 'DOMESTIC',  -- DOMESTIC, VIETNAM, BOTH
    main_partner_id UUID REFERENCES partners(id),     -- 국내 거래처
    sub_partner_id UUID REFERENCES partners(id),      -- 베트남 거래처 (BOTH일 경우)
    domestic_ratio INTEGER DEFAULT 100,               -- 국내 비율 (0~100%)
    
    unit_price DECIMAL(15, 4),
    currency VARCHAR(3) DEFAULT 'KRW',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### exchange_rates (환율 마스터)
```sql
CREATE TABLE exchange_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    currency_code VARCHAR(3) NOT NULL,
    rate DECIMAL(15, 4) NOT NULL,
    effective_date DATE NOT NULL,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(currency_code, effective_date)
);
```

#### inventory_transactions (입출고 이력)
```sql
CREATE TABLE inventory_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_date DATE NOT NULL,
    transaction_type VARCHAR(10) NOT NULL,     -- IN, OUT
    partner_id UUID REFERENCES partners(id),
    product_id UUID REFERENCES products(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(15, 4),
    supply_amount DECIMAL(15, 2),
    currency VARCHAR(3) DEFAULT 'KRW',
    exchange_rate DECIMAL(15, 4),
    total_amount DECIMAL(15, 2),
    item_type VARCHAR(20),
    upload_batch_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### shipment_plans (출고 계획)
```sql
CREATE TABLE shipment_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_date DATE NOT NULL,
    plan_type VARCHAR(10) NOT NULL,            -- DAILY, WEEKLY, MONTHLY, YEARLY
    partner_id UUID REFERENCES partners(id),
    product_id UUID REFERENCES products(id),
    vehicle_model_id UUID REFERENCES vehicle_models(id),
    planned_quantity INTEGER NOT NULL,
    unit_price DECIMAL(15, 4),
    currency VARCHAR(3) DEFAULT 'KRW',
    planned_amount DECIMAL(15, 2),
    source VARCHAR(20) DEFAULT 'MANUAL',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### purchase_orders (발주서)
```sql
CREATE TABLE purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    order_date DATE NOT NULL,
    due_date DATE NOT NULL,
    shipment_date DATE,                        -- 선적 예정일 (베트남용)
    partner_id UUID REFERENCES partners(id),
    company_id UUID REFERENCES company_configs(id),  -- 발주 주체
    order_type VARCHAR(20) NOT NULL,           -- DOMESTIC, VIETNAM
    status VARCHAR(20) DEFAULT 'DRAFT',
    total_quantity INTEGER,
    total_amount DECIMAL(15, 2),
    currency VARCHAR(3) DEFAULT 'KRW',
    exchange_rate DECIMAL(15, 4),
    notes TEXT,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### purchase_order_logs (발주 이력 - 신규)
```sql
CREATE TABLE purchase_order_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES purchase_orders(id),
    prev_status VARCHAR(20),
    new_status VARCHAR(20),
    changed_by VARCHAR(100),
    changed_at TIMESTAMPTZ DEFAULT NOW(),
    remarks TEXT
);
```

---

## 10. 개발 일정

### 10.1 Phase 1 (MVP) - 8주

| 주차 | 영역 | 작업 내용 | MCP 활용 |
|------|------|----------|----------|
| 1주 | 설계 | UI/UX 와이어프레임, MRP 알고리즘 설계 | figma, sequential-thinking |
| 2주 | 프로젝트 셋업 | Supabase 설정, DB 스키마, 인증, Clean Architecture 구조 | supabase, postgres, context7 |
| 3-4주 | 마스터/업로드 | 회사정보, 차종/거래처/제품 마스터, **고급 업로드 검증** | shadcn, magic, context7 |
| 5-6주 | 계획/재고 | 출고 계획 관리, 재고 현황, **이원화 공급**, 고정 환율 | shadcn, postgres, sequential-thinking |
| 7주 | 발주/대시보드 | MRP 계산, **베트남 주간 발주**, 발주서 생성, 대시보드 | magic, postgres, shadcn |
| 8주 | 테스트/마무리 | **감사 로그**, 알림, E2E 테스트, 버그 수정 | playwright |

### 10.2 Phase 2 (고도화) - 4주

- 차종/사양 마스터 및 연간 계획
- Slack 알림 연동
- Notion 연동
- 직인 이미지 자동 날인
- 고급 분석 리포트

---

## 11. 첨부 파일 목록

| No | 파일명 | 설명 |
|----|--------|------|
| 1 | 입고등록_템플릿.xlsx | MES 입고 데이터 업로드용 템플릿 |
| 2 | 출고등록_템플릿.xlsx | MES 출고 데이터 업로드용 템플릿 |
| 3 | 출고계획_템플릿.xlsx | 고객사 출고 계획 입력용 템플릿 |
| 4 | 발주서_양식.xlsx | 협력사/베트남 발주서 양식 (A4 출력용) |
| 5 | 차종_일괄등록_템플릿.xlsx | 차종 마스터 일괄 등록용 템플릿 |
| 6 | 거래처_일괄등록_템플릿.xlsx | 거래처 마스터 일괄 등록용 템플릿 |

---

**— 문서 끝 —**
