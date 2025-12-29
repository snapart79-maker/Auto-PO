/**
 * ERPTable - ERP/MES 스타일 테이블 컴포넌트
 * 진한 파란색 헤더, 테두리 있는 셀, Record 페이지네이션
 * 페이지 사이즈 선택, 컬럼 필터링 지원
 */

import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type RowSelectionState,
  type ColumnFiltersState,
} from '@tanstack/react-table'
import { useState, useCallback, useEffect } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUp,
  ArrowDown,
  X,
} from 'lucide-react'
import { cn } from '../lib/utils'
import { Input } from './ui/input'
import { Button } from './ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'

// 기본 페이지 사이즈 옵션
const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

interface ERPTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  pageSize?: number
  onRowClick?: (row: TData) => void
  enableSelection?: boolean
  onSelectionChange?: (selectedRows: TData[]) => void
  title?: string
  showSummary?: boolean
  summaryRow?: Record<string, React.ReactNode>
  // 페이지 사이즈 선택
  enablePageSizeSelect?: boolean
  pageSizeOptions?: number[]
  onPageSizeChange?: (pageSize: number) => void
  // 컬럼 필터링
  enableColumnFilters?: boolean
  columnFilters?: ColumnFiltersState
  onColumnFiltersChange?: (filters: ColumnFiltersState) => void
  // 글로벌 필터
  globalFilter?: string
  onGlobalFilterChange?: (filter: string) => void
}

