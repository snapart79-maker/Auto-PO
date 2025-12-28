# Implementation Plan: Phase 6 - MRP + Vietnam UI

**Status**: 🔄 In Progress
**Started**: 2025-12-28
**Last Updated**: 2025-12-28
**Estimated Completion**: 2025-12-28

---

**CRITICAL INSTRUCTIONS**: After completing each phase:
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
MRP(Material Requirements Planning) 계산 결과 화면, 베트남 주간 통합 발주 화면, 분할 발주 비율 설정 UI를 구현합니다.

**핵심 기능**:
1. **MRP 결과 화면**: 재고현황, 순소요량, 발주제안 목록 표시
2. **베트남 주간 통합 발주**: 월~목 권고 누적 → 금요일 통합 발주 생성
3. **분할 비율 설정**: 이원화 제품의 국내/베트남 비율 조정

### Success Criteria
- [ ] MRP 계산 결과가 실시간으로 표시됨
- [ ] 제품별 발주 필요 여부와 권장 수량이 정확함
- [ ] 베트남 주간 통합 발주가 올바르게 생성됨
- [ ] 분할 비율 변경이 저장되고 MRP 계산에 반영됨
- [ ] 테스트 커버리지 80% 이상 유지

### User Impact
- MRP 계산을 통해 최적의 발주 시점과 수량 파악 가능
- 베트남 발주 업무 자동화로 효율성 향상
- 이원화 비율 조정으로 유연한 조달 전략 수립 가능

---

## 🏗️ Architecture Decisions

| Decision | Rationale | Trade-offs |
|----------|-----------|------------|
| SupabaseOrderRepository 구현 | IOrderRepository 인터페이스 활용, Clean Architecture 준수 | Supabase 종속성 (infrastructure layer에서만) |
| useMRP 커스텀 훅 사용 | 상태 관리 및 API 호출 로직 캡슐화 | 추가 훅 관리 필요 |
| TanStack Table 활용 | MRP 결과의 정렬/필터링/페이지네이션 | 기존 패턴 재사용 |
| shadcn/ui Slider 활용 | 비율 조정 UX 개선 | 추가 컴포넌트 필요 |

---

## 📦 Dependencies

### Required Before Starting
- [x] Phase 5: Excel Upload UI 완료
- [x] MRPCalculationService 구현 완료
- [x] CalculateMRPUseCase 구현 완료
- [x] ConsolidateVietnamOrdersUseCase 구현 완료
- [x] SplitOrderByRatioUseCase 구현 완료
- [x] SupabaseProductRepository 구현 완료
- [x] SupabaseInventoryRepository 구현 완료

### External Dependencies
- @tanstack/react-table: ^8.x (이미 설치됨)
- @radix-ui/react-slider: Slider 컴포넌트용

---

## 🧪 Test Strategy

### Testing Approach
**TDD Principle**: Write tests FIRST, then implement to make them pass

### Test Pyramid for This Feature
| Test Type | Coverage Target | Purpose |
|-----------|-----------------|---------|
| **Unit Tests** | ≥80% | MRP 훅 로직, Repository 메서드 |
| **Integration Tests** | Critical paths | UseCase + Repository 통합 |
| **Component Tests** | Key interactions | UI 컴포넌트 동작 검증 |

### Test File Organization
```
test/
├── unit/
│   └── infrastructure/
│       ├── repositories/
│       │   └── SupabaseOrderRepository.test.ts
│       └── react/
│           └── hooks/
│               └── useMRP.test.ts
├── integration/
│   └── mrp/
│       └── MRPCalculation.test.ts
└── react/
    └── components/
        ├── MRPResultsTable.test.tsx
        └── VietnamOrderPage.test.tsx
```

---

## 🚀 Implementation Phases

### Phase 6.1: SupabaseOrderRepository 구현
**Goal**: IOrderRepository의 Supabase 구현체 완성
**Estimated Time**: 2 hours
**Status**: ⏳ Pending

#### Tasks

**🔴 RED: Write Failing Tests First**
- [ ] **Test 6.1.1**: SupabaseOrderRepository 단위 테스트 작성
  - File: `test/infrastructure/repositories/SupabaseOrderRepository.test.ts`
  - Test scenarios:
    - findById: ID로 발주 조회
    - findByOrderNumber: 발주번호로 조회
    - getPendingQuantity: 제품별 미입고 수량 조회
    - save: 발주 저장
    - saveLog: 발주 이력 저장

