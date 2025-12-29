# Implementation Plan: Feature 4 - 입고/출고 현황 화면

**Status**: ✅ Complete
**Started**: 2025-12-28
**Last Updated**: 2025-12-28
**Completed**: 2025-12-28

---

## Overview

### Feature Description
PRD 4.1/4.2에 정의된 입고/출고 현황 화면을 구현합니다.
- PRD 3.2 레이아웃 패턴 적용 (조회조건 + 메인 테이블 + 사이드 요약)
- 기존 inventory_transactions 테이블 활용
- 거래처별 합계 (원화/외화) 사이드 패널
- 공통 컴포넌트로 재사용성 확보

### Success Criteria
- [x] 입고 현황 화면이 PRD 3.2 레이아웃을 따름
- [x] 출고 현황 화면이 PRD 3.2 레이아웃을 따름
- [x] 조회조건 (기간, 품번, 품명, 거래처) 동작
- [x] 메인 테이블에 거래처/제품 정보 표시
- [x] 사이드 패널에 거래처별 합계 (원화/외화 분리)
- [x] 기존 테스트 627개 모두 통과 → 640개 (13개 신규)
- [x] 신규 로직 테스트 커버리지 80% 이상

### User Impact
- 입고/출고 실적을 기간별, 거래처별로 조회 가능
- 거래처별 합계로 거래 규모 파악 용이
- 통일된 UI 패턴으로 학습 비용 절감

---

## Architecture Decisions

| Decision | Rationale | Trade-offs |
|----------|-----------|------------|
| 공통 컴포넌트 분리 (TransactionSearchForm, PartnerSummaryPanel) | 입고/출고 화면 재사용, 일관성 유지 | 초기 개발 시간 증가 |
| GetTransactionsWithDetailsUseCase 신규 생성 | Clean Architecture 준수, 테스트 용이 | 파일 수 증가 |
| 원화/외화 분리 표시 | PRD 4.1.3 요구사항 준수 | UI 복잡도 증가 |

---

## Dependencies

### Required Before Starting
- [x] Feature 3 완료 (메뉴 구조, 라우팅)
- [x] InventoryTransaction 엔티티 존재
- [x] SupabaseInventoryRepository 존재

### External Dependencies
- TanStack Table: 이미 설치됨
- shadcn/ui: 이미 설치됨
- date-fns: 4.1.0 (설치됨)
- react-day-picker: 9.13.0 (신규 설치)
- @radix-ui/react-popover (신규 설치)

---

## Implementation Phases

### Phase 1: 공통 컴포넌트 생성
**Goal**: TransactionSearchForm, PartnerSummaryPanel 컴포넌트 생성
**Status**: ✅ Complete

#### Tasks
- [x] **Task 1.1**: TransactionSearchForm 컴포넌트 생성
- [x] **Task 1.2**: PartnerSummaryPanel 컴포넌트 생성
- [x] **Task 1.3**: DatePicker 컴포넌트 추가 (Calendar, Popover 포함)

---

### Phase 2: Application Layer 확장
**Goal**: 거래처/제품 조인 쿼리 Use Case 생성
**Status**: ✅ Complete

#### Tasks
- [x] **Task 2.1**: TransactionWithDetails 타입 정의
- [x] **Task 2.2**: GetTransactionsWithDetailsUseCase 생성
- [x] **Task 2.3**: GetPartnerSummaryUseCase 생성
- [x] **Task 2.4**: Use Case 단위 테스트 작성 (13개 테스트 추가)

---

### Phase 3: InboundStatusPage 구현
**Goal**: 입고 현황 화면 완성 (PRD 3.2 레이아웃)
**Status**: ✅ Complete

#### Tasks
- [x] **Task 3.1**: InboundStatusPage 리팩토링
- [x] **Task 3.2**: 메인 테이블 컬럼 정의
- [x] **Task 3.3**: useTransactions 훅 구현
- [x] **Task 3.4**: 레이아웃 통합 및 스타일링

---