export function ERPTable<TData, TValue>({
  columns,
  data,
  pageSize: initialPageSize = 20,
  onRowClick,
  enableSelection = false,
  onSelectionChange,
  title,
  showSummary = true,
  summaryRow,
  enablePageSizeSelect = false,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  onPageSizeChange,
  enableColumnFilters = false,
  columnFilters: controlledColumnFilters,
  onColumnFiltersChange,
  globalFilter: controlledGlobalFilter,
  onGlobalFilterChange,
}: ERPTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [internalPageSize, setInternalPageSize] = useState(initialPageSize)
  const [internalColumnFilters, setInternalColumnFilters] = useState<ColumnFiltersState>([])
  const [internalGlobalFilter, setInternalGlobalFilter] = useState('')

  // Controlled vs Uncontrolled 상태 관리
  const pageSize = internalPageSize
  const columnFilters = controlledColumnFilters ?? internalColumnFilters
  const globalFilter = controlledGlobalFilter ?? internalGlobalFilter

  // 페이지 사이즈 변경 핸들러
  const handlePageSizeChange = useCallback(
    (size: number) => {
      setInternalPageSize(size)
      onPageSizeChange?.(size)
    },
    [onPageSizeChange]
  )

  // 컬럼 필터 변경 핸들러
  const handleColumnFiltersChange = useCallback(
    (updater: ColumnFiltersState | ((old: ColumnFiltersState) => ColumnFiltersState)) => {
      const newFilters = typeof updater === 'function' ? updater(columnFilters) : updater
      setInternalColumnFilters(newFilters)
      onColumnFiltersChange?.(newFilters)
    },
    [columnFilters, onColumnFiltersChange]
  )

  // 글로벌 필터 변경 핸들러
  const handleGlobalFilterChange = useCallback(
    (value: string) => {
      setInternalGlobalFilter(value)
      onGlobalFilterChange?.(value)
    },
    [onGlobalFilterChange]
  )

  // 필터 초기화
  const handleResetFilters = useCallback(() => {
    setInternalColumnFilters([])
    setInternalGlobalFilter('')
    onColumnFiltersChange?.([])
    onGlobalFilterChange?.('')
  }, [onColumnFiltersChange, onGlobalFilterChange])

  // 활성 필터 확인
  const hasActiveFilters = columnFilters.length > 0 || globalFilter !== ''

  // 선택 컬럼 추가
  const allColumns: ColumnDef<TData, TValue>[] = enableSelection
    ? [
        {
          id: 'select',
          header: ({ table }) => (
            <input
              type="checkbox"
              checked={table.getIsAllPageRowsSelected()}
              onChange={(e) => table.toggleAllPageRowsSelected(e.target.checked)}
              className="w-4 h-4"
            />
          ),
          cell: ({ row }) => (
            <input
              type="checkbox"
              checked={row.getIsSelected()}
              onChange={(e) => row.toggleSelected(e.target.checked)}
              onClick={(e) => e.stopPropagation()}
              className="w-4 h-4"
            />
          ),
          size: 40,
        } as ColumnDef<TData, TValue>,
        ...columns,
      ]
    : columns

  const table = useReactTable({
    data,
    columns: allColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: handleColumnFiltersChange,
    onGlobalFilterChange: handleGlobalFilterChange,
    onRowSelectionChange: (updater) => {
      const newSelection = typeof updater === 'function' ? updater(rowSelection) : updater
      setRowSelection(newSelection)
      if (onSelectionChange) {
        const selectedRows = Object.keys(newSelection)
          .filter((key) => newSelection[key])
          .map((key) => data[parseInt(key)])
          .filter((row): row is TData => row !== undefined)
        onSelectionChange(selectedRows)
      }
    },
    state: {
      sorting,
      rowSelection,
      columnFilters,
      globalFilter,
      pagination: {
        pageIndex: 0,
        pageSize,
      },
    },
    enableRowSelection: enableSelection,
    enableColumnFilters,
  })

  // 페이지 사이즈 변경 시 테이블 업데이트
  useEffect(() => {
    table.setPageSize(pageSize)
  }, [pageSize, table])

  const { pageIndex } = table.getState().pagination
  const totalRows = table.getFilteredRowModel().rows.length
  const startRow = totalRows > 0 ? pageIndex * pageSize + 1 : 0

  return (
    <div className="flex flex-col h-full">
      {/* 테이블 제목 (탭 스타일) */}
      {title && (
        <div className="flex">
          <div className="bg-[#4a6fa5] text-white text-xs font-medium px-4 py-1.5 rounded-t border border-[#3d5a80] border-b-0">
            {title}
          </div>
        </div>
      )}

      {/* 테이블 컨테이너 */}
      <div className="flex-1 border border-[#999] bg-white overflow-auto">
        <table className="w-full border-collapse text-xs">
          {/* 헤더 */}
          <thead className="sticky top-0 z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const isSorted = header.column.getIsSorted()
                  return (
                    <th
                      key={header.id}
                      className={cn(
                        'bg-gradient-to-b from-[#5a7fb5] to-[#4a6fa5] text-white',
                        'border border-[#3d5a80] px-2 py-1.5 text-center font-medium',
                        'whitespace-nowrap',
                        header.column.getCanSort() && 'cursor-pointer select-none hover:from-[#6a8fc5] hover:to-[#5a7fb5]'
                      )}
                      style={{ width: header.column.getSize() }}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div className="flex items-center justify-center gap-1">
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                        {isSorted === 'asc' && <ArrowUp className="h-3 w-3" />}
                        {isSorted === 'desc' && <ArrowDown className="h-3 w-3" />}
                      </div>
                    </th>
                  )
                })}
              </tr>
            ))}
            {/* 필터 행 */}
            {enableColumnFilters && (
              <tr>
                {table.getHeaderGroups()[0]?.headers.map((header) => {
                  const column = header.column
                  const canFilter = column.getCanFilter()
                  const columnId = column.id
                  const headerText = typeof column.columnDef.header === 'string'
                    ? column.columnDef.header
                    : columnId

                  return (
                    <th
                      key={header.id}
                      className="bg-[#f0f4f8] border border-[#ddd] px-1 py-1"
                    >
                      {canFilter && columnId !== 'select' ? (
                        <Input
                          type="text"
                          placeholder={`${headerText} 검색...`}
                          value={(column.getFilterValue() ?? '') as string}
                          onChange={(e) => column.setFilterValue(e.target.value)}
                          className="h-6 text-xs w-full"
                        />
                      ) : null}
                    </th>
                  )
                })}
              </tr>
            )}
          </thead>

          {/* 바디 */}
          <tbody>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row, index) => (
                <tr
                  key={row.id}
                  className={cn(
                    index % 2 === 0 ? 'bg-white' : 'bg-[#f8f9fa]',
                    'hover:bg-[#e8f0ff]',
                    row.getIsSelected() && 'bg-[#cde4ff]',
                    onRowClick && 'cursor-pointer'
                  )}
                  onClick={() => onRowClick?.(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="border border-[#ddd] px-2 py-1 text-center"
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={allColumns.length}
                  className="border border-[#ddd] px-4 py-8 text-center text-gray-500"
                >
                  데이터가 없습니다.
                </td>
              </tr>
            )}
          </tbody>

          {/* 합계 행 */}
          {showSummary && summaryRow && (
            <tfoot>
              <tr className="bg-[#f5f5dc] font-medium">
                {allColumns.map((col, index) => (
                  <td
                    key={index}
                    className="border border-[#ddd] px-2 py-1 text-center"
                  >
                    {index === 0 ? '합계' : summaryRow[col.id as string] ?? ''}
                  </td>
                ))}
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* 페이지네이션 바 */}
      <div className="h-8 bg-[#e8e8e8] border border-t-0 border-[#999] flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          {/* 페이지 사이즈 선택 */}
          {enablePageSizeSelect && (
            <div className="flex items-center gap-1">
              <Select
                value={String(pageSize)}
                onValueChange={(value) => handlePageSizeChange(Number(value))}
              >
                <SelectTrigger className="h-6 w-16 text-xs" aria-label="페이지 사이즈">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {pageSizeOptions.map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-xs text-gray-600">개씩</span>
            </div>
          )}

          {/* 필터 초기화 버튼 */}
          {enableColumnFilters && hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="h-6 px-2 text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              필터 초기화
            </Button>
          )}

          {/* 페이지네이션 컨트롤 */}
          <div className="flex items-center gap-1">
            <button
              className="p-0.5 hover:bg-[#d0d0d0] rounded disabled:opacity-40"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronsLeft className="h-4 w-4" />
            </button>
            <button
              className="p-0.5 hover:bg-[#d0d0d0] rounded disabled:opacity-40"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs px-2">
              Record {startRow} of {totalRows}
            </span>
            <button
              className="p-0.5 hover:bg-[#d0d0d0] rounded disabled:opacity-40"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              className="p-0.5 hover:bg-[#d0d0d0] rounded disabled:opacity-40"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <ChevronsRight className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="text-xs text-gray-600">
          {table.getState().pagination.pageIndex + 1} / {Math.max(1, table.getPageCount())} 페이지
        </div>
      </div>
    </div>
  )
}
