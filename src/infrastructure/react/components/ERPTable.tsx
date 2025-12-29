/**
 * ERPTable - ERP/MES 스타일 테이블 컴포넌트
 * 진한 파란색 헤더, 테두리 있는 셀, Record 페이지네이션
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
} from '@tanstack/react-table'
import { useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUp,
  ArrowDown,
} from 'lucide-react'
import { cn } from '../lib/utils'

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
}

export function ERPTable<TData, TValue>({
  columns,
  data,
  pageSize = 20,
  onRowClick,
  enableSelection = false,
  onSelectionChange,
  title,
  showSummary = true,
  summaryRow,
}: ERPTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})

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
    },
    initialState: {
      pagination: {
        pageSize,
      },
    },
    enableRowSelection: enableSelection,
  })

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
      <div className="h-7 bg-[#e8e8e8] border border-t-0 border-[#999] flex items-center justify-between px-2">
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
        <div className="text-xs text-gray-600">
          {table.getState().pagination.pageIndex + 1} / {Math.max(1, table.getPageCount())} 페이지
        </div>
      </div>
    </div>
  )
}
