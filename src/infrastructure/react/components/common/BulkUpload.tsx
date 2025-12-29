/**
 * BulkUpload - 일괄 업로드 공통 컴포넌트
 *
 * Excel 파일 업로드, 파싱, 프리뷰, 저장 기능을 제공하는 재사용 가능한 컴포넌트
 */

import { useState, useCallback, useRef } from 'react'
import * as XLSX from 'xlsx'
import { Upload, Download, FileSpreadsheet, AlertTriangle, Loader2 } from 'lucide-react'
import { ERPButton } from '../ERPGroupBox'
import { cn } from '../../lib/utils'

export interface ParseError {
  row: number
  column: string
  message: string
  value?: unknown
}

export interface BulkUploadColumn<T> {
  key: keyof T
  header: string
  align?: 'left' | 'center' | 'right'
  format?: (value: unknown) => string
}

export interface BulkUploadProps<T> {
  /** 컴포넌트 제목 */
  title: string
  /** 테이블 컬럼 정의 */
  columns: BulkUploadColumn<T>[]
  /** 파일 파싱 함수 */
  parseFile: (buffer: ArrayBuffer) => Promise<{ rows: T[]; errors: ParseError[] }>
  /** 저장 콜백 */
  onSave: (data: T[]) => Promise<void> | void
  /** 취소 콜백 */
  onCancel: () => void
  /** 템플릿 파일명 */
  templateFileName: string
  /** 템플릿 데이터 (aoa 형식) */
  templateData: unknown[][]
  /** 템플릿 시트명 (기본값: 'Sheet1') */
  templateSheetName?: string
  /** 컬럼 너비 설정 */
  columnWidths?: { wch: number }[]
  /** 클래스명 */
  className?: string
  /** 프리뷰 행 수 제한 (기본값: 20) */
  previewLimit?: number
}

