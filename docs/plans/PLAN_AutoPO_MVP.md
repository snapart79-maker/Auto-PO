# Implementation Plan: Auto PO System (자동발주 시스템) MVP

**Status**: 🔄 Planning
**Started**: 2025-12-27
**Last Updated**: 2025-12-27
**Estimated Completion**: 8 Weeks

---

**⚠️ CRITICAL INSTRUCTIONS**: After completing each phase:
1. ✅ Check off completed task checkboxes
2. 🧪 Run all quality gate validation commands
3. ⚠️ Verify ALL quality gate items pass
4. 📅 Update "Last Updated" date above
5. 📝 Document learnings in Notes section
6. ➡️ Only then proceed to next phase

⛔ **DO NOT skip quality gates or proceed with failing checks**

---

## 📋 Overview

### Feature Description
경림테크(주) Wire Harness 제조업체를 위한 MRP 기반 자동발주 관리 시스템.
MES Excel 데이터 업로드, 이원화 공급(국내/베트남) 분할 발주, 고급 검증, 발주서 생성(Excel/PDF), 감사 로그 등 핵심 기능 구현.

### Success Criteria
- [ ] MES Excel 파일 업로드 및 고급 검증 (참조 무결성, 인라인 수정)
- [ ] MRP 계산 로직 정확도 100% (안전재고, 순소요량, 발주점)
- [ ] 이원화 공급 분할 발주 자동화 (국내/베트남 비율 기반)
- [ ] 베트남 주간 통합 발주 + 선적일 선택
- [ ] 발주서 Excel/PDF 생성 및 다운로드
- [ ] 발주 이력 감사 로그 자동 기록
- [ ] 대시보드 KPI (긴급발주, 재고부족, 입출고율)
- [ ] Clean Architecture 원칙 100% 준수

### User Impact
- 수작업 발주 프로세스 자동화로 업무 시간 70% 절감
- 데이터 검증 강화로 발주 오류 95% 감소
- 이원화 공급 관리 체계화로 재고 최적화

---

## 🏗️ Architecture Decisions

### Clean Architecture 구조

```
src/
├── domain/                    # 💎 핵심 (의존성 없음 - 순수 TypeScript)
│   ├── entities/              # Company, Partner, Product, Order, etc.
│   ├── valueObjects/          # Money, Quantity, OrderStatus
│   └── repositories/          # Interface 정의만 (구현체 없음)
│
├── application/               # 🎯 유스케이스 (domain만 의존)
│   ├── usecases/              # CalculateMRP, SplitOrder, ValidateUpload
│   └── services/              # MRPCalculationService
│
├── interface/                 # 🔌 어댑터 (application 의존)
│   ├── controllers/           # API 엔드포인트 로직
│   ├── presenters/            # 데이터 변환 (ViewModel)
│   └── gateways/              # Supabase Repository 구현체
│
└── infrastructure/            # 🔧 프레임워크 (가장 바깥)
    ├── supabase/              # Supabase 클라이언트
    ├── react/                 # React 컴포넌트, 페이지, 훅
    └── external/              # ExcelParser, PdfGenerator
```

| Decision | Rationale | Trade-offs |
|----------|-----------|------------|
| Clean Architecture | MRP 계산 로직을 프레임워크와 분리하여 테스트 용이성 확보 | 초기 설정 복잡도 증가 |
| Supabase Full Stack | DB, Auth, Realtime, Edge Functions 통합 | PostgreSQL 기반으로 제한 |
| TanStack Table | 고성능 데이터 테이블 + 필터링/정렬/페이지네이션 | 학습 곡선 |
| shadcn/ui | 고품질 UI 컴포넌트 + Tailwind 기반 커스터마이징 | 의존성 증가 |

---

## 📦 Dependencies

### Required Before Starting
- [ ] Node.js 18+ 설치
- [ ] Supabase 계정 생성 및 프로젝트 생성
- [ ] GitHub 레포지토리 생성

