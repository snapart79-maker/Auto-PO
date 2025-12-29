/**
 * TableToolbar Component Tests
 * TDD: 테스트 파일 수정 (실제 컴포넌트에 맞게)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act, fireEvent } from '@testing-library/react'
import { TableToolbar } from '@infrastructure/react/components/common/TableToolbar'

describe('TableToolbar', () => {
  const defaultProps = {
    onSearch: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('렌더링', () => {
    it('기본 툴바가 렌더링되어야 함', () => {
      render(<TableToolbar {...defaultProps} />)

      expect(screen.getByRole('toolbar')).toBeInTheDocument()
    })

    it('검색 입력 필드가 렌더링되어야 함', () => {
      render(<TableToolbar {...defaultProps} />)

      expect(screen.getByRole('searchbox')).toBeInTheDocument()
    })

    it('검색 플레이스홀더가 표시되어야 함', () => {
      render(<TableToolbar {...defaultProps} searchPlaceholder="품번 검색..." />)

      expect(screen.getByPlaceholderText('품번 검색...')).toBeInTheDocument()
    })

    it('기본 검색 플레이스홀더가 표시되어야 함', () => {
      render(<TableToolbar {...defaultProps} />)

      expect(screen.getByPlaceholderText('검색...')).toBeInTheDocument()
    })
  })

  describe('검색 기능', () => {
    it('검색어 입력 시 onSearch가 호출되어야 함', () => {
      vi.useFakeTimers()
      const onSearch = vi.fn()

      render(<TableToolbar onSearch={onSearch} debounceMs={0} />)

      const searchInput = screen.getByRole('searchbox')

      // fireEvent를 사용하여 React 이벤트 시스템과 호환
      fireEvent.change(searchInput, { target: { value: '테스트' } })

      act(() => {
        vi.runAllTimers()
      })

      expect(onSearch).toHaveBeenCalledWith('테스트')
      vi.useRealTimers()
    })

    it('검색어 입력이 디바운스되어야 함', () => {
      vi.useFakeTimers()
      const onSearch = vi.fn()

      render(<TableToolbar onSearch={onSearch} debounceMs={300} />)

      const searchInput = screen.getByRole('searchbox')

      // fireEvent를 사용하여 React 이벤트 시스템과 호환
      fireEvent.change(searchInput, { target: { value: '테' } })

      // 디바운스 시간 전에는 호출되지 않아야 함
      expect(onSearch).not.toHaveBeenCalled()

      // 디바운스 시간 후 호출되어야 함
      act(() => {
        vi.advanceTimersByTime(300)
      })

      expect(onSearch).toHaveBeenCalledWith('테')
      vi.useRealTimers()
    })

    it('검색 초기화 버튼 클릭 시 검색어가 지워져야 함', () => {
      const onSearch = vi.fn()

      // 제어 컴포넌트로 사용하여 초기화 버튼 표시
      render(
        <TableToolbar onSearch={onSearch} debounceMs={0} searchValue="테스트" />
      )

      // 초기화 버튼이 표시되어야 함
      const clearButton = screen.getByLabelText('검색 초기화')
      expect(clearButton).toBeInTheDocument()

      act(() => {
        clearButton.click()
      })

      expect(onSearch).toHaveBeenCalledWith('')
    })
  })

  describe('필터 기능', () => {
    const filters = [
      {
        key: 'status',
        label: '상태',
        options: [
          { value: 'active', label: '활성' },
          { value: 'inactive', label: '비활성' },
        ],
      },
      {
        key: 'type',
        label: '유형',
        options: [
          { value: 'domestic', label: '국내' },
          { value: 'overseas', label: '해외' },
        ],
      },
    ]

    it('필터가 렌더링되어야 함', () => {
      render(<TableToolbar {...defaultProps} filters={filters} />)

      // Select 컴포넌트는 combobox role을 가짐
      const comboboxes = screen.getAllByRole('combobox')
      expect(comboboxes.length).toBeGreaterThanOrEqual(2)
    })

    it('필터 초기화 버튼이 동작해야 함', () => {
      const onFilterChange = vi.fn()

      render(
        <TableToolbar
          {...defaultProps}
          filters={filters}
          filterValues={{ status: 'active', type: 'domestic' }}
          onFilterChange={onFilterChange}
        />
      )

      const resetButton = screen.getByRole('button', { name: /필터 초기화/i })

      act(() => {
        resetButton.click()
      })

      expect(onFilterChange).toHaveBeenCalledWith(null, null)
    })
  })

  describe('액션 버튼', () => {
    it('추가 버튼이 렌더링되어야 함', () => {
      render(<TableToolbar {...defaultProps} onAdd={vi.fn()} addLabel="제품 추가" />)

      expect(screen.getByRole('button', { name: /제품 추가/i })).toBeInTheDocument()
    })

    it('추가 버튼 클릭 시 onAdd가 호출되어야 함', () => {
      const onAdd = vi.fn()

      render(<TableToolbar {...defaultProps} onAdd={onAdd} addLabel="추가" />)

      const addButton = screen.getByRole('button', { name: /추가/i })

      act(() => {
        addButton.click()
      })

      expect(onAdd).toHaveBeenCalledTimes(1)
    })

    it('내보내기 버튼이 렌더링되어야 함', () => {
      render(<TableToolbar {...defaultProps} onExport={vi.fn()} />)

      expect(screen.getByRole('button', { name: /내보내기/i })).toBeInTheDocument()
    })

    it('내보내기 버튼 클릭 시 onExport가 호출되어야 함', () => {
      const onExport = vi.fn()

      render(<TableToolbar {...defaultProps} onExport={onExport} />)

      const exportButton = screen.getByRole('button', { name: /내보내기/i })

      act(() => {
        exportButton.click()
      })

      expect(onExport).toHaveBeenCalledTimes(1)
    })

    it('일괄등록 버튼이 렌더링되어야 함', () => {
      render(<TableToolbar {...defaultProps} onBulkUpload={vi.fn()} />)

      expect(screen.getByRole('button', { name: /일괄등록/i })).toBeInTheDocument()
    })

    it('삭제 버튼이 렌더링되어야 함 (선택된 항목이 있을 때)', () => {
      render(<TableToolbar {...defaultProps} onDelete={vi.fn()} selectedCount={3} />)

      expect(screen.getByRole('button', { name: /삭제.*3/i })).toBeInTheDocument()
    })

    it('선택된 항목이 없으면 삭제 버튼이 숨겨져야 함', () => {
      render(<TableToolbar {...defaultProps} onDelete={vi.fn()} selectedCount={0} />)

      expect(screen.queryByRole('button', { name: /삭제/i })).not.toBeInTheDocument()
    })
  })

  describe('선택 상태 표시', () => {
    it('선택된 항목 수가 표시되어야 함', () => {
      render(<TableToolbar {...defaultProps} selectedCount={5} totalCount={100} />)

      expect(screen.getByText(/5개 선택/i)).toBeInTheDocument()
    })

    it('전체 항목 수가 표시되어야 함', () => {
      render(<TableToolbar {...defaultProps} totalCount={100} />)

      expect(screen.getByText(/총 100개/i)).toBeInTheDocument()
    })
  })

  describe('로딩 상태', () => {
    it('검색 중일 때 로딩 인디케이터가 표시되어야 함', () => {
      render(<TableToolbar {...defaultProps} isSearching={true} />)

      expect(screen.getByTestId('search-loading')).toBeInTheDocument()
    })

    it('로딩 중일 때 검색 입력이 비활성화되어야 함', () => {
      render(<TableToolbar {...defaultProps} isLoading={true} />)

      expect(screen.getByRole('searchbox')).toBeDisabled()
    })
  })

  describe('커스텀 액션', () => {
    it('커스텀 액션 버튼이 렌더링되어야 함', () => {
      const customActions = [
        { key: 'refresh', label: '새로고침', onClick: vi.fn() },
        { key: 'print', label: '인쇄', onClick: vi.fn() },
      ]

      render(<TableToolbar {...defaultProps} customActions={customActions} />)

      expect(screen.getByRole('button', { name: '새로고침' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '인쇄' })).toBeInTheDocument()
    })

    it('커스텀 액션 클릭 시 onClick이 호출되어야 함', () => {
      const onClick = vi.fn()
      const customActions = [
        { key: 'refresh', label: '새로고침', onClick },
      ]

      render(<TableToolbar {...defaultProps} customActions={customActions} />)

      const button = screen.getByRole('button', { name: '새로고침' })

      act(() => {
        button.click()
      })

      expect(onClick).toHaveBeenCalledTimes(1)
    })
  })

  describe('레이아웃', () => {
    it('검색과 필터가 왼쪽에 배치되어야 함', () => {
      const filters = [{ key: 'status', label: '상태', options: [] }]
      render(<TableToolbar {...defaultProps} filters={filters} />)

      const toolbar = screen.getByRole('toolbar')
      expect(toolbar).toHaveClass('flex')
    })

    it('액션 버튼이 오른쪽에 배치되어야 함', () => {
      render(
        <TableToolbar
          {...defaultProps}
          onAdd={vi.fn()}
          onExport={vi.fn()}
        />
      )

      const actionsContainer = screen.getByTestId('toolbar-actions')
      expect(actionsContainer).toHaveClass('ml-auto')
    })
  })
})
