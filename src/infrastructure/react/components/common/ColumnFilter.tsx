/**
 * ColumnFilter - 컬럼별 필터링 컴포넌트
 * TanStack Table 컬럼 필터링을 위한 UI 컴포넌트
 */

import * as React from 'react'
import { X } from 'lucide-react'
import { cn } from '../../lib/utils'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'

// 필터 타입
export type FilterType = 'text' | 'number' | 'select' | 'date'

// 범위 값 타입
export interface RangeValue {
  min?: number
  max?: number
}

// 날짜 범위 타입
export interface DateRangeValue {
  start?: string
  end?: string
}

// Select 옵션 타입
export interface SelectOption {
  value: string
  label: string
}

// 필터 값 타입
export type FilterValue = string | RangeValue | DateRangeValue

// ColumnFilter Props
export interface ColumnFilterProps {
  columnId: string
  columnLabel: string
  type?: FilterType
  value?: FilterValue
  onFilterChange: (columnId: string, value: FilterValue | '') => void
  options?: SelectOption[]
  debounceMs?: number
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
  placeholder?: string
}

export function ColumnFilter({
  columnId,
  columnLabel,
  type = 'text',
  value,
  onFilterChange,
  options = [],
  debounceMs = 300,
  disabled = false,
  size = 'sm',
  className,
  placeholder,
}: ColumnFilterProps) {
  const [internalValue, setInternalValue] = React.useState<FilterValue>(value ?? '')
  const debounceRef = React.useRef<ReturnType<typeof setTimeout>>()

  // 외부 value 변경 시 내부 상태 동기화
  React.useEffect(() => {
    setInternalValue(value ?? '')
  }, [value])

  // cleanup
  React.useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])

  // 디바운스된 필터 변경
  const handleDebouncedChange = React.useCallback(
    (newValue: FilterValue) => {
      setInternalValue(newValue)

      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }

      debounceRef.current = setTimeout(() => {
        onFilterChange(columnId, newValue)
      }, debounceMs)
    },
    [columnId, onFilterChange, debounceMs]
  )

  // 즉시 필터 변경 (Select 등)
  const handleImmediateChange = React.useCallback(
    (newValue: FilterValue) => {
      setInternalValue(newValue)
      onFilterChange(columnId, newValue)
    },
    [columnId, onFilterChange]
  )

  // 필터 초기화
  const handleClear = React.useCallback(() => {
    setInternalValue('')
    onFilterChange(columnId, '')
  }, [columnId, onFilterChange])

  // 크기 클래스
  const sizeClasses = {
    sm: 'h-7 text-xs',
    md: 'h-8 text-sm',
    lg: 'h-10 text-base',
  }

  const inputSizeClass = sizeClasses[size]

  // 텍스트 필터
  if (type === 'text') {
    const textValue = typeof internalValue === 'string' ? internalValue : ''
    return (
      <div className={cn('relative flex items-center', className)}>
        <Input
          type="text"
          placeholder={placeholder ?? `${columnLabel} 검색...`}
          value={textValue}
          onChange={(e) => handleDebouncedChange(e.target.value)}
          disabled={disabled}
          className={cn(inputSizeClass, 'pr-8')}
        />
        {textValue && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            disabled={disabled}
            className="absolute right-0 h-full px-2 hover:bg-transparent"
            aria-label="초기화"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    )
  }

  // 숫자 범위 필터
  if (type === 'number') {
    const rangeValue = (internalValue as RangeValue) || {}
    return (
      <div className={cn('flex items-center gap-1', className)}>
        <Input
          type="number"
          placeholder="최소"
          value={rangeValue.min ?? ''}
          onChange={(e) => {
            const newValue = e.target.value ? Number(e.target.value) : undefined
            handleDebouncedChange({ ...rangeValue, min: newValue })
          }}
          disabled={disabled}
          className={cn(inputSizeClass, 'w-20')}
        />
        <span className="text-muted-foreground">~</span>
        <Input
          type="number"
          placeholder="최대"
          value={rangeValue.max ?? ''}
          onChange={(e) => {
            const newValue = e.target.value ? Number(e.target.value) : undefined
            handleDebouncedChange({ ...rangeValue, max: newValue })
          }}
          disabled={disabled}
          className={cn(inputSizeClass, 'w-20')}
        />
        {(rangeValue.min !== undefined || rangeValue.max !== undefined) && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            disabled={disabled}
            className="h-7 px-2"
            aria-label="초기화"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    )
  }

  // Select 필터
  if (type === 'select') {
    const selectValue = typeof internalValue === 'string' ? internalValue : ''
    return (
      <div className={cn('flex items-center gap-1', className)}>
        <Select
          value={selectValue}
          onValueChange={(val) => handleImmediateChange(val)}
          disabled={disabled}
        >
          <SelectTrigger className={cn(inputSizeClass, 'w-[120px]')}>
            <SelectValue placeholder={placeholder ?? columnLabel}>
              {selectValue
                ? options.find((o) => o.value === selectValue)?.label
                : placeholder ?? columnLabel}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectValue && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            disabled={disabled}
            className="h-7 px-2"
            aria-label="초기화"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    )
  }

  // 날짜 범위 필터
  if (type === 'date') {
    const dateValue = (internalValue as DateRangeValue) || {}
    return (
      <div className={cn('flex items-center gap-1', className)}>
        <div className="flex flex-col gap-1">
          <Input
            type="date"
            aria-label="시작일"
            value={dateValue.start ?? ''}
            onChange={(e) => {
              handleDebouncedChange({ ...dateValue, start: e.target.value || undefined })
            }}
            disabled={disabled}
            className={cn(inputSizeClass, 'w-32')}
          />
        </div>
        <span className="text-muted-foreground">~</span>
        <div className="flex flex-col gap-1">
          <Input
            type="date"
            aria-label="종료일"
            value={dateValue.end ?? ''}
            onChange={(e) => {
              handleDebouncedChange({ ...dateValue, end: e.target.value || undefined })
            }}
            disabled={disabled}
            className={cn(inputSizeClass, 'w-32')}
          />
        </div>
        {(dateValue.start || dateValue.end) && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            disabled={disabled}
            className="h-7 px-2"
            aria-label="초기화"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    )
  }

  return null
}

// ColumnFilterGroup - 여러 컬럼 필터를 그룹으로 관리
export interface ColumnFilterConfig {
  id: string
  label: string
  type: FilterType
  options?: SelectOption[]
  placeholder?: string
}

export interface ColumnFilterGroupProps {
  columns: ColumnFilterConfig[]
  values?: Record<string, FilterValue>
  onFiltersChange: (filters: Record<string, FilterValue>) => void
  disabled?: boolean
  className?: string
}

export function ColumnFilterGroup({
  columns,
  values = {},
  onFiltersChange,
  disabled = false,
  className,
}: ColumnFilterGroupProps) {
  const handleFilterChange = React.useCallback(
    (columnId: string, value: FilterValue | '') => {
      const newFilters = { ...values }
      if (value === '' || value === undefined) {
        delete newFilters[columnId]
      } else {
        newFilters[columnId] = value
      }
      onFiltersChange(newFilters)
    },
    [values, onFiltersChange]
  )

  const handleResetAll = React.useCallback(() => {
    onFiltersChange({})
  }, [onFiltersChange])

  const hasActiveFilters = Object.keys(values).length > 0

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {columns.map((column) => (
        <ColumnFilter
          key={column.id}
          columnId={column.id}
          columnLabel={column.label}
          type={column.type}
          options={column.options}
          placeholder={column.placeholder}
          value={values[column.id]}
          onFilterChange={handleFilterChange}
          disabled={disabled}
        />
      ))}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleResetAll}
          disabled={disabled}
          className="h-7"
        >
          전체 초기화
        </Button>
      )}
    </div>
  )
}
