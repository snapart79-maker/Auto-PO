# Implementation Plan: Phase 7 - Purchase Order + Audit Log UI

**Status**: 🔄 In Progress
**Started**: 2025-12-28
**Last Updated**: 2025-12-28
**Scope**: Large (4 phases, ~15-20 hours total)

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
발주서 관리 UI를 구현합니다:
- 발주 목록 조회 (필터링, 정렬, 페이지네이션)
- 발주 상세 보기 및 상태 관리
- 발주 생성/수정 폼
- 발주 이력(Audit Log) 조회
- Excel/PDF 내보내기

### Success Criteria
- [ ] 발주 목록 페이지에서 전체 발주 조회 가능
- [ ] 발주 상태 변경 (DRAFT → CONFIRMED → SENT → COMPLETED/CANCELLED)
- [ ] 발주 이력 조회 가능
- [ ] Excel 내보내기 기능 동작
- [ ] PDF 내보내기 기능 동작
- [ ] 80%+ 테스트 커버리지

### User Impact
사용자가 MRP 계산 결과를 기반으로 발주서를 생성하고 관리할 수 있습니다.

---

## 🏗️ Architecture Decisions

| Decision | Rationale | Trade-offs |
|----------|-----------|------------|
| usePurchaseOrder hook | 기존 useMRP 패턴과 일관성 유지 | Hook 복잡도 증가 |
| Dialog 기반 상세보기 | 기존 ProductsPage, PartnersPage 패턴 유지 | 페이지 전환 없이 빠른 확인 |
| xlsx 라이브러리 재사용 | 이미 설치됨, 읽기/쓰기 모두 지원 | PDF는 별도 구현 필요 |
| 브라우저 기반 PDF | 서버 의존성 없음, 프론트엔드 완결 | 복잡한 레이아웃 제한 |

---

## 📦 Dependencies

### Required Before Starting
- [x] PurchaseOrder entity 완성
- [x] OrderStatus value object 완성
- [x] PurchaseOrderLog entity 완성
- [x] SupabaseOrderRepository 구현 완료
- [x] GeneratePurchaseOrderUseCase 구현 완료

### External Dependencies
- `xlsx: ^0.18.5` (이미 설치됨)
- 추가 설치 불필요

---

## 🧪 Test Strategy

### Testing Approach
**TDD Principle**: Write tests FIRST, then implement to make them pass

### Test Pyramid for This Feature
| Test Type | Coverage Target | Purpose |
|-----------|-----------------|---------|
| **Unit Tests** | ≥80% | Hook logic, status transitions, export formatting |
| **Integration Tests** | Critical paths | Repository ↔ Hook ↔ Component 연동 |

### Test File Organization
```
test/
├── unit/
│   ├── infrastructure/
│   │   ├── react/
│   │   │   └── hooks/
│   │   │       └── usePurchaseOrder.test.ts
│   │   └── external/
│   │       ├── ExcelExporter.test.ts
│   │       └── PdfExporter.test.ts
│   └── application/
│       └── usecases/
│           └── ExportPurchaseOrderUseCase.test.ts
```

---

## 🚀 Implementation Phases

### Phase 7.1: usePurchaseOrder Hook + PurchaseOrdersPage 목록
**Goal**: 발주 목록 조회 기능이 동작하는 페이지 완성
**Estimated Time**: 3-4 hours
**Status**: ⏳ Pending

#### Tasks

**🔴 RED: Write Failing Tests First**
- [ ] **Test 7.1.1**: usePurchaseOrder hook 테스트 작성
  - File: `test/unit/infrastructure/react/hooks/usePurchaseOrder.test.ts`
  - Test cases:
    - 초기 상태 idle, orders 빈 배열
    - loadOrders 호출 시 loading → complete 전이
    - 필터 적용 시 필터링된 결과 반환
    - 에러 시 error 상태 전이

**🟢 GREEN: Implement to Make Tests Pass**
- [ ] **Task 7.1.2**: usePurchaseOrder hook 구현
  - File: `src/infrastructure/react/hooks/usePurchaseOrder.ts`
  - Features:
    - loadOrders(filter?) - 목록 조회
    - saveOrder(order) - 저장
    - deleteOrder(id) - 삭제 (DRAFT만)
    - updateStatus(id, status) - 상태 변경

