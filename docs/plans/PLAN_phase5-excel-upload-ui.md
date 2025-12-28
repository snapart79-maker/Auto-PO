# Implementation Plan: Phase 5 - Excel Upload UI

**Status**: 🔄 In Progress
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
MES Excel 데이터 업로드 기능 구현:
- ExcelParser: xlsx 라이브러리를 활용한 Excel 파싱
- 프리뷰 화면: 업로드 데이터 미리보기 + 오류 하이라이팅
- 인라인 수정: 오류 데이터 즉시 수정 가능
- 재검증: 수정 후 즉시 재검증
- 입고/출고 데이터 업로드: Supabase 저장

### Success Criteria
- [ ] Excel 파일(.xlsx) 드래그앤드롭 및 파일선택 업로드
- [ ] 데이터 파싱 및 프리뷰 테이블 표시
- [ ] 참조 무결성 검증 (거래처, 품번, 환율)
- [ ] 오류 셀 빨간색 하이라이팅
- [ ] 인라인 수정 및 재검증 기능
- [ ] 검증 통과 데이터 Supabase 저장
- [ ] 80%+ 테스트 커버리지

### User Impact
MES 담당자가 Excel로 관리하는 입출고 데이터를 시스템에 쉽게 업로드하고, 오류를 즉시 확인/수정할 수 있음

---

## 🏗️ Architecture Decisions

| Decision | Rationale | Trade-offs |
|----------|-----------|------------|
| ExcelParser를 Infrastructure에 배치 | xlsx 라이브러리 의존성은 외부 레이어에서만 | Application 레이어에서 직접 사용 불가, 인터페이스 필요 |
| 클라이언트 사이드 파싱 | 서버 부하 감소, 즉각적인 피드백 | 대용량 파일 처리 시 브라우저 부하 |
| TanStack Table 활용 | 기존 DataTable 컴포넌트 재사용 | 인라인 편집 위해 커스터마이징 필요 |
| Zod로 행 데이터 검증 | 타입 안전 검증, 이미 설치됨 | 학습 비용 |

---

## 📦 Dependencies

### Required Before Starting
- [x] Phase 4 완료 (마스터 데이터 UI)
- [x] ValidateUploadDataUseCase 존재
- [x] xlsx 패키지 설치됨

### External Dependencies
- xlsx: ^0.18.5 ✅
- zod: ^3.24.0 ✅
- @tanstack/react-table: ^8.20.0 ✅

---

## 🧪 Test Strategy

### Testing Approach
**TDD Principle**: Write tests FIRST, then implement to make them pass

### Test Pyramid for This Feature
| Test Type | Coverage Target | Purpose |
|-----------|-----------------|---------|
| **Unit Tests** | ≥80% | ExcelParser, validation logic, row mapping |
| **Integration Tests** | Critical paths | Upload flow, re-validation |
| **Component Tests** | Key components | FileDropzone, UploadPreview |

### Test File Organization
```
test/
├── infrastructure/
│   └── excel/
│       └── ExcelParser.test.ts
├── application/
│   └── usecases/
│       └── ProcessUploadUseCase.test.ts
└── react/
    └── components/
        ├── FileDropzone.test.tsx
        └── UploadPreview.test.tsx
```

---

## 🚀 Implementation Phases

### Phase 5.1: ExcelParser Infrastructure
**Goal**: Excel 파일 파싱 기능 구현
**Estimated Time**: 2 hours
**Status**: ⏳ Pending

#### Tasks

**🔴 RED: Write Failing Tests First**
- [ ] **Test 5.1.1**: ExcelParser 단위 테스트
  - File(s): `test/infrastructure/excel/ExcelParser.test.ts`
  - Test scenarios:
    - 입고(IN) Excel 파싱
    - 출고(OUT) Excel 파싱
    - 빈 파일 처리
    - 잘못된 형식 오류 처리
    - 날짜 변환 검증

**🟢 GREEN: Implement to Make Tests Pass**
- [ ] **Task 5.1.2**: ExcelParser 인터페이스 정의
  - File: `src/infrastructure/excel/types.ts`
  - ParsedRow, ExcelParserOptions 타입 정의

- [ ] **Task 5.1.3**: ExcelParser 구현
  - File: `src/infrastructure/excel/ExcelParser.ts`
  - xlsx 라이브러리 사용
  - 헤더 매핑, 날짜 변환, 타입 캐스팅