### Phase 4: OutboundStatusPage 구현
**Goal**: 출고 현황 화면 완성
**Status**: ✅ Complete

#### Tasks
- [x] **Task 4.1**: OutboundStatusPage 리팩토링
- [x] **Task 4.2**: transactionType='OUT' 적용

---

## Final Results

### Quality Gate Results
| Check | Result |
|-------|--------|
| Type Check | ✅ Pass |
| Build | ✅ Pass |
| Tests | ✅ 640 passed (45 test files) |

### Files Created/Modified

**New Files (12):**
- `src/infrastructure/react/components/ui/popover.tsx`
- `src/infrastructure/react/components/ui/calendar.tsx`
- `src/infrastructure/react/components/ui/date-picker.tsx`
- `src/infrastructure/react/components/TransactionSearchForm.tsx`
- `src/infrastructure/react/components/PartnerSummaryPanel.tsx`
- `src/application/dtos/TransactionWithDetails.ts`
- `src/application/usecases/GetTransactionsWithDetailsUseCase.ts`
- `src/application/usecases/GetPartnerSummaryUseCase.ts`
- `src/infrastructure/react/hooks/useTransactions.ts`
- `test/unit/application/usecases/GetTransactionsWithDetailsUseCase.test.ts`
- `test/unit/application/usecases/GetPartnerSummaryUseCase.test.ts`
- `docs/plans/PLAN_Feature4_Inbound_Outbound_Status.md`

**Modified Files (4):**
- `src/infrastructure/react/components/ui/index.ts`
- `src/infrastructure/react/pages/InboundStatusPage.tsx`
- `src/infrastructure/react/pages/OutboundStatusPage.tsx`
- `src/application/usecases/index.ts`

---

## Notes & Learnings

### Implementation Notes
- react-day-picker v9+ API 변경으로 classNames 구조 수정 필요
- Supabase 조인 쿼리 시 TypeScript 타입 추론이 안 되어 별도 인터페이스 정의 필요
- infrastructure/react 폴더는 vitest 커버리지에서 제외되어 있어 E2E 테스트로 대체

### New Features
- PRD 3.2 레이아웃 패턴 구현:
  - 조회조건 폼 (기간, 품번, 품명, 거래처)
  - 기능 버튼 (개별등록, 엑셀업로드, 엑셀다운로드 - 추후 구현)
  - 메인 테이블 (TanStack Table)
  - 사이드 요약 패널 (거래처별 원화/외화 분리)

### Layout Pattern (PRD 3.2)
```
┌─────────────────────────────────────────────────────────────┐
│  📦 입고/출고 현황                        [새로고침]         │
├─────────────────────────────────────────────────────────────┤
│  ┌─ 조회조건 ─────────────────────┐  ┌─ 기능 버튼 ─┐      │
│  │ 기간: [시작일] ~ [종료일]      │  │ [개별등록]  │      │
│  │ 품번: [______]  품명: [______] │  │ [엑셀업로드]│      │
│  │ 거래처: [______]  [조회][초기화]│  │ [엑셀다운로드]│    │
│  └────────────────────────────────┘  └─────────────┘      │
├────────────────────────────────────┬────────────────────────┤
│  [메인 테이블]                      │  [사이드 요약]         │
│  입고일|거래처|품번|품명|수량|...  │  거래처별 합계 (원화)  │
│  ─────────────────────────────────  │  ─────────────────    │
│  2025-01-15|A사|001|제품A|100      │  A사 | 300 | 500,000   │
│  ...                                │  B사 | 150 | 200,000   │
│                                     │  ──────────────────    │
│  페이지네이션                       │  거래처별 합계 (외화)  │
└────────────────────────────────────┴────────────────────────┘
```

---

## References

- PRD: 자동발주_추가_PRD.md 섹션 3.2, 4.1, 4.2
- shadcn/ui: https://ui.shadcn.com
- TanStack Table: https://tanstack.com/table
- react-day-picker v9: https://react-day-picker.js.org

---

**Plan Status**: ✅ Complete
**Completion Date**: 2025-12-28
