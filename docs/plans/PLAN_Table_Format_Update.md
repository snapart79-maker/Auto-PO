# Implementation Plan: 테이블 및 양식 업데이트

**Status**: 🔄 In Progress
**Started**: 2025-12-28
**Last Updated**: 2025-12-28
**Scope**: Medium (4-5 phases)

---

**CRITICAL INSTRUCTIONS**: After completing each phase:
1. Check off completed task checkboxes
2. Run all quality gate validation commands
3. Verify ALL quality gate items pass
4. Update "Last Updated" date above
5. Document learnings in Notes section
6. Only then proceed to next phase

**DO NOT skip quality gates or proceed with failing checks**

---

## Overview

### Feature Description
MES 시스템에서 사용 중인 Excel 양식과 일치하도록 4개 페이지의 테이블 컬럼 및 일괄등록 양식을 업데이트합니다.

**대상 페이지:**
1. 거래처관리 (PartnersPage)
2. 제품관리 (ProductsPage)
3. 입고현황 (InboundStatusPage)
4. 출고현황 (OutboundStatusPage)

### Success Criteria
- [ ] 모든 테이블 컬럼이 Excel 양식과 동일하게 표시
- [ ] 일괄등록 양식(다운로드)이 Excel 양식과 동일
- [ ] 일괄업로드가 새 양식 형식을 지원
- [ ] 테스트 커버리지 80% 이상 달성
- [ ] E2E 테스트 통과
- [ ] 빌드 성공

### User Impact
- MES 시스템과 동일한 UI로 사용자 친숙도 향상
- 기존 Excel 데이터를 그대로 업로드 가능
- 데이터 검증 및 확인 용이

---

## Architecture Decisions

| Decision | Rationale | Trade-offs |
|----------|-----------|------------|
| DB 스키마 확장 | 새 필드 저장 필요 | 마이그레이션 필요 |
| Domain Entity 확장 | Clean Architecture 준수 | 기존 코드 수정 필요 |
| 서브에이전트 병렬 처리 | 작업 속도 향상 | 통합 검증 필요 |
| TanStack Table 유지 | 기존 인프라 활용 | - |

---

## Dependencies

### Required Before Starting
- [x] 현재 코드베이스 분석 완료
- [x] Excel 양식 분석 완료
- [ ] 사용자 승인

### External Dependencies
- xlsx: ^0.18.5 (기존)
- @tanstack/react-table: ^8.20.0 (기존)
- Supabase (기존)

---

## Excel Format Analysis

### 1. 거래처 관리 (Partners)
**필요 컬럼 (24개):**
| # | 컬럼명 | 현재 여부 | 비고 |
|---|--------|----------|------|
| 1 | 거래처코드 | O | partnerCode |
| 2 | 거래처명(전명) | O | partnerName |
| 3 | 비고 | X | NEW |
| 4 | 거래처그룹 | X | NEW (매입매출처 등) |
| 5 | 사용여부(Y/N) | O | isActive |
| 6 | 사업자등록번호 | O | businessNumber |
| 7 | 대표자명 | X | NEW |
| 8 | 창립기념일 | X | NEW |
| 9 | 우편번호 | X | NEW |
| 10 | 주소 | O | address |
| 11 | 업태 | X | NEW |
| 12 | 업종 | X | NEW |
| 13 | 국가코드 | X | NEW |
| 14 | 인도조건 | X | NEW |
| 15 | 화폐단위코드 | O | currency |
| 16 | 전화번호1 | O | contactPhone |
| 17 | 전화번호2 | X | NEW |
| 18 | 대표 이메일 | O | contactEmail |
| 19 | 홈페이지 주소 | X | NEW |
| 20 | 협력사담당자명 | O | contactPerson |
| 21 | 협력사담당자 연락처 | X | NEW |
| 22 | 담당사원 | X | NEW |
| 23 | 적용시작일 | X | NEW |
| 24 | 적용완료일 | X | NEW |

### 2. 제품관리 (Products)
**필요 컬럼 (12개):**
| # | 컬럼명 | 현재 여부 | 비고 |
|---|--------|----------|------|
| 1 | 프로젝트코드 | X | NEW (차종코드 대체) |
| 2 | 품번 | O | productCode |
| 3 | 품명 | O | productName |
| 4 | 사양1 | X | NEW |
| 5 | 사양2 | X | NEW |
| 6 | 사양3 | X | NEW |
| 7 | MOQ | X | NEW |
| 8 | 품목유형 | X | NEW (완제품 등) |
| 9 | 단위 | X | NEW (EA 등) |
| 10 | 적용시작일 | X | NEW |
| 11 | 적용완료일 | X | NEW |
| 12 | 수정일시 | O | updatedAt |

