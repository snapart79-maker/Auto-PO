# Implementation Plan: Phase 8 - Dashboard UI

**Status**: ✅ Complete
**Started**: 2025-12-28
**Last Updated**: 2025-12-28
**Estimated Completion**: 2025-12-28

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
대시보드 UI 구현 - 시스템 전체 현황을 한눈에 파악할 수 있는 대시보드 페이지 완성

주요 기능:
1. **재고 현황 대시보드** - 현재 재고 수준, 안전재고 대비 현황
2. **MRP 요약 현황** - 발주 필요 품목 현황, 순소요량 계산 결과 요약
3. **발주 현황 요약** - 상태별 발주 현황, 최근 발주 목록
4. **차트 및 위젯** - 시각적 데이터 표현 컴포넌트

### Success Criteria
- [ ] 4개 Stat Card가 실시간 데이터 표시
- [ ] 최근 발주 5건 위젯 동작
- [ ] MRP 권고 품목 요약 표시
- [ ] 재고 부족 경고 알림 표시
- [ ] 차트 컴포넌트 (발주 상태별, 재고 현황)
- [ ] 80%+ 테스트 커버리지

### User Impact
시스템 관리자와 발주 담당자가 한 화면에서 전체 시스템 현황을 파악하고, 즉각적인 의사결정을 내릴 수 있음

---

## 🏗️ Architecture Decisions

| Decision | Rationale | Trade-offs |
|----------|-----------|------------|
| useDashboard 단일 hook | 대시보드 전용 데이터 로드를 한 곳에서 관리 | 약간의 재사용성 감소 |
| recharts 차트 라이브러리 | React 친화적, 가벼움, 커뮤니티 지원 | 고급 차트는 제한적 |
| StatCard 분리 컴포넌트 | 재사용성, 일관된 스타일링 | 추가 파일 |
| Widget 패턴 | 각 섹션 독립적 관리 | 컴포넌트 수 증가 |

---

## 📦 Dependencies

### Required Before Starting
- [x] Phase 7 완료 (발주 관리 UI)
- [x] 기존 Repository 구현 완료

### External Dependencies
- recharts: ^2.x (차트 라이브러리 - 신규 설치)
- lucide-react: 기존 아이콘 라이브러리

---

## 🧪 Test Strategy

### Testing Approach
**TDD Principle**: Write tests FIRST, then implement to make them pass

### Test Pyramid for This Feature
| Test Type | Coverage Target | Purpose |
|-----------|-----------------|---------|
| **Unit Tests** | ≥80% | Dashboard 유틸리티, 계산 함수 |
| **Integration Tests** | Critical paths | Hook과 컴포넌트 연동 |

### Test File Organization
```
test/
├── unit/
│   ├── infrastructure/react/
│   │   ├── hooks/useDashboard.test.ts
│   │   └── components/
│   │       ├── StatCard.test.ts
│   │       ├── RecentOrdersWidget.test.ts
│   │       └── MRPSummaryWidget.test.ts
```

---

## 🚀 Implementation Phases

### Phase 8.1: useDashboard Hook + StatCard 컴포넌트
**Goal**: 대시보드 핵심 데이터 로드 hook과 통계 카드 컴포넌트
**Estimated Time**: 2 hours
**Status**: ⏳ Pending

#### Tasks

**🔴 RED: Write Failing Tests First**
- [ ] **Test 8.1.1**: useDashboard hook 테스트 작성
  - File: `test/unit/infrastructure/react/hooks/useDashboard.test.ts`
  - 통계 데이터 로드, 로딩 상태, 에러 처리

- [ ] **Test 8.1.2**: StatCard 컴포넌트 테스트 작성
  - File: `test/unit/infrastructure/react/components/StatCard.test.ts`
  - 아이콘, 제목, 값, 설명 렌더링

**🟢 GREEN: Implement to Make Tests Pass**
- [ ] **Task 8.1.3**: DashboardStats 인터페이스 정의
  - File: `src/infrastructure/react/hooks/useDashboard.ts`

- [ ] **Task 8.1.4**: useDashboard hook 구현
  - File: `src/infrastructure/react/hooks/useDashboard.ts`

- [ ] **Task 8.1.5**: StatCard 컴포넌트 구현
  - File: `src/infrastructure/react/components/StatCard.tsx`

- [ ] **Task 8.1.6**: DashboardPage에 통합
  - File: `src/infrastructure/react/pages/DashboardPage.tsx`

**🔵 REFACTOR: Clean Up Code**
- [ ] **Task 8.1.7**: 코드 정리 및 최적화

#### Quality Gate ✋
- [ ] 테스트 통과
- [ ] 타입 체크 통과
- [ ] 린트 통과

