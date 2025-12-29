/**
 * Error Handler Unit Tests
 * TDD: RED Phase - 테스트 먼저 작성
 */
// @ts-nocheck - Test file type checking is less strict
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import { z } from 'zod'
import * as sonner from 'sonner'
import type { PostgrestError } from '@supabase/supabase-js'

// 테스트 대상 모듈 임포트
import {
  ApiError,
  DuplicateError,
  NotFoundError,
  ValidationError,
  handleApiError,
  isPostgrestError,
  getPostgrestErrorMessage,
} from '@infrastructure/lib/error-handler'

// sonner 모듈 spy
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}))

// Type-safe access to mocked toast
const mockedToast = sonner.toast as unknown as {
  error: Mock
  success: Mock
}

describe('Error Classes', () => {
  describe('ApiError', () => {
    it('should create an ApiError with message, code, and status', () => {
      const error = new ApiError('테스트 에러', 'TEST_CODE', 500)

      expect(error.message).toBe('테스트 에러')
      expect(error.code).toBe('TEST_CODE')
      expect(error.status).toBe(500)
      expect(error.name).toBe('ApiError')
      expect(error).toBeInstanceOf(Error)
    })

    it('should create an ApiError with only message', () => {
      const error = new ApiError('간단한 에러')

      expect(error.message).toBe('간단한 에러')
      expect(error.code).toBeUndefined()
      expect(error.status).toBeUndefined()
    })
  })

  describe('DuplicateError', () => {
    it('should create a DuplicateError with correct defaults', () => {
      const error = new DuplicateError('이미 존재하는 품번입니다.')

      expect(error.message).toBe('이미 존재하는 품번입니다.')
      expect(error.code).toBe('DUPLICATE')
      expect(error.status).toBe(409)
      expect(error.name).toBe('DuplicateError')
      expect(error).toBeInstanceOf(ApiError)
    })
  })

  describe('NotFoundError', () => {
    it('should create a NotFoundError with correct defaults', () => {
      const error = new NotFoundError('데이터를 찾을 수 없습니다.')

      expect(error.message).toBe('데이터를 찾을 수 없습니다.')
      expect(error.code).toBe('NOT_FOUND')
      expect(error.status).toBe(404)
      expect(error.name).toBe('NotFoundError')
      expect(error).toBeInstanceOf(ApiError)
    })
  })

  describe('ValidationError', () => {
    it('should create a ValidationError with correct defaults', () => {
      const error = new ValidationError('유효성 검증 실패')

      expect(error.message).toBe('유효성 검증 실패')
      expect(error.code).toBe('VALIDATION')
      expect(error.status).toBe(400)
      expect(error.name).toBe('ValidationError')
      expect(error).toBeInstanceOf(ApiError)
    })
  })
})

describe('isPostgrestError', () => {
  it('should return true for Postgrest error objects', () => {
    const postgrestError = {
      code: '23505',
      message: 'duplicate key value',
      details: 'Key already exists',
      hint: null,
    }

    expect(isPostgrestError(postgrestError)).toBe(true)
  })

  it('should return false for null', () => {
    expect(isPostgrestError(null)).toBe(false)
  })

  it('should return false for undefined', () => {
    expect(isPostgrestError(undefined)).toBe(false)
  })

  it('should return false for string', () => {
    expect(isPostgrestError('error')).toBe(false)
  })

  it('should return false for object without code', () => {
    expect(isPostgrestError({ message: 'error', details: null })).toBe(false)
  })

  it('should return false for object without message', () => {
    expect(isPostgrestError({ code: '23505', details: null })).toBe(false)
  })

  it('should return false for object without details (not a PostgrestError)', () => {
    expect(isPostgrestError({ code: '23505', message: 'error' })).toBe(false)
  })

  it('should return false for Error instances', () => {
    const error = new Error('test error')
    expect(isPostgrestError(error)).toBe(false)
  })

  it('should return false for ApiError instances', () => {
    const error = new ApiError('test error', 'CODE', 500)
    expect(isPostgrestError(error)).toBe(false)
  })
})