### 3. 입고현황 (Inbound)
**필요 컬럼 (22개):**
| # | 컬럼명 | 현재 여부 | 비고 |
|---|--------|----------|------|
| 1 | 입고일 | O | transactionDate |
| 2 | 거래처코드 | X | NEW (분리 표시) |
| 3 | 공급사 | O | partnerName |
| 4 | 고객품번 | O | productCode |
| 5 | 품명 | O | productName |
| 6 | 수량 | O | quantity |
| 7 | 적용단가 | O | unitPrice |
| 8 | 공급가액 | O | supplyAmount |
| 9 | 화폐단위 | O | currency |
| 10 | 부가가치세 | X | NEW (%) |
| 11 | 금액(원화) | X | NEW |
| 12 | 세금 | X | NEW |
| 13 | 총금액 | O | totalAmount |
| 14 | 창고코드 | X | NEW |
| 15 | 창고명 | X | NEW |
| 16 | 수불마감KEY | X | NEW |
| 17 | 등록일시 | X | NEW |
| 18 | 등록자 | X | NEW |
| 19 | 수정일시 | X | NEW |
| 20 | 수정자 | X | NEW |
| 21 | 반품번호 | X | NEW |
| 22 | 입출상세 | X | NEW (일반입고 등) |

### 4. 출고현황 (Outbound)
**핵심 컬럼 (25개):**
| # | 컬럼명 | 현재 여부 | 비고 |
|---|--------|----------|------|
| 1 | 선택 | X | NEW (체크박스) |
| 2 | 조회기간 | X | NEW |
| 3 | 출하일 | O | transactionDate |
| 4 | 수불구분 | X | NEW (출고(매출)) |
| 5 | 출하유형 | X | NEW (출하(판매)) |
| 6 | LOT번호 | X | NEW |
| 7 | 품번 | O | productCode |
| 8 | 품명 | O | productName |
| 9 | 고객품번 | X | NEW |
| 10 | 수량 | O | quantity |
| 11 | 단가 | O | unitPrice |
| 12 | 계약단가 | X | NEW |
| 13 | 계약화폐단위 | X | NEW |
| 14 | 적용단가 | X | NEW |
| 15 | 공급가액 | O | supplyAmount |
| 16 | 화폐단위 | O | currency |
| 17 | 환율 | X | NEW |
| 18 | 부가가치세 | X | NEW |
| 19 | 금액(원화) | X | NEW |
| 20 | 세금 | X | NEW |
| 21 | 총금액 | O | totalAmount |
| 22 | 거래처코드 | X | NEW |
| 23 | 공급사 | O | partnerName |
| 24 | 창고코드 | X | NEW |
| 25 | 창고명 | X | NEW |

---

## Test Strategy

### Testing Approach
**TDD Principle**: Write tests FIRST, then implement to make them pass

### Test Pyramid for This Feature
| Test Type | Coverage Target | Purpose |
|-----------|-----------------|---------|
| **Unit Tests** | >= 80% | Entity 생성, 유효성 검사, DTO 변환 |
| **Integration Tests** | Critical paths | Repository CRUD, Hook 동작 |
| **E2E Tests** | Key user flows | 페이지 렌더링, 업로드/다운로드 |

### Test File Organization
```
test/
├── unit/
│   ├── domain/entities/
│   │   ├── Partner.test.ts (확장)
│   │   └── Product.test.ts (확장)
│   └── application/dtos/
│       └── TransactionWithDetails.test.ts
├── integration/
│   ├── repositories/
│   │   ├── PartnerRepository.test.ts
│   │   └── ProductRepository.test.ts
│   └── hooks/
│       └── useTransactions.test.ts
└── e2e/
    └── pages/
        ├── partners.spec.ts
        ├── products.spec.ts
        ├── inbound.spec.ts
        └── outbound.spec.ts
```

### Coverage Requirements by Phase
- **Phase 1 (DB Schema)**: Migration 테스트
- **Phase 2 (Domain/DTO)**: Unit tests >= 80%
- **Phase 3 (UI)**: Component tests >= 70%
- **Phase 4 (Integration)**: E2E tests + 전체 커버리지 확인

