/**
 * Skeleton Component Tests
 * TDD: RED Phase - 테스트 먼저 작성
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  Skeleton,
  SkeletonText,
  SkeletonCard,
  SkeletonTable,
  SkeletonForm,
} from '@infrastructure/react/components/common/Skeleton'

describe('Skeleton', () => {
  describe('기본 렌더링', () => {
    it('기본 Skeleton이 렌더링되어야 함', () => {
      render(<Skeleton data-testid="skeleton" />)

      const skeleton = screen.getByTestId('skeleton')
      expect(skeleton).toBeInTheDocument()
      expect(skeleton).toHaveClass('animate-pulse')
    })

    it('커스텀 className이 적용되어야 함', () => {
      render(<Skeleton className="w-full h-10" data-testid="skeleton" />)

      const skeleton = screen.getByTestId('skeleton')
      expect(skeleton).toHaveClass('w-full')
      expect(skeleton).toHaveClass('h-10')
    })

    it('원형 스켈레톤이 렌더링되어야 함', () => {
      render(<Skeleton variant="circular" data-testid="skeleton" />)

      const skeleton = screen.getByTestId('skeleton')
      expect(skeleton).toHaveClass('rounded-full')
    })

    it('사각형 스켈레톤이 렌더링되어야 함', () => {
      render(<Skeleton variant="rectangular" data-testid="skeleton" />)

      const skeleton = screen.getByTestId('skeleton')
      expect(skeleton).toHaveClass('rounded-md')
    })

    it('텍스트 스켈레톤이 렌더링되어야 함', () => {
      render(<Skeleton variant="text" data-testid="skeleton" />)

      const skeleton = screen.getByTestId('skeleton')
      expect(skeleton).toHaveClass('rounded')
    })
  })

  describe('크기 설정', () => {
    it('width와 height가 적용되어야 함', () => {
      render(<Skeleton width={100} height={50} data-testid="skeleton" />)

      const skeleton = screen.getByTestId('skeleton')
      expect(skeleton).toHaveStyle({ width: '100px', height: '50px' })
    })

    it('문자열 width/height가 적용되어야 함', () => {
      render(<Skeleton width="100%" height="2rem" data-testid="skeleton" />)

      const skeleton = screen.getByTestId('skeleton')
      expect(skeleton).toHaveStyle({ width: '100%', height: '2rem' })
    })
  })
})

describe('SkeletonText', () => {
  it('기본 줄 수가 렌더링되어야 함', () => {
    render(<SkeletonText data-testid="skeleton-text" />)

    const container = screen.getByTestId('skeleton-text')
    const lines = container.querySelectorAll('[class*="animate-pulse"]')
    expect(lines.length).toBe(3) // 기본값
  })

  it('지정된 줄 수가 렌더링되어야 함', () => {
    render(<SkeletonText lines={5} data-testid="skeleton-text" />)

    const container = screen.getByTestId('skeleton-text')
    const lines = container.querySelectorAll('[class*="animate-pulse"]')
    expect(lines.length).toBe(5)
  })

  it('마지막 줄이 더 짧아야 함', () => {
    render(<SkeletonText lines={3} data-testid="skeleton-text" />)

    const container = screen.getByTestId('skeleton-text')
    const lines = container.querySelectorAll('[class*="animate-pulse"]')
    const lastLine = lines[lines.length - 1]
    expect(lastLine).toHaveClass('w-3/4')
  })
})

describe('SkeletonCard', () => {
  it('카드 스켈레톤이 렌더링되어야 함', () => {
    render(<SkeletonCard data-testid="skeleton-card" />)

    const card = screen.getByTestId('skeleton-card')
    expect(card).toBeInTheDocument()
  })

  it('이미지 영역이 있어야 함', () => {
    render(<SkeletonCard showImage data-testid="skeleton-card" />)

    const card = screen.getByTestId('skeleton-card')
    const imageArea = card.querySelector('[class*="h-48"]')
    expect(imageArea).toBeInTheDocument()
  })

  it('이미지 없는 카드가 렌더링되어야 함', () => {
    render(<SkeletonCard showImage={false} data-testid="skeleton-card" />)

    const card = screen.getByTestId('skeleton-card')
    const imageArea = card.querySelector('[class*="h-48"]')
    expect(imageArea).not.toBeInTheDocument()
  })

  it('제목과 설명 영역이 있어야 함', () => {
    render(<SkeletonCard data-testid="skeleton-card" />)

    const card = screen.getByTestId('skeleton-card')
    const skeletons = card.querySelectorAll('[class*="animate-pulse"]')
    expect(skeletons.length).toBeGreaterThanOrEqual(2)
  })
})

describe('SkeletonTable', () => {
  it('테이블 스켈레톤이 렌더링되어야 함', () => {
    render(<SkeletonTable data-testid="skeleton-table" />)

    const table = screen.getByTestId('skeleton-table')
    expect(table).toBeInTheDocument()
  })

  it('기본 행 수가 렌더링되어야 함', () => {
    render(<SkeletonTable data-testid="skeleton-table" />)

    const table = screen.getByTestId('skeleton-table')
    const rows = table.querySelectorAll('[data-testid="skeleton-row"]')
    expect(rows.length).toBe(5) // 기본값
  })

  it('지정된 행 수가 렌더링되어야 함', () => {
    render(<SkeletonTable rows={10} data-testid="skeleton-table" />)

    const table = screen.getByTestId('skeleton-table')
    const rows = table.querySelectorAll('[data-testid="skeleton-row"]')
    expect(rows.length).toBe(10)
  })

  it('기본 열 수가 렌더링되어야 함', () => {
    render(<SkeletonTable data-testid="skeleton-table" />)

    const table = screen.getByTestId('skeleton-table')
    const firstRow = table.querySelector('[data-testid="skeleton-row"]')
    const columns = firstRow?.querySelectorAll('[class*="animate-pulse"]')
    expect(columns?.length).toBe(4) // 기본값
  })

  it('지정된 열 수가 렌더링되어야 함', () => {
    render(<SkeletonTable columns={6} data-testid="skeleton-table" />)

    const table = screen.getByTestId('skeleton-table')
    const firstRow = table.querySelector('[data-testid="skeleton-row"]')
    const columns = firstRow?.querySelectorAll('[class*="animate-pulse"]')
    expect(columns?.length).toBe(6)
  })

  it('헤더 행이 있어야 함', () => {
    render(<SkeletonTable showHeader data-testid="skeleton-table" />)

    const table = screen.getByTestId('skeleton-table')
    const header = table.querySelector('[data-testid="skeleton-header"]')
    expect(header).toBeInTheDocument()
  })
})

describe('SkeletonForm', () => {
  it('폼 스켈레톤이 렌더링되어야 함', () => {
    render(<SkeletonForm data-testid="skeleton-form" />)

    const form = screen.getByTestId('skeleton-form')
    expect(form).toBeInTheDocument()
  })

  it('기본 필드 수가 렌더링되어야 함', () => {
    render(<SkeletonForm data-testid="skeleton-form" />)

    const form = screen.getByTestId('skeleton-form')
    const fields = form.querySelectorAll('[data-testid="skeleton-field"]')
    expect(fields.length).toBe(4) // 기본값
  })

  it('지정된 필드 수가 렌더링되어야 함', () => {
    render(<SkeletonForm fields={6} data-testid="skeleton-form" />)

    const form = screen.getByTestId('skeleton-form')
    const fields = form.querySelectorAll('[data-testid="skeleton-field"]')
    expect(fields.length).toBe(6)
  })

  it('각 필드에 라벨과 입력 영역이 있어야 함', () => {
    render(<SkeletonForm data-testid="skeleton-form" />)

    const form = screen.getByTestId('skeleton-form')
    const firstField = form.querySelector('[data-testid="skeleton-field"]')
    const skeletons = firstField?.querySelectorAll('[class*="animate-pulse"]')
    expect(skeletons?.length).toBeGreaterThanOrEqual(2) // 라벨 + 입력
  })

  it('액션 버튼 영역이 있어야 함', () => {
    render(<SkeletonForm showActions data-testid="skeleton-form" />)

    const form = screen.getByTestId('skeleton-form')
    const actions = form.querySelector('[data-testid="skeleton-actions"]')
    expect(actions).toBeInTheDocument()
  })
})