**🔵 REFACTOR: Clean Up Code**
- [ ] **Task 5.1.4**: 코드 정리 및 export
  - File: `src/infrastructure/excel/index.ts`

#### Quality Gate ✋
- [ ] Tests pass: `pnpm run test:run ExcelParser`
- [ ] Type check: `pnpm run type-check`
- [ ] Lint: `pnpm run lint`

---

### Phase 5.2: FileDropzone Component
**Goal**: 파일 드래그앤드롭 UI 컴포넌트
**Estimated Time**: 1.5 hours
**Status**: ⏳ Pending

#### Tasks

**🔴 RED: Write Failing Tests First**
- [ ] **Test 5.2.1**: FileDropzone 컴포넌트 테스트
  - File(s): `test/react/components/FileDropzone.test.tsx`
  - Test scenarios:
    - 파일 드롭 이벤트 처리
    - 파일 선택 버튼 클릭
    - 허용 파일 타입 검증
    - 드래그 상태 UI 변화

**🟢 GREEN: Implement to Make Tests Pass**
- [ ] **Task 5.2.2**: FileDropzone 컴포넌트 구현
  - File: `src/infrastructure/react/components/FileDropzone.tsx`
  - 드래그앤드롭 지원
  - 파일 선택 버튼
  - 시각적 피드백

**🔵 REFACTOR: Clean Up Code**
- [ ] **Task 5.2.3**: shadcn/ui 스타일 적용

#### Quality Gate ✋
- [ ] Tests pass
- [ ] 수동 테스트: 파일 드롭 동작 확인

---

### Phase 5.3: UploadPreview with Error Highlighting
**Goal**: 업로드 데이터 프리뷰 및 오류 하이라이팅
**Estimated Time**: 2.5 hours
**Status**: ⏳ Pending

#### Tasks

**🔴 RED: Write Failing Tests First**
- [ ] **Test 5.3.1**: UploadPreview 컴포넌트 테스트
  - File(s): `test/react/components/UploadPreview.test.tsx`
  - Test scenarios:
    - 데이터 테이블 렌더링
    - 오류 셀 하이라이팅
    - 오류 메시지 표시
    - 통계 정보 표시 (총 행수, 오류 행수)

**🟢 GREEN: Implement to Make Tests Pass**
- [ ] **Task 5.3.2**: UploadPreview 컴포넌트 구현
  - File: `src/infrastructure/react/components/UploadPreview.tsx`
  - TanStack Table 활용
  - 오류 셀 빨간색 배경
  - 툴팁으로 오류 메시지 표시

- [ ] **Task 5.3.3**: 오류 통계 컴포넌트
  - File: `src/infrastructure/react/components/ValidationSummary.tsx`
  - 총 행수, 유효 행수, 오류 행수 표시

**🔵 REFACTOR: Clean Up Code**
- [ ] **Task 5.3.4**: 스타일 최적화 및 접근성 개선

#### Quality Gate ✋
- [ ] Tests pass
- [ ] 오류 하이라이팅 시각적 확인
- [ ] 접근성 검토 (색상 외 다른 표시)

---

### Phase 5.4: Inline Editing & Re-validation
**Goal**: 인라인 수정 및 재검증 기능
**Estimated Time**: 2 hours
**Status**: ⏳ Pending

#### Tasks

**🔴 RED: Write Failing Tests First**
- [ ] **Test 5.4.1**: 인라인 편집 테스트
  - File(s): `test/react/components/EditableCell.test.tsx`
  - Test scenarios:
    - 셀 클릭 시 편집 모드 전환
    - 값 변경 후 blur 시 저장
    - ESC 키로 취소
    - 숫자 필드 유효성 검증

- [ ] **Test 5.4.2**: 재검증 통합 테스트
  - File(s): `test/react/components/UploadPreview.revalidate.test.tsx`
  - Test scenarios:
    - 값 수정 후 재검증 트리거
    - 오류 해결 시 하이라이팅 제거
    - 새 오류 발생 시 하이라이팅 추가

**🟢 GREEN: Implement to Make Tests Pass**
- [ ] **Task 5.4.3**: EditableCell 컴포넌트
  - File: `src/infrastructure/react/components/EditableCell.tsx`
  - 인라인 편집 지원
  - 타입별 입력 (text, number, date)

- [ ] **Task 5.4.4**: 재검증 로직 통합
  - UploadPreview에 재검증 훅 추가
  - 디바운싱으로 성능 최적화

**🔵 REFACTOR: Clean Up Code**
- [ ] **Task 5.4.5**: 커스텀 훅 추출 (useInlineEdit)

