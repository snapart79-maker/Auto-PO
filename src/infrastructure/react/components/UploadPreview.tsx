/**
 * UploadPreview Component
 * 업로드 데이터 프리뷰 및 오류 하이라이팅
 */

import { useMemo, useState, useCallback } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import { cn } from '../lib/utils'
import { Button } from './ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table'
import { ValidationSummary } from './ValidationSummary'
import type { ParsedRow, ParseError } from '@infrastructure/excel/types'
import type { ValidationError } from '@application/usecases/ValidateUploadDataUseCase'

export interface UploadPreviewProps<T extends ParsedRow> {
  /** 파싱된 데이터 */
  data: T[]
  /** 파싱 오류 */
  parseErrors: ParseError[]
  /** 검증 오류 */
  validationErrors: ValidationError[]
  /** 컬럼 정의 */
  columns: ColumnDef<T>[]
  /** 재검증 트리거 */
  onRevalidate?: () => void
  /** 저장 클릭 */
  onSave?: () => void
  /** 취소 클릭 */
  onCancel?: () => void
  /** 저장 중 여부 */
  isSaving?: boolean
  /** 추가 CSS 클래스 */
  className?: string
}

export function UploadPreview<T extends ParsedRow>({
  data,
  parseErrors,
  validationErrors,
  columns,
  onRevalidate,
  onSave,
  onCancel,
  isSaving = false,
  className,
}: UploadPreviewProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([])

  // 에러 맵 생성 (row -> field -> error)
  const errorMap = useMemo(() => {
    const map = new Map<number, Map<string, string>>()

    // 파싱 오류
    for (const error of parseErrors) {
      if (!map.has(error.row)) {
        map.set(error.row, new Map())
      }
      map.get(error.row)!.set(error.column, error.message)
    }

    // 검증 오류
    for (const error of validationErrors) {
      if (!map.has(error.row)) {
        map.set(error.row, new Map())
      }
      map.get(error.row)!.set(error.field, error.message)
    }

    return map
  }, [parseErrors, validationErrors])

  // 에러가 있는 행 목록
  const errorRows = useMemo(() => new Set(errorMap.keys()), [errorMap])

  // 통계
  const totalErrors = parseErrors.length + validationErrors.length
  const validRows = data.length - errorRows.size

  // 셀에 에러가 있는지 확인
  const getCellError = useCallback(
    (rowNumber: number, field: string): string | undefined => {
      return errorMap.get(rowNumber)?.get(field)
    },
    [errorMap]
  )

  // 행에 에러가 있는지 확인
  const hasRowError = useCallback(
    (rowNumber: number): boolean => {
      return errorRows.has(rowNumber)
    },
    [errorRows]
  )

  // 컬럼에 에러 하이라이팅 적용
  const columnsWithErrorHighlight = useMemo((): ColumnDef<T>[] => {
    return columns.map((col) => ({
      ...col,
      cell: (info) => {
        const row = info.row.original
        const field = col.id ?? (col as { accessorKey?: string }).accessorKey ?? ''
        const error = getCellError(row.rowNumber, field)
        const value = info.getValue()

        return (
          <div
            className={cn('relative', error && 'group')}
            title={error}
          >
            <span
              className={cn(
                'block rounded px-1',
                error && 'bg-destructive/10 text-destructive'
              )}
            >
              {formatCellValue(value)}
            </span>
            {error && (
              <div className="absolute left-0 top-full z-10 hidden max-w-xs rounded bg-destructive px-2 py-1 text-xs text-destructive-foreground shadow-lg group-hover:block">
                {error}
              </div>
            )}
          </div>
        )
      },
    }))
  }, [columns, getCellError])

  // 테이블 인스턴스
  const table = useReactTable({
    data,
    columns: columnsWithErrorHighlight,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: 20 },
    },
  })

  const canSave = totalErrors === 0 && data.length > 0

  return (
    <div className={cn('space-y-4', className)}>
      {/* 검증 요약 */}
      <ValidationSummary
        totalRows={data.length}
        validRows={validRows}
        errorCount={totalErrors}
      />

      {/* 테이블 */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="cursor-pointer select-none"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-1">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getIsSorted() === 'asc' && ' ↑'}
                      {header.column.getIsSorted() === 'desc' && ' ↓'}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className={cn(
                    hasRowError(row.original.rowNumber) &&
                      'bg-destructive/5 hover:bg-destructive/10'
                  )}
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
          총 {data.length}개 중 {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}-
          {Math.min(
            (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
            data.length
          )}
          개 표시
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

      {/* 액션 버튼 */}
      <div className="flex items-center justify-end gap-2">
        {onRevalidate && (
          <Button variant="outline" onClick={onRevalidate}>
            재검증
          </Button>
        )}
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            취소
          </Button>
        )}
        {onSave && (
          <Button onClick={onSave} disabled={!canSave || isSaving}>
            {isSaving ? '저장 중...' : canSave ? '저장' : '오류 수정 필요'}
          </Button>
        )}
      </div>
    </div>
  )
}

/**
 * 셀 값 포맷팅
 */
function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) return '-'
  if (value instanceof Date) {
    return value.toLocaleDateString('ko-KR')
  }
  if (typeof value === 'number') {
    return value.toLocaleString('ko-KR')
  }
  return String(value)
}
