/**
 * ConfirmDialog Component Tests
 * TDD: RED Phase - 테스트 먼저 작성
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConfirmDialog, useConfirmDialog } from '@infrastructure/react/components/common/ConfirmDialog'

describe('ConfirmDialog', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    title: '삭제 확인',
    description: '정말 삭제하시겠습니까?',
    onConfirm: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('렌더링', () => {
    it('open=true일 때 다이얼로그가 표시되어야 함', () => {
      render(<ConfirmDialog {...defaultProps} />)

      expect(screen.getByRole('alertdialog')).toBeInTheDocument()
      expect(screen.getByText('삭제 확인')).toBeInTheDocument()
      expect(screen.getByText('정말 삭제하시겠습니까?')).toBeInTheDocument()
    })

    it('open=false일 때 다이얼로그가 숨겨져야 함', () => {
      render(<ConfirmDialog {...defaultProps} open={false} />)

      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    })

    it('기본 버튼 텍스트가 표시되어야 함', () => {
      render(<ConfirmDialog {...defaultProps} />)

      expect(screen.getByRole('button', { name: '확인' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '취소' })).toBeInTheDocument()
    })

    it('커스텀 버튼 텍스트가 표시되어야 함', () => {
      render(
        <ConfirmDialog
          {...defaultProps}
          confirmText="삭제"
          cancelText="돌아가기"
        />
      )

      expect(screen.getByRole('button', { name: '삭제' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '돌아가기' })).toBeInTheDocument()
    })
  })

  describe('확인 버튼 클릭', () => {
    it('확인 버튼 클릭 시 onConfirm이 호출되어야 함', async () => {
      const user = userEvent.setup()
      render(<ConfirmDialog {...defaultProps} />)

      await user.click(screen.getByRole('button', { name: '확인' }))

      expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1)
    })

    it('확인 버튼 클릭 후 다이얼로그가 닫혀야 함', async () => {
      const user = userEvent.setup()
      render(<ConfirmDialog {...defaultProps} />)

      await user.click(screen.getByRole('button', { name: '확인' }))

      expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false)
    })
  })

  describe('취소 버튼 클릭', () => {
    it('취소 버튼 클릭 시 onCancel이 호출되어야 함', async () => {
      const onCancel = vi.fn()
      const user = userEvent.setup()
      render(<ConfirmDialog {...defaultProps} onCancel={onCancel} />)

      await user.click(screen.getByRole('button', { name: '취소' }))

      expect(onCancel).toHaveBeenCalledTimes(1)
    })

    it('취소 버튼 클릭 후 다이얼로그가 닫혀야 함', async () => {
      const user = userEvent.setup()
      render(<ConfirmDialog {...defaultProps} />)

      await user.click(screen.getByRole('button', { name: '취소' }))

      expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false)
    })
  })

  describe('variant (변형)', () => {
    it('destructive variant일 때 확인 버튼이 빨간색이어야 함', () => {
      render(<ConfirmDialog {...defaultProps} variant="destructive" />)

      const confirmButton = screen.getByRole('button', { name: '확인' })
      expect(confirmButton).toHaveClass('bg-destructive')
    })

    it('default variant일 때 기본 스타일이어야 함', () => {
      render(<ConfirmDialog {...defaultProps} variant="default" />)

      const confirmButton = screen.getByRole('button', { name: '확인' })
      expect(confirmButton).toHaveClass('bg-primary')
    })
  })

  describe('로딩 상태', () => {
    it('loading=true일 때 확인 버튼이 비활성화되어야 함', () => {
      render(<ConfirmDialog {...defaultProps} loading={true} />)

      expect(screen.getByRole('button', { name: /확인/ })).toBeDisabled()
    })

    it('loading=true일 때 로딩 스피너가 표시되어야 함', () => {
      render(<ConfirmDialog {...defaultProps} loading={true} />)

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
    })
  })
})

describe('useConfirmDialog Hook', () => {
  it('초기 상태는 닫혀 있어야 함', () => {
    const TestComponent = () => {
      const { isOpen } = useConfirmDialog()
      return <div data-testid="is-open">{isOpen ? 'open' : 'closed'}</div>
    }

    render(<TestComponent />)

    expect(screen.getByTestId('is-open')).toHaveTextContent('closed')
  })

  it('confirm 호출 시 Promise를 반환해야 함', async () => {
    const TestComponent = () => {
      const { confirm, isOpen } = useConfirmDialog()

      const handleClick = async () => {
        const result = await confirm({
          title: '테스트',
          description: '테스트 설명',
        })
        return result
      }

      return (
        <div>
          <button onClick={handleClick}>Open</button>
          <div data-testid="is-open">{isOpen ? 'open' : 'closed'}</div>
        </div>
      )
    }

    const user = userEvent.setup()
    render(<TestComponent />)

    await user.click(screen.getByRole('button', { name: 'Open' }))

    await waitFor(() => {
      expect(screen.getByTestId('is-open')).toHaveTextContent('open')
    })
  })
})