- [ ] **Task 7.1.3**: PurchaseOrdersPage 구현
  - File: `src/infrastructure/react/pages/PurchaseOrdersPage.tsx`
  - Features:
    - 발주 목록 테이블 (DataTable 패턴)
    - 상태별 필터 (Tabs 또는 Select)
    - 발주유형 필터 (DOMESTIC/VIETNAM)
    - 날짜 범위 필터

- [ ] **Task 7.1.4**: Layout 사이드바에 메뉴 추가
  - File: `src/infrastructure/react/components/Layout.tsx`
  - 발주 관리 메뉴 활성화

**🔵 REFACTOR: Clean Up Code**
- [ ] **Task 7.1.5**: 코드 정리 및 타입 개선

#### Quality Gate ✋
- [ ] `pnpm run type-check` 통과
- [ ] `pnpm run lint` 0 errors
- [ ] `pnpm run build` 성공
- [ ] `pnpm run test:coverage` 80%+
- [ ] 발주 목록 페이지 수동 테스트 완료

---

### Phase 7.2: Order Detail Modal + Status Management
**Goal**: 발주 상세 조회, 상태 변경, 이력 조회 기능 완성
**Estimated Time**: 3-4 hours
**Status**: ⏳ Pending

#### Tasks

**🔴 RED: Write Failing Tests First**
- [ ] **Test 7.2.1**: 상태 변경 로직 테스트
  - File: `test/unit/infrastructure/react/hooks/usePurchaseOrder.test.ts` (추가)
  - Test cases:
    - confirm() 호출 시 DRAFT → CONFIRMED
    - send() 호출 시 CONFIRMED → SENT
    - complete() 호출 시 SENT → COMPLETED
    - cancel() 호출 시 취소 가능 상태에서만 동작
    - 상태 변경 시 로그 저장

**🟢 GREEN: Implement to Make Tests Pass**
- [ ] **Task 7.2.2**: OrderDetailDialog 컴포넌트 구현
  - File: `src/infrastructure/react/components/OrderDetailDialog.tsx`
  - Features:
    - 발주 정보 표시 (번호, 날짜, 거래처, 금액 등)
    - 품목 목록 표시
    - 상태 변경 버튼 (가능한 전이만 표시)
    - 이력 탭

- [ ] **Task 7.2.3**: OrderAuditLog 컴포넌트 구현
  - File: `src/infrastructure/react/components/OrderAuditLog.tsx`
  - Features:
    - 이력 목록 타임라인 표시
    - 상태 변경 뱃지
    - 변경 사유 표시

- [ ] **Task 7.2.4**: usePurchaseOrder hook에 상태 변경 메서드 추가
  - confirmOrder(id, remarks?)
  - sendOrder(id, remarks?)
  - completeOrder(id, remarks?)
  - cancelOrder(id, remarks?)
  - loadOrderLogs(orderId)

**🔵 REFACTOR: Clean Up Code**
- [ ] **Task 7.2.5**: 공통 컴포넌트 추출 및 정리

#### Quality Gate ✋
- [ ] 모든 quality gate 항목 통과
- [ ] 상태 변경 수동 테스트 완료
- [ ] 이력 조회 수동 테스트 완료

---

### Phase 7.3: Order Create/Edit Form
**Goal**: 발주 생성/수정 기능 완성
**Estimated Time**: 3-4 hours
**Status**: ⏳ Pending

#### Tasks

**🔴 RED: Write Failing Tests First**
- [ ] **Test 7.3.1**: 발주 생성/수정 테스트
  - Test cases:
    - 빈 품목으로 생성 시 에러
    - 베트남 발주 시 선적일 필수
    - 수정은 DRAFT 상태만 가능

**🟢 GREEN: Implement to Make Tests Pass**
- [ ] **Task 7.3.2**: OrderFormDialog 컴포넌트 구현
  - File: `src/infrastructure/react/components/OrderFormDialog.tsx`
  - Features:
    - 거래처 선택
    - 발주 유형 선택 (DOMESTIC/VIETNAM)
    - 납기일, 선적일 입력
    - 품목 추가/삭제
    - 저장/취소 버튼

- [ ] **Task 7.3.3**: OrderItemsEditor 컴포넌트 구현
  - File: `src/infrastructure/react/components/OrderItemsEditor.tsx`
  - Features:
    - 제품 검색/선택
    - 수량 입력
    - 단가 표시
    - 소계 계산

- [ ] **Task 7.3.4**: PurchaseOrdersPage에 생성 버튼 추가

