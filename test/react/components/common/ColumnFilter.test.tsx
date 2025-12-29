/**
 * ColumnFilter Component Tests
 * TDD: 컬럼 필터링 컴포넌트 테스트
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ColumnFilter, type ColumnFilterProps } from '@infrastructure/react/components/common/ColumnFilter'

describe('ColumnFilter', () => {
  const mockOnFilterChange = vi.fn()

  const defaultProps: ColumnFilterProps = {
    columnId: 'name',
    columnLabel: '이름',
    onFilterChange: mockOnFilterChange,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('렌더링', () => {
    it('텍스트 필터 입력이 렌더링되어야 함', () => {
      render(<ColumnFilter {...defaultProps} />)

      expect(screen.getByPlaceholderText(/이름/i)).toBeInTheDocument()
    })

    it('숫자 타입일 때 범위 필터가 렌더링되어야 함', () => {
      render(<ColumnFilter {...defaultProps} type="number" />)

      expect(screen.getByPlaceholderText(/최소/i)).toBeInTheDocument()
      expect(screen.getByPlaceholderText(/최대/i)).toBeInTheDocument()
    })

    it('select 타입일 때 드롭다운이 렌더링되어야 함', () => {
      const options = [
        { value: 'active', label: '활성' },
        { value: 'inactive', label: '비활성' },
      ]
      render(<ColumnFilter {...defaultProps} type="select" options={options} />)

      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })

    it('현재 필터 값이 표시되어야 함', () => {
      render(<ColumnFilter {...defaultProps} value="검색어" />)

      expect(screen.getByDisplayValue('검색어')).toBeInTheDocument()
    })
  })

  describe('텍스트 필터', () => {
    it('텍스트 입력 시 onFilterChange가 호출되어야 함', async () => {
      vi.useFakeTimers()
      render(<ColumnFilter {...defaultProps} debounceMs={100} />)

      const input = screen.getByPlaceholderText(/이름/i)
      fireEvent.change(input, { target: { value: '테스트' } })

      // 디바운스 후에 호출됨
      vi.advanceTimersByTime(100)
      expect(mockOnFilterChange).toHaveBeenCalled()

      vi.useRealTimers()
    })

    it('디바운스가 적용되어야 함', async () => {
      vi.useFakeTimers()
      render(<ColumnFilter {...defaultProps} debounceMs={300} />)

      const input = screen.getByPlaceholderText(/이름/i)
      fireEvent.change(input, { target: { value: '검색' } })

      // 디바운스 전에는 호출되지 않음
      expect(mockOnFilterChange).not.toHaveBeenCalled()

      // 디바운스 후에 호출됨
      vi.advanceTimersByTime(300)
      expect(mockOnFilterChange).toHaveBeenCalledWith('name', '검색')

      vi.useRealTimers()
    })

    it('초기화 버튼 클릭 시 필터가 초기화되어야 함', async () => {
      const user = userEvent.setup()
      render(<ColumnFilter {...defaultProps} value="검색어" />)

      const clearButton = screen.getByRole('button', { name: /초기화/i })
      await user.click(clearButton)

      expect(mockOnFilterChange).toHaveBeenCalledWith('name', '')
    })
  })

  describe('숫자 범위 필터', () => {
    it('최소값 입력 시 onFilterChange가 호출되어야 함', async () => {
      vi.useFakeTimers()
      render(<ColumnFilter {...defaultProps} type="number" />)

      const minInput = screen.getByPlaceholderText(/최소/i)
      fireEvent.change(minInput, { target: { value: '10' } })

      vi.advanceTimersByTime(300)
      expect(mockOnFilterChange).toHaveBeenCalledWith('name', { min: 10, max: undefined })

      vi.useRealTimers()
    })

    it('최대값 입력 시 onFilterChange가 호출되어야 함', async () => {
      vi.useFakeTimers()
      render(<ColumnFilter {...defaultProps} type="number" />)

      const maxInput = screen.getByPlaceholderText(/최대/i)
      fireEvent.change(maxInput, { target: { value: '100' } })

      vi.advanceTimersByTime(300)
      expect(mockOnFilterChange).toHaveBeenCalledWith('name', { min: undefined, max: 100 })

      vi.useRealTimers()
    })

    it('기존 범위 값이 표시되어야 함', () => {
      render(
        <ColumnFilter
          {...defaultProps}
          type="number"
          value={{ min: 10, max: 100 }}
        />
      )

      expect(screen.getByDisplayValue('10')).toBeInTheDocument()
      expect(screen.getByDisplayValue('100')).toBeInTheDocument()
    })
  })

  describe('Select 필터', () => {
    const options = [
      { value: 'active', label: '활성' },
      { value: 'inactive', label: '비활성' },
    ]

    it('옵션이 렌더링되어야 함', async () => {
      const user = userEvent.setup()
      render(<ColumnFilter {...defaultProps} type="select" options={options} />)

      const trigger = screen.getByRole('combobox')
      await user.click(trigger)

      expect(screen.getByRole('option', { name: '활성' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: '비활성' })).toBeInTheDocument()
    })

    it('옵션 선택 시 onFilterChange가 호출되어야 함', async () => {
      const user = userEvent.setup()
      render(<ColumnFilter {...defaultProps} type="select" options={options} />)

      const trigger = screen.getByRole('combobox')
      await user.click(trigger)

      const option = screen.getByRole('option', { name: '활성' })
      await user.click(option)

      expect(mockOnFilterChange).toHaveBeenCalledWith('name', 'active')
    })

    it('현재 선택된 값이 표시되어야 함', () => {
      render(
        <ColumnFilter
          {...defaultProps}
          type="select"
          options={options}
          value="active"
        />
      )

      expect(screen.getByRole('combobox')).toHaveTextContent('활성')
    })
  })

  describe('date 필터', () => {
    it('날짜 입력이 렌더링되어야 함', () => {
      render(<ColumnFilter {...defaultProps} type="date" />)

      expect(screen.getByLabelText(/시작일/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/종료일/i)).toBeInTheDocument()
    })

    it('날짜 범위 입력 시 onFilterChange가 호출되어야 함', async () => {
      vi.useFakeTimers()
      render(<ColumnFilter {...defaultProps} type="date" />)

      const startInput = screen.getByLabelText(/시작일/i)
      fireEvent.change(startInput, { target: { value: '2024-01-01' } })

      vi.advanceTimersByTime(300)
      expect(mockOnFilterChange).toHaveBeenCalledWith('name', {
        start: '2024-01-01',
        end: undefined,
      })

      vi.useRealTimers()
    })
  })

  describe('스타일 및 상태', () => {
    it('disabled 상태에서 입력이 비활성화되어야 함', () => {
      render(<ColumnFilter {...defaultProps} disabled />)

      expect(screen.getByPlaceholderText(/이름/i)).toBeDisabled()
    })

    it('className이 적용되어야 함', () => {
      const { container } = render(
        <ColumnFilter {...defaultProps} className="custom-class" />
      )

      expect(container.querySelector('.custom-class')).toBeInTheDocument()
    })

    it('size prop에 따라 크기가 변경되어야 함', () => {
      const { rerender, container } = render(
        <ColumnFilter {...defaultProps} size="sm" />
      )

      // small size
      expect(container.querySelector('.h-7')).toBeInTheDocument()

      rerender(<ColumnFilter {...defaultProps} size="lg" />)
      expect(container.querySelector('.h-10')).toBeInTheDocument()
    })
  })
})

describe('ColumnFilterGroup', () => {
  it('여러 ColumnFilter가 그룹으로 렌더링되어야 함', async () => {
    const mockOnFiltersChange = vi.fn()
    const { ColumnFilterGroup } = await import('@infrastructure/react/components/common/ColumnFilter')

    const columns = [
      { id: 'name', label: '이름', type: 'text' as const },
      { id: 'quantity', label: '수량', type: 'number' as const },
      { id: 'status', label: '상태', type: 'select' as const, options: [{ value: 'active', label: '활성' }] },
    ]

    render(
      <ColumnFilterGroup
        columns={columns}
        onFiltersChange={mockOnFiltersChange}
      />
    )

    expect(screen.getByPlaceholderText(/이름/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/최소/i)).toBeInTheDocument()
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })

  it('전체 초기화 버튼이 동작해야 함', async () => {
    const mockOnFiltersChange = vi.fn()
    const { ColumnFilterGroup } = await import('@infrastructure/react/components/common/ColumnFilter')
    const user = userEvent.setup()

    const columns = [
      { id: 'name', label: '이름', type: 'text' as const },
    ]

    render(
      <ColumnFilterGroup
        columns={columns}
        values={{ name: '검색어' }}
        onFiltersChange={mockOnFiltersChange}
      />
    )

    const resetButton = screen.getByRole('button', { name: /전체 초기화/i })
    await user.click(resetButton)

    expect(mockOnFiltersChange).toHaveBeenCalledWith({})
  })
})
