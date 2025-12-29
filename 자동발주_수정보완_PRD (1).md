# 자동발주 시스템 수정/보완 PRD

## 오픈소스 참조 기반 코드 품질 개선

### Product Requirements Document (PRD) v1.5 - 수정/보완

---

| 항목 | 내용 |
|------|------|
| **문서 버전** | v1.5 (수정/보완 PRD) |
| **작성일** | 2025년 12월 29일 |
| **작성자** | 생산관리실 |
| **기준 문서** | PRD v1.3, 추가 PRD v1.4 |
| **목적** | 오픈소스 참조 기반 코드 품질 개선, 미완성 기능 보완, 버그 수정 |

---

## 목차

1. [개요](#1-개요)
2. [오픈소스 참조 프로젝트](#2-오픈소스-참조-프로젝트)
3. [현재 문제점 분석](#3-현재-문제점-분석)
4. [코드 품질 가이드라인](#4-코드-품질-가이드라인)
5. [컴포넌트 구조 표준](#5-컴포넌트-구조-표준)
6. [폼 유효성 검증 패턴](#6-폼-유효성-검증-패턴)
7. [테이블 컴포넌트 패턴](#7-테이블-컴포넌트-패턴)
8. [에러 처리 패턴](#8-에러-처리-패턴)
9. [일괄 등록 구현 가이드](#9-일괄-등록-구현-가이드)
10. [Clean Architecture 적용](#10-clean-architecture-적용)
11. [개발 도구 및 MCP 활용](#11-개발-도구-및-mcp-활용)
12. [구현 체크리스트](#12-구현-체크리스트)
13. [개발 일정](#13-개발-일정)

---

## 1. 개요

### 1.1 문서 목적

본 문서는 현재 자동발주 시스템의 **미완성 기능 보완** 및 **코드 품질 개선**을 위한 가이드라인을 제공합니다.

### 1.2 핵심 목표

| 목표 | 설명 |
|------|------|
| **버그 수정** | 등록 오류, UI 오류 등 현재 발생하는 버그 해결 |
| **미완성 기능 완료** | 일괄 등록, 유효성 검증 등 누락된 기능 구현 |
| **코드 품질 향상** | 오픈소스 참조를 통한 Best Practice 적용 |
| **일관성 확보** | 모든 화면에서 동일한 패턴 적용 |

### 1.3 접근 방식

```
┌─────────────────────────────────────────────────────────────┐
│                    개발 접근 방식                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. 오픈소스 참조    →   2. 패턴 추출    →   3. 적용        │
│     (Carbon ERP,         (컴포넌트,          (우리 시스템에  │
│      ERPNext 등)          폼, 테이블)         맞게 수정)     │
│                                                             │
│  4. feature-planner  →   5. MCP 활용    →   6. 테스트       │
│     (단계별 계획)         (figma, shadcn,     (playwright)   │
│                           supabase 등)                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. 오픈소스 참조 프로젝트

### 2.1 필수 참조 프로젝트

#### 🏆 Carbon ERP/MES (최우선 참조)

```
https://github.com/crbnos/carbon
```

| 항목 | 내용 |
|------|------|
| **기술 스택** | React, TypeScript, Remix, Supabase, Tailwind |
| **유사도** | ⭐⭐⭐⭐⭐ (거의 동일한 스택) |
| **참조할 부분** | 폴더 구조, 컴포넌트 설계, Supabase RLS, API 패턴 |
| **특징** | ERP + MES + QMS + MRP + BOM 관리 |

**Carbon에서 참조할 핵심 코드:**

```
carbon/
├── apps/
│   └── carbon/
│       ├── app/
│       │   ├── modules/           ← 모듈별 분리 참조
│       │   │   ├── inventory/
│       │   │   ├── parts/
│       │   │   └── purchasing/
│       │   └── components/        ← 공통 컴포넌트 참조
│       │       ├── Form/
│       │       ├── Table/
│       │       └── Layout/
│       └── supabase/
│           └── migrations/        ← DB 스키마 참조
├── packages/
│   ├── react/                     ← 재사용 컴포넌트
│   └── utils/                     ← 유틸리티 함수
```

#### 📦 추가 참조 프로젝트

| 프로젝트 | GitHub | 참조 포인트 |
|---------|--------|------------|
| **shadcn/ui** | https://ui.shadcn.com | 폼, 테이블, 다이얼로그 컴포넌트 |
| **TanStack Table** | https://tanstack.com/table | 테이블 페이지네이션, 필터링, 정렬 |
| **React Hook Form** | https://react-hook-form.com | 폼 상태 관리, 유효성 검증 |
| **Zod** | https://zod.dev | 스키마 유효성 검증 |

### 2.2 참조 방법

```bash
# 1. Carbon 프로젝트 클론
git clone https://github.com/crbnos/carbon.git

# 2. 구조 분석
tree -L 3 carbon/apps/carbon/app

# 3. 핵심 코드 추출
# - modules/inventory/ → 재고 관리 패턴
# - modules/purchasing/ → 발주 관리 패턴
# - components/Form/ → 폼 컴포넌트 패턴
# - components/Table/ → 테이블 컴포넌트 패턴
```

---

## 3. 현재 문제점 분석

### 3.1 확인된 문제점 목록

#### 🔴 Critical (즉시 수정)

| # | 문제 | 영향 | 해결 방안 |
|---|------|------|----------|
| C1 | 등록 오류 | 데이터 저장 실패 | Zod 스키마 검증 + 에러 핸들링 |
| C2 | 폼 유효성 검증 없음 | 잘못된 데이터 입력 | React Hook Form + Zod 적용 |
| C3 | API 에러 처리 미흡 | 사용자 혼란 | 글로벌 에러 핸들러 구현 |

#### 🟠 High (빠른 수정)

| # | 문제 | 영향 | 해결 방안 |
|---|------|------|----------|
| H1 | 일괄 등록 기능 없음 | 대량 데이터 입력 불가 | Excel 파싱 + 일괄 업서트 구현 |
| H2 | 테이블 페이지네이션 없음 | 대량 데이터 조회 불가 | TanStack Table 페이지네이션 |
| H3 | 테이블 필터링 불완전 | 원하는 데이터 검색 어려움 | 다중 조건 필터 구현 |

#### 🟡 Medium (계획적 수정)

| # | 문제 | 영향 | 해결 방안 |
|---|------|------|----------|
| M1 | UI 일관성 없음 | 사용성 저하 | 공통 컴포넌트 추출 및 적용 |
| M2 | 로딩 상태 표시 없음 | UX 저하 | 스켈레톤 + 스피너 적용 |
| M3 | 확인 다이얼로그 없음 | 실수로 삭제 가능 | 확인 모달 추가 |

#### 🟢 Low (점진적 개선)

| # | 문제 | 영향 | 해결 방안 |
|---|------|------|----------|
| L1 | 키보드 접근성 미흡 | 접근성 저하 | ARIA 속성 추가 |
| L2 | 반응형 디자인 미흡 | 모바일 사용 불가 | Tailwind 반응형 적용 |

### 3.2 문제별 상세 분석

#### C1. 등록 오류

```typescript
// ❌ 현재 문제 (예상)
const handleSubmit = async (data) => {
  await supabase.from('products').insert(data);  // 에러 처리 없음
  // 유효성 검증 없음
  // 중복 체크 없음
}

// ✅ 해결 방안 (Carbon 참조)
const handleSubmit = async (data: ProductFormData) => {
  try {
    // 1. Zod 스키마로 유효성 검증
    const validated = productSchema.parse(data);
    
    // 2. 중복 체크
    const existing = await checkDuplicate(validated.product_code);
    if (existing) throw new DuplicateError('이미 존재하는 품번입니다.');
    
    // 3. 저장
    const { data: result, error } = await supabase
      .from('products')
      .insert(validated)
      .select()
      .single();
    
    if (error) throw error;
    
    // 4. 성공 토스트
    toast.success('등록되었습니다.');
    return result;
  } catch (error) {
    // 5. 에러 처리
    handleApiError(error);
  }
}
```

---

## 4. 코드 품질 가이드라인

### 4.1 TypeScript 엄격 모드

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

### 4.2 네이밍 컨벤션

| 대상 | 규칙 | 예시 |
|------|------|------|
| 컴포넌트 | PascalCase | `ProductForm`, `PartnerTable` |
| 함수/변수 | camelCase | `handleSubmit`, `isLoading` |
| 상수 | UPPER_SNAKE_CASE | `MAX_PAGE_SIZE`, `API_URL` |
| 타입/인터페이스 | PascalCase | `Product`, `Partner` |
| 파일명 (컴포넌트) | PascalCase | `ProductForm.tsx` |
| 파일명 (유틸) | camelCase | `formatDate.ts` |
| 폴더명 | kebab-case | `product-management` |

### 4.3 import 순서

```typescript
// 1. React/외부 라이브러리
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

// 2. 내부 모듈 (절대 경로)
import { supabase } from '@/lib/supabase';
import { useProducts } from '@/hooks/useProducts';

// 3. 컴포넌트
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// 4. 타입
import type { Product, ProductFormData } from '@/types';

// 5. 스타일 (있는 경우)
import './ProductForm.css';
```

### 4.4 주석 가이드

```typescript
/**
 * 제품 등록 폼 컴포넌트
 * 
 * @description 새 제품을 등록하거나 기존 제품을 수정하는 폼
 * @param product - 수정할 제품 (없으면 신규 등록)
 * @param onSuccess - 저장 성공 시 콜백
 */
export function ProductForm({ product, onSuccess }: ProductFormProps) {
  // ...
}

// TODO: 일괄 등록 기능 추가 필요
// FIXME: 중복 체크 로직 개선 필요
// NOTE: Carbon ERP의 parts 모듈 참조
```

---

## 5. 컴포넌트 구조 표준

### 5.1 폴더 구조 (Carbon 참조)

```
src/
├── app/                           # 라우팅 (React Router)
│   ├── (authenticated)/           # 인증 필요 페이지
│   │   ├── dashboard/
│   │   ├── master/                # 기준관리
│   │   │   ├── company/
│   │   │   ├── vehicle/
│   │   │   ├── partner/
│   │   │   ├── product/
│   │   │   └── exchange-rate/
│   │   ├── inventory/             # 입고/출고
│   │   │   ├── inbound/
│   │   │   └── outbound/
│   │   ├── stock/                 # 재고관리
│   │   │   ├── current/
│   │   │   ├── initial/
│   │   │   └── adjustment/
│   │   └── order/                 # 발주관리
│   │       ├── shipment-plan/
│   │       ├── mrp/
│   │       ├── purchase-order/
│   │       └── vietnam/
│   └── (public)/                  # 공개 페이지
│       └── login/
│
├── components/                    # 공통 컴포넌트
│   ├── ui/                        # shadcn/ui 컴포넌트
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── dialog.tsx
│   │   └── ...
│   ├── form/                      # 폼 관련 컴포넌트
│   │   ├── FormField.tsx
│   │   ├── DatePicker.tsx
│   │   └── SelectField.tsx
│   ├── table/                     # 테이블 관련 컴포넌트
│   │   ├── DataTable.tsx
│   │   ├── Pagination.tsx
│   │   └── ColumnFilter.tsx
│   └── layout/                    # 레이아웃 컴포넌트
│       ├── Sidebar.tsx
│       ├── Header.tsx
│       └── PageContainer.tsx
│
├── domain/                        # Clean Architecture - 핵심
│   ├── entities/
│   │   ├── Product.ts
│   │   ├── Partner.ts
│   │   └── ...
│   └── repositories/
│       ├── IProductRepository.ts
│       └── ...
│
├── application/                   # Clean Architecture - 유스케이스
│   ├── usecases/
│   │   ├── product/
│   │   │   ├── CreateProduct.ts
│   │   │   ├── UpdateProduct.ts
│   │   │   └── DeleteProduct.ts
│   │   └── ...
│   └── services/
│       └── MRPService.ts
│
├── infrastructure/                # Clean Architecture - 외부
│   ├── supabase/
│   │   ├── client.ts
│   │   └── repositories/
│   │       ├── SupabaseProductRepository.ts
│   │       └── ...
│   └── excel/
│       ├── ExcelParser.ts
│       └── ExcelExporter.ts
│
├── hooks/                         # 커스텀 훅
│   ├── useProducts.ts
│   ├── usePartners.ts
│   └── useDebounce.ts
│
├── lib/                           # 유틸리티
│   ├── utils.ts
│   ├── formatters.ts
│   └── validators.ts
│
├── schemas/                       # Zod 스키마
│   ├── product.schema.ts
│   ├── partner.schema.ts
│   └── common.schema.ts
│
└── types/                         # TypeScript 타입
    ├── database.types.ts          # Supabase 생성 타입
    └── index.ts
```

### 5.2 컴포넌트 템플릿

```typescript
// src/components/form/ProductForm.tsx

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { productSchema, type ProductFormData } from '@/schemas/product.schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

interface ProductFormProps {
  product?: Product;
  onSuccess: (product: Product) => void;
  onCancel: () => void;
}

export function ProductForm({ product, onSuccess, onCancel }: ProductFormProps) {
  const isEditMode = !!product;
  
  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: product ?? {
      product_code: '',
      product_name: '',
      // ... 기본값
    },
  });

  const { isSubmitting } = form.formState;

  const onSubmit = async (data: ProductFormData) => {
    try {
      // API 호출
      const result = isEditMode
        ? await updateProduct(product.id, data)
        : await createProduct(data);
      
      toast.success(isEditMode ? '수정되었습니다.' : '등록되었습니다.');
      onSuccess(result);
    } catch (error) {
      handleApiError(error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="product_code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>품번 *</FormLabel>
              <FormControl>
                <Input 
                  placeholder="품번을 입력하세요" 
                  {...field} 
                  disabled={isEditMode}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* ... 다른 필드들 */}
        
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            취소
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? '저장 중...' : (isEditMode ? '수정' : '등록')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
```

---

## 6. 폼 유효성 검증 패턴

### 6.1 Zod 스키마 정의

```typescript
// src/schemas/product.schema.ts

import { z } from 'zod';

// 기본 스키마
export const productSchema = z.object({
  product_code: z
    .string()
    .min(1, '품번을 입력하세요.')
    .max(50, '품번은 50자 이하여야 합니다.')
    .regex(/^[A-Za-z0-9-]+$/, '품번은 영문, 숫자, 하이픈만 가능합니다.'),
  
  product_name: z
    .string()
    .min(1, '품명을 입력하세요.')
    .max(200, '품명은 200자 이하여야 합니다.'),
  
  vehicle_model_id: z
    .string()
    .uuid('유효한 차종을 선택하세요.')
    .optional()
    .nullable(),
  
  domestic_lead_time: z
    .number()
    .int('정수를 입력하세요.')
    .min(1, '리드타임은 1일 이상이어야 합니다.')
    .max(365, '리드타임은 365일 이하여야 합니다.')
    .default(3),
  
  overseas_lead_time: z
    .number()
    .int()
    .min(1)
    .max(365)
    .default(21),
  
  primary_supplier: z
    .enum(['DOMESTIC', 'VIETNAM', 'BOTH'], {
      errorMap: () => ({ message: '유효한 공급처를 선택하세요.' }),
    })
    .default('DOMESTIC'),
  
  domestic_ratio: z
    .number()
    .int()
    .min(0, '비율은 0% 이상이어야 합니다.')
    .max(100, '비율은 100% 이하여야 합니다.')
    .default(100),
  
  unit_price: z
    .number()
    .positive('단가는 0보다 커야 합니다.')
    .optional()
    .nullable(),
  
  currency: z
    .enum(['KRW', 'USD', 'EUR', 'VND'])
    .default('KRW'),
  
  is_active: z.boolean().default(true),
});

// 타입 추출
export type ProductFormData = z.infer<typeof productSchema>;

// 수정용 스키마 (ID 포함)
export const productUpdateSchema = productSchema.extend({
  id: z.string().uuid(),
});

// 일괄 등록용 스키마
export const productBulkSchema = z.array(productSchema);
```

### 6.2 커스텀 유효성 검증

```typescript
// 비동기 중복 체크
export const productSchemaWithDuplicateCheck = productSchema.refine(
  async (data) => {
    const existing = await checkProductCodeExists(data.product_code);
    return !existing;
  },
  {
    message: '이미 존재하는 품번입니다.',
    path: ['product_code'],
  }
);

// 조건부 유효성 검증
export const productSchemaWithConditional = productSchema.superRefine(
  (data, ctx) => {
    // BOTH인 경우 비율 검증
    if (data.primary_supplier === 'BOTH') {
      if (data.domestic_ratio <= 0 || data.domestic_ratio >= 100) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'BOTH 선택 시 국내 비율은 1~99% 사이여야 합니다.',
          path: ['domestic_ratio'],
        });
      }
    }
    
    // 해외 공급 시 해외 리드타임 필수
    if (data.primary_supplier !== 'DOMESTIC' && !data.overseas_lead_time) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '해외 공급 시 해외 리드타임을 입력하세요.',
        path: ['overseas_lead_time'],
      });
    }
  }
);
```

### 6.3 React Hook Form 통합

```typescript
// src/hooks/useProductForm.ts

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { productSchema, ProductFormData } from '@/schemas/product.schema';

export function useProductForm(defaultValues?: Partial<ProductFormData>) {
  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      product_code: '',
      product_name: '',
      domestic_lead_time: 3,
      overseas_lead_time: 21,
      primary_supplier: 'DOMESTIC',
      domestic_ratio: 100,
      currency: 'KRW',
      is_active: true,
      ...defaultValues,
    },
    mode: 'onBlur', // 포커스 아웃 시 검증
  });

  return form;
}
```

---

## 7. 테이블 컴포넌트 패턴

### 7.1 TanStack Table 기본 설정

```typescript
// src/components/table/DataTable.tsx

import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type PaginationState,
} from '@tanstack/react-table';
import { useState } from 'react';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  pageSize?: number;
  searchPlaceholder?: string;
  onRowClick?: (row: TData) => void;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  pageSize = 10,
  searchPlaceholder = '검색...',
  onRowClick,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize,
  });

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      pagination,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="space-y-4">
      {/* 검색 */}
      <div className="flex items-center gap-4">
        <Input
          placeholder={searchPlaceholder}
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* 테이블 */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    className={header.column.getCanSort() ? 'cursor-pointer select-none' : ''}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {{
                      asc: ' 🔼',
                      desc: ' 🔽',
                    }[header.column.getIsSorted() as string] ?? null}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  onClick={() => onRowClick?.(row.original)}
                  className={onRowClick ? 'cursor-pointer hover:bg-muted' : ''}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  데이터가 없습니다.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* 페이지네이션 */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          총 {table.getFilteredRowModel().rows.length}건 중{' '}
          {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}-
          {Math.min(
            (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
            table.getFilteredRowModel().rows.length
          )}
          건 표시
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            이전
          </Button>
          <span className="text-sm">
            {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            다음
          </Button>
        </div>
      </div>
    </div>
  );
}
```

### 7.2 컬럼 정의 예시

```typescript
// src/app/master/product/columns.tsx

import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Pencil, Trash } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const productColumns: ColumnDef<Product>[] = [
  {
    accessorKey: 'product_code',
    header: '품번',
    cell: ({ row }) => (
      <span className="font-medium">{row.getValue('product_code')}</span>
    ),
  },
  {
    accessorKey: 'product_name',
    header: '품명',
  },
  {
    accessorKey: 'vehicle_model.vehicle_name',
    header: '차종',
    cell: ({ row }) => row.original.vehicle_model?.vehicle_name ?? '-',
  },
  {
    accessorKey: 'primary_supplier',
    header: '공급처',
    cell: ({ row }) => {
      const supplier = row.getValue('primary_supplier') as string;
      const colorMap = {
        DOMESTIC: 'bg-blue-100 text-blue-800',
        VIETNAM: 'bg-green-100 text-green-800',
        BOTH: 'bg-purple-100 text-purple-800',
      };
      return (
        <Badge className={colorMap[supplier]}>
          {supplier === 'DOMESTIC' ? '국내' : supplier === 'VIETNAM' ? '베트남' : '이원화'}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'is_active',
    header: '상태',
    cell: ({ row }) => (
      <Badge variant={row.getValue('is_active') ? 'default' : 'secondary'}>
        {row.getValue('is_active') ? '사용' : '미사용'}
      </Badge>
    ),
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row, table }) => {
      const product = row.original;
      const { onEdit, onDelete } = table.options.meta as TableMeta;
      
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(product)}>
              <Pencil className="mr-2 h-4 w-4" />
              수정
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(product)}
              className="text-red-600"
            >
              <Trash className="mr-2 h-4 w-4" />
              삭제
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
```

---

## 8. 에러 처리 패턴

### 8.1 글로벌 에러 핸들러

```typescript
// src/lib/error-handler.ts

import { toast } from 'sonner';
import { PostgrestError } from '@supabase/supabase-js';
import { ZodError } from 'zod';

// 커스텀 에러 타입
export class ApiError extends Error {
  constructor(
    message: string,
    public code?: string,
    public status?: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class DuplicateError extends ApiError {
  constructor(message: string) {
    super(message, 'DUPLICATE', 409);
    this.name = 'DuplicateError';
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string) {
    super(message, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

// 에러 핸들러
export function handleApiError(error: unknown): void {
  console.error('API Error:', error);

  // Zod 유효성 검증 에러
  if (error instanceof ZodError) {
    const messages = error.errors.map((e) => e.message).join('\n');
    toast.error('입력값 오류', { description: messages });
    return;
  }

  // Supabase 에러
  if (isPostgrestError(error)) {
    const message = getPostgrestErrorMessage(error);
    toast.error('데이터베이스 오류', { description: message });
    return;
  }

  // 커스텀 에러
  if (error instanceof ApiError) {
    toast.error(error.message);
    return;
  }

  // 일반 에러
  if (error instanceof Error) {
    toast.error('오류가 발생했습니다.', { description: error.message });
    return;
  }

  // 알 수 없는 에러
  toast.error('알 수 없는 오류가 발생했습니다.');
}

function isPostgrestError(error: unknown): error is PostgrestError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error
  );
}

function getPostgrestErrorMessage(error: PostgrestError): string {
  // Supabase 에러 코드별 메시지
  const errorMessages: Record<string, string> = {
    '23505': '이미 존재하는 데이터입니다.',
    '23503': '참조하는 데이터가 존재하지 않습니다.',
    '23502': '필수 항목이 누락되었습니다.',
    '42501': '권한이 없습니다.',
    'PGRST116': '데이터를 찾을 수 없습니다.',
  };

  return errorMessages[error.code] ?? error.message;
}
```

### 8.2 API 래퍼

```typescript
// src/lib/api.ts

import { supabase } from './supabase';
import { handleApiError, ApiError } from './error-handler';

type ApiResult<T> = {
  data: T | null;
  error: Error | null;
};

export async function apiCall<T>(
  fn: () => Promise<{ data: T | null; error: PostgrestError | null }>
): Promise<ApiResult<T>> {
  try {
    const { data, error } = await fn();
    
    if (error) {
      throw error;
    }
    
    return { data, error: null };
  } catch (error) {
    handleApiError(error);
    return { data: null, error: error as Error };
  }
}

// 사용 예시
export async function getProducts() {
  return apiCall(() =>
    supabase
      .from('products')
      .select('*, vehicle_model:vehicle_models(*), main_partner:partners(*)')
      .order('created_at', { ascending: false })
  );
}

export async function createProduct(data: ProductFormData) {
  // 중복 체크
  const { data: existing } = await supabase
    .from('products')
    .select('id')
    .eq('product_code', data.product_code)
    .single();

  if (existing) {
    throw new DuplicateError('이미 존재하는 품번입니다.');
  }

  return apiCall(() =>
    supabase.from('products').insert(data).select().single()
  );
}
```

---

## 9. 일괄 등록 구현 가이드

### 9.1 Excel 파싱

```typescript
// src/infrastructure/excel/ExcelParser.ts

import * as XLSX from 'xlsx';
import { z } from 'zod';

export interface ParseResult<T> {
  data: T[];
  errors: ParseError[];
  totalRows: number;
  validRows: number;
}

export interface ParseError {
  row: number;
  column: string;
  message: string;
  value: unknown;
}

export class ExcelParser<T> {
  constructor(
    private schema: z.ZodSchema<T>,
    private columnMapping: Record<string, string> // Excel 컬럼명 → 필드명
  ) {}

  async parse(file: File): Promise<ParseResult<T>> {
    const workbook = await this.readFile(file);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    const headers = jsonData[0] as string[];
    const rows = jsonData.slice(1) as unknown[][];

    const result: ParseResult<T> = {
      data: [],
      errors: [],
      totalRows: rows.length,
      validRows: 0,
    };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // Excel 행 번호 (헤더 제외)

      try {
        const mappedData = this.mapRow(headers, row);
        const validated = this.schema.parse(mappedData);
        result.data.push(validated);
        result.validRows++;
      } catch (error) {
        if (error instanceof z.ZodError) {
          error.errors.forEach((e) => {
            result.errors.push({
              row: rowNum,
              column: e.path.join('.'),
              message: e.message,
              value: row[headers.indexOf(this.reverseMapping(e.path[0] as string))],
            });
          });
        }
      }
    }

    return result;
  }

  private async readFile(file: File): Promise<XLSX.WorkBook> {
    const buffer = await file.arrayBuffer();
    return XLSX.read(buffer, { type: 'array' });
  }

  private mapRow(headers: string[], row: unknown[]): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    headers.forEach((header, index) => {
      const fieldName = this.columnMapping[header];
      if (fieldName) {
        result[fieldName] = row[index];
      }
    });

    return result;
  }

  private reverseMapping(fieldName: string): string {
    return Object.entries(this.columnMapping).find(
      ([, value]) => value === fieldName
    )?.[0] ?? fieldName;
  }
}

// 제품 일괄 등록용 파서
export const productExcelParser = new ExcelParser(productSchema, {
  '품번': 'product_code',
  '품명': 'product_name',
  '차종코드': 'vehicle_code',
  '국내리드타임': 'domestic_lead_time',
  '해외리드타임': 'overseas_lead_time',
  '공급처': 'primary_supplier',
  '국내비율': 'domestic_ratio',
  '단가': 'unit_price',
  '통화': 'currency',
});
```

### 9.2 일괄 등록 UI

```typescript
// src/components/BulkUpload.tsx

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface BulkUploadProps<T> {
  parser: ExcelParser<T>;
  onUpload: (data: T[]) => Promise<void>;
  templateUrl: string;
}

export function BulkUpload<T>({ parser, onUpload, templateUrl }: BulkUploadProps<T>) {
  const [result, setResult] = useState<ParseResult<T> | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    try {
      const parseResult = await parser.parse(file);
      setResult(parseResult);
    } catch (error) {
      toast.error('파일 파싱 실패', { description: (error as Error).message });
    }
  }, [parser]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    maxFiles: 1,
  });

  const handleUpload = async () => {
    if (!result?.data.length) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const batchSize = 100;
      const batches = Math.ceil(result.data.length / batchSize);

      for (let i = 0; i < batches; i++) {
        const batch = result.data.slice(i * batchSize, (i + 1) * batchSize);
        await onUpload(batch);
        setUploadProgress(((i + 1) / batches) * 100);
      }

      toast.success('업로드 완료', {
        description: `${result.data.length}건이 등록되었습니다.`,
      });
      setResult(null);
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 템플릿 다운로드 */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">일괄 등록</h3>
        <Button variant="outline" asChild>
          <a href={templateUrl} download>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            템플릿 다운로드
          </a>
        </Button>
      </div>

      {/* 드래그앤드롭 영역 */}
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer',
          isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
        )}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">
          {isDragActive
            ? '여기에 파일을 놓으세요'
            : 'Excel 파일을 드래그하거나 클릭하여 선택하세요'}
        </p>
      </div>

      {/* 파싱 결과 */}
      {result && (
        <div className="space-y-4">
          {/* 요약 */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-muted">
              <div className="text-2xl font-bold">{result.totalRows}</div>
              <div className="text-sm text-muted-foreground">전체</div>
            </div>
            <div className="p-4 rounded-lg bg-green-50">
              <div className="text-2xl font-bold text-green-600">
                {result.validRows}
              </div>
              <div className="text-sm text-green-600">유효</div>
            </div>
            <div className="p-4 rounded-lg bg-red-50">
              <div className="text-2xl font-bold text-red-600">
                {result.errors.length}
              </div>
              <div className="text-sm text-red-600">오류</div>
            </div>
          </div>

          {/* 오류 목록 */}
          {result.errors.length > 0 && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <span className="font-medium text-red-600">
                  {result.errors.length}건의 오류가 있습니다
                </span>
              </div>
              <div className="max-h-40 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">행</TableHead>
                      <TableHead>컬럼</TableHead>
                      <TableHead>값</TableHead>
                      <TableHead>오류</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.errors.slice(0, 10).map((error, index) => (
                      <TableRow key={index}>
                        <TableCell>{error.row}</TableCell>
                        <TableCell>{error.column}</TableCell>
                        <TableCell className="max-w-[100px] truncate">
                          {String(error.value)}
                        </TableCell>
                        <TableCell className="text-red-600">
                          {error.message}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {result.errors.length > 10 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    외 {result.errors.length - 10}건...
                  </p>
                )}
              </div>
            </div>
          )}

          {/* 업로드 버튼 */}
          {isUploading ? (
            <div className="space-y-2">
              <Progress value={uploadProgress} />
              <p className="text-sm text-center text-muted-foreground">
                업로드 중... {Math.round(uploadProgress)}%
              </p>
            </div>
          ) : (
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setResult(null)}>
                취소
              </Button>
              <Button
                onClick={handleUpload}
                disabled={result.validRows === 0}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                {result.validRows}건 등록
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

---

## 10. Clean Architecture 적용

### 10.1 계층 구조

```
┌─────────────────────────────────────────────────────────────┐
│                     Presentation Layer                       │
│  (React Components, Pages, Hooks)                           │
│  - UI 렌더링                                                 │
│  - 사용자 입력 처리                                          │
│  - 상태 관리                                                 │
├─────────────────────────────────────────────────────────────┤
│                     Application Layer                        │
│  (Use Cases, Services)                                       │
│  - 비즈니스 로직 오케스트레이션                              │
│  - 트랜잭션 관리                                             │
│  - MRP 계산 로직                                             │
├─────────────────────────────────────────────────────────────┤
│                      Domain Layer                            │
│  (Entities, Value Objects, Repository Interfaces)            │
│  - 핵심 비즈니스 규칙                                        │
│  - 엔티티 정의                                               │
│  - 인터페이스 정의                                           │
├─────────────────────────────────────────────────────────────┤
│                   Infrastructure Layer                       │
│  (Supabase, Excel, External APIs)                            │
│  - 데이터베이스 접근                                         │
│  - 외부 서비스 연동                                          │
│  - 파일 처리                                                 │
└─────────────────────────────────────────────────────────────┘
```

### 10.2 의존성 방향

```typescript
// ✅ 올바른 의존성 방향: 바깥 → 안쪽

// Domain Layer (핵심 - 의존성 없음)
// src/domain/entities/Product.ts
export interface Product {
  id: string;
  productCode: string;
  productName: string;
  // ...
}

// src/domain/repositories/IProductRepository.ts
export interface IProductRepository {
  findAll(): Promise<Product[]>;
  findById(id: string): Promise<Product | null>;
  create(product: Omit<Product, 'id'>): Promise<Product>;
  update(id: string, product: Partial<Product>): Promise<Product>;
  delete(id: string): Promise<void>;
}

// Application Layer (Domain만 의존)
// src/application/usecases/product/CreateProduct.ts
import { IProductRepository } from '@/domain/repositories/IProductRepository';
import { Product } from '@/domain/entities/Product';

export class CreateProductUseCase {
  constructor(private readonly productRepository: IProductRepository) {}

  async execute(data: Omit<Product, 'id'>): Promise<Product> {
    // 비즈니스 규칙 검증
    await this.validateProductCode(data.productCode);
    
    // 저장
    return this.productRepository.create(data);
  }

  private async validateProductCode(code: string): Promise<void> {
    const existing = await this.productRepository.findByCode(code);
    if (existing) {
      throw new DuplicateError('이미 존재하는 품번입니다.');
    }
  }
}

// Infrastructure Layer (Domain, Application 구현)
// src/infrastructure/supabase/repositories/SupabaseProductRepository.ts
import { supabase } from '../client';
import { IProductRepository } from '@/domain/repositories/IProductRepository';
import { Product } from '@/domain/entities/Product';

export class SupabaseProductRepository implements IProductRepository {
  async findAll(): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data.map(this.toDomain);
  }

  async create(product: Omit<Product, 'id'>): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .insert(this.toPersistence(product))
      .select()
      .single();

    if (error) throw error;
    return this.toDomain(data);
  }

  private toDomain(data: any): Product {
    return {
      id: data.id,
      productCode: data.product_code,
      productName: data.product_name,
      // ... 매핑
    };
  }

  private toPersistence(product: Omit<Product, 'id'>): any {
    return {
      product_code: product.productCode,
      product_name: product.productName,
      // ... 역매핑
    };
  }
}

// Presentation Layer (모두 의존)
// src/hooks/useProducts.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CreateProductUseCase } from '@/application/usecases/product/CreateProduct';
import { SupabaseProductRepository } from '@/infrastructure/supabase/repositories/SupabaseProductRepository';

const productRepository = new SupabaseProductRepository();
const createProductUseCase = new CreateProductUseCase(productRepository);

export function useProducts() {
  const queryClient = useQueryClient();

  const productsQuery = useQuery({
    queryKey: ['products'],
    queryFn: () => productRepository.findAll(),
  });

  const createProductMutation = useMutation({
    mutationFn: (data: ProductFormData) => createProductUseCase.execute(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('제품이 등록되었습니다.');
    },
    onError: handleApiError,
  });

  return {
    products: productsQuery.data ?? [],
    isLoading: productsQuery.isLoading,
    createProduct: createProductMutation.mutate,
    isCreating: createProductMutation.isPending,
  };
}
```

---

## 11. 개발 도구 및 MCP 활용

### 11.1 feature-planner 스킬 사용법

```markdown
# feature-planner 사용 예시

## Feature: 제품 일괄 등록

### 1. 기능 분석
- 목적: Excel 파일을 통한 대량 제품 등록
- 입력: Excel 파일 (.xlsx, .xls)
- 출력: 등록된 제품 목록, 오류 리포트
- 의존성: 제품 마스터, 차종 마스터, 거래처 마스터

### 2. 구현 계획
1. **Excel 파서 구현** (1시간)
   - XLSX 라이브러리 설정
   - 컬럼 매핑 정의
   - Zod 스키마 검증 연동

2. **UI 컴포넌트 구현** (2시간)
   - 드래그앤드롭 영역
   - 파싱 결과 프리뷰
   - 오류 하이라이팅
   - 진행률 표시

3. **API 연동** (1시간)
   - 일괄 업서트 쿼리
   - 트랜잭션 처리
   - 에러 핸들링

4. **테스트** (30분)
   - 정상 케이스
   - 오류 케이스 (중복, 유효성 실패)
   - 대용량 데이터 (1000건)

### 3. MCP 활용
- context7: XLSX 라이브러리 문서
- shadcn: Dropzone, Progress 컴포넌트
- supabase: 벌크 인서트 최적화
- playwright: E2E 테스트

### 4. 예상 소요 시간
- 총 4.5시간
```

### 11.2 MCP 활용 매핑

| 작업 | MCP | 사용법 |
|------|-----|--------|
| UI 와이어프레임 | **figma** | `figma.create_wireframe(screen_name)` |
| 컴포넌트 생성 | **shadcn** | `shadcn.add_component(name)` |
| 대시보드 차트 | **magic** | 복잡한 UI 컴포넌트 생성 |
| DB 스키마 | **supabase** | `supabase.create_table(schema)` |
| SQL 쿼리 | **postgres** | 복잡한 집계, 뷰 생성 |
| 알고리즘 설계 | **sequential-thinking** | MRP 계산 로직 단계별 분석 |
| 문서 참조 | **context7** | React, TanStack 공식 문서 |
| E2E 테스트 | **playwright** | 테스트 시나리오 작성 및 실행 |

### 11.3 개발 워크플로우

```
┌──────────────────────────────────────────────────────────────┐
│                    개발 워크플로우                            │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  1. feature-planner   →   2. figma MCP    →   3. shadcn MCP │
│     기능 분석/계획          UI 와이어프레임      컴포넌트 생성 │
│                                                              │
│  4. supabase MCP     →   5. 코드 구현     →   6. playwright │
│     DB 스키마/쿼리          실제 개발            E2E 테스트   │
│                                                              │
│  7. 코드 리뷰        →   8. 배포                             │
│     품질 검토              프로덕션                           │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## 12. 구현 체크리스트

### 12.1 Critical (즉시)

- [ ] **C1. 등록 오류 수정**
  - [ ] Zod 스키마 정의 (모든 엔티티)
  - [ ] React Hook Form 적용
  - [ ] 에러 메시지 표시
  - [ ] 중복 체크 로직

- [ ] **C2. 폼 유효성 검증**
  - [ ] 필수 필드 검증
  - [ ] 형식 검증 (이메일, 전화번호 등)
  - [ ] 범위 검증 (숫자 최소/최대)
  - [ ] 조건부 검증

- [ ] **C3. API 에러 처리**
  - [ ] 글로벌 에러 핸들러 구현
  - [ ] Supabase 에러 코드 매핑
  - [ ] 토스트 알림 적용

### 12.2 High (빠른)

- [ ] **H1. 일괄 등록 기능**
  - [ ] Excel 파서 구현
  - [ ] 드래그앤드롭 UI
  - [ ] 파싱 결과 프리뷰
  - [ ] 오류 하이라이팅
  - [ ] 일괄 업서트 API

- [ ] **H2. 테이블 페이지네이션**
  - [ ] TanStack Table 설정
  - [ ] 페이지 사이즈 선택
  - [ ] 페이지 이동 버튼
  - [ ] 총 건수 표시

- [ ] **H3. 테이블 필터링**
  - [ ] 전역 검색
  - [ ] 컬럼별 필터
  - [ ] 다중 조건 필터
  - [ ] 필터 초기화

### 12.3 Medium (계획적)

- [ ] **M1. UI 일관성**
  - [ ] 공통 레이아웃 컴포넌트
  - [ ] 버튼 스타일 통일
  - [ ] 폼 스타일 통일
  - [ ] 테이블 스타일 통일

- [ ] **M2. 로딩 상태**
  - [ ] 스켈레톤 컴포넌트
  - [ ] 버튼 스피너
  - [ ] 전체 페이지 로딩

- [ ] **M3. 확인 다이얼로그**
  - [ ] 삭제 확인
  - [ ] 저장 확인 (변경사항 있을 때)
  - [ ] 페이지 이탈 경고

### 12.4 기능별 체크리스트

#### 기준관리

- [ ] 회사정보: 개별등록 ✅ / 수정 ✅
- [ ] 차종관리: 개별등록 / 수정 / 삭제 / **일괄등록**
- [ ] 거래처관리: 개별등록 / 수정 / 삭제 / **일괄등록**
- [ ] 제품관리: 개별등록 / 수정 / 삭제 / **일괄등록**
- [ ] 환율관리: 개별등록 / 수정 / 이력조회

#### 입고/출고

- [ ] 입고현황: 조회 / 필터링 / 페이지네이션 / 거래처별합계
- [ ] 입고등록: 개별등록 / **엑셀업로드** / 유효성검증
- [ ] 출고현황: 조회 / 필터링 / 페이지네이션 / 고객사별합계
- [ ] 출고등록: 개별등록 / **엑셀업로드** / 유효성검증

#### 재고관리

- [ ] 재고현황: 조회 / 상태표시 / 부족알림
- [ ] 초기재고: 개별등록 / **일괄등록**
- [ ] 재고조정: 등록 / 이력조회

#### 발주관리

- [ ] 출고계획: 등록 / 수정 / 삭제 / **일괄등록**
- [ ] MRP계산: 자동계산 / 재계산 / 결과조회
- [ ] 발주권고: 선택발주 / 전체발주
- [ ] 발주서관리: 조회 / 상태변경 / PDF출력 / Excel출력
- [ ] 베트남발주: 주간누적 / 통합발주 / 선적일선택

---

## 13. 개발 일정

### 13.1 Phase 1: 버그 수정 및 기반 작업 (1주)

| 일차 | 작업 | 담당 | MCP |
|------|------|------|-----|
| 1일 | Carbon 프로젝트 분석, 패턴 추출 | - | - |
| 2일 | 공통 컴포넌트 정리 (Form, Table) | - | shadcn |
| 3일 | Zod 스키마 전체 정의 | - | context7 |
| 4일 | 에러 핸들러 구현 | - | - |
| 5일 | 기존 폼에 유효성 검증 적용 | - | - |

### 13.2 Phase 2: 일괄 등록 구현 (1주)

| 일차 | 작업 | 담당 | MCP |
|------|------|------|-----|
| 1일 | Excel 파서 구현 | - | context7 |
| 2일 | BulkUpload 컴포넌트 구현 | - | shadcn |
| 3일 | 차종/거래처 일괄 등록 | - | supabase |
| 4일 | 제품 일괄 등록 | - | supabase |
| 5일 | 입고/출고 엑셀 업로드 | - | supabase |

### 13.3 Phase 3: UI 개선 (1주)

| 일차 | 작업 | 담당 | MCP |
|------|------|------|-----|
| 1일 | DataTable 컴포넌트 완성 | - | shadcn |
| 2일 | 페이지네이션, 필터링 적용 | - | context7 |
| 3일 | 입고/출고 현황 새 레이아웃 | - | figma |
| 4일 | 로딩 상태, 스켈레톤 적용 | - | shadcn |
| 5일 | 확인 다이얼로그 적용 | - | shadcn |

### 13.4 Phase 4: 재고/발주 기능 (2주)

| 주차 | 작업 | MCP |
|------|------|-----|
| 1주 | 재고관리 (현황, 초기, 조정) | supabase, postgres |
| 2주 | 발주관리 (계획, MRP, 발주서) | sequential-thinking |

### 13.5 Phase 5: 테스트 및 안정화 (1주)

| 일차 | 작업 | MCP |
|------|------|-----|
| 1-2일 | E2E 테스트 작성 | playwright |
| 3-4일 | 버그 수정, 성능 최적화 | - |
| 5일 | 배포 준비, 문서화 | - |

---

## 부록 A: Claude Code 프롬프트 템플릿

```markdown
# 자동발주 시스템 수정/보완 작업

## 📋 사전 작업 (필수)

### 1단계: 현황 파악
1. `tree -L 3` 으로 프로젝트 구조 확인
2. `/docs` 폴더의 PRD 문서 읽기
3. 현재 구현된 화면/라우팅 파악
4. DB 스키마 확인

### 2단계: 오픈소스 참조
1. Carbon ERP 클론: `git clone https://github.com/crbnos/carbon.git`
2. 다음 폴더 분석:
   - `apps/carbon/app/modules/` → 모듈 구조
   - `apps/carbon/app/components/` → 컴포넌트 패턴
   - `packages/react/` → 재사용 컴포넌트

### 3단계: PRD 분석
파일 읽기: `자동발주_수정보완_PRD.md`

다음 항목을 **체크리스트로 추출**:
- [ ] Critical 버그 목록
- [ ] 미완성 기능 목록
- [ ] UI 수정 사항
- [ ] 새로 구현할 컴포넌트

---

## 🎯 개발 원칙

### 필수 준수 사항
1. **Clean Architecture**: domain → application → infrastructure 순서
2. **TypeScript 엄격 모드**: any 사용 금지, 타입 명시
3. **Zod 스키마**: 모든 폼에 유효성 검증 적용
4. **에러 처리**: 글로벌 에러 핸들러 사용
5. **일관성**: 공통 컴포넌트 사용, 스타일 통일

### MCP 활용
- figma: UI 와이어프레임
- shadcn: 컴포넌트 생성
- supabase: DB 작업
- postgres: 복잡한 쿼리
- context7: 라이브러리 문서
- sequential-thinking: 알고리즘 설계
- playwright: E2E 테스트

### feature-planner 사용
각 기능 구현 전 반드시 다음 형식으로 계획 수립:

```
Feature: [기능명]
├── 목적:
├── 참조 코드: (Carbon ERP 경로)
├── 의존성:
├── 구현 단계:
└── 테스트 케이스:
```

---

## ✅ 구현 순서

### 1. 기반 작업 (먼저)
- [ ] 공통 컴포넌트 정리
- [ ] Zod 스키마 정의
- [ ] 에러 핸들러 구현

### 2. 버그 수정 (다음)
- [ ] 등록 오류 수정
- [ ] 유효성 검증 적용

### 3. 기능 구현 (순서대로)
- [ ] 일괄 등록 기능
- [ ] 테이블 페이지네이션/필터링
- [ ] 재고 관리
- [ ] 발주 관리

---

## 📝 작업 진행 방식

1. **한 번에 하나의 Feature만** 구현
2. 구현 전 **feature-planner로 계획** 수립
3. **Carbon 코드 참조**하여 패턴 적용
4. 구현 후 **체크리스트 업데이트**
5. 주요 기능은 **E2E 테스트** 작성

---

## ⚠️ 금지 사항

- ❌ any 타입 사용
- ❌ 에러 무시 (catch 후 아무것도 안 함)
- ❌ 하드코딩 (매직 넘버, 문자열 직접 사용)
- ❌ console.log 남겨두기
- ❌ 기존 기능 깨뜨리기

---

## 🚀 시작

위 내용을 이해했으면, 다음 순서로 진행:

1. 프로젝트 현황 파악 결과 보고
2. Carbon ERP 분석 결과 보고
3. 작업 계획 수립 (우선순위별)
4. 승인 후 단계별 구현 시작

준비되면 "분석 시작합니다"라고 말해줘.
```

---

**— 문서 끝 —**
