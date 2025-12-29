/**
 * ExportButton Component Tests
 * TDD: Excel Export 기능 테스트
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ExportButton, useExport, type ExportButtonProps } from '@infrastructure/react/components/common/ExportButton'

// XLSX mock - vitest에서 제대로 작동하도록
vi.mock('xlsx', () => ({
  utils: {
    book_new: vi.fn(() => ({})),
    json_to_sheet: vi.fn(() => ({})),
    book_append_sheet: vi.fn(),
  },
  writeFile: vi.fn(),
}))

describe('ExportButton', () => {
  const mockData = [
    { id: 1, name: 'Item 1', quantity: 100 },
    { id: 2, name: 'Item 2', quantity: 200 },
    { id: 3, name: 'Item 3', quantity: 300 },
  ]

  const mockColumns = [
    { key: 'id', header: 'ID' },
    { key: 'name', header: '이름' },
    { key: 'quantity', header: '수량' },
  ]

  const defaultProps: ExportButtonProps = {
    data: mockData,
    columns: mockColumns,
    filename: 'export',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('렌더링', () => {
    it('Export 버튼이 렌더링되어야 함', () => {
      render(<ExportButton {...defaultProps} />)

      expect(screen.getByRole('button', { name: /내보내기/i })).toBeInTheDocument()
    })

    it('아이콘이 표시되어야 함', () => {
      render(<ExportButton {...defaultProps} />)

      const button = screen.getByRole('button', { name: /내보내기/i })
      expect(button.querySelector('svg')).toBeInTheDocument()
    })

    it('커스텀 라벨이 표시되어야 함', () => {
      render(<ExportButton {...defaultProps} label="Excel 다운로드" />)

      expect(screen.getByRole('button', { name: /Excel 다운로드/i })).toBeInTheDocument()
    })

    it('데이터가 없을 때 버튼이 비활성화되어야 함', () => {
      render(<ExportButton {...defaultProps} data={[]} />)

      expect(screen.getByRole('button', { name: /내보내기/i })).toBeDisabled()
    })
  })

  describe('Export 기능', () => {
    it('버튼 클릭 시 export가 실행되어야 함', async () => {
      const user = userEvent.setup()
      render(<ExportButton {...defaultProps} />)

      const button = screen.getByRole('button', { name: /내보내기/i })
      await user.click(button)

      // XLSX mock이 호출되어야 함
      const XLSX = await import('xlsx')
      expect(XLSX.utils.book_new).toHaveBeenCalled()
    })

    it('onExport 콜백이 호출되어야 함', async () => {
      const onExport = vi.fn()
      const user = userEvent.setup()

      render(<ExportButton {...defaultProps} onExport={onExport} />)

      const button = screen.getByRole('button', { name: /내보내기/i })
      await user.click(button)

      expect(onExport).toHaveBeenCalled()
    })

    it('onExport 콜백에 올바른 옵션이 전달되어야 함', async () => {
      const onExport = vi.fn()
      const user = userEvent.setup()

      render(<ExportButton {...defaultProps} onExport={onExport} />)

      const button = screen.getByRole('button', { name: /내보내기/i })
      await user.click(button)

      expect(onExport).toHaveBeenCalledWith(
        expect.objectContaining({
          data: mockData,
          filename: 'export',
          format: 'xlsx',
        })
      )
    })

    it('filename에 날짜가 추가되어야 함', async () => {
      const onExport = vi.fn()
      const user = userEvent.setup()

      render(
        <ExportButton
          {...defaultProps}
          filename="products"
          appendDate
          onExport={onExport}
        />
      )

      const button = screen.getByRole('button', { name: /내보내기/i })
      await user.click(button)

      // 날짜 포맷 확인 (YYYY-MM-DD)
      expect(onExport).toHaveBeenCalledWith(
        expect.objectContaining({
          filename: expect.stringMatching(/products_\d{4}-\d{2}-\d{2}/)
        })
      )
    })
  })

  describe('포맷 옵션', () => {
    it('xlsx 포맷으로 export할 수 있어야 함', async () => {
      const onExport = vi.fn()
      const user = userEvent.setup()

      render(
        <ExportButton
          {...defaultProps}
          format="xlsx"
          onExport={onExport}
        />
      )

      const button = screen.getByRole('button', { name: /내보내기/i })
      await user.click(button)

      expect(onExport).toHaveBeenCalledWith(
        expect.objectContaining({
          format: 'xlsx'
        })
      )
    })

    it('csv 포맷으로 export할 수 있어야 함', async () => {
      const onExport = vi.fn()
      const user = userEvent.setup()

      render(
        <ExportButton
          {...defaultProps}
          format="csv"
          onExport={onExport}
        />
      )

      const button = screen.getByRole('button', { name: /내보내기/i })
      await user.click(button)

      expect(onExport).toHaveBeenCalledWith(
        expect.objectContaining({
          format: 'csv'
        })
      )
    })

    it('showFormatSelect가 true일 때 드롭다운 버튼이 렌더링되어야 함', () => {
      render(<ExportButton {...defaultProps} showFormatSelect />)

      // 드롭다운 트리거 버튼 확인
      expect(screen.getByRole('button', { name: /Export 옵션/i })).toBeInTheDocument()
    })
  })

  describe('스타일 및 상태', () => {
    it('disabled prop이 적용되어야 함', () => {
      render(<ExportButton {...defaultProps} disabled />)

      expect(screen.getByRole('button', { name: /내보내기/i })).toBeDisabled()
    })

    it('variant prop이 적용되어야 함', () => {
      render(<ExportButton {...defaultProps} variant="outline" />)

      const button = screen.getByRole('button', { name: /내보내기/i })
      expect(button).toHaveClass('border')
    })

    it('className이 적용되어야 함', () => {
      render(<ExportButton {...defaultProps} className="custom-class" />)

      expect(screen.getByRole('button', { name: /내보내기/i })).toHaveClass('custom-class')
    })
  })
})

describe('useExport Hook', () => {
  it('export 함수가 올바르게 동작해야 함', () => {
    // Hook을 테스트하기 위한 래퍼 컴포넌트
    const TestComponent = () => {
      const { exportToExcel, isExporting } = useExport()

      return (
        <button
          onClick={() => exportToExcel({
            data: [{ id: 1, name: 'Test' }],
            columns: [{ key: 'id', header: 'ID' }, { key: 'name', header: 'Name' }],
            filename: 'test',
          })}
          disabled={isExporting}
        >
          Export
        </button>
      )
    }

    render(<TestComponent />)

    const button = screen.getByRole('button', { name: /Export/i })
    expect(button).not.toBeDisabled()
  })

  it('export 실행 후 isExporting이 false로 돌아와야 함', async () => {
    const user = userEvent.setup()

    const TestComponent = () => {
      const { exportToExcel, isExporting } = useExport()

      return (
        <button
          onClick={() => exportToExcel({
            data: [{ id: 1, name: 'Test' }],
            columns: [{ key: 'id', header: 'ID' }, { key: 'name', header: 'Name' }],
            filename: 'test',
          })}
          data-testid="export-btn"
          disabled={isExporting}
        >
          {isExporting ? 'Exporting...' : 'Export'}
        </button>
      )
    }

    render(<TestComponent />)

    const button = screen.getByTestId('export-btn')
    await user.click(button)

    // 실행 완료 후 버튼이 다시 활성화되어야 함
    await waitFor(() => {
      expect(button).not.toBeDisabled()
      expect(button).toHaveTextContent('Export')
    })
  })
})
