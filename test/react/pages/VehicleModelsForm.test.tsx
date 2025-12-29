/**
 * VehicleModelsPage Form Tests
 * TDD: RED phase - 차종 폼 유효성 검증 및 ConfirmDialog 테스트
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { VehicleModelForm } from '@infrastructure/react/components/forms/VehicleModelForm'

// Mock toast
vi.mock('@infrastructure/react/components/ui/toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}))

describe('VehicleModelForm', () => {
  const mockOnSubmit = vi.fn()
  const mockOnCancel = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('폼이 렌더링되어야 함', () => {
    render(
      <VehicleModelForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    )

    expect(screen.getByLabelText(/차종 코드/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/차종명/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/설명/i)).toBeInTheDocument()
  })

  it('빈 폼 제출 시 유효성 오류 표시해야 함', async () => {
    const user = userEvent.setup()

    render(
      <VehicleModelForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    )

    const submitButton = screen.getByRole('button', { name: /저장/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/차종 코드를 입력하세요/i)).toBeInTheDocument()
    })

    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  it('유효한 데이터 입력 시 제출 성공해야 함', async () => {
    const user = userEvent.setup()

    render(
      <VehicleModelForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    )

    await user.type(screen.getByLabelText(/차종 코드/i), 'V001')
    await user.type(screen.getByLabelText(/차종명/i), '테스트 차종')
    await user.type(screen.getByLabelText(/설명/i), '테스트 설명')

    const submitButton = screen.getByRole('button', { name: /저장/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled()
    }, { timeout: 3000 })

    // React Hook Form은 데이터 객체로 onSubmit을 호출
    const callArg = mockOnSubmit.mock.calls[0]?.[0]
    expect(callArg).toHaveProperty('vehicle_code', 'V001')
    expect(callArg).toHaveProperty('vehicle_name', '테스트 차종')
  })

  it('취소 버튼 클릭 시 onCancel 호출해야 함', async () => {
    const user = userEvent.setup()

    render(
      <VehicleModelForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    )

    const cancelButton = screen.getByRole('button', { name: /취소/i })
    await user.click(cancelButton)

    expect(mockOnCancel).toHaveBeenCalled()
  })

  it('수정 모드에서 기존 값이 표시되어야 함', () => {
    const defaultValues = {
      vehicle_code: 'V002',
      vehicle_name: '기존 차종',
      description: '기존 설명',
      is_active: true,
    }

    render(
      <VehicleModelForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        defaultValues={defaultValues}
        isEdit
      />
    )

    expect(screen.getByLabelText(/차종 코드/i)).toHaveValue('V002')
    expect(screen.getByLabelText(/차종명/i)).toHaveValue('기존 차종')
    expect(screen.getByLabelText(/설명/i)).toHaveValue('기존 설명')
  })

  it('수정 모드에서 차종 코드는 비활성화되어야 함', () => {
    const defaultValues = {
      vehicle_code: 'V002',
      vehicle_name: '기존 차종',
      description: '기존 설명',
      is_active: true,
    }

    render(
      <VehicleModelForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        defaultValues={defaultValues}
        isEdit
      />
    )

    expect(screen.getByLabelText(/차종 코드/i)).toBeDisabled()
  })

  it('차종 코드 20자 초과 시 오류 표시해야 함', async () => {
    const user = userEvent.setup()

    render(
      <VehicleModelForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    )

    const longCode = 'V'.repeat(25)
    await user.type(screen.getByLabelText(/차종 코드/i), longCode)
    await user.type(screen.getByLabelText(/차종명/i), '테스트')

    const submitButton = screen.getByRole('button', { name: /저장/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/20자 이하/i)).toBeInTheDocument()
    })
  })

  it('로딩 상태에서 제출 버튼이 비활성화되어야 함', () => {
    render(
      <VehicleModelForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isLoading
      />
    )

    const submitButton = screen.getByRole('button', { name: /저장/i })
    expect(submitButton).toBeDisabled()
  })
})
