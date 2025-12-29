/**
 * ERPSummaryPanel - ERP/MES 스타일 사이드 요약 패널
 * 거래처별 합계 등 요약 테이블
 */

import { cn } from '../lib/utils'
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react'

interface Column {
  key: string
  header: string
  align?: 'left' | 'center' | 'right'
  width?: string
}

interface ERPSummaryPanelProps {
  title: string
  columns: Column[]
  data: Record<string, React.ReactNode>[]
  totalRow?: Record<string, React.ReactNode>
  className?: string
}

export function ERPSummaryPanel({
  title,
  columns,
  data,
  totalRow,
  className,
}: ERPSummaryPanelProps) {
  const totalRecords = data.length

  return (
    <div className={cn('flex flex-col', className)}>
      {/* 제목 */}
      <div className="bg-[#4a6fa5] text-white text-xs font-medium px-3 py-1.5 rounded-t border border-[#3d5a80] border-b-0">
        {title}
      </div>

      {/* 테이블 */}
      <div className="border border-[#999] bg-white flex-1 overflow-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    'bg-gradient-to-b from-[#5a7fb5] to-[#4a6fa5] text-white',
                    'border border-[#3d5a80] px-2 py-1.5 text-center font-medium',
                    'whitespace-nowrap'
                  )}
                  style={{ width: col.width }}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length > 0 ? (
              data.map((row, index) => (
                <tr
                  key={index}
                  className={cn(
                    index % 2 === 0 ? 'bg-white' : 'bg-[#f8f9fa]',
                    'hover:bg-[#e8f0ff]'
                  )}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        'border border-[#ddd] px-2 py-1',
                        col.align === 'right' && 'text-right',
                        col.align === 'left' && 'text-left',
                        (!col.align || col.align === 'center') && 'text-center'
                      )}
                    >
                      {row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="border border-[#ddd] px-4 py-4 text-center text-gray-500"
                >
                  데이터가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
          {/* 합계 행 */}
          {totalRow && (
            <tfoot>
              <tr className="bg-[#f5f5dc] font-medium">
                {columns.map((col, index) => (
                  <td
                    key={col.key}
                    className={cn(
                      'border border-[#ddd] px-2 py-1',
                      col.align === 'right' && 'text-right',
                      col.align === 'left' && 'text-left',
                      (!col.align || col.align === 'center') && 'text-center'
                    )}
                  >
                    {index === 0 ? '합계' : totalRow[col.key] ?? ''}
                  </td>
                ))}
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* 페이지네이션 바 */}
      <div className="h-6 bg-[#e8e8e8] border border-t-0 border-[#999] flex items-center justify-center px-2">
        <div className="flex items-center gap-1">
          <button className="p-0.5 hover:bg-[#d0d0d0] rounded disabled:opacity-40" disabled>
            <ChevronsLeft className="h-3 w-3" />
          </button>
          <button className="p-0.5 hover:bg-[#d0d0d0] rounded disabled:opacity-40" disabled>
            <ChevronLeft className="h-3 w-3" />
          </button>
          <span className="text-[10px] px-1">
            Record {totalRecords > 0 ? 1 : 0} of {totalRecords}
          </span>
          <button className="p-0.5 hover:bg-[#d0d0d0] rounded disabled:opacity-40" disabled>
            <ChevronRight className="h-3 w-3" />
          </button>
          <button className="p-0.5 hover:bg-[#d0d0d0] rounded disabled:opacity-40" disabled>
            <ChevronsRight className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * ERPFunctionPanel - 기능 버튼 패널
 */
interface FunctionButton {
  label: string
  icon?: React.ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'danger'
  disabled?: boolean
}

interface ERPFunctionPanelProps {
  title: string
  buttons: FunctionButton[]
  className?: string
}

export function ERPFunctionPanel({ title, buttons, className }: ERPFunctionPanelProps) {
  const variantClasses = {
    primary: 'bg-gradient-to-b from-[#5a7fb5] to-[#4a6fa5] text-white border-[#3d5a80] hover:from-[#6a8fc5] hover:to-[#5a7fb5]',
    secondary: 'bg-gradient-to-b from-[#f5f5f5] to-[#e8e8e8] text-gray-700 border-[#999] hover:from-[#fff] hover:to-[#f0f0f0]',
    danger: 'bg-gradient-to-b from-[#dc6c6c] to-[#c55a5a] text-white border-[#a04040] hover:from-[#ec7c7c] hover:to-[#d56a6a]',
  }

  return (
    <fieldset
      className={cn(
        'border border-[#7a9cc6] rounded bg-[#f5f8fc] p-2',
        className
      )}
    >
      <legend className="text-xs font-medium text-[#4a6fa5] px-1">
        {title}
      </legend>
      <div className="flex flex-col gap-1">
        {buttons.map((btn, index) => (
          <button
            key={index}
            onClick={btn.onClick}
            disabled={btn.disabled}
            className={cn(
              'flex items-center justify-center gap-1 px-3 py-1.5 text-xs border rounded font-medium',
              'focus:outline-none focus:ring-2 focus:ring-[#4a6fa5] focus:ring-offset-1',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              variantClasses[btn.variant || 'secondary']
            )}
          >
            {btn.icon}
            {btn.label}
          </button>
        ))}
      </div>
    </fieldset>
  )
}