---

## Implementation Phases

### Phase 1: Database Schema & Migration
**Goal**: 새 필드를 지원하는 DB 스키마 확장
**Status**: Pending

#### Tasks

**GREEN: Implement Schema Changes**
- [ ] **Task 1.1**: Partners 테이블 확장 마이그레이션
  - File: `supabase/migrations/003_extend_partners.sql`
  - 추가 컬럼: note, partner_group, ceo_name, foundation_date, postal_code, business_type, industry_type, country_code, incoterms, phone2, website, partner_contact_phone, manager, effective_start_date, effective_end_date

- [ ] **Task 1.2**: Products 테이블 확장 마이그레이션
  - File: `supabase/migrations/004_extend_products.sql`
  - 추가 컬럼: project_code, spec1, spec2, spec3, moq, product_type, unit, effective_start_date, effective_end_date

- [ ] **Task 1.3**: Inventory Transactions 테이블 확장 마이그레이션
  - File: `supabase/migrations/005_extend_transactions.sql`
  - 추가 컬럼: partner_code, vat_rate, krw_amount, tax_amount, warehouse_code, warehouse_name, closing_key, registered_at, registered_by, modified_at, modified_by, return_number, transaction_detail, lot_number, transaction_category, shipment_type, customer_product_code, contract_price, contract_currency, applied_price, exchange_rate

- [ ] **Task 1.4**: Database Types 업데이트
  - File: `src/infrastructure/supabase/database.types.ts`

#### Quality Gate
- [ ] 마이그레이션 SQL 문법 검증
- [ ] 기존 데이터 영향 없음 확인
- [ ] Supabase 로컬 테스트

---

### Phase 2: Domain Entities & DTOs 확장
**Goal**: 새 필드를 지원하는 도메인 레이어 업데이트
**Status**: Pending

#### Tasks

**RED: Write Failing Tests First**
- [ ] **Test 2.1**: Partner Entity 확장 테스트
  - File: `test/unit/domain/entities/Partner.test.ts`
  - 테스트: 새 필드 생성, 유효성 검사

- [ ] **Test 2.2**: Product Entity 확장 테스트
  - File: `test/unit/domain/entities/Product.test.ts`
  - 테스트: 새 필드 생성, 유효성 검사

- [ ] **Test 2.3**: TransactionWithDetails DTO 확장 테스트
  - File: `test/unit/application/dtos/TransactionWithDetails.test.ts`
  - 테스트: 새 필드 매핑

**GREEN: Implement to Make Tests Pass**
- [ ] **Task 2.4**: Partner Entity 확장
  - File: `src/domain/entities/Partner.ts`
  - 추가: PartnerProps 인터페이스 확장

- [ ] **Task 2.5**: Product Entity 확장
  - File: `src/domain/entities/Product.ts`
  - 추가: ProductProps 인터페이스 확장

- [ ] **Task 2.6**: TransactionWithDetails DTO 확장
  - File: `src/application/dtos/TransactionWithDetails.ts`
  - 추가: 새 필드 정의

- [ ] **Task 2.7**: Repository 구현체 업데이트
  - Files:
    - `src/infrastructure/repositories/SupabasePartnerRepository.ts`
    - `src/infrastructure/repositories/SupabaseProductRepository.ts`
    - `src/infrastructure/repositories/SupabaseInventoryRepository.ts`

**REFACTOR: Clean Up Code**
- [ ] **Task 2.8**: 코드 정리 및 문서화

#### Quality Gate
- [ ] `pnpm run test` 통과
- [ ] `pnpm run type-check` 통과
- [ ] 테스트 커버리지 >= 80%

---

### Phase 3: UI 페이지 업데이트 (서브에이전트 병렬 처리)
**Goal**: 4개 페이지의 테이블 컬럼 및 양식 업데이트
**Status**: Pending

#### Tasks

**서브에이전트 A: PartnersPage**
- [ ] **Task 3.1A**: 테이블 컬럼 업데이트 (24개 컬럼)
- [ ] **Task 3.2A**: 일괄등록 양식 다운로드 수정
- [ ] **Task 3.3A**: 일괄업로드 파싱 로직 수정
- [ ] **Task 3.4A**: 개별 등록/수정 다이얼로그 확장

