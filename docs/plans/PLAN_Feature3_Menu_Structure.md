# Implementation Plan: Feature 3 - 메뉴 구조 변경

**Status**: ✅ Complete
**Started**: 2025-12-28
**Last Updated**: 2025-12-28
**Completed**: 2025-12-28

---

## 📋 Overview

### Feature Description
PRD 2.2에 정의된 새로운 메뉴 구조로 사이드바를 변경합니다.
- 접이식 그룹 메뉴 (Collapsible) 적용
- 5개 메인 그룹: 대시보드, 기준관리, 입고/출고, 재고 관리, 발주 관리
- 신규 라우트 및 페이지 스텁 생성

### Success Criteria
- [x] 모든 메뉴 그룹이 접이식으로 동작
- [x] PRD 2.2 구조와 일치
- [x] 기존 페이지 접근 가능 (라우팅 유지)
- [x] 신규 페이지 스텁 생성 (6개)
- [x] 기존 테스트 모두 통과 (627개)

### User Impact
- 메뉴 접기/펼치기로 화면 공간 효율화
- 논리적 그룹핑으로 메뉴 탐색 용이
- 재고 관리 메뉴 신규 접근

---

## 🏗️ Architecture Decisions

| Decision | Rationale | Trade-offs |
|----------|-----------|------------|
| shadcn Collapsible 사용 | 기존 UI 라이브러리와 일관성 | 직접 구현 대비 커스터마이징 제한 |
| NavGroup 컴포넌트 분리 | 재사용성, 테스트 용이성 | 파일 수 증가 |
| 페이지 스텁으로 시작 | 라우팅 먼저 확정, 점진적 구현 | 초기에는 빈 페이지 |

---

## 📦 Dependencies

### Required Before Starting
- [x] Feature 1 완료 (DB 스키마)
- [x] Feature 2 완료 (Application Layer)

### External Dependencies
- @radix-ui/react-collapsible: shadcn Collapsible 기반 (설치됨)
- lucide-react: 아이콘 (이미 설치됨)

---

## 🚀 Implementation Phases

### Phase 1: Collapsible + NavGroup 컴포넌트
**Goal**: 접이식 메뉴 그룹 컴포넌트 생성
**Status**: ✅ Complete

#### Tasks
- [x] **Task 1.1**: @radix-ui/react-collapsible 패키지 설치
- [x] **Task 1.2**: shadcn Collapsible 컴포넌트 추가
  - File: `src/infrastructure/react/components/ui/collapsible.tsx`
- [x] **Task 1.3**: NavGroup 컴포넌트 구현
  - File: `src/infrastructure/react/components/NavGroup.tsx`
  - Props: title, icon, items, defaultOpen, testId
  - 접근성: aria-expanded, aria-controls 지원
  - 활성 자식 감지: 자동 열림 기능
- [x] **Task 1.4**: ui/index.ts 내보내기 추가

---

### Phase 2: Layout.tsx 사이드바 그룹핑
**Goal**: Layout 사이드바를 PRD 2.2 구조로 변경
**Status**: ✅ Complete

#### Tasks
- [x] **Task 2.1**: Layout.tsx 메뉴 구조 변경
  - 대시보드 (단독)
  - 기준관리 그룹 (5개 하위)
  - 입고/출고 그룹 (2개 하위)
  - 재고 관리 그룹 (3개 하위)
  - 발주 관리 그룹 (4개 하위)
- [x] **Task 2.2**: 메뉴 데이터 구조 분리
  - masterDataItems, inventoryTransactionItems
  - inventoryManagementItems, orderManagementItems

---

### Phase 3: App.tsx 라우팅 + 페이지 스텁
**Goal**: 신규 라우트 추가 및 페이지 스텁 생성
**Status**: ✅ Complete

#### Tasks
- [x] **Task 3.1**: 신규 페이지 스텁 생성 (6개)
  - `InboundStatusPage.tsx` - 입고 현황
  - `OutboundStatusPage.tsx` - 출고 현황
  - `InventoryStatusPage.tsx` - 재고 현황
  - `InitialInventoryPage.tsx` - 초기 재고 등록
  - `InventoryAdjustmentPage.tsx` - 재고 조정
  - `ShipmentPlanPage.tsx` - 출고 계획 등록
- [x] **Task 3.2**: App.tsx 라우팅 추가
  - 17개 라우트 (기존 11개 + 신규 6개)
  - 기존 legacy 업로드 경로 유지

#### Quality Gate ✅
```bash
npm run type-check  # ✅ Pass
npm run build       # ✅ Pass
npm test -- --run   # ✅ 627 tests passed
```

---

## 📊 Final Results

### Test Results
| Metric | Result |
|--------|--------|
| Test Files | 43 passed |
| Total Tests | 627 passed |
| Failed | 0 |
| Duration | 4.26s |

### Files Created/Modified

**New Files (9):**
- `src/infrastructure/react/components/ui/collapsible.tsx`
- `src/infrastructure/react/components/NavGroup.tsx`
- `src/infrastructure/react/pages/InboundStatusPage.tsx`
- `src/infrastructure/react/pages/OutboundStatusPage.tsx`
- `src/infrastructure/react/pages/InventoryStatusPage.tsx`
- `src/infrastructure/react/pages/InitialInventoryPage.tsx`
- `src/infrastructure/react/pages/InventoryAdjustmentPage.tsx`
- `src/infrastructure/react/pages/ShipmentPlanPage.tsx`
- `docs/plans/PLAN_Feature3_Menu_Structure.md`

**Modified Files (3):**
- `src/infrastructure/react/components/ui/index.ts`
- `src/infrastructure/react/components/Layout.tsx`
- `src/App.tsx`

---

## 📝 Notes & Learnings

### Implementation Notes
- UI 컴포넌트 테스트 환경 (@testing-library/react)이 설정되어 있지 않음
- infrastructure/react 폴더는 커버리지에서 제외되어 있어 E2E 테스트로 처리 예정
- NavGroup 컴포넌트는 활성 자식 감지 기능으로 사용성 향상

### New Menu Structure (PRD 2.2)
```
Auto PO
├── 📊 대시보드
├── ⚙️ 기준관리 (기본 열림)
│   ├── 회사정보     /company
│   ├── 차종관리     /vehicle-models
│   ├── 거래처관리   /partners
│   ├── 제품관리     /products
│   └── 환율관리     /exchange-rates
├── 📦 입고/출고
│   ├── 입고 현황    /inbound
│   └── 출고 현황    /outbound
├── 📋 재고 관리
│   ├── 재고 현황         /inventory/status
│   ├── 초기 재고 등록    /inventory/initial
│   └── 재고 조정         /inventory/adjustment
└── 🛒 발주 관리
    ├── 출고 계획 등록    /shipment-plan
    ├── MRP 계산 / 발주 권고  /mrp
    ├── 발주서 관리       /orders
    └── 베트남 주간 발주  /mrp/vietnam
```

---

## 📚 References

- PRD: 자동발주_추가_PRD.md 섹션 2.2
- shadcn/ui Collapsible: https://ui.shadcn.com/docs/components/collapsible

---

**Plan Status**: ✅ Complete
**Completion Date**: 2025-12-28