**🔵 REFACTOR: Clean Up Code**
- [ ] **Task 7.3.5**: 폼 검증 로직 개선

#### Quality Gate ✋
- [ ] 모든 quality gate 항목 통과
- [ ] 발주 생성 수동 테스트 완료
- [ ] 발주 수정 수동 테스트 완료

---

### Phase 7.4: Excel/PDF Export
**Goal**: 발주서 Excel/PDF 내보내기 기능 완성
**Estimated Time**: 3-4 hours
**Status**: ⏳ Pending

#### Tasks

**🔴 RED: Write Failing Tests First**
- [ ] **Test 7.4.1**: ExcelExporter 테스트
  - File: `test/unit/infrastructure/external/ExcelExporter.test.ts`
  - Test cases:
    - 발주서 데이터를 Excel 형식으로 변환
    - 한글 헤더 올바르게 출력
    - 날짜/금액 포맷팅

- [ ] **Test 7.4.2**: PdfExporter 테스트
  - File: `test/unit/infrastructure/external/PdfExporter.test.ts`
  - Test cases:
    - 발주서 PDF 생성
    - 레이아웃 포함 (헤더, 품목, 합계)

**🟢 GREEN: Implement to Make Tests Pass**
- [ ] **Task 7.4.3**: ExcelExporter 구현
  - File: `src/infrastructure/external/excel/ExcelExporter.ts`
  - Features:
    - exportOrder(order) - 단일 발주 Excel
    - exportOrders(orders) - 다중 발주 Excel
    - downloadExcel(blob, filename)

- [ ] **Task 7.4.4**: PdfExporter 구현
  - File: `src/infrastructure/external/pdf/PdfExporter.ts`
  - Features:
    - 발주서 PDF 템플릿
    - 회사 정보 헤더
    - 품목 테이블
    - 합계 영역
    - downloadPdf(blob, filename)

- [ ] **Task 7.4.5**: Export 버튼 UI 추가
  - OrderDetailDialog에 내보내기 버튼 추가
  - PurchaseOrdersPage에 일괄 내보내기 버튼 추가

**🔵 REFACTOR: Clean Up Code**
- [ ] **Task 7.4.6**: 내보내기 로직 최적화

#### Quality Gate ✋
- [ ] 모든 quality gate 항목 통과
- [ ] Excel 내보내기 수동 테스트 완료
- [ ] PDF 내보내기 수동 테스트 완료

---

## ⚠️ Risk Assessment

| Risk | Probability | Impact | Mitigation Strategy |
|------|-------------|--------|---------------------|
| PDF 라이브러리 복잡성 | Medium | Medium | 간단한 HTML 기반 PDF 생성 우선 |
| 품목 데이터 없음 | Low | High | Mock 데이터로 테스트, 실제 데이터 연동은 Phase 7.3에서 |
| 대용량 데이터 성능 | Low | Medium | 페이지네이션, 가상 스크롤 적용 |

---

## 🔄 Rollback Strategy

### If Phase 7.1 Fails
- Layout.tsx에서 메뉴 비활성화로 복원
- pages/PurchaseOrdersPage.tsx 삭제
- hooks/usePurchaseOrder.ts 삭제

### If Phase 7.2 Fails
- OrderDetailDialog.tsx 삭제
- OrderAuditLog.tsx 삭제
- hook에서 상태 변경 메서드 제거

### If Phase 7.3 Fails
- OrderFormDialog.tsx 삭제
- OrderItemsEditor.tsx 삭제
- 생성 버튼 제거

### If Phase 7.4 Fails
- external/excel/ExcelExporter.ts 삭제
- external/pdf/PdfExporter.ts 삭제
- 내보내기 버튼 제거

---

## 📊 Progress Tracking

### Completion Status
- **Phase 7.1**: ⏳ 0%
- **Phase 7.2**: ⏳ 0%
- **Phase 7.3**: ⏳ 0%
- **Phase 7.4**: ⏳ 0%

**Overall Progress**: 0% complete

---

## 📝 Notes & Learnings

### Implementation Notes
- (작업 중 발견사항 기록)

### Blockers Encountered
- (발생한 문제 및 해결책 기록)

---

## ✅ Final Checklist

**Before marking plan as COMPLETE**:
- [ ] All phases completed with quality gates passed
- [ ] Full integration testing performed
- [ ] 80%+ test coverage achieved
- [ ] All manual tests passed
- [ ] Plan document updated with learnings