### External Dependencies
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "@supabase/supabase-js": "^2.x",
    "@tanstack/react-table": "^8.x",
    "xlsx": "^0.18.x",
    "date-fns": "^3.x",
    "zod": "^3.x"
  },
  "devDependencies": {
    "typescript": "^5.x",
    "vitest": "^1.x",
    "@playwright/test": "^1.x"
  }
}
```

---

## 🧪 Test Strategy

### Testing Approach
**TDD Principle**: Write tests FIRST, then implement to make them pass

### Test Pyramid for This Feature
| Test Type | Coverage Target | Purpose |
|-----------|-----------------|---------|
| **Unit Tests** | ≥90% | MRP 계산, 분할 발주, 검증 로직 (domain/application) |
| **Integration Tests** | ≥80% | Supabase Repository, API 컨트롤러 |
| **E2E Tests** | Critical paths | 업로드→검증→발주 플로우, 대시보드 |

### Test File Organization
```
test/
├── unit/
│   ├── domain/
│   │   ├── entities/
│   │   └── valueObjects/
│   └── application/
│       └── usecases/
├── integration/
│   └── gateways/
└── e2e/
    └── flows/
```

---

## 🚀 Implementation Phases

---

## Phase 1: Foundation & Project Setup
**Goal**: Clean Architecture 프로젝트 구조 + Supabase 인프라 구축
**Estimated Time**: 8-10 hours
**Status**: ⏳ Pending

### Tasks

**🔴 RED: Write Failing Tests First**
- [ ] **Test 1.1**: Domain Entity 단위 테스트 작성
  - File(s): `test/unit/domain/entities/*.test.ts`
  - Expected: Tests FAIL (entities 미구현)
  - Details:
    - Company entity 생성/검증 테스트
    - Partner entity (SUPPLIER|CUSTOMER|VIETNAM) 테스트
    - Product entity (이원화 설정) 테스트

**🟢 GREEN: Implement to Make Tests Pass**
- [ ] **Task 1.2**: Vite + React + TypeScript 프로젝트 생성
  - Command: `npm create vite@latest auto-po -- --template react-ts`
  - Details: ESLint, Prettier, Vitest 설정

- [ ] **Task 1.3**: Clean Architecture 폴더 구조 생성
  - Files: `src/domain/`, `src/application/`, `src/interface/`, `src/infrastructure/`
  - Details: 각 레이어별 index.ts export 설정

- [ ] **Task 1.4**: Domain Entities 구현
  - Files:
    - `src/domain/entities/Company.ts`
    - `src/domain/entities/Partner.ts`
    - `src/domain/entities/Product.ts`
    - `src/domain/entities/VehicleModel.ts`
    - `src/domain/entities/ExchangeRate.ts`
    - `src/domain/entities/InventoryTransaction.ts`
    - `src/domain/entities/ShipmentPlan.ts`
    - `src/domain/entities/PurchaseOrder.ts`
    - `src/domain/entities/PurchaseOrderLog.ts`
  - Goal: 순수 TypeScript 클래스/인터페이스 정의

- [ ] **Task 1.5**: Value Objects 구현
  - Files:
    - `src/domain/valueObjects/Money.ts`
    - `src/domain/valueObjects/Quantity.ts`
    - `src/domain/valueObjects/OrderStatus.ts`
    - `src/domain/valueObjects/PartnerType.ts`

- [ ] **Task 1.6**: Repository Interfaces 정의
  - Files: `src/domain/repositories/I*.Repository.ts`
  - Details: 구현체 없이 인터페이스만 정의

- [ ] **Task 1.7**: Supabase 프로젝트 설정 및 테이블 생성
  - Details: 9개 테이블 SQL 스키마 실행
  - Tables: company_configs, vehicle_models, partners, products, exchange_rates, inventory_transactions, shipment_plans, purchase_orders, purchase_order_logs

- [ ] **Task 1.8**: RLS (Row Level Security) 정책 설정
  - Details: 인증된 사용자만 접근 가능하도록 설정

- [ ] **Task 1.9**: Supabase 클라이언트 연결 설정
  - File: `src/infrastructure/supabase/client.ts`

**🔵 REFACTOR: Clean Up Code**
- [ ] **Task 1.10**: 코드 정리 및 문서화
  - Details: JSDoc 주석, 타입 export 정리

### Quality Gate ✋

**TDD Compliance**:
- [ ] Tests written FIRST and initially failed
- [ ] Production code written to make tests pass
- [ ] Test coverage ≥80% for domain entities

**Build & Tests**:
```bash
npm run build          # 빌드 성공
npm run test           # 단위 테스트 통과
npm run lint           # 린트 에러 없음
npm run type-check     # 타입 체크 통과
```

**Supabase Verification**:
- [ ] 9개 테이블 생성 완료
- [ ] RLS 정책 적용 확인
- [ ] 연결 테스트 통과

**Manual Test Checklist**:
- [ ] Supabase Dashboard에서 테이블 확인
- [ ] 클라이언트에서 연결 테스트

---

## Phase 2: Master Data Management
**Goal**: 회사정보, 차종, 거래처, 제품 마스터 CRUD + 일괄등록
**Estimated Time**: 12-15 hours
**Status**: ⏳ Pending

### Tasks

**🔴 RED: Write Failing Tests First**
- [ ] **Test 2.1**: Repository 통합 테스트 작성
  - File(s): `test/integration/gateways/*.test.ts`
  - Expected: Tests FAIL (repository 미구현)
  - Details: CRUD 오퍼레이션 테스트

- [ ] **Test 2.2**: 일괄등록 UseCase 단위 테스트
  - File(s): `test/unit/application/usecases/BulkImportUseCase.test.ts`
  - Expected: Tests FAIL

**🟢 GREEN: Implement to Make Tests Pass**
- [ ] **Task 2.3**: Supabase Repository 구현체 생성
  - Files:
    - `src/interface/gateways/SupabaseCompanyRepository.ts`
    - `src/interface/gateways/SupabaseVehicleModelRepository.ts`
    - `src/interface/gateways/SupabasePartnerRepository.ts`
    - `src/interface/gateways/SupabaseProductRepository.ts`
    - `src/interface/gateways/SupabaseExchangeRateRepository.ts`

- [ ] **Task 2.4**: shadcn/ui 설치 및 기본 컴포넌트 설정
  - Command: `npx shadcn-ui@latest init`
  - Components: Button, Input, Form, Dialog, Table, Select

- [ ] **Task 2.5**: 회사 정보 관리 화면
  - File: `src/infrastructure/react/pages/CompanySettingsPage.tsx`
  - Features: 조회, 수정

- [ ] **Task 2.6**: 차종 마스터 화면
  - File: `src/infrastructure/react/pages/VehicleModelsPage.tsx`
  - Features: CRUD, 검색, 페이지네이션, Excel 일괄등록

- [ ] **Task 2.7**: 거래처 마스터 화면
  - File: `src/infrastructure/react/pages/PartnersPage.tsx`
  - Features: CRUD, 유형별 필터링 (SUPPLIER/CUSTOMER/VIETNAM), Excel 일괄등록

- [ ] **Task 2.8**: 제품 마스터 화면
  - File: `src/infrastructure/react/pages/ProductsPage.tsx`
  - Features: CRUD, 이원화 설정 (primary_supplier, domestic_ratio), Excel 일괄등록

- [ ] **Task 2.9**: 환율 관리 화면
  - File: `src/infrastructure/react/pages/ExchangeRatesPage.tsx`
  - Features: 고정 환율 설정, 변경 이력 조회

- [ ] **Task 2.10**: TanStack Table 공통 컴포넌트
  - File: `src/infrastructure/react/components/DataTable.tsx`
  - Features: 정렬, 필터링, 페이지네이션, 행 선택

**🔵 REFACTOR: Clean Up Code**
- [ ] **Task 2.11**: 공통 컴포넌트 추출 및 리팩터링

### Quality Gate ✋

**TDD Compliance**:
- [ ] Repository 통합 테스트 100% 통과
- [ ] UseCase 단위 테스트 통과
- [ ] Coverage ≥80%

**Build & Tests**:
```bash
npm run build
npm run test
npm run test:integration
```

**Manual Test Checklist**:
- [ ] 각 마스터 CRUD 동작 확인
- [ ] Excel 일괄등록 테스트 (성공/실패 케이스)
- [ ] 검색 및 필터링 동작 확인

---

## Phase 3: Excel Upload & Advanced Validation
**Goal**: MES 엑셀 업로드 + 고급 검증 시스템 (참조 무결성, 인라인 수정)
**Estimated Time**: 12-15 hours
**Status**: ⏳ Pending

### Tasks

**🔴 RED: Write Failing Tests First**
- [ ] **Test 3.1**: ValidateUploadDataUseCase 단위 테스트
  - File(s): `test/unit/application/usecases/ValidateUploadDataUseCase.test.ts`
  - Details:
    - 필수값 체크 테스트
    - 참조 무결성 테스트 (존재하지 않는 거래처코드)
    - 환율 검증 테스트

- [ ] **Test 3.2**: ExcelParser 테스트
  - File(s): `test/unit/infrastructure/external/ExcelParser.test.ts`

**🟢 GREEN: Implement to Make Tests Pass**
- [ ] **Task 3.3**: ExcelParser 구현
  - File: `src/infrastructure/external/ExcelParser.ts`
  - Dependencies: xlsx 라이브러리
  - Features: 입고/출고 템플릿 파싱

- [ ] **Task 3.4**: ValidateUploadDataUseCase 구현
  - File: `src/application/usecases/ValidateUploadDataUseCase.ts`
  - Validation Levels:
    - Level 1: 필수값 체크, 중복 체크
    - Level 2: 참조 무결성 (거래처코드, 품번 존재 확인)
    - Level 3: 환율 검증 (USD 거래 시 환율 등록 여부)

- [ ] **Task 3.5**: 업로드 프리뷰 화면 구현
  - File: `src/infrastructure/react/pages/UploadPreviewPage.tsx`
  - Features:
    - 스테이징 테이블 (검증 전 데이터)
    - 오류 하이라이팅 (빨간 배경 + 툴팁)
    - 정상/오류 건수 표시

- [ ] **Task 3.6**: 인라인 수정 기능
  - File: `src/infrastructure/react/components/EditableCell.tsx`
  - Features: 클릭 시 수정 모드, 재검증 트리거

- [ ] **Task 3.7**: 입고 데이터 업로드 화면
  - File: `src/infrastructure/react/pages/ReceiptUploadPage.tsx`
  - Template: 입고마감관리-YYYYMMDD.xlsx

- [ ] **Task 3.8**: 출고 데이터 업로드 화면
  - File: `src/infrastructure/react/pages/ShipmentUploadPage.tsx`
  - Template: 출고마감관리-YYYYMMDD.xlsx

- [ ] **Task 3.9**: UploadInventoryDataUseCase 구현
  - File: `src/application/usecases/UploadInventoryDataUseCase.ts`
  - Features: 검증 통과 데이터 → inventory_transactions 저장

**🔵 REFACTOR: Clean Up Code**
- [ ] **Task 3.10**: 검증 로직 모듈화

### Quality Gate ✋

**TDD Compliance**:
- [ ] 검증 로직 단위 테스트 100% 통과
- [ ] Coverage ≥90%

**Manual Test Checklist**:
- [ ] 정상 파일 업로드 → 프리뷰 → 저장 성공
- [ ] 오류 파일 업로드 → 하이라이팅 표시
- [ ] 인라인 수정 → 재검증 → 저장 성공
- [ ] 참조 무결성 오류 (존재하지 않는 거래처코드) 검출

---

## Phase 4: MRP Calculation Engine
**Goal**: 핵심 MRP 계산 로직 + 이원화 분할 발주
**Estimated Time**: 10-12 hours
**Status**: ⏳ Pending

### Tasks

**🔴 RED: Write Failing Tests First**
- [ ] **Test 4.1**: CalculateMRPUseCase 단위 테스트
  - File(s): `test/unit/application/usecases/CalculateMRPUseCase.test.ts`
  - Details:
    - 안전재고 계산 (국내 ×1.2, 베트남 ×1.5)
    - 순소요량 계산
    - 발주점 계산

- [ ] **Test 4.2**: SplitOrderByRatioUseCase 단위 테스트
  - File(s): `test/unit/application/usecases/SplitOrderByRatioUseCase.test.ts`
  - Details:
    - 70:30 분할 시 정확한 수량 계산
    - 반올림 처리 검증
    - 100:0, 0:100 엣지 케이스

**🟢 GREEN: Implement to Make Tests Pass**
- [ ] **Task 4.3**: MRPCalculationService 구현
  - File: `src/application/services/MRPCalculationService.ts`
  - Formulas:
    ```typescript
    // 안전재고
    safetyStock = dailyAvgShipment × leadTime × coefficient
    // coefficient: 국내 1.2, 베트남 1.5

    // 순소요량
    netRequirement = totalRequirement - currentStock - pendingOrders + safetyStock

    // 발주점
    reorderPoint = safetyStock + (dailyConsumption × leadTime)
    ```

- [ ] **Task 4.4**: CalculateMRPUseCase 구현
  - File: `src/application/usecases/CalculateMRPUseCase.ts`
  - Input: 제품 ID, 기간
  - Output: MRP 계산 결과 (순소요량, 발주권고량, 발주시점)

- [ ] **Task 4.5**: SplitOrderByRatioUseCase 구현
  - File: `src/application/usecases/SplitOrderByRatioUseCase.ts`
  - Logic:
    ```typescript
    domesticQty = Math.round(totalQty × domesticRatio / 100)
    vietnamQty = totalQty - domesticQty
    ```

- [ ] **Task 4.6**: MRP 계산 결과 화면
  - File: `src/infrastructure/react/pages/MRPResultPage.tsx`
  - Features:
    - 품목별 MRP 계산 결과 테이블
    - 긴급 발주 필요 품목 하이라이팅
    - 발주 권고 목록

- [ ] **Task 4.7**: 발주 권고 리스트 화면
  - File: `src/infrastructure/react/pages/OrderRecommendationPage.tsx`
  - Features:
    - 국내/베트남 분리 표시
    - 일괄 발주 생성 버튼

**🔵 REFACTOR: Clean Up Code**
- [ ] **Task 4.8**: MRP 계산 로직 최적화

### Quality Gate ✋

**TDD Compliance**:
- [ ] MRP 계산 단위 테스트 100% 통과
- [ ] 분할 발주 테스트 100% 통과
- [ ] Coverage ≥95% (핵심 비즈니스 로직)

**Manual Test Checklist**:
- [ ] MRP 계산 정확도 검증 (수동 계산과 비교)
- [ ] 이원화 분할 정확도 검증
- [ ] 긴급 발주 품목 정확히 표시

---

## Phase 5: Vietnam Special Ordering
**Goal**: 베트남 주간 통합 발주 + 선적일 선택
**Estimated Time**: 8-10 hours
**Status**: ⏳ Pending

### Tasks

**🔴 RED: Write Failing Tests First**
- [ ] **Test 5.1**: ConsolidateVietnamOrdersUseCase 단위 테스트
  - File(s): `test/unit/application/usecases/ConsolidateVietnamOrdersUseCase.test.ts`
  - Details:
    - 월~목 발주 권고 누적 테스트
    - 금요일 통합 발주 생성 테스트
    - 선적일 → 입고일 계산 테스트

**🟢 GREEN: Implement to Make Tests Pass**
- [ ] **Task 5.2**: ConsolidateVietnamOrdersUseCase 구현
  - File: `src/application/usecases/ConsolidateVietnamOrdersUseCase.ts`
  - Logic:
    - 월~목: 발주 권고 누적 (pending_vietnam_orders 테이블)
    - 금요일(또는 지정일): 누적 물량 합산 → 통합 발주서 생성

- [ ] **Task 5.3**: 선적 예정일 선택 UI
  - File: `src/infrastructure/react/components/ShipmentDatePicker.tsx`
  - Features:
    - Date Picker
    - 예상 입고일 자동 계산 (선적일 + 리드타임)

- [ ] **Task 5.4**: 베트남 통합 발주 화면
  - File: `src/infrastructure/react/pages/VietnamOrderPage.tsx`
  - Features:
    - 누적 발주 권고 목록
    - 선적 예정일 선택
    - 통합 발주서 생성 버튼
    - USD 환산 금액 표시

- [ ] **Task 5.5**: 베트남 발주서 템플릿
  - File: `src/infrastructure/external/VietnamOrderTemplate.ts`
  - Features: USD 기준, 선적일 포함

**🔵 REFACTOR: Clean Up Code**
- [ ] **Task 5.6**: 날짜 계산 유틸리티 함수 분리

### Quality Gate ✋

**TDD Compliance**:
- [ ] 주간 통합 발주 테스트 통과
- [ ] 선적일 → 입고일 계산 정확도 100%

**Manual Test Checklist**:
- [ ] 월~목 발주 권고 누적 확인
- [ ] 금요일 통합 발주 생성 테스트
- [ ] 선적일 선택 → 예상 입고일 표시

---

## Phase 6: Purchase Order Generation
**Goal**: 발주서 생성 (Excel/PDF) + 상태 관리 + 감사 로그
**Estimated Time**: 12-15 hours
**Status**: ⏳ Pending

### Tasks

**🔴 RED: Write Failing Tests First**
- [ ] **Test 6.1**: GeneratePurchaseOrderUseCase 단위 테스트
  - File(s): `test/unit/application/usecases/GeneratePurchaseOrderUseCase.test.ts`

- [ ] **Test 6.2**: 발주 상태 변경 및 로그 기록 테스트
  - File(s): `test/integration/OrderStatusChange.test.ts`

**🟢 GREEN: Implement to Make Tests Pass**
- [ ] **Task 6.3**: GeneratePurchaseOrderUseCase 구현
  - File: `src/application/usecases/GeneratePurchaseOrderUseCase.ts`
  - Features:
    - 발주번호 자동 생성 (PO-YYYYMMDD-NNN)
    - 발주 데이터 저장
    - 초기 상태: DRAFT

- [ ] **Task 6.4**: 발주 상태 관리 로직
  - File: `src/application/usecases/UpdateOrderStatusUseCase.ts`
  - Status Flow: DRAFT → CONFIRMED → SENT → PARTIAL → COMPLETED
  - 상태 변경 시 purchase_order_logs 자동 기록

- [ ] **Task 6.5**: Excel 발주서 생성
  - File: `src/infrastructure/external/ExcelOrderGenerator.ts`
  - Features: 회사 정보 반영, A4 출력용 양식

- [ ] **Task 6.6**: PDF 발주서 생성 (Supabase Edge Function)
  - File: `supabase/functions/generate-pdf/index.ts`
  - Dependencies: reportlab (Python) 또는 pdf-lib
  - Features: 회사 정보, 발주 품목, 합계

- [ ] **Task 6.7**: 발주서 목록 화면
  - File: `src/infrastructure/react/pages/PurchaseOrdersPage.tsx`
  - Features:
    - 상태별 필터링
    - 날짜 범위 검색
    - Excel/PDF 다운로드

- [ ] **Task 6.8**: 발주서 상세 화면
  - File: `src/infrastructure/react/pages/PurchaseOrderDetailPage.tsx`
  - Features:
    - 기본 정보 탭
    - 품목 목록 탭
    - 이력(감사 로그) 탭

- [ ] **Task 6.9**: 발주 이력 조회 컴포넌트
  - File: `src/infrastructure/react/components/OrderAuditLog.tsx`
  - Features: 변경일시, 상태변경, 변경자 표시

**🔵 REFACTOR: Clean Up Code**
- [ ] **Task 6.10**: 발주서 템플릿 모듈화

### Quality Gate ✋

**TDD Compliance**:
- [ ] 발주 생성 테스트 통과
- [ ] 상태 변경 + 로그 기록 테스트 통과

**Manual Test Checklist**:
- [ ] 발주서 생성 → Excel 다운로드 확인
- [ ] 발주서 생성 → PDF 다운로드 확인
- [ ] 상태 변경 → 감사 로그 자동 기록 확인
- [ ] 이력 조회 화면 정상 표시

---

## Phase 7: Dashboard & Notifications
**Goal**: KPI 대시보드 + 실시간 알림
**Estimated Time**: 10-12 hours
**Status**: ⏳ Pending

### Tasks

**🔴 RED: Write Failing Tests First**
- [ ] **Test 7.1**: 대시보드 데이터 집계 테스트
  - File(s): `test/integration/DashboardData.test.ts`

**🟢 GREEN: Implement to Make Tests Pass**
- [ ] **Task 7.2**: 대시보드 데이터 집계 쿼리
  - File: `src/interface/gateways/DashboardRepository.ts`
  - Queries:
    - 긴급발주 필요 품목 (현재고 < 안전재고 × 50%)
    - 재고 부족 예상 품목 Top 5
    - 입고율/출고율 (일간/주간/월간)
    - 거래처별 입출고 현황

- [ ] **Task 7.3**: 대시보드 메인 화면
  - File: `src/infrastructure/react/pages/DashboardPage.tsx`
  - Features:
    - KPI 카드 (긴급발주, 재고부족, 입고율, 출고율)
    - 차종별 긴급발주 품목 카드
    - 거래처별 입출고 Bar Chart

- [ ] **Task 7.4**: KPI 카드 컴포넌트
  - File: `src/infrastructure/react/components/KPICard.tsx`
  - Features: 아이콘, 숫자, 추세 표시

- [ ] **Task 7.5**: 차트 컴포넌트
  - File: `src/infrastructure/react/components/BarChart.tsx`
  - Dependencies: recharts 또는 Chart.js
  - Features: 거래처별 입출고 수량/금액

- [ ] **Task 7.6**: 알림 센터 구현
  - File: `src/infrastructure/react/components/NotificationCenter.tsx`
  - Features:
    - 헤더 벨 아이콘 + 읽지 않은 알림 수 배지
    - 알림 목록 드롭다운
    - 알림 읽음 처리

- [ ] **Task 7.7**: Supabase Realtime 알림 연동
  - File: `src/infrastructure/supabase/realtime.ts`
  - Features:
    - 긴급발주 알림 실시간 수신
    - 재고부족 경고 실시간 수신

- [ ] **Task 7.8**: 알림 테이블 및 트리거 설정
  - SQL: notifications 테이블, 트리거 함수

**🔵 REFACTOR: Clean Up Code**
- [ ] **Task 7.9**: 대시보드 성능 최적화 (메모이제이션)

### Quality Gate ✋

**TDD Compliance**:
- [ ] 대시보드 데이터 집계 테스트 통과

**Manual Test Checklist**:
- [ ] 대시보드 KPI 정확도 검증
- [ ] 긴급발주 품목 클릭 → 상세 팝업
- [ ] Realtime 알림 수신 테스트
- [ ] 알림 읽음 처리 동작 확인

---

## Phase 8: Testing & Polish
**Goal**: E2E 테스트 + 성능 최적화 + 버그 수정
**Estimated Time**: 10-12 hours
**Status**: ⏳ Pending

### Tasks

**🔴 RED: Write E2E Test Scenarios**
- [ ] **Test 8.1**: E2E 테스트 - 업로드 → 발주 플로우
  - File(s): `test/e2e/upload-to-order.spec.ts`
  - Scenario:
    1. 로그인
    2. 입고 데이터 Excel 업로드
    3. 검증 오류 수정
    4. 저장
    5. MRP 계산 실행
    6. 발주 권고 확인
    7. 발주서 생성
    8. PDF 다운로드

- [ ] **Test 8.2**: E2E 테스트 - 마스터 CRUD
  - File(s): `test/e2e/master-crud.spec.ts`

- [ ] **Test 8.3**: E2E 테스트 - 대시보드
  - File(s): `test/e2e/dashboard.spec.ts`

**🟢 GREEN: Fix Issues & Optimize**
- [ ] **Task 8.4**: E2E 테스트 실행 및 버그 수정
  - Command: `npx playwright test`

- [ ] **Task 8.5**: 성능 최적화 - DB 인덱스
  - SQL: 자주 사용되는 조회 컬럼에 인덱스 추가
  - Tables: inventory_transactions, purchase_orders

- [ ] **Task 8.6**: 성능 최적화 - React 메모이제이션
  - Files: 대시보드, 테이블 컴포넌트
  - Techniques: useMemo, useCallback, React.memo

- [ ] **Task 8.7**: UI 폴리싱
  - Details:
    - 로딩 상태 표시
    - 에러 처리 UI
    - 반응형 레이아웃

- [ ] **Task 8.8**: 문서화
  - Files:
    - README.md 업데이트
    - API 문서
    - 사용자 가이드

**🔵 REFACTOR: Final Cleanup**
- [ ] **Task 8.9**: 코드 리뷰 및 최종 정리

### Quality Gate ✋

**E2E Test Results**:
```bash
npx playwright test
# 모든 테스트 통과
```

**Performance Targets**:
- [ ] 대시보드 로딩 < 2초
- [ ] MRP 계산 < 3초 (1000개 품목)
- [ ] Excel 업로드 검증 < 5초 (1000행)

**Manual Test Checklist**:
- [ ] 전체 플로우 테스트 (업로드 → 발주서 생성)
- [ ] 모바일 반응형 확인
- [ ] 에러 핸들링 확인

---

## ⚠️ Risk Assessment

| Risk | Probability | Impact | Mitigation Strategy |
|------|-------------|--------|---------------------|
| Supabase RLS 복잡성 | 중 | 고 | Phase 1에서 RLS 정책 충분히 테스트, 문서화 |
| MRP 계산 오류 | 중 | 고 | 단위 테스트 100% 커버리지, 수동 검산 검증 |
| Excel 파싱 다양한 포맷 | 중 | 중 | 템플릿 엄격히 정의, 다양한 테스트 케이스 |
| 베트남 발주 로직 복잡성 | 중 | 중 | 별도 UseCase로 분리, 충분한 테스트 |
| PDF 생성 성능 | 저 | 중 | Edge Function 비동기 처리, 백그라운드 작업 |
| Realtime 알림 지연 | 저 | 저 | 폴백 메커니즘 (폴링) 준비 |

---

## 🔄 Rollback Strategy

### Phase 1 Rollback
- Git commit 롤백
- Supabase 테이블 DROP (필요 시)

### Phase 2-7 Rollback
- Git commit 롤백
- 해당 Phase에서 추가된 테이블 데이터 삭제
- 이전 Phase 완료 상태로 복원

### Phase 8 Rollback
- 성능 최적화 롤백: 인덱스 DROP
- UI 변경 롤백: Git commit 롤백

---

## 📊 Progress Tracking

### Completion Status
- **Phase 1 (Foundation)**: ⏳ 0%
- **Phase 2 (Master Data)**: ⏳ 0%
- **Phase 3 (Excel Upload)**: ⏳ 0%
- **Phase 4 (MRP Engine)**: ⏳ 0%
- **Phase 5 (Vietnam Order)**: ⏳ 0%
- **Phase 6 (Purchase Order)**: ⏳ 0%
- **Phase 7 (Dashboard)**: ⏳ 0%
- **Phase 8 (Testing)**: ⏳ 0%

**Overall Progress**: 0% complete

### Time Tracking
| Phase | Estimated | Actual | Variance |
|-------|-----------|--------|----------|
| Phase 1 | 10h | - | - |
| Phase 2 | 15h | - | - |
| Phase 3 | 15h | - | - |
| Phase 4 | 12h | - | - |
| Phase 5 | 10h | - | - |
| Phase 6 | 15h | - | - |
| Phase 7 | 12h | - | - |
| Phase 8 | 12h | - | - |
| **Total** | ~100h | - | - |

---

## 📝 Notes & Learnings

### Implementation Notes
- (Phase 진행 시 기록)

### Blockers Encountered
- (발생 시 기록)

### Improvements for Future Plans
- (완료 후 기록)

---

## 📚 References

### Documentation
- [Supabase Docs](https://supabase.com/docs)
- [TanStack Table Docs](https://tanstack.com/table/latest)
- [shadcn/ui Docs](https://ui.shadcn.com/)

### MCP Servers
- **context7**: React, TypeScript, TanStack 라이브러리 문서
- **supabase**: DB 스키마, Auth, RLS, Edge Functions
- **postgres**: SQL 최적화, 인덱스 설계
- **magic**: 대시보드 UI, 차트 컴포넌트
- **playwright**: E2E 테스트 자동화
- **sequential-thinking**: MRP 알고리즘 설계

---

## ✅ Final Checklist

**Before marking plan as COMPLETE**:
- [ ] All 8 phases completed with quality gates passed
- [ ] Full integration testing performed
- [ ] E2E test coverage ≥80%
- [ ] Documentation updated (README, API docs)
- [ ] Performance benchmarks met (<2s page load)
- [ ] Clean Architecture 원칙 100% 준수 확인
- [ ] Domain 레이어 외부 의존성 0개 확인
- [ ] All stakeholders notified

---

**Plan Status**: 🔄 Awaiting Approval
**Next Action**: 사용자 승인 후 Phase 1 시작
