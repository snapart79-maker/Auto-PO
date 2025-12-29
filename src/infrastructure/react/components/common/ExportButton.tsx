/**
 * ExportButton - Excel/CSV Export 컴포넌트
 * 테이블 데이터를 다양한 포맷으로 내보내기
 */

import * as React from 'react'
import { Download, Loader2, ChevronDown, Check } from 'lucide-react'
import * as XLSX from 'xlsx'
import { cn } from '../../lib/utils'
import { Button } from '../ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'

// Export 포맷
export type ExportFormat = 'xlsx' | 'csv'

// Export 컬럼 정의
export interface ExportColumn {
  key: string
  header: string
  format?: (value: unknown) => string | number
}

// Export 옵션
export interface ExportOptions {
  data: unknown[]
  columns: ExportColumn[]
  filename: string
  format?: ExportFormat
}

// ExportButton Props
export interface ExportButtonProps {
  data: unknown[]
  columns: ExportColumn[]
  filename: string
  format?: ExportFormat
  label?: string
  appendDate?: boolean
  showFormatSelect?: boolean
  showColumnSelect?: boolean
  disabled?: boolean
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
  onExport?: (options: ExportOptions) => void | Promise<void>
}

// 날짜 포맷
function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Excel Export 함수
async function exportToFile(options: ExportOptions): Promise<void> {
  const { data, columns, filename, format = 'xlsx' } = options

  // 데이터를 Excel 형식으로 변환
  const exportData = data.map((row) => {
    const exportRow: Record<string, string | number> = {}
    columns.forEach((col) => {
      const value = (row as Record<string, unknown>)[col.key]
      exportRow[col.header] = col.format
        ? col.format(value)
        : value !== undefined && value !== null
          ? String(value)
          : ''
    })
    return exportRow
  })

  // 워크북 생성
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(exportData)

  // 컬럼 너비 자동 조정
  const colWidths = columns.map((col) => {
    const maxLength = Math.max(
      col.header.length,
      ...exportData.map((row) => String(row[col.header] || '').length)
    )
    return { wch: Math.min(maxLength + 2, 50) }
  })
  ws['!cols'] = colWidths

  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')

  // 파일 확장자
  const extension = format === 'csv' ? 'csv' : 'xlsx'

  // 파일 다운로드
  XLSX.writeFile(wb, `${filename}.${extension}`, {
    bookType: format === 'csv' ? 'csv' : 'xlsx',
  })
}

export function ExportButton({
  data,
  columns,
  filename,
  format: defaultFormat = 'xlsx',
  label = '내보내기',
  appendDate = false,
  showFormatSelect = false,
  showColumnSelect = false,
  disabled = false,
  variant = 'outline',
  size = 'sm',
  className,
  onExport,
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = React.useState(false)
  const [selectedFormat, setSelectedFormat] = React.useState<ExportFormat>(defaultFormat)
  const [selectedColumns, setSelectedColumns] = React.useState<Set<string>>(
    new Set(columns.map((c) => c.key))
  )

  const hasData = data.length > 0
  const isDisabled = disabled || !hasData || isExporting

  // 파일명 생성
  const getFilename = React.useCallback(() => {
    if (appendDate) {
      return `${filename}_${formatDate(new Date())}`
    }
    return filename
  }, [filename, appendDate])

  // 선택된 컬럼만 필터링
  const getSelectedColumns = React.useCallback(() => {
    return columns.filter((col) => selectedColumns.has(col.key))
  }, [columns, selectedColumns])

  // Export 실행
  const handleExport = React.useCallback(async () => {
    if (isDisabled) return

    setIsExporting(true)

    try {
      const exportOptions: ExportOptions = {
        data,
        columns: getSelectedColumns(),
        filename: getFilename(),
        format: selectedFormat,
      }

      if (onExport) {
        await onExport(exportOptions)
      } else {
        await exportToFile(exportOptions)
      }
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setIsExporting(false)
    }
  }, [data, getSelectedColumns, getFilename, selectedFormat, onExport, isDisabled])

  // 컬럼 토글
  const toggleColumn = React.useCallback((columnKey: string) => {
    setSelectedColumns((prev) => {
      const next = new Set(prev)
      if (next.has(columnKey)) {
        next.delete(columnKey)
      } else {
        next.add(columnKey)
      }
      return next
    })
  }, [])

  // 심플 버튼 (포맷/컬럼 선택 없음)
  if (!showFormatSelect && !showColumnSelect) {
    return (
      <Button
        variant={variant}
        size={size}
        onClick={handleExport}
        disabled={isDisabled}
        className={className}
        aria-busy={isExporting}
      >
        {isExporting ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Download className="mr-2 h-4 w-4" />
        )}
        {label}
      </Button>
    )
  }

  // 드롭다운 메뉴 포함 버튼
  return (
    <div className={cn('flex items-center gap-1', className)}>
      <Button
        variant={variant}
        size={size}
        onClick={handleExport}
        disabled={isDisabled}
        className="rounded-r-none"
        aria-busy={isExporting}
      >
        {isExporting ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Download className="mr-2 h-4 w-4" />
        )}
        {label}
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant={variant}
            size={size}
            disabled={isDisabled}
            className="rounded-l-none border-l-0 px-2"
            aria-label="Export 옵션"
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {showFormatSelect && (
            <>
              <DropdownMenuLabel aria-label="포맷">포맷</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => setSelectedFormat('xlsx')}
              >
                <Check
                  className={cn(
                    'mr-2 h-4 w-4',
                    selectedFormat === 'xlsx' ? 'opacity-100' : 'opacity-0'
                  )}
                />
                xlsx (Excel)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSelectedFormat('csv')}
              >
                <Check
                  className={cn(
                    'mr-2 h-4 w-4',
                    selectedFormat === 'csv' ? 'opacity-100' : 'opacity-0'
                  )}
                />
                csv
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}

          {showColumnSelect && (
            <>
              <DropdownMenuLabel aria-label="컬럼 선택">컬럼 선택</DropdownMenuLabel>
              {columns.map((col) => (
                <DropdownMenuCheckboxItem
                  key={col.key}
                  checked={selectedColumns.has(col.key)}
                  onCheckedChange={() => toggleColumn(col.key)}
                >
                  {col.header}
                </DropdownMenuCheckboxItem>
              ))}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

// useExport Hook
export interface UseExportOptions {
  onSuccess?: () => void
  onError?: (error: Error) => void
}

export interface UseExportReturn {
  exportToExcel: (options: ExportOptions) => Promise<void>
  isExporting: boolean
}

export function useExport(hookOptions?: UseExportOptions): UseExportReturn {
  const [isExporting, setIsExporting] = React.useState(false)

  const exportToExcel = React.useCallback(
    async (options: ExportOptions) => {
      setIsExporting(true)
      try {
        await exportToFile(options)
        hookOptions?.onSuccess?.()
      } catch (error) {
        console.error('Export failed:', error)
        hookOptions?.onError?.(error instanceof Error ? error : new Error('Export failed'))
      } finally {
        setIsExporting(false)
      }
    },
    [hookOptions]
  )

  return { exportToExcel, isExporting }
}
