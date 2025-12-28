/**
 * EditableCell Component
 * 인라인 편집 가능한 테이블 셀
 */

import { useState, useCallback, useRef, useEffect, type KeyboardEvent } from 'react'
import { cn } from '../lib/utils'
import { Input } from './ui/input'

export type CellType = 'text' | 'number' | 'date'

export interface EditableCellProps {
  /** 현재 값 */
  value: unknown
  /** 셀 타입 */
  type?: CellType
  /** 값 변경 시 콜백 */
  onChange: (value: unknown) => void
  /** 편집 완료 시 콜백 */
  onBlur?: () => void
  /** 에러 메시지 */
  error?: string
  /** 읽기 전용 */
  readOnly?: boolean
  /** 추가 CSS 클래스 */
  className?: string
}

export function EditableCell({
  value,
  type = 'text',
  onChange,
  onBlur,
  error,
  readOnly = false,
  className,
}: EditableCellProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // 편집 모드 시작
  const startEdit = useCallback(() => {
    if (readOnly) return
    setEditValue(formatValueForEdit(value, type))
    setIsEditing(true)
  }, [readOnly, value, type])

  // 편집 모드 종료 (저장)
  const commitEdit = useCallback(() => {
    const parsed = parseValue(editValue, type)
    onChange(parsed)
    setIsEditing(false)
    onBlur?.()
  }, [editValue, type, onChange, onBlur])

  // 편집 취소
  const cancelEdit = useCallback(() => {
    setIsEditing(false)
  }, [])

  // 키보드 이벤트 처리
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        commitEdit()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        cancelEdit()
      }
    },
    [commitEdit, cancelEdit]
  )

  // 편집 모드 시 포커스
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  // 편집 모드
  if (isEditing) {
    return (
      <Input
        ref={inputRef}
        type={type === 'number' ? 'number' : type === 'date' ? 'date' : 'text'}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={commitEdit}
        onKeyDown={handleKeyDown}
        className={cn(
          'h-8 min-w-[80px] px-2 py-1 text-sm',
          error && 'border-destructive focus-visible:ring-destructive',
          className
        )}
      />
    )
  }

  // 읽기 모드
  return (
    <div
      onClick={startEdit}
      className={cn(
        'min-h-[32px] cursor-pointer rounded px-2 py-1',
        !readOnly && 'hover:bg-muted',
        error && 'bg-destructive/10 text-destructive',
        readOnly && 'cursor-default',
        className
      )}
      title={error || (readOnly ? undefined : '클릭하여 편집')}
    >
      <span className="block truncate">{formatValueForDisplay(value, type)}</span>
    </div>
  )
}

/**
 * 편집용 값 포맷팅
 */
function formatValueForEdit(value: unknown, type: CellType): string {
  if (value === null || value === undefined) return ''

  if (type === 'date' && value instanceof Date) {
    // ISO 형식 (YYYY-MM-DD)
    return value.toISOString().split('T')[0] ?? ''
  }

  return String(value)
}

/**
 * 표시용 값 포맷팅
 */
function formatValueForDisplay(value: unknown, type: CellType): string {
  if (value === null || value === undefined) return '-'

  if (type === 'date' && value instanceof Date) {
    return value.toLocaleDateString('ko-KR')
  }

  if (type === 'number' && typeof value === 'number') {
    return value.toLocaleString('ko-KR')
  }

  return String(value)
}

/**
 * 입력값 파싱
 */
function parseValue(value: string, type: CellType): unknown {
  if (!value.trim()) return null

  if (type === 'number') {
    const num = Number(value.replace(/,/g, ''))
    return isNaN(num) ? null : num
  }

  if (type === 'date') {
    const date = new Date(value)
    return isNaN(date.getTime()) ? null : date
  }

  return value.trim()
}