export function BulkUpload<T extends Record<string, unknown>>({
  title,
  columns,
  parseFile,
  onSave,
  onCancel,
  templateFileName,
  templateData,
  templateSheetName = 'Sheet1',
  columnWidths,
  className,
  previewLimit = 20,
}: BulkUploadProps<T>) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [data, setData] = useState<T[]>([])
  const [errors, setErrors] = useState<ParseError[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [hasFile, setHasFile] = useState(false)

  // 템플릿 다운로드
  const handleDownloadTemplate = useCallback(() => {
    const ws = XLSX.utils.aoa_to_sheet(templateData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, templateSheetName)
    if (columnWidths) {
      ws['!cols'] = columnWidths
    }
    XLSX.writeFile(wb, templateFileName)
  }, [templateData, templateFileName, templateSheetName, columnWidths])

  // 파일 처리
  const handleFile = useCallback(async (file: File) => {
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      setErrors([{ row: 0, column: 'file', message: 'Excel 파일(.xlsx, .xls)만 업로드 가능합니다.' }])
      return
    }

    setIsLoading(true)
    setHasFile(true)

    try {
      const buffer = await file.arrayBuffer()
      const result = await parseFile(buffer)

      setData(result.rows)
      setErrors(result.errors)
    } catch (err) {
      setErrors([{
        row: 0,
        column: 'file',
        message: err instanceof Error ? err.message : '파일 처리 중 오류가 발생했습니다.',
      }])
    } finally {
      setIsLoading(false)
    }
  }, [parseFile])

  // 파일 입력 변경
  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleFile(file)
    }
    // 같은 파일 재선택 가능하도록 초기화
    event.target.value = ''
  }, [handleFile])

  // 드래그 앤 드롭
  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    setIsDragOver(false)

    const file = event.dataTransfer.files[0]
    if (file) {
      handleFile(file)
    }
  }, [handleFile])

  // 저장
  const handleSave = useCallback(async () => {
    if (errors.length > 0 || data.length === 0) return

    setIsSaving(true)
    try {
      await onSave(data)
    } finally {
      setIsSaving(false)
    }
  }, [data, errors.length, onSave])

  // 초기화
  const handleReset = useCallback(() => {
    setData([])
    setErrors([])
    setHasFile(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  // 값 포맷팅
  const formatValue = (column: BulkUploadColumn<T>, value: unknown): string => {
    if (column.format) {
      return column.format(value)
    }
    if (value === null || value === undefined) {
      return '-'
    }
    if (typeof value === 'number') {
      return new Intl.NumberFormat('ko-KR').format(value)
    }
    if (value instanceof Date) {
      return value.toLocaleDateString('ko-KR')
    }
    return String(value)
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">{title}</h3>
        <ERPButton type="button" onClick={handleDownloadTemplate}>
          <Download className="h-3 w-3 mr-1" />
          템플릿 다운로드
        </ERPButton>
      </div>

      {/* 파일 드롭존 */}
      {!hasFile && (
        <div
          className={cn(
            'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
            isDragOver ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-gray-400',
            'cursor-pointer'
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            className="hidden"
            aria-label="파일 선택"
          />
          <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-sm text-gray-600">
            엑셀 파일을 드래그하거나 클릭하여 업로드하세요
          </p>
          <p className="text-xs text-gray-400 mt-1">
            .xlsx, .xls 파일만 지원됩니다
          </p>
        </div>
      )}

      {/* 로딩 */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-sm text-gray-600">파일을 처리하는 중...</span>
        </div>
      )}

      {/* 에러 목록 */}
      {errors.length > 0 && !isLoading && (
        <div className="p-3 bg-red-50 border border-red-200 rounded">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <span className="font-medium text-red-700">오류 목록 ({errors.length}건)</span>
          </div>
          <ul className="text-sm text-red-600 space-y-1 max-h-32 overflow-auto">
            {errors.map((err, i) => (
              <li key={i}>
                {err.row > 0 ? `행 ${err.row}` : '파일'}: {err.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 데이터 프리뷰 */}
      {hasFile && !isLoading && data.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {data.length}건의 데이터가 파싱되었습니다.
              {data.length > previewLimit && ` (상위 ${previewLimit}건 표시)`}
            </p>
            <ERPButton type="button" onClick={handleReset} className="text-xs">
              다시 선택
            </ERPButton>
          </div>

          <div className="max-h-80 overflow-auto border rounded">
            <table className="w-full text-xs border-collapse">
              <thead className="bg-gray-100 sticky top-0">
                <tr>
                  <th className="p-2 border text-center w-10">#</th>
                  {columns.map((col) => (
                    <th
                      key={String(col.key)}
                      className={cn(
                        'p-2 border',
                        col.align === 'right' ? 'text-right' :
                        col.align === 'center' ? 'text-center' : 'text-left'
                      )}
                    >
                      {col.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.slice(0, previewLimit).map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="p-2 border text-center text-gray-500">{i + 1}</td>
                    {columns.map((col) => (
                      <td
                        key={String(col.key)}
                        className={cn(
                          'p-2 border',
                          col.align === 'right' ? 'text-right' :
                          col.align === 'center' ? 'text-center' : 'text-left'
                        )}
                      >
                        {formatValue(col, row[col.key])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 빈 데이터 경고 */}
      {hasFile && !isLoading && data.length === 0 && errors.length === 0 && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded text-center">
          <p className="text-sm text-yellow-700">파일에 유효한 데이터가 없습니다.</p>
          <ERPButton type="button" onClick={handleReset} className="mt-2 text-xs">
            다시 선택
          </ERPButton>
        </div>
      )}

      {/* 버튼 */}
      {hasFile && !isLoading && (
        <div className="flex items-center justify-end gap-2 pt-2">
          <ERPButton type="button" onClick={onCancel} disabled={isSaving}>
            취소
          </ERPButton>
          <ERPButton
            type="button"
            variant="primary"
            onClick={handleSave}
            disabled={isSaving || errors.length > 0 || data.length === 0}
          >
            {isSaving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            {isSaving ? '저장 중...' : '저장'}
          </ERPButton>
        </div>
      )}
    </div>
  )
}

export default BulkUpload
