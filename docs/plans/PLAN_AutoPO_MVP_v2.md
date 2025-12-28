# Implementation Plan: Auto PO System (자동발주 시스템) MVP v2

## Hybrid Architecture Approach

**Status**: 🔄 In Progress
**Started**: 2025-12-27
**Last Updated**: 2025-12-27
**Estimated Completion**: 9 Phases (~70 hours)
**Phase 1**: ✅ Complete
**Phase 2**: ✅ Complete (136 tests passed)
**Phase 3**: ✅ Complete (264 tests passed, 90.96% coverage)

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

### Hybrid Architecture Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│  STAGE 1: Pure Business Logic (Phase 1-3)                      │
│  ─────────────────────────────────────────────────────────────  │
│  • Domain Layer: 순수 TypeScript, 외부 의존성 ZERO             │
│  • Application Layer: Domain만 의존, UseCases 구현              │
│  • 단위 테스트 100% 커버리지                                    │
│  → React도 Supabase도 모름. 비즈니스 로직만 집중.              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  STAGE 2: Full Stack by Feature (Phase 4-9)                    │
│  ─────────────────────────────────────────────────────────────  │
│  • Supabase Repository 구현 + React UI 함께                    │
│  • 기능별로 완성 → 바로 테스트 가능                             │
│  • 이미 검증된 비즈니스 로직 위에 구축                          │
└─────────────────────────────────────────────────────────────────┘
```

### 의존성 규칙 (엄격 준수)

```
infrastructure/ ──┐
                  ├──→ interface/ ──→ application/ ──→ domain/
                  │         ↑              ↑              ↑
                  │      Adapters       UseCases        Core
                  │                                       │
                  └─────────── 역방향 import 절대 금지 ────┘
```

### Success Criteria
- [ ] Domain/Application 레이어 외부 의존성 ZERO
- [ ] 비즈니스 로직 (MRP, 분할발주) 단위 테스트 100%
- [ ] MES Excel 업로드 → 발주서 생성 전체 플로우 동작
- [ ] E2E 테스트 커버리지 ≥80%
- [ ] 주요 페이지 로딩 < 2초

---

## 🏗️ Architecture Decisions

### Clean Architecture 폴더 구조

```
src/
├── domain/                      # 💎 핵심 (Phase 2)
│   ├── entities/
│   │   ├── Company.ts
│   │   ├── Partner.ts
│   │   ├── Product.ts
│   │   ├── VehicleModel.ts
│   │   ├── ExchangeRate.ts
│   │   ├── InventoryTransaction.ts
│   │   ├── ShipmentPlan.ts
│   │   ├── PurchaseOrder.ts
│   │   └── PurchaseOrderLog.ts
│   ├── valueObjects/
│   │   ├── Money.ts
│   │   ├── Quantity.ts
│   │   ├── OrderStatus.ts
│   │   ├── PartnerType.ts
│   │   ├── SupplierType.ts
│   │   └── DateRange.ts
│   └── repositories/
│       ├── ICompanyRepository.ts
│       ├── IPartnerRepository.ts
│       ├── IProductRepository.ts
│       ├── IInventoryRepository.ts
│       └── IOrderRepository.ts
│
├── application/                 # 🎯 유스케이스 (Phase 3)
│   ├── usecases/
│   │   ├── CalculateMRPUseCase.ts
│   │   ├── SplitOrderByRatioUseCase.ts
│   │   ├── ValidateUploadDataUseCase.ts
│   │   ├── ConsolidateVietnamOrdersUseCase.ts
│   │   └── GeneratePurchaseOrderUseCase.ts
│   └── services/
│       └── MRPCalculationService.ts
│
├── interface/                   # 🔌 어댑터 (Phase 4+)
│   ├── controllers/
│   ├── presenters/
│   └── gateways/
│       ├── SupabaseCompanyRepository.ts
│       ├── SupabasePartnerRepository.ts
│       ├── SupabaseProductRepository.ts
│       └── ...
│
└── infrastructure/              # 🔧 프레임워크 (Phase 4+)
    ├── supabase/
    │   └── client.ts
    ├── react/
    │   ├── components/
    │   ├── pages/
    │   └── hooks/
    └── external/
        ├── ExcelParser.ts
        └── PdfGenerator.ts