**🟢 GREEN: Implement to Make Tests Pass**
- [ ] **Task 6.1.2**: SupabaseOrderRepository 구현
  - File: `src/infrastructure/repositories/SupabaseOrderRepository.ts`
  - Supabase 테이블: `purchase_orders`, `purchase_order_items`, `purchase_order_logs`

**🔵 REFACTOR: Clean Up Code**
- [ ] **Task 6.1.3**: 코드 정리 및 최적화

#### Quality Gate ✋

- [ ] TypeScript 타입 체크 통과
- [ ] ESLint 오류 없음
- [ ] 모든 테스트 통과
- [ ] 빌드 성공

---

### Phase 6.2: MRP 결과 UI 컴포넌트
**Goal**: MRP 계산 결과를 표시하는 UI 구현
**Estimated Time**: 3 hours
**Status**: ⏳ Pending

#### Tasks

**🔴 RED: Write Failing Tests First**
- [ ] **Test 6.2.1**: useMRP 훅 테스트 작성
  - File: `test/infrastructure/react/hooks/useMRP.test.ts`
  - Test scenarios:
    - 제품 목록 로드
    - MRP 계산 실행
    - 필터링 (발주 필요 제품만)
    - 기간 선택

- [ ] **Test 6.2.2**: MRPResultsTable 컴포넌트 테스트
  - File: `test/react/components/MRPResultsTable.test.tsx`
  - Test scenarios:
    - 테이블 렌더링
    - 정렬 동작
    - 발주 필요 행 하이라이팅

**🟢 GREEN: Implement to Make Tests Pass**
- [ ] **Task 6.2.3**: useMRP 훅 구현
  - File: `src/infrastructure/react/hooks/useMRP.ts`
  - 기능:
    - 제품 목록 조회
    - MRP 계산 트리거
    - 결과 상태 관리

- [ ] **Task 6.2.4**: MRPResultsTable 컴포넌트 구현
  - File: `src/infrastructure/react/components/MRPResultsTable.tsx`
  - 컬럼: 품번, 품명, 현재고, 안전재고, 발주점, 순소요량, 권장수량, 공급처

- [ ] **Task 6.2.5**: MRPPage 페이지 구현
  - File: `src/infrastructure/react/pages/MRPPage.tsx`
  - 기능:
    - 기간 선택
    - 차종 필터
    - 발주 필요 필터 토글
    - MRP 결과 테이블

**🔵 REFACTOR: Clean Up Code**
- [ ] **Task 6.2.6**: UI/UX 개선 및 코드 정리

#### Quality Gate ✋

- [ ] 컴포넌트 렌더링 정상
- [ ] MRP 계산 결과 정확성 검증
- [ ] 모든 테스트 통과

---

### Phase 6.3: 베트남 주간 통합 발주 UI
**Goal**: 베트남 주간 통합 발주 화면 구현
**Estimated Time**: 3 hours
**Status**: ⏳ Pending

#### Tasks

**🔴 RED: Write Failing Tests First**
- [ ] **Test 6.3.1**: useVietnamOrder 훅 테스트 작성
  - File: `test/infrastructure/react/hooks/useVietnamOrder.test.ts`
  - Test scenarios:
    - 주간 범위 계산
    - 발주 권고 조회
    - 통합 발주 생성

- [ ] **Test 6.3.2**: VietnamOrderPage 테스트
  - File: `test/react/pages/VietnamOrderPage.test.tsx`

**🟢 GREEN: Implement to Make Tests Pass**
- [ ] **Task 6.3.3**: useVietnamOrder 훅 구현
  - File: `src/infrastructure/react/hooks/useVietnamOrder.ts`
  - 기능:
    - 주간 베트남 발주 권고 조회
    - ConsolidateVietnamOrdersUseCase 활용
    - 발주 생성

- [ ] **Task 6.3.4**: VietnamOrderSummary 컴포넌트 구현
  - File: `src/infrastructure/react/components/VietnamOrderSummary.tsx`
  - 표시: 주간 범위, 총 수량, 총 금액, 제품 수

- [ ] **Task 6.3.5**: VietnamOrderPage 페이지 구현
  - File: `src/infrastructure/react/pages/VietnamOrderPage.tsx`
  - 기능:
    - 주간 선택
    - 선적일 지정
    - 통합 발주 미리보기
    - 발주 생성 버튼

