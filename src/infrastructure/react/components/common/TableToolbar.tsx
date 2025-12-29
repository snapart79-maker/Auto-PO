/**
 * TableToolbar - 테이블 도구 모음 컴포넌트
 * 검색, 필터, 액션 버튼을 포함하는 DataTable용 도구 모음
 */
import * as React from 'react'
import { Search, X, Plus, Download, Upload, Trash2, Loader2 } from 'lucide-react'
import { cn } from '../../lib/utils'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'

// Filter 타입 정의
interface FilterOption {
  value: string
  label: string
}

interface Filter {
  key: string
  label: string
  options: FilterOption[]
}

// Custom Action 타입 정의
interface CustomAction {
  key: string
  label: string
  onClick: () => void
  icon?: React.ReactNode
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  disabled?: boolean
}

// TableToolbar Props
interface TableToolbarProps {
  // 검색
  onSearch?: (value: string) => void
  searchPlaceholder?: string
  searchValue?: string
  debounceMs?: number
  isSearching?: boolean

  // 필터
  filters?: Filter[]
  filterValues?: Record<string, string>
  onFilterChange?: (key: string | null, value: string | null) => void

  // 액션 버튼
  onAdd?: () => void
  addLabel?: string
  onExport?: () => void
  onBulkUpload?: () => void
  onDelete?: () => void

  // 선택 상태
  selectedCount?: number
  totalCount?: number

  // 커스텀 액션
  customActions?: CustomAction[]

  // 상태
  isLoading?: boolean

  // 스타일
  className?: string
}

export function TableToolbar({
  onSearch,
  searchPlaceholder = '검색...',
  searchValue: controlledSearchValue,
  debounceMs = 300,
  isSearching = false,
  filters,
  filterValues = {},
  onFilterChange,
  onAdd,
  addLabel = '추가',
  onExport,
  onBulkUpload,
  onDelete,
  selectedCount = 0,
  totalCount,
  customActions,
  isLoading = false,
  className,
}: TableToolbarProps) {
  const [internalSearchValue, setInternalSearchValue] = React.useState('')
  const searchValue = controlledSearchValue ?? internalSearchValue
  const debounceRef = React.useRef<ReturnType<typeof setTimeout>>()

  // 검색어 변경 핸들러 (디바운스 적용)
  const handleSearchChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value
      setInternalSearchValue(value)

      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }

      debounceRef.current = setTimeout(() => {
        onSearch?.(value)
      }, debounceMs)
    },
    [onSearch, debounceMs]
  )

  // 검색 초기화
  const handleClearSearch = React.useCallback(() => {
    setInternalSearchValue('')
    onSearch?.('')
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
  }, [onSearch])

  // 필터 초기화
  const handleResetFilters = React.useCallback(() => {
    onFilterChange?.(null, null)
  }, [onFilterChange])

  // 선택된 필터가 있는지 확인
  const hasActiveFilters = Object.values(filterValues).some((v) => v)

  // cleanup
  React.useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])

  return (
    <div
      role="toolbar"
      className={cn(
        'flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between',
        className
      )}
    >
      {/* 왼쪽: 검색 + 필터 */}
      <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
        {/* 검색 */}
        {onSearch && (
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              role="searchbox"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={handleSearchChange}
              disabled={isLoading}
              className="pl-8 pr-8"
            />
            {isSearching && (
              <Loader2
                className="absolute right-8 top-2.5 h-4 w-4 animate-spin text-muted-foreground"
                data-testid="search-loading"
              />
            )}
            {searchValue && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                aria-label="검색 초기화"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

        {/* 필터 */}
        {filters && filters.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {filters.map((filter) => (
              <Select
                key={filter.key}
                value={filterValues[filter.key] || ''}
                onValueChange={(value) => onFilterChange?.(filter.key, value)}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder={filter.label}>
                    {filterValues[filter.key]
                      ? `${filter.label}: ${filter.options.find((o) => o.value === filterValues[filter.key])?.label}`
                      : filter.label}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {filter.options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ))}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="h-9"
              >
                필터 초기화
              </Button>
            )}
          </div>
        )}

        {/* 선택된 항목 수 / 전체 항목 수 */}
        <div className="text-sm text-muted-foreground">
          {selectedCount > 0 && (
            <span className="font-medium text-foreground">{selectedCount}개 선택 · </span>
          )}
          {totalCount !== undefined && <span>총 {totalCount}개</span>}
        </div>
      </div>

      {/* 오른쪽: 액션 버튼 */}
      <div
        className="flex items-center gap-2 ml-auto"
        data-testid="toolbar-actions"
      >
        {/* 삭제 버튼 (선택된 항목이 있을 때만) */}
        {onDelete && selectedCount > 0 && (
          <Button variant="destructive" size="sm" onClick={onDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            삭제 ({selectedCount})
          </Button>
        )}

        {/* 커스텀 액션 */}
        {customActions?.map((action) => (
          <Button
            key={action.key}
            variant={action.variant || 'outline'}
            size="sm"
            onClick={action.onClick}
            disabled={action.disabled}
          >
            {action.icon}
            {action.label}
          </Button>
        ))}

        {/* 일괄등록 버튼 */}
        {onBulkUpload && (
          <Button variant="outline" size="sm" onClick={onBulkUpload}>
            <Upload className="mr-2 h-4 w-4" />
            일괄등록
          </Button>
        )}

        {/* 내보내기 버튼 */}
        {onExport && (
          <Button variant="outline" size="sm" onClick={onExport}>
            <Download className="mr-2 h-4 w-4" />
            내보내기
          </Button>
        )}

        {/* 추가 버튼 */}
        {onAdd && (
          <Button size="sm" onClick={onAdd}>
            <Plus className="mr-2 h-4 w-4" />
            {addLabel}
          </Button>
        )}
      </div>
    </div>
  )
}