// Helper to create PostgrestError-like objects for testing
const createPostgrestError = (code: string, message: string) => ({
  code,
  message,
  details: null as string | null,
  hint: null as string | null,
  name: 'PostgrestError' as const,
}) satisfies PostgrestError

describe('getPostgrestErrorMessage', () => {
  it('should return Korean message for duplicate key error (23505)', () => {
    const error = createPostgrestError('23505', 'duplicate key value')
    expect(getPostgrestErrorMessage(error)).toBe('이미 존재하는 데이터입니다.')
  })

  it('should return Korean message for foreign key violation (23503)', () => {
    const error = createPostgrestError('23503', 'foreign key violation')
    expect(getPostgrestErrorMessage(error)).toBe('참조하는 데이터가 존재하지 않습니다.')
  })

  it('should return Korean message for not null violation (23502)', () => {
    const error = createPostgrestError('23502', 'not null violation')
    expect(getPostgrestErrorMessage(error)).toBe('필수 항목이 누락되었습니다.')
  })

  it('should return Korean message for permission denied (42501)', () => {
    const error = createPostgrestError('42501', 'permission denied')
    expect(getPostgrestErrorMessage(error)).toBe('권한이 없습니다.')
  })

  it('should return Korean message for PGRST116', () => {
    const error = createPostgrestError('PGRST116', 'not found')
    expect(getPostgrestErrorMessage(error)).toBe('데이터를 찾을 수 없습니다.')
  })

  it('should return original message for unknown error codes', () => {
    const error = createPostgrestError('UNKNOWN', 'Some unknown error')
    expect(getPostgrestErrorMessage(error)).toBe('Some unknown error')
  })
})

describe('handleApiError', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Suppress console.error output during tests
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('should handle ZodError and show validation messages', () => {
    const schema = z.object({
      name: z.string().min(1, '이름을 입력하세요.'),
      age: z.number().positive('나이는 양수여야 합니다.'),
    })

    try {
      schema.parse({ name: '', age: -1 })
    } catch (error) {
      handleApiError(error)
    }

    expect(mockedToast.error).toHaveBeenCalledWith('입력값 오류', expect.objectContaining({
      description: expect.stringContaining('이름을 입력하세요.'),
    }))
  })

  it('should handle Postgrest error and show Korean message', () => {
    const postgrestError = {
      code: '23505',
      message: 'duplicate key value',
      details: null,
      hint: null,
    }

    handleApiError(postgrestError)

    expect(mockedToast.error).toHaveBeenCalledWith('데이터베이스 오류', expect.objectContaining({
      description: '이미 존재하는 데이터입니다.',
    }))
  })

  it('should handle ApiError and show error message', () => {
    const error = new ApiError('API 호출 실패')

    handleApiError(error)

    expect(mockedToast.error).toHaveBeenCalledWith('API 호출 실패')
  })

  it('should handle DuplicateError', () => {
    const error = new DuplicateError('이미 존재하는 품번입니다.')

    handleApiError(error)

    expect(mockedToast.error).toHaveBeenCalledWith('이미 존재하는 품번입니다.')
  })

  it('should handle generic Error and show message', () => {
    const error = new Error('일반 에러 메시지')

    handleApiError(error)

    expect(mockedToast.error).toHaveBeenCalledWith('오류가 발생했습니다.', expect.objectContaining({
      description: '일반 에러 메시지',
    }))
  })

  it('should handle unknown error types', () => {
    handleApiError('문자열 에러')

    expect(mockedToast.error).toHaveBeenCalledWith('알 수 없는 오류가 발생했습니다.')
  })

  it('should handle null', () => {
    handleApiError(null)

    expect(mockedToast.error).toHaveBeenCalledWith('알 수 없는 오류가 발생했습니다.')
  })

  it('should log error to console', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const error = new Error('테스트 에러')

    handleApiError(error)

    expect(consoleSpy).toHaveBeenCalledWith('API Error:', error)
    consoleSpy.mockRestore()
  })
})
