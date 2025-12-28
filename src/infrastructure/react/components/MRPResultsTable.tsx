/**
 * MRPResultsTable Component
 * MRP 계산 결과 테이블
 */

import { useMemo } from 'react'
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
} from '@tanstack/react-table'
import { useState } from 'react'
import { cn } from '../lib/utils'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table'
import type { MRPWithSplit } from '../hooks/useMRP'

export interface MRPResultsTableProps {
  data: MRPWithSplit[]
  /** 발주 필요 항목만 표시 */
  showOnlyNeedsOrder?: boolean
  /** 행 클릭 핸들러 */
  onRowClick?: (row: MRPWithSplit) => void
  /** 추가 CSS 클래스 */
  className?: string
}

export function MRPResultsTable({
  data,
  showOnlyNeedsOrder = false,
  onRowClick,
  className,
}: MRPResultsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  // 컬럼 정의
  const columns = useMemo<ColumnDef<MRPWithSplit>[]>(
    () => [
      {
        accessorKey: 'productCode',
        header: '품번',
        cell: ({ row }) => (
          <span className="font-mono text-sm">{row.original.productCode}</span>
        ),
      },
      {
        accessorKey: 'productName',
        header: '품명',
        cell: ({ row }) => (
          <span className="max-w-[200px] truncate" title={row.original.productName}>
            {row.original.productName}
          </span>
        ),
      },
      {
        accessorKey: 'supplierType',
        header: '공급처',
        cell: ({ row }) => {
          const type = row.original.supplierType
          const variants: Record<string, 'default' | 'secondary' | 'outline'> = {
            DOMESTIC: 'default',
            VIETNAM: 'secondary',
            BOTH: 'outline',
          }
          const labels: Record<string, string> = {
            DOMESTIC: '국내',
            VIETNAM: '베트남',
            BOTH: '이원화',
          }
          return (
            <Badge variant={variants[type] ?? 'default'}>{labels[type] ?? type}</Badge>
          )
        },
      },
      {
        accessorKey: 'currentStock',
        header: '현재고',
        cell: ({ row }) => (
          <span className="text-right font-mono">
            {row.original.currentStock.toLocaleString()}
          </span>
        ),
      },
      {
        accessorKey: 'safetyStock',
        header: '안전재고',
        cell: ({ row }) => (
          <span className="text-right font-mono">
            {row.original.safetyStock.toLocaleString()}
          </span>
        ),
      },
      {
        accessorKey: 'reorderPoint',
        header: '발주점',
        cell: ({ row }) => (
          <span className="text-right font-mono">
            {row.original.reorderPoint.toLocaleString()}
          </span>
        ),
      },
      {
        accessorKey: 'netRequirement',
        header: '순소요량',
        cell: ({ row }) => {
          const value = row.original.netRequirement
          return (
            <span
              className={cn(
                'text-right font-mono',
                value > 0 ? 'text-destructive' : 'text-muted-foreground'
              )}
            >
              {value.toLocaleString()}
            </span>
          )
        },
      },
      {
        accessorKey: 'recommendedQuantity',
        header: '권장수량',
        cell: ({ row }) => {
          const value = row.original.recommendedQuantity
          const split = row.original.splitResult
          return (
            <div className="text-right">
              <span className="font-mono font-semibold">{value.toLocaleString()}</span>
              {split && (
                <div className="text-xs text-muted-foreground">
                  국내: {split.domesticQuantity.toLocaleString()} / 베트남:{' '}
                  {split.vietnamQuantity.toLocaleString()}
                </div>
              )}
            </div>
          )
        },
      },
      {
        accessorKey: 'needsOrder',
        header: '발주필요',
        cell: ({ row }) => {
          const needs = row.original.needsOrder
          return (
            <Badge variant={needs ? 'destructive' : 'secondary'}>
              {needs ? '필요' : '불필요'}
            </Badge>
          )
        },
      },
    ],
    []
  )

  // 필터링된 데이터
  const filteredData = useMemo(() => {
    if (showOnlyNeedsOrder) {
      return data.filter((d) => d.needsOrder && d.recommendedQuantity > 0)
    }
    return data
  }, [data, showOnlyNeedsOrder])

  // 테이블 인스턴스
  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting, columnFilters },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: 20 },
    },
  })

  return (
    <div className={cn('space-y-4', className)}>
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
                    row.original.needsOrder &&
                      'bg-destructive/5 hover:bg-destructive/10',
                    onRowClick && 'cursor-pointer'
                  )}
                  onClick={() => onRowClick?.(row.original)}
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
          총 {filteredData.length}개 중{' '}
          {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}-
          {Math.min(
            (table.getState().pagination.pageIndex + 1) *
              table.getState().pagination.pageSize,
            filteredData.length
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
    </div>
  )
}