**서브에이전트 B: ProductsPage**
- [ ] **Task 3.1B**: 테이블 컬럼 업데이트 (12개 컬럼)
- [ ] **Task 3.2B**: 일괄등록 양식 다운로드 수정
- [ ] **Task 3.3B**: 일괄업로드 파싱 로직 수정
- [ ] **Task 3.4B**: 개별 등록/수정 다이얼로그 확장

**서브에이전트 C: InboundStatusPage**
- [ ] **Task 3.1C**: 테이블 컬럼 업데이트 (22개 컬럼)
- [ ] **Task 3.2C**: useTransactions hook 수정
- [ ] **Task 3.3C**: 요약 패널 업데이트

**서브에이전트 D: OutboundStatusPage**
- [ ] **Task 3.1D**: 테이블 컬럼 업데이트 (25개 컬럼)
- [ ] **Task 3.2D**: useTransactions hook 수정
- [ ] **Task 3.3D**: 요약 패널 업데이트

#### Quality Gate
- [ ] `pnpm run type-check` 통과
- [ ] `pnpm run build` 성공
- [ ] 각 페이지 수동 테스트

---

### Phase 4: 테스트 및 품질 검증
**Goal**: 테스트 커버리지 80% 달성 및 E2E 테스트
**Status**: Pending

#### Tasks

**E2E Tests**
- [ ] **Task 4.1**: Partners E2E 테스트
  - File: `test/e2e/pages/partners.spec.ts`
  - 테스트: 조회, 등록, 수정, 삭제, 일괄업로드

- [ ] **Task 4.2**: Products E2E 테스트
  - File: `test/e2e/pages/products.spec.ts`
  - 테스트: 조회, 등록, 수정, 삭제, 일괄업로드

- [ ] **Task 4.3**: Inbound E2E 테스트
  - File: `test/e2e/pages/inbound.spec.ts`
  - 테스트: 조회, 필터링, 요약 확인

- [ ] **Task 4.4**: Outbound E2E 테스트
  - File: `test/e2e/pages/outbound.spec.ts`
  - 테스트: 조회, 필터링, 요약 확인

**Coverage Check**
- [ ] **Task 4.5**: 부족한 테스트 케이스 추가
- [ ] **Task 4.6**: 커버리지 80% 달성 확인

#### Quality Gate
- [ ] `pnpm run test` 통과
- [ ] `pnpm run test:coverage` >= 80%
- [ ] `npx playwright test` 통과
- [ ] `pnpm run build` 성공

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation Strategy |
|------|-------------|--------|---------------------|
| DB 마이그레이션 실패 | Low | High | 로컬 테스트 후 적용, 롤백 SQL 준비 |
| 기존 데이터 호환성 | Medium | Medium | NULL 허용 필드로 추가, 기본값 설정 |
| 테스트 커버리지 미달 | Low | Medium | 서브에이전트 자동 테스트 추가 |
| 빌드 실패 | Low | High | Phase별 빌드 검증 |

---

## Rollback Strategy

### If Phase 1 Fails
- 마이그레이션 롤백: `supabase/migrations/rollback/` 스크립트 실행
- database.types.ts 복원

### If Phase 2 Fails
- Entity/DTO 이전 버전 복원
- Repository 이전 버전 복원

### If Phase 3 Fails
- 개별 페이지 이전 버전 복원
- Git revert 사용

### If Phase 4 Fails
- 테스트 파일 수정
- 커버리지 개선 작업

---

## Progress Tracking

### Completion Status
- **Phase 1**: Pending 0%
- **Phase 2**: Pending 0%
- **Phase 3**: Pending 0%
- **Phase 4**: Pending 0%

**Overall Progress**: 0% complete

---

## Validation Commands

```bash
# 테스트 실행
pnpm run test

# 테스트 커버리지
pnpm run test:coverage

# 타입 체크
pnpm run type-check

# 린트
pnpm run lint

# 빌드
pnpm run build

# E2E 테스트
npx playwright test
```

---

## Notes & Learnings

### Implementation Notes
- (작업 중 추가 예정)

### Blockers Encountered
- (작업 중 추가 예정)

---

## Final Checklist

**Before marking plan as COMPLETE**:
- [ ] All phases completed with quality gates passed
- [ ] Full integration testing performed
- [ ] Test coverage >= 80%
- [ ] All 4 pages updated and verified
- [ ] Excel upload/download tested
- [ ] Build successful

---

**Plan Status**: Pending User Approval
**Next Action**: 사용자 승인 후 Phase 1 시작
**Blocked By**: 사용자 승인