#### Quality Gate ✋
- [ ] Tests pass
- [ ] 편집 → 재검증 플로우 동작 확인

---

### Phase 5.5: Upload Page & Repository Integration
**Goal**: 업로드 페이지 및 Supabase 저장
**Estimated Time**: 2 hours
**Status**: ⏳ Pending

#### Tasks

**🔴 RED: Write Failing Tests First**
- [ ] **Test 5.5.1**: ProcessUploadUseCase 테스트
  - File(s): `test/application/usecases/ProcessUploadUseCase.test.ts`
  - Test scenarios:
    - 검증 통과 데이터 저장
    - 검증 실패 시 저장 안 함
    - 배치 ID 생성 검증

**🟢 GREEN: Implement to Make Tests Pass**
- [ ] **Task 5.5.2**: ProcessUploadUseCase 구현
  - File: `src/application/usecases/ProcessUploadUseCase.ts`
  - 검증 + 저장 통합
  - 배치 ID로 롤백 지원

- [ ] **Task 5.5.3**: SupabaseInventoryRepository 구현
  - File: `src/infrastructure/repositories/SupabaseInventoryRepository.ts`
  - IInventoryRepository 구현
  - saveMany, deleteByBatch

- [ ] **Task 5.5.4**: InventoryUploadPage 구현
  - File: `src/infrastructure/react/pages/InventoryUploadPage.tsx`
  - 전체 업로드 플로우 통합
  - 성공/실패 Toast 알림

- [ ] **Task 5.5.5**: ShipmentUploadPage 구현
  - File: `src/infrastructure/react/pages/ShipmentUploadPage.tsx`
  - 출고 계획 업로드 (구조 유사)

**🔵 REFACTOR: Clean Up Code**
- [ ] **Task 5.5.6**: 공통 로직 추출 (useUpload 훅)

#### Quality Gate ✋
- [ ] Tests pass
- [ ] Type check pass
- [ ] Lint pass
- [ ] Build success
- [ ] 전체 업로드 플로우 E2E 테스트

---

### Phase 5.6: Final Integration & Polish
**Goal**: 라우팅 연결 및 마무리
**Estimated Time**: 1 hour
**Status**: ⏳ Pending

#### Tasks

- [ ] **Task 5.6.1**: App.tsx 라우팅 추가
  - `/upload/inventory` - 입고 업로드
  - `/upload/shipment` - 출고 계획 업로드

- [ ] **Task 5.6.2**: Layout 네비게이션 메뉴 추가

- [ ] **Task 5.6.3**: 최종 테스트 실행 및 커버리지 확인

#### Quality Gate ✋
- [ ] `pnpm run test:coverage` - 80%+ 커버리지
- [ ] `pnpm run build` - 빌드 성공
- [ ] 전체 기능 수동 테스트

---

## ⚠️ Risk Assessment

| Risk | Probability | Impact | Mitigation Strategy |
|------|-------------|--------|---------------------|
| 대용량 Excel 파일 성능 | Medium | Medium | Web Worker로 파싱 분리, 페이지네이션 |
| 날짜 형식 불일치 | High | Low | 다양한 날짜 형식 지원, 사용자 피드백 |
| Supabase RLS 권한 | Low | High | 테스트 환경에서 RLS 검증 |

---

## 🔄 Rollback Strategy

### If Phase 5.1-5.4 Fails
- ExcelParser, FileDropzone, UploadPreview 파일 삭제
- test 파일 삭제

### If Phase 5.5 Fails
- SupabaseInventoryRepository 삭제
- ProcessUploadUseCase 삭제
- 페이지 컴포넌트 삭제

---

## 📊 Progress Tracking

### Completion Status
- **Phase 5.1**: ⏳ 0%
- **Phase 5.2**: ⏳ 0%
- **Phase 5.3**: ⏳ 0%
- **Phase 5.4**: ⏳ 0%
- **Phase 5.5**: ⏳ 0%
- **Phase 5.6**: ⏳ 0%

**Overall Progress**: 0% complete

---

## 📝 Notes & Learnings

### Implementation Notes
- (작업 중 추가 예정)

### Blockers Encountered
- (발생 시 기록)

---

## ✅ Final Checklist

**Before marking plan as COMPLETE**:
- [ ] All phases completed with quality gates passed
- [ ] Test coverage ≥ 80%
- [ ] Build successful
- [ ] All manual testing passed
- [ ] Documentation updated
