# Implementation Plan: Feature 6 - 발주 관리 기능

**Status**: ✅ Complete
**Started**: 2025-12-28
**Last Updated**: 2025-12-28
**Completed**: 2025-12-28

---

## Overview

### Feature Description
PRD 섹션 6에 정의된 발주 관리 기능을 구현합니다.
- 출고 계획 등록 (ShipmentPlanPage)
- MRP 계산 / 발주 권고 (MRPPage 개선)
- 발주서 관리 (PurchaseOrdersPage 유지)
- 베트남 주간 발주 (VietnamOrderPage 유지)
- PRD 3.2 레이아웃 패턴 적용

### Success Criteria
- [x] system_settings 테이블 지원 (평균납품량 기준일수)
- [x] ShipmentPlanPage 풀 구현 (개별등록, 조회, 삭제)
- [x] MRPPage 365일 기본값, 화면 진입 시 자동 계산
- [x] MRPPage 체크박스 선택 발주 기능
- [x] 선택 발주 → 발주서 생성 연동 (navigate to /orders)
- [x] 기존 테스트 640개 모두 통과
- [x] Type check 통과
- [x] Build 성공 (8.12s)

### User Impact
- 출고계획 → MRP → 발주 흐름 자동화
- 365일 평균 기반 정확한 발주량 산출
- 체크박스 기반 직관적인 발주 선택

---

## Implementation Phases

### Phase 1: system_settings 지원
**Goal**: system_settings 테이블 타입 + useSystemSettings 훅 구현
**Status**: ✅ Complete

#### Tasks
- [x] **Task 1.1**: database.types.ts에 system_settings 타입 추가
- [x] **Task 1.2**: useSystemSettings 훅 생성 (평균납품량 기준일수 조회/설정)
- [x] **Task 1.3**: MRPPage에 system_settings 연동

---

### Phase 2: ShipmentPlanPage 풀 구현
**Goal**: 출고 계획 등록 화면 완성 (PRD 6.2)
**Status**: ✅ Complete

#### Tasks
- [x] **Task 2.1**: useShipmentPlan 훅 생성
- [x] **Task 2.2**: ShipmentPlanPage PRD 3.2 레이아웃 적용
- [x] **Task 2.3**: 조회조건 폼 (기간, 고객사, 품번)
- [x] **Task 2.4**: 메인 테이블 + 사이드 요약
- [x] **Task 2.5**: 개별 등록 Dialog
- [x] **Task 2.6**: 삭제 기능

---

### Phase 3: MRPPage 개선
**Goal**: MRP 화면 PRD 6.3 규격 개선
**Status**: ✅ Complete

#### Tasks
- [x] **Task 3.1**: 365일 기본값 적용 (system_settings 연동)
- [x] **Task 3.2**: 화면 진입 시 자동 MRP 계산
- [x] **Task 3.3**: 테이블 체크박스 선택 기능 추가
- [x] **Task 3.4**: PRD 3.2 레이아웃 적용 (조회조건 + 테이블 + 사이드 요약)
- [x] **Task 3.5**: 선택 발주 / 전체 발주 버튼 추가

---

### Phase 4: MRP → 발주 연동
**Goal**: 선택한 품목을 발주서로 생성
**Status**: ✅ Complete

#### Tasks
- [x] **Task 4.1**: 선택 발주 버튼 → 발주서 생성 연동
- [x] **Task 4.2**: 전체 발주 버튼 → 발주권고량 > 0 품목 일괄 발주
- [x] **Task 4.3**: 발주 생성 후 PurchaseOrdersPage로 이동

---

### Phase 5: 통합 테스트 및 검증
**Goal**: 전체 테스트 및 품질 검증
**Status**: ✅ Complete

#### Tasks
- [x] **Task 5.1**: Type check 통과
- [x] **Task 5.2**: Build 성공 (8.12s)
- [x] **Task 5.3**: 기존 테스트 모두 통과 (640 tests)
- [x] **Task 5.4**: MRP 선택/전체 발주 기능 동작 확인

---

## Final Results

### Quality Gate Results
| Check | Result |
|-------|--------|
| Type Check | ✅ Pass |
| Build | ✅ Pass (8.12s) |
| Tests | ✅ 640 passed (45 files) |

### Files Created/Modified

**New Files (4):**
- `src/infrastructure/supabase/database.types.ts` (system_settings 타입 추가)
- `src/infrastructure/react/hooks/useSystemSettings.ts`
- `src/infrastructure/react/hooks/useShipmentPlan.ts`
- `src/infrastructure/react/components/ui/checkbox.tsx`

**Modified Files (2):**
- `src/infrastructure/react/pages/ShipmentPlanPage.tsx` (풀 구현)
- `src/infrastructure/react/pages/MRPPage.tsx` (PRD 6.3 개선)

---

## Notes & Learnings

### Implementation Notes
- 기존 SupabaseShipmentPlanRepository 재사용
- ShipmentPlan 엔티티 재사용
- MRPPage 기존 구조 유지하면서 개선
- useMRP 훅 확장

### PRD 6.3 MRP 화면 동작 방식
- 화면 진입 시: 오늘 기준 자동 MRP 계산
- [MRP 재계산]: 조회조건 변경 후 재계산
- [선택 발주]: 체크한 품목만 발주서 생성
- [전체 발주]: 발주권고량 > 0 전체 품목 발주

---

## References

- PRD: 자동발주_추가_PRD.md 섹션 6 발주 관리 기능
- PRD: 섹션 7 MRP 계산 로직 상세
- 기존 패턴: InventoryStatusPage, InboundStatusPage (PRD 3.2 레이아웃)

---

**Plan Status**: 🔄 In Progress