**🔵 REFACTOR: Clean Up Code**
- [ ] **Task 6.3.6**: UI 개선 및 코드 정리

#### Quality Gate ✋

- [ ] 베트남 발주 통합 로직 정확성
- [ ] 모든 테스트 통과

---

### Phase 6.4: 분할 비율 설정 UI
**Goal**: 이원화 제품의 국내/베트남 분할 비율 설정 UI
**Estimated Time**: 2 hours
**Status**: ⏳ Pending

#### Tasks

**🔴 RED: Write Failing Tests First**
- [ ] **Test 6.4.1**: Slider UI 컴포넌트 테스트
  - File: `test/react/components/ui/slider.test.tsx`

- [ ] **Test 6.4.2**: SplitRatioEditor 테스트
  - File: `test/react/components/SplitRatioEditor.test.tsx`

**🟢 GREEN: Implement to Make Tests Pass**
- [ ] **Task 6.4.3**: Slider UI 컴포넌트 추가
  - File: `src/infrastructure/react/components/ui/slider.tsx`
  - Radix UI Slider 기반

- [ ] **Task 6.4.4**: SplitRatioEditor 컴포넌트 구현
  - File: `src/infrastructure/react/components/SplitRatioEditor.tsx`
  - 기능:
    - 국내/베트남 비율 슬라이더
    - 실시간 분할 수량 프리뷰
    - 저장 버튼

- [ ] **Task 6.4.5**: ProductsPage에 분할 비율 편집 통합
  - 기존 제품 다이얼로그에 비율 편집 추가

**🔵 REFACTOR: Clean Up Code**
- [ ] **Task 6.4.6**: UI/UX 개선

#### Quality Gate ✋

- [ ] 비율 변경이 DB에 저장됨
- [ ] 변경된 비율이 MRP 계산에 반영됨

---

### Phase 6.5: 통합 및 네비게이션 업데이트
**Goal**: 모든 컴포넌트 통합 및 라우팅 설정
**Estimated Time**: 1 hour
**Status**: ⏳ Pending

#### Tasks

- [ ] **Task 6.5.1**: App.tsx 라우트 업데이트
  - `/mrp` → MRPPage
  - `/mrp/vietnam` → VietnamOrderPage

- [ ] **Task 6.5.2**: Layout.tsx 네비게이션 업데이트
  - MRP 계산 메뉴 활성화
  - 베트남 발주 서브메뉴 추가

- [ ] **Task 6.5.3**: 페이지 인덱스 export 업데이트

- [ ] **Task 6.5.4**: 최종 통합 테스트

#### Quality Gate ✋

- [ ] 모든 라우트 정상 동작
- [ ] 네비게이션 UI 정상
- [ ] 전체 테스트 통과
- [ ] 빌드 성공

---

## ⚠️ Risk Assessment

| Risk | Probability | Impact | Mitigation Strategy |
|------|-------------|--------|---------------------|
| Supabase 스키마 불일치 | Low | High | database.types.ts 확인 및 동기화 |
| MRP 계산 성능 이슈 | Medium | Medium | 배치 처리, 페이지네이션 적용 |
| 비율 변경 동시성 이슈 | Low | Medium | 낙관적 잠금 또는 버전 관리 |

---

## 🔄 Rollback Strategy

### If Phase 6.1 Fails
- SupabaseOrderRepository 파일 삭제
- 테스트 파일 삭제

### If Phase 6.2-6.4 Fails
- 해당 컴포넌트/페이지 파일 삭제
- App.tsx, Layout.tsx 원복

### If Phase 6.5 Fails
- 라우트 변경 원복
- 기존 PlaceholderPage 복원

---

## 📊 Progress Tracking

### Completion Status
- **Phase 6.1**: ⏳ 0%
- **Phase 6.2**: ⏳ 0%
- **Phase 6.3**: ⏳ 0%
- **Phase 6.4**: ⏳ 0%
- **Phase 6.5**: ⏳ 0%

**Overall Progress**: 0% complete

---

## 📝 Notes & Learnings

### Implementation Notes
- [Add insights during implementation]

### Blockers Encountered
- None yet

---

## ✅ Final Checklist

**Before marking plan as COMPLETE**:
- [ ] All phases completed with quality gates passed
- [ ] Test coverage ≥ 80%
- [ ] TypeScript 타입 체크 통과
- [ ] ESLint 0 errors
- [ ] 빌드 성공
- [ ] 문서 업데이트