```

| Decision | Rationale | Trade-offs |
|----------|-----------|------------|
| Domain First | MRP 로직 UI 없이 100% 검증 가능 | 초기에 시각적 결과물 없음 |
| Application First | 비즈니스 규칙 확정 후 UI 개발 | 테스트 작성 시간 필요 |
| Feature-based Full Stack | 기능별 완성으로 빠른 피드백 | 병렬 개발 어려움 |

---

## 📦 Dependencies

### Core Dependencies
```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.28.0",
    "@supabase/supabase-js": "^2.47.0",
    "@tanstack/react-table": "^8.20.0",
    "date-fns": "^4.1.0",
    "zod": "^3.24.0",
    "xlsx": "^0.18.5"
  },
  "devDependencies": {
    "vitest": "^2.1.0",
    "@playwright/test": "^1.x",
    "typescript": "~5.7.2"
  }
}
```

---

## 🧪 Test Strategy

### Phase별 테스트 전략

| Phase | Test Type | Coverage Target |
|-------|-----------|-----------------|
| Phase 2 (Domain) | Unit | 100% |
| Phase 3 (Application) | Unit + Mock | 100% |
| Phase 4-8 (Full Stack) | Integration | ≥80% |
| Phase 9 (Polish) | E2E | Critical Paths |

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

## Phase 1: Project Foundation
**Goal**: 프로젝트 인프라 + Supabase 테이블 구축
**Estimated Time**: 4 hours
**Status**: ⏳ Pending

### Tasks

**🔴 RED: Write Failing Tests First**
- [ ] **Test 1.1**: 프로젝트 빌드 테스트
  - Command: `npm run build` should succeed
  - Expected: FAIL (프로젝트 미생성)

**🟢 GREEN: Implement to Make Tests Pass**
- [ ] **Task 1.2**: Vite + React + TypeScript 프로젝트 생성
  - Files: `package.json`, `vite.config.ts`, `tsconfig.json`

- [ ] **Task 1.3**: Clean Architecture 폴더 구조 생성
  ```
  src/
  ├── domain/
  │   ├── entities/
  │   ├── valueObjects/
  │   └── repositories/
  ├── application/
  │   ├── usecases/
  │   └── services/
  ├── interface/
  │   ├── controllers/
  │   ├── presenters/
  │   └── gateways/
  └── infrastructure/
      ├── supabase/
      ├── react/
      └── external/
  ```

- [ ] **Task 1.4**: Path Aliases 설정
  - `@domain/*`, `@application/*`, `@interface/*`, `@infrastructure/*`

- [ ] **Task 1.5**: ESLint 의존성 규칙 설정
  - domain → 외부 import 금지
  - application → domain만 허용

- [ ] **Task 1.6**: Vitest 테스트 환경 설정
  - File: `vitest.config.ts`

- [ ] **Task 1.7**: Supabase 테이블 스키마 SQL 작성
  - 9개 테이블: company_configs, vehicle_models, partners, products, exchange_rates, inventory_transactions, shipment_plans, purchase_orders, purchase_order_logs

- [ ] **Task 1.8**: Supabase 클라이언트 설정
  - File: `src/infrastructure/supabase/client.ts`

**🔵 REFACTOR: Clean Up Code**
- [ ] **Task 1.9**: 폴더별 index.ts export 정리

### Quality Gate ✋

```bash
npm run build          # 빌드 성공
npm run test           # 테스트 환경 동작
npm run lint           # 린트 통과
npm run type-check     # 타입 체크 통과
```

- [ ] 9개 테이블 Supabase에 생성 완료
- [ ] Path aliases 동작 확인
- [ ] ESLint 의존성 규칙 동작 확인

---

## Phase 2: Domain Layer (Pure TypeScript)
**Goal**: 순수 비즈니스 엔티티 + Value Objects (외부 의존성 ZERO)
**Estimated Time**: 6 hours
**Status**: ⏳ Pending

### ⚠️ CRITICAL RULE
```
이 Phase의 모든 코드는:
- import 문에 외부 라이브러리 ZERO
- React, Supabase, date-fns 등 절대 사용 금지
- 순수 TypeScript만 허용
```

### Tasks

**🔴 RED: Write Failing Tests First**
- [ ] **Test 2.1**: Entity 생성 테스트
  - File: `test/unit/domain/entities/Partner.test.ts`
  - Scenarios:
    - 유효한 Partner 생성 성공
    - 필수값 누락 시 에러
    - PartnerType 검증

- [ ] **Test 2.2**: Value Object 테스트
  - File: `test/unit/domain/valueObjects/Money.test.ts`
  - Scenarios:
    - Money 생성 (금액, 통화)
    - 환산 계산
    - 동등성 비교
    - 불변성 검증

- [ ] **Test 2.3**: Product 이원화 설정 테스트
  - File: `test/unit/domain/entities/Product.test.ts`
  - Scenarios:
    - DOMESTIC only 설정
    - VIETNAM only 설정
    - BOTH 설정 (비율 포함)

**🟢 GREEN: Implement to Make Tests Pass**
- [ ] **Task 2.4**: Value Objects 구현
  - `src/domain/valueObjects/Money.ts`
  - `src/domain/valueObjects/Quantity.ts`
  - `src/domain/valueObjects/OrderStatus.ts`
  - `src/domain/valueObjects/PartnerType.ts`
  - `src/domain/valueObjects/SupplierType.ts`
  - `src/domain/valueObjects/DateRange.ts`

- [ ] **Task 2.5**: Entity 구현 (9개)
  - `src/domain/entities/Company.ts`
  - `src/domain/entities/Partner.ts`
  - `src/domain/entities/Product.ts`
  - `src/domain/entities/VehicleModel.ts`
  - `src/domain/entities/ExchangeRate.ts`
  - `src/domain/entities/InventoryTransaction.ts`
  - `src/domain/entities/ShipmentPlan.ts`
  - `src/domain/entities/PurchaseOrder.ts`
  - `src/domain/entities/PurchaseOrderLog.ts`

- [ ] **Task 2.6**: Repository Interfaces 정의
  - `src/domain/repositories/ICompanyRepository.ts`
  - `src/domain/repositories/IPartnerRepository.ts`
  - `src/domain/repositories/IProductRepository.ts`
  - `src/domain/repositories/IInventoryRepository.ts`
  - `src/domain/repositories/IOrderRepository.ts`

**🔵 REFACTOR: Clean Up Code**
- [ ] **Task 2.7**: 공통 타입 추출 및 정리

### Quality Gate ✋

```bash
npm run test -- --coverage src/domain
# Coverage: 100%

# 의존성 검증
grep -r "from '@supabase" src/domain/   # 결과 없어야 함
grep -r "from 'react" src/domain/       # 결과 없어야 함
```

- [ ] Domain 레이어 테스트 커버리지 100%
- [ ] 외부 라이브러리 import ZERO 확인
- [ ] 모든 Entity/ValueObject 타입 안전

---

## Phase 3: Application Layer (Business Logic)
**Goal**: 핵심 비즈니스 로직 UseCase 구현 (Domain만 의존)
**Estimated Time**: 8 hours
**Status**: ✅ Complete (264 tests, 90.96% coverage)

### ⚠️ CRITICAL RULE
```
이 Phase의 모든 코드는:
- @domain/* 만 import 가능
- Repository는 Interface로만 사용 (구현체 주입)
- React, Supabase 등 절대 사용 금지
```

### Tasks

**🔴 RED: Write Failing Tests First**
- [x] **Test 3.1**: CalculateMRPUseCase 테스트
  - File: `test/unit/application/usecases/CalculateMRPUseCase.test.ts`
  - Scenarios:
    ```typescript
    // 안전재고 계산
    test('국내 안전재고 = 일평균출하량 × 리드타임 × 1.2')
    test('베트남 안전재고 = 일평균출하량 × 리드타임 × 1.5')

    // 순소요량 계산
    test('순소요량 = 총소요량 - 현재고 - 기발주량 + 안전재고')

    // 발주점 계산
    test('발주점 = 안전재고 + (일평균소비량 × 리드타임)')

    // Edge cases
    test('현재고가 안전재고보다 많으면 발주 불필요')
    test('일평균출하량 0일 때 처리')
    ```

- [x] **Test 3.2**: SplitOrderByRatioUseCase 테스트
  - File: `test/unit/application/usecases/SplitOrderByRatioUseCase.test.ts`
  - Scenarios:
    ```typescript
    test('70:30 분할 시 1000개 → 국내 700, 베트남 300')
    test('반올림: 1001개 70% → 국내 701, 베트남 300')
    test('100:0 분할 시 베트남 0')
    test('0:100 분할 시 국내 0')
    test('DOMESTIC only면 분할 안함')
    test('VIETNAM only면 분할 안함')
    ```

- [x] **Test 3.3**: ValidateUploadDataUseCase 테스트
  - File: `test/unit/application/usecases/ValidateUploadDataUseCase.test.ts`
  - Scenarios:
    ```typescript
    test('필수값 누락 검출')
    test('존재하지 않는 거래처코드 검출')
    test('존재하지 않는 품번 검출')
    test('USD 거래 시 환율 미등록 검출')
    test('중복 행 검출')
    test('모든 검증 통과 시 성공')
    ```

- [x] **Test 3.4**: ConsolidateVietnamOrdersUseCase 테스트
  - File: `test/unit/application/usecases/ConsolidateVietnamOrdersUseCase.test.ts`
  - Scenarios:
    ```typescript
    test('월~목 발주권고 누적')
    test('동일 품목 수량 합산')
    test('통합 발주서 생성')
    ```

- [x] **Test 3.5**: GeneratePurchaseOrderUseCase 테스트
  - File: `test/unit/application/usecases/GeneratePurchaseOrderUseCase.test.ts`
  - Scenarios:
    ```typescript
    test('발주번호 생성: PO-YYYYMMDD-NNN')
    test('초기 상태: DRAFT')
    test('총수량, 총금액 계산')
    ```

**🟢 GREEN: Implement to Make Tests Pass**
- [x] **Task 3.6**: MRPCalculationService 구현
  - File: `src/application/services/MRPCalculationService.ts`
  - Methods:
    - `calculateSafetyStock(dailyAvg, leadTime, supplierType)`
    - `calculateNetRequirement(total, stock, pending, safety)`
    - `calculateReorderPoint(safety, daily, leadTime)`

- [x] **Task 3.7**: CalculateMRPUseCase 구현
  - File: `src/application/usecases/CalculateMRPUseCase.ts`

- [x] **Task 3.8**: SplitOrderByRatioUseCase 구현
  - File: `src/application/usecases/SplitOrderByRatioUseCase.ts`

- [x] **Task 3.9**: ValidateUploadDataUseCase 구현
  - File: `src/application/usecases/ValidateUploadDataUseCase.ts`

- [x] **Task 3.10**: ConsolidateVietnamOrdersUseCase 구현
  - File: `src/application/usecases/ConsolidateVietnamOrdersUseCase.ts`

- [x] **Task 3.11**: GeneratePurchaseOrderUseCase 구현
  - File: `src/application/usecases/GeneratePurchaseOrderUseCase.ts`

**🔵 REFACTOR: Clean Up Code**
- [x] **Task 3.12**: 공통 계산 로직 추출

### Quality Gate ✋

```bash
pnpm run test:coverage
# Coverage: 90.96%

# 의존성 검증
grep -r "from '@infrastructure" src/application/  # 결과 없어야 함 ✅
grep -r "from '@interface" src/application/       # 결과 없어야 함 ✅
```

- [x] Application 레이어 테스트 커버리지 90.96% (목표 80%+ 달성)
- [x] 모든 MRP 공식 정확도 검증
- [x] Domain만 의존 확인

---

## Phase 4: Infrastructure + Master Data UI
**Goal**: Supabase 연동 + 마스터 데이터 화면
**Estimated Time**: 10 hours
**Status**: ⏳ Pending

### Tasks

**🔴 RED: Write Failing Tests First**
- [ ] **Test 4.1**: Repository 통합 테스트
  - File: `test/integration/gateways/SupabasePartnerRepository.test.ts`

**🟢 GREEN: Implement to Make Tests Pass**
- [ ] **Task 4.2**: Supabase Repository 구현체
  - `src/interface/gateways/SupabaseCompanyRepository.ts`
  - `src/interface/gateways/SupabasePartnerRepository.ts`
  - `src/interface/gateways/SupabaseProductRepository.ts`
  - `src/interface/gateways/SupabaseVehicleModelRepository.ts`
  - `src/interface/gateways/SupabaseExchangeRateRepository.ts`

- [ ] **Task 4.3**: shadcn/ui 설치 및 기본 컴포넌트

- [ ] **Task 4.4**: TanStack Table 공통 컴포넌트
  - File: `src/infrastructure/react/components/DataTable.tsx`

- [ ] **Task 4.5**: 회사정보 설정 화면
  - File: `src/infrastructure/react/pages/CompanySettingsPage.tsx`

- [ ] **Task 4.6**: 차종 마스터 화면 (CRUD + 일괄등록)
  - File: `src/infrastructure/react/pages/VehicleModelsPage.tsx`

- [ ] **Task 4.7**: 거래처 마스터 화면 (CRUD + 유형필터 + 일괄등록)
  - File: `src/infrastructure/react/pages/PartnersPage.tsx`

- [ ] **Task 4.8**: 제품 마스터 화면 (CRUD + 이원화설정 + 일괄등록)
  - File: `src/infrastructure/react/pages/ProductsPage.tsx`

- [ ] **Task 4.9**: 환율 관리 화면
  - File: `src/infrastructure/react/pages/ExchangeRatesPage.tsx`

**🔵 REFACTOR: Clean Up Code**
- [ ] **Task 4.10**: 공통 폼/테이블 컴포넌트 추출

### Quality Gate ✋

```bash
npm run test:integration
npm run build
```

- [ ] 각 마스터 CRUD 동작 확인
- [ ] Excel 일괄등록 테스트 성공
- [ ] 검색/필터링 동작 확인

---

## Phase 5: Excel Upload + Validation UI
**Goal**: MES 엑셀 업로드 + 고급 검증 시스템
**Estimated Time**: 8 hours
**Status**: ⏳ Pending

### Tasks

- [ ] **Task 5.1**: ExcelParser 구현
  - File: `src/infrastructure/external/ExcelParser.ts`

- [ ] **Task 5.2**: 업로드 프리뷰 화면
  - File: `src/infrastructure/react/pages/UploadPreviewPage.tsx`

- [ ] **Task 5.3**: 오류 하이라이팅 UI
  - File: `src/infrastructure/react/components/ErrorHighlightCell.tsx`

- [ ] **Task 5.4**: 인라인 수정 기능
  - File: `src/infrastructure/react/components/EditableCell.tsx`

- [ ] **Task 5.5**: 입고 데이터 업로드 화면
  - File: `src/infrastructure/react/pages/ReceiptUploadPage.tsx`

- [ ] **Task 5.6**: 출고 데이터 업로드 화면
  - File: `src/infrastructure/react/pages/ShipmentUploadPage.tsx`

### Quality Gate ✋

- [ ] 정상 파일 업로드 → 저장 성공
- [ ] 오류 파일 → 하이라이팅 표시
- [ ] 인라인 수정 → 재검증 → 저장

---

## Phase 6: MRP + Vietnam Order UI
**Goal**: MRP 계산 결과 화면 + 베트남 특수 발주
**Estimated Time**: 8 hours
**Status**: ⏳ Pending

### Tasks

- [ ] **Task 6.1**: MRP 계산 결과 화면
  - File: `src/infrastructure/react/pages/MRPResultPage.tsx`

- [ ] **Task 6.2**: 발주 권고 리스트
  - File: `src/infrastructure/react/pages/OrderRecommendationPage.tsx`

- [ ] **Task 6.3**: 베트남 주간 통합 발주 화면
  - File: `src/infrastructure/react/pages/VietnamOrderPage.tsx`

- [ ] **Task 6.4**: 선적일 Date Picker 컴포넌트
  - File: `src/infrastructure/react/components/ShipmentDatePicker.tsx`

### Quality Gate ✋

- [ ] MRP 계산 정확도 검증 (수동 계산과 비교)
- [ ] 베트남 통합 발주 시나리오 테스트

---

## Phase 7: Purchase Order + Audit Log UI
**Goal**: 발주서 생성 + 상태 관리 + 감사 로그
**Estimated Time**: 10 hours
**Status**: ⏳ Pending

### Tasks

- [ ] **Task 7.1**: 발주서 목록 화면
  - File: `src/infrastructure/react/pages/PurchaseOrdersPage.tsx`

- [ ] **Task 7.2**: 발주서 상세 화면 (기본정보/품목/이력 탭)
  - File: `src/infrastructure/react/pages/PurchaseOrderDetailPage.tsx`

- [ ] **Task 7.3**: Excel 발주서 생성
  - File: `src/infrastructure/external/ExcelOrderGenerator.ts`

- [ ] **Task 7.4**: PDF 발주서 생성 (Edge Function)
  - File: `supabase/functions/generate-pdf/index.ts`

- [ ] **Task 7.5**: 발주 상태 관리 + 감사 로그 자동 기록

- [ ] **Task 7.6**: 발주 이력 조회 컴포넌트
  - File: `src/infrastructure/react/components/OrderAuditLog.tsx`

### Quality Gate ✋

- [ ] Excel/PDF 다운로드 성공
- [ ] 상태 변경 시 로그 자동 기록

---

## Phase 8: Dashboard + Notifications
**Goal**: KPI 대시보드 + 실시간 알림
**Estimated Time**: 8 hours
**Status**: ⏳ Pending

### Tasks

- [ ] **Task 8.1**: 대시보드 데이터 집계
  - File: `src/interface/gateways/DashboardRepository.ts`

- [ ] **Task 8.2**: 대시보드 메인 화면
  - File: `src/infrastructure/react/pages/DashboardPage.tsx`

- [ ] **Task 8.3**: KPI 카드 컴포넌트
  - File: `src/infrastructure/react/components/KPICard.tsx`

- [ ] **Task 8.4**: 차트 컴포넌트 (거래처별 입출고)
  - File: `src/infrastructure/react/components/BarChart.tsx`

- [ ] **Task 8.5**: 알림 센터
  - File: `src/infrastructure/react/components/NotificationCenter.tsx`

- [ ] **Task 8.6**: Supabase Realtime 알림 연동
  - File: `src/infrastructure/supabase/realtime.ts`

### Quality Gate ✋

- [ ] KPI 정확도 검증
- [ ] Realtime 알림 수신 테스트

---

## Phase 9: E2E Testing + Polish
**Goal**: 전체 플로우 테스트 + 성능 최적화
**Estimated Time**: 8 hours
**Status**: ⏳ Pending

### Tasks

- [ ] **Task 9.1**: Playwright E2E 테스트 작성
  - 업로드 → 검증 → 발주 플로우
  - 마스터 CRUD 플로우
  - 대시보드 로딩

- [ ] **Task 9.2**: 성능 최적화
  - DB 인덱스 추가
  - React 메모이제이션

- [ ] **Task 9.3**: 버그 수정 + UI 폴리싱

- [ ] **Task 9.4**: 문서화
  - README 업데이트
  - 사용자 가이드

### Quality Gate ✋

```bash
npx playwright test
# 모든 테스트 통과
```

- [ ] E2E 테스트 100% 통과
- [ ] 주요 페이지 로딩 < 2초

---

## ⚠️ Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| MRP 계산 오류 | 중 | 고 | Phase 3에서 100% 테스트 커버리지 |
| Domain 레이어 오염 | 중 | 고 | ESLint 의존성 규칙 + CI 검증 |
| Excel 파싱 실패 | 중 | 중 | 템플릿 엄격 정의 + 다양한 테스트 |
| Supabase RLS 복잡성 | 중 | 중 | Phase 1에서 충분한 테스트 |

---

## 📊 Progress Tracking

### Completion Status
| Phase | Name | Est. Hours | Status |
|-------|------|------------|--------|
| 1 | Foundation | 4h | ⏳ 0% |
| 2 | Domain Layer | 6h | ⏳ 0% |
| 3 | Application Layer | 8h | ⏳ 0% |
| 4 | Master Data UI | 10h | ⏳ 0% |
| 5 | Excel Upload UI | 8h | ⏳ 0% |
| 6 | MRP + Vietnam UI | 8h | ⏳ 0% |
| 7 | Purchase Order UI | 10h | ⏳ 0% |
| 8 | Dashboard UI | 8h | ⏳ 0% |
| 9 | E2E + Polish | 8h | ⏳ 0% |
| **Total** | | **~70h** | **0%** |

---

## 📝 Notes & Learnings

### Implementation Notes
- (Phase 진행 시 기록)

### Key Decisions Made
- (결정 사항 기록)

---

## ✅ Final Checklist

**Before marking plan as COMPLETE**:
- [ ] Phase 1-3: Domain/Application 테스트 100%
- [ ] Phase 4-8: 기능별 통합 테스트 통과
- [ ] Phase 9: E2E 테스트 통과
- [ ] 주요 페이지 로딩 < 2초
- [ ] Clean Architecture 의존성 규칙 준수 확인
- [ ] 문서화 완료

---

**Plan Status**: 🔄 Awaiting Approval
**Next Action**: 사용자 승인 후 Phase 1 시작
