/**
 * FormWrapper Component Tests
 * TDD: RED Phase - 테스트 먼저 작성
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { z } from 'zod'
import { FormWrapper, FormField, FormActions } from '@infrastructure/react/components/common/FormWrapper'

// 테스트용 스키마
const testSchema = z.object({
  name: z.string().min(1, '이름을 입력하세요.'),
  email: z.string().email('유효한 이메일을 입력하세요.'),
  age: z.number().min(1, '나이는 1 이상이어야 합니다.').optional(),
})

describe('FormWrapper', () => {
  const defaultProps = {
    schema: testSchema,
    onSubmit: vi.fn(),
    children: <div data-testid="form-content">Form Content</div>,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('렌더링', () => {
    it('form 요소가 렌더링되어야 함', () => {
      render(<FormWrapper {...defaultProps} />)

      expect(screen.getByRole('form')).toBeInTheDocument()
    })

    it('children이 렌더링되어야 함', () => {
      render(<FormWrapper {...defaultProps} />)

      expect(screen.getByTestId('form-content')).toBeInTheDocument()
    })

    it('기본값이 폼에 설정되어야 함', () => {
      render(
        <FormWrapper
          {...defaultProps}
          defaultValues={{ name: '홍길동', email: 'hong@example.com' }}
        >
          {({ register }) => (
            <>
              <input {...register('name')} data-testid="name-input" />
              <input {...register('email')} data-testid="email-input" />
            </>
          )}
        </FormWrapper>
      )

      expect(screen.getByTestId('name-input')).toHaveValue('홍길동')
      expect(screen.getByTestId('email-input')).toHaveValue('hong@example.com')
    })
  })

  describe('폼 제출', () => {
    it('유효한 데이터로 제출 시 onSubmit이 호출되어야 함', async () => {
      const user = userEvent.setup()
      const onSubmit = vi.fn()

      render(
        <FormWrapper schema={testSchema} onSubmit={onSubmit}>
          {({ register }) => (
            <>
              <input {...register('name')} data-testid="name-input" />
              <input {...register('email')} data-testid="email-input" />
              <button type="submit">제출</button>
            </>
          )}
        </FormWrapper>
      )

      await user.type(screen.getByTestId('name-input'), '홍길동')
      await user.type(screen.getByTestId('email-input'), 'hong@example.com')
      await user.click(screen.getByRole('button', { name: '제출' }))

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            name: '홍길동',
            email: 'hong@example.com',
          }),
          expect.anything()
        )
      })
    })

    it('유효하지 않은 데이터로 제출 시 onSubmit이 호출되지 않아야 함', async () => {
      const user = userEvent.setup()
      const onSubmit = vi.fn()

      render(
        <FormWrapper schema={testSchema} onSubmit={onSubmit}>
          {({ register }) => (
            <>
              <input {...register('name')} data-testid="name-input" />
              <input {...register('email')} data-testid="email-input" />
              <button type="submit">제출</button>
            </>
          )}
        </FormWrapper>
      )

      // 빈 폼 제출
      await user.click(screen.getByRole('button', { name: '제출' }))

      await waitFor(() => {
        expect(onSubmit).not.toHaveBeenCalled()
      })
    })
  })

  describe('유효성 검사 에러', () => {
    it('필수 필드 누락 시 에러 메시지가 표시되어야 함', async () => {
      const user = userEvent.setup()

      render(
        <FormWrapper schema={testSchema} onSubmit={vi.fn()}>
          {({ register, formState: { errors } }) => (
            <>
              <input {...register('name')} data-testid="name-input" />
              {errors.name && (
                <span data-testid="name-error">{errors.name.message}</span>
              )}
              <input {...register('email')} data-testid="email-input" />
              {errors.email && (
                <span data-testid="email-error">{errors.email.message}</span>
              )}
              <button type="submit">제출</button>
            </>
          )}
        </FormWrapper>
      )

      await user.click(screen.getByRole('button', { name: '제출' }))

      await waitFor(() => {
        expect(screen.getByTestId('name-error')).toHaveTextContent('이름을 입력하세요.')
      })
    })

    it('이메일 형식 오류 시 에러 메시지가 표시되어야 함', async () => {
      const user = userEvent.setup()

      render(
        <FormWrapper schema={testSchema} onSubmit={vi.fn()}>
          {({ register, formState: { errors } }) => (
            <>
              <input {...register('name')} data-testid="name-input" />
              <input {...register('email')} data-testid="email-input" />
              {errors.email && (
                <span data-testid="email-error">{errors.email.message}</span>
              )}
              <button type="submit">제출</button>
            </>
          )}
        </FormWrapper>
      )

      await user.type(screen.getByTestId('name-input'), '홍길동')
      await user.type(screen.getByTestId('email-input'), 'invalid-email')
      await user.click(screen.getByRole('button', { name: '제출' }))

      await waitFor(() => {
        expect(screen.getByTestId('email-error')).toHaveTextContent('유효한 이메일을 입력하세요.')
      })
    })
  })

  describe('로딩 상태', () => {
    it('isSubmitting이 true일 때 제출 버튼이 비활성화되어야 함', async () => {
      const user = userEvent.setup()
      const onSubmit = vi.fn(() => new Promise(() => {})) // Never resolves

      render(
        <FormWrapper schema={testSchema} onSubmit={onSubmit}>
          {({ register, formState: { isSubmitting } }) => (
            <>
              <input {...register('name')} data-testid="name-input" />
              <input {...register('email')} data-testid="email-input" />
              <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? '저장 중...' : '제출'}
              </button>
            </>
          )}
        </FormWrapper>
      )

      await user.type(screen.getByTestId('name-input'), '홍길동')
      await user.type(screen.getByTestId('email-input'), 'hong@example.com')
      await user.click(screen.getByRole('button', { name: '제출' }))

      await waitFor(() => {
        expect(screen.getByRole('button')).toBeDisabled()
        expect(screen.getByRole('button')).toHaveTextContent('저장 중...')
      })
    })
  })

  describe('폼 리셋', () => {
    it('reset 호출 시 폼이 초기화되어야 함', async () => {
      const user = userEvent.setup()

      render(
        <FormWrapper
          schema={testSchema}
          onSubmit={vi.fn()}
          defaultValues={{ name: '', email: '' }}
        >
          {({ register, reset }) => (
            <>
              <input {...register('name')} data-testid="name-input" />
              <input {...register('email')} data-testid="email-input" />
              <button type="button" onClick={() => reset()}>
                초기화
              </button>
            </>
          )}
        </FormWrapper>
      )

      await user.type(screen.getByTestId('name-input'), '홍길동')
      await user.type(screen.getByTestId('email-input'), 'hong@example.com')

      expect(screen.getByTestId('name-input')).toHaveValue('홍길동')

      await user.click(screen.getByRole('button', { name: '초기화' }))

      await waitFor(() => {
        expect(screen.getByTestId('name-input')).toHaveValue('')
        expect(screen.getByTestId('email-input')).toHaveValue('')
      })
    })
  })
})

describe('FormField', () => {
  it('label이 렌더링되어야 함', () => {
    render(
      <FormField name="test" label="테스트 필드">
        <input data-testid="test-input" />
      </FormField>
    )

    expect(screen.getByText('테스트 필드')).toBeInTheDocument()
  })

  it('required 표시가 되어야 함', () => {
    render(
      <FormField name="test" label="테스트 필드" required>
        <input data-testid="test-input" />
      </FormField>
    )

    expect(screen.getByText('*')).toBeInTheDocument()
  })

  it('에러 메시지가 표시되어야 함', () => {
    render(
      <FormField name="test" label="테스트 필드" error="에러 메시지입니다.">
        <input data-testid="test-input" />
      </FormField>
    )

    expect(screen.getByText('에러 메시지입니다.')).toBeInTheDocument()
  })

  it('도움말 텍스트가 표시되어야 함', () => {
    render(
      <FormField name="test" label="테스트 필드" helpText="도움말 텍스트">
        <input data-testid="test-input" />
      </FormField>
    )

    expect(screen.getByText('도움말 텍스트')).toBeInTheDocument()
  })
})

describe('FormActions', () => {
  it('버튼들이 렌더링되어야 함', () => {
    render(
      <FormActions>
        <button>취소</button>
        <button>저장</button>
      </FormActions>
    )

    expect(screen.getByRole('button', { name: '취소' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '저장' })).toBeInTheDocument()
  })

  it('오른쪽 정렬되어야 함', () => {
    render(
      <FormActions>
        <button>저장</button>
      </FormActions>
    )

    const container = screen.getByRole('button', { name: '저장' }).parentElement
    expect(container).toHaveClass('justify-end')
  })
})
