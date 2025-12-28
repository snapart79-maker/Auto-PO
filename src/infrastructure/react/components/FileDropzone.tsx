/**
 * FileDropzone Component
 * 파일 드래그앤드롭 및 선택 컴포넌트
 */

import { useState, useRef, useCallback, type DragEvent, type ChangeEvent } from 'react'
import { cn } from '../lib/utils'
import { Button } from './ui/button'

export interface FileDropzoneProps {
  /** 파일 드롭/선택 시 콜백 */
  onFileDrop: (file: File) => void
  /** 에러 발생 시 콜백 */
  onError?: (message: string) => void
  /** 허용 파일 타입 */
  accept?: string[]
  /** 비활성화 여부 */
  disabled?: boolean
  /** 로딩 중 여부 */
  loading?: boolean
  /** 추가 CSS 클래스 */
  className?: string
}

const DEFAULT_ACCEPT = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
  'application/vnd.ms-excel', // xls
]

export function FileDropzone({
  onFileDrop,
  onError,
  accept = DEFAULT_ACCEPT,
  disabled = false,
  loading = false,
  className,
}: FileDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const isAcceptedFile = useCallback(
    (file: File) => {
      // MIME 타입 체크
      if (accept.includes(file.type)) return true
      // 확장자 체크 (.xlsx, .xls)
      const ext = file.name.split('.').pop()?.toLowerCase()
      if (ext === 'xlsx' || ext === 'xls') return true
      return false
    },
    [accept]
  )

  const handleDragOver = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      if (disabled || loading) return
      setIsDragOver(true)
    },
    [disabled, loading]
  )

  const handleDragEnter = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      if (disabled || loading) return
      setIsDragOver(true)
    },
    [disabled, loading]
  )

  const handleDragLeave = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragOver(false)
    },
    []
  )

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragOver(false)

      if (disabled || loading) return

      const files = e.dataTransfer?.files
      if (!files || files.length === 0) return

      const file = files[0]
      if (!file) return

      if (!isAcceptedFile(file)) {
        onError?.('Excel 파일(.xlsx, .xls)만 업로드 가능합니다.')
        return
      }

      onFileDrop(file)
    },
    [disabled, loading, isAcceptedFile, onFileDrop, onError]
  )

  const handleInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (!files || files.length === 0) return

      const file = files[0]
      if (!file) return

      if (!isAcceptedFile(file)) {
        onError?.('Excel 파일(.xlsx, .xls)만 업로드 가능합니다.')
        return
      }

      onFileDrop(file)

      // 입력 초기화 (같은 파일 다시 선택 가능하도록)
      e.target.value = ''
    },
    [isAcceptedFile, onFileDrop, onError]
  )

  const handleButtonClick = useCallback(() => {
    if (disabled || loading) return
    inputRef.current?.click()
  }, [disabled, loading])

  return (
    <div
      className={cn(
        'relative rounded-lg border-2 border-dashed p-8 transition-colors',
        isDragOver && !disabled && !loading
          ? 'border-primary bg-primary/5'
          : 'border-muted-foreground/25 hover:border-muted-foreground/50',
        (disabled || loading) && 'cursor-not-allowed opacity-50',
        className
      )}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      data-testid="file-dropzone"
    >
      {/* 숨겨진 파일 입력 */}
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls"
        onChange={handleInputChange}
        disabled={disabled || loading}
        className="hidden"
        data-testid="file-input"
      />

      {/* 드롭존 콘텐츠 */}
      <div className="flex flex-col items-center gap-4 text-center">
        {/* 아이콘 */}
        <div className="rounded-full bg-muted p-4">
          {loading ? (
            <LoadingSpinner className="h-8 w-8 animate-spin text-muted-foreground" />
          ) : (
            <UploadIcon className="h-8 w-8 text-muted-foreground" />
          )}
        </div>

        {/* 텍스트 */}
        <div className="space-y-1">
          <p className="text-sm font-medium">
            {loading ? '파일 처리 중...' : 'Excel 파일을 여기에 드래그하세요'}
          </p>
          <p className="text-xs text-muted-foreground">
            또는 버튼을 클릭하여 파일을 선택하세요
          </p>
        </div>

        {/* 파일 선택 버튼 */}
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={handleButtonClick}
          disabled={disabled || loading}
        >
          {loading ? '처리 중...' : '파일 선택'}
        </Button>

        {/* 허용 파일 안내 */}
        <p className="text-xs text-muted-foreground">
          지원 형식: .xlsx, .xls
        </p>
      </div>
    </div>
  )
}

/**
 * 업로드 아이콘
 */
function UploadIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  )
}

/**
 * 로딩 스피너
 */
function LoadingSpinner({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  )
}
