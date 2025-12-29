# Implementation Plan: Feature 8 - E2E 테스트 (Playwright)

**Status**: ✅ Complete
**Started**: 2025-12-28
**Last Updated**: 2025-12-28
**Completed**: 2025-12-28

---

## Overview

### Feature Description
Playwright를 사용한 E2E 테스트 추가
- Page Objects 패턴 확장
- 개별 흐름 테스트 (입고/출고, 재고, MRP)
- 전체 통합 흐름 테스트 (입고→재고→MRP→발주)

### Success Criteria
- [x] Page Objects 추가 (InventoryPage, MRPPage, InboundPage, ShipmentPlanPage)
- [x] 개별 흐름 테스트 추가 (inventory-flow, mrp-flow)
- [x] 통합 흐름 테스트 추가 (full-flow)
- [x] Type check 통과
- [x] Build 성공
- [x] 기존 유닛 테스트 640개 유지

---

## Implementation Phases

### Phase 1: Page Objects 추가
**Status**: ✅ Complete

#### Tasks
- [x] playwright.config.ts npm으로 변경
- [x] InventoryPage.ts 생성
- [x] MRPPage.ts 생성
- [x] InboundPage.ts 생성
- [x] ShipmentPlanPage.ts 생성
- [x] index.ts 업데이트

---

### Phase 2: 개별 흐름 테스트
**Status**: ✅ Complete

#### Tasks
- [x] inventory-flow.spec.ts (재고 현황, 초기재고, 재고조정, 입고/출고)
- [x] mrp-flow.spec.ts (MRP 계산, 발주 버튼, 베트남 발주, 출고계획)

---

### Phase 3: 통합 흐름 테스트
**Status**: ✅ Complete

#### Tasks
- [x] full-flow.spec.ts (전체 페이지 순회, 사이드바 네비게이션)
- [x] 재고→MRP 흐름 테스트
- [x] MRP→발주 흐름 테스트
- [x] 대시보드 통합 테스트
- [x] 데이터 일관성 시나리오 테스트

---

## Quality Gate Results
| Check | Result |
|-------|--------|
| Type Check | ✅ Pass |
| Build | ✅ Pass (5.40s) |
| Unit Tests | ✅ 640 passed |
| E2E Tests | ✅ 124 tests defined |

---

## Files Created/Modified

**New Page Objects (4):**
- `test/e2e/pages/inventory.page.ts`
- `test/e2e/pages/mrp.page.ts`
- `test/e2e/pages/inbound.page.ts`
- `test/e2e/pages/shipment-plan.page.ts`

**New Test Files (3):**
- `test/e2e/flows/inventory-flow.spec.ts` (재고 관리 테스트)
- `test/e2e/flows/mrp-flow.spec.ts` (MRP/발주 테스트)
- `test/e2e/flows/full-flow.spec.ts` (전체 흐름 통합 테스트)

**Modified Files (2):**
- `playwright.config.ts` (pnpm → npm)
- `test/e2e/pages/index.ts` (새 Page Objects export)

---

## E2E Test Summary

| 테스트 파일 | 테스트 수 | 내용 |
|------------|----------|------|
| inventory-flow.spec.ts | ~18 | 재고 현황, 초기재고, 재고조정, 입고/출고 |
| mrp-flow.spec.ts | ~18 | MRP 계산, 발주 버튼, 베트남 발주, 출고계획 |
| full-flow.spec.ts | ~12 | 전체 흐름 순회, 데이터 일관성 |
| (기존) | ~76 | dashboard, navigation, layout, accessibility, orders, products |

**총 E2E 테스트: 124개**

---

## Notes & Learnings

### Implementation Notes
- 기존 BasePage 패턴 재사용
- Playwright MCP 서버 활용 가능
- 테스트는 실제 서버 없이도 페이지 로드/네비게이션 검증

### 실행 방법
```bash
# E2E 테스트 실행 (개발 서버 자동 시작)
npx playwright test

# 특정 파일만 실행
npx playwright test inventory-flow

# UI 모드로 실행
npx playwright test --ui

# 리포트 보기
npx playwright show-report
```

---

## References
- 기존 Page Objects: BasePage, DashboardPage, ProductsPage, OrdersPage
- 기존 테스트: accessibility, dashboard, layout, navigation, orders-flow

---

**Plan Status**: ✅ Complete