---

### Phase 8.2: RecentOrdersWidget + 차트 라이브러리
**Goal**: 최근 발주 위젯과 차트 라이브러리 설정
**Estimated Time**: 2 hours
**Status**: ⏳ Pending

#### Tasks

**🔴 RED: Write Failing Tests First**
- [ ] **Test 8.2.1**: RecentOrdersWidget 테스트 작성
  - File: `test/unit/infrastructure/react/components/RecentOrdersWidget.test.ts`

**🟢 GREEN: Implement to Make Tests Pass**
- [ ] **Task 8.2.2**: recharts 라이브러리 설치
  - Command: `pnpm add recharts`

- [ ] **Task 8.2.3**: RecentOrdersWidget 컴포넌트 구현
  - File: `src/infrastructure/react/components/RecentOrdersWidget.tsx`

- [ ] **Task 8.2.4**: OrderStatusChart 컴포넌트 구현
  - File: `src/infrastructure/react/components/OrderStatusChart.tsx`

**🔵 REFACTOR: Clean Up Code**
- [ ] **Task 8.2.5**: 코드 정리

#### Quality Gate ✋
- [ ] 테스트 통과
- [ ] 차트 렌더링 확인

---

### Phase 8.3: MRPSummaryWidget + LowStockAlert
**Goal**: MRP 권고 품목 요약과 재고 부족 경고 표시
**Estimated Time**: 2 hours
**Status**: ⏳ Pending

#### Tasks

**🔴 RED: Write Failing Tests First**
- [ ] **Test 8.3.1**: MRPSummaryWidget 테스트 작성
  - File: `test/unit/infrastructure/react/components/MRPSummaryWidget.test.ts`

**🟢 GREEN: Implement to Make Tests Pass**
- [ ] **Task 8.3.2**: MRPSummaryWidget 컴포넌트 구현
  - File: `src/infrastructure/react/components/MRPSummaryWidget.tsx`

- [ ] **Task 8.3.3**: LowStockAlert 컴포넌트 구현
  - File: `src/infrastructure/react/components/LowStockAlert.tsx`

**🔵 REFACTOR: Clean Up Code**
- [ ] **Task 8.3.4**: 코드 정리

#### Quality Gate ✋
- [ ] 테스트 통과
- [ ] MRP 데이터 표시 확인

---

### Phase 8.4: Charts + Dashboard Integration
**Goal**: 차트 완성 및 전체 대시보드 통합
**Estimated Time**: 2 hours
**Status**: ⏳ Pending

#### Tasks

**🔴 RED: Write Failing Tests First**
- [ ] **Test 8.4.1**: 차트 컴포넌트 테스트 작성

**🟢 GREEN: Implement to Make Tests Pass**
- [ ] **Task 8.4.2**: InventoryChart 컴포넌트 구현
  - File: `src/infrastructure/react/components/InventoryChart.tsx`

- [ ] **Task 8.4.3**: DashboardPage 최종 통합
  - File: `src/infrastructure/react/pages/DashboardPage.tsx`

- [ ] **Task 8.4.4**: 로딩/에러 상태 처리

**🔵 REFACTOR: Clean Up Code**
- [ ] **Task 8.4.5**: 최종 코드 정리 및 반응형 디자인

#### Quality Gate ✋
- [ ] 전체 테스트 통과
- [ ] 80%+ 커버리지 달성
- [ ] 타입 체크 통과
- [ ] 린트 통과

---

## ⚠️ Risk Assessment

| Risk | Probability | Impact | Mitigation Strategy |
|------|-------------|--------|---------------------|
| 차트 라이브러리 호환성 | Low | Medium | recharts는 React 18 호환 확인됨 |
| 데이터 로드 성능 | Low | Medium | 병렬 로드, 캐싱 적용 |
| 반응형 레이아웃 이슈 | Low | Low | Tailwind Grid 사용 |

---

## 🔄 Rollback Strategy

### If Phase 8.1 Fails
- useDashboard.ts 삭제
- StatCard.tsx 삭제
- DashboardPage.tsx 원래 상태 복원

### If Phase 8.2 Fails
- recharts 제거: `pnpm remove recharts`
- Widget 컴포넌트 삭제

---

## 📊 Progress Tracking

### Completion Status
- **Phase 8.1**: ⏳ 0%
- **Phase 8.2**: ⏳ 0%
- **Phase 8.3**: ⏳ 0%
- **Phase 8.4**: ⏳ 0%

**Overall Progress**: 0% complete

---

## 📝 Notes & Learnings

### Implementation Notes
- (구현 중 추가 예정)

---

**Plan Status**: 🔄 In Progress
**Next Action**: Phase 8.1 구현 시작
