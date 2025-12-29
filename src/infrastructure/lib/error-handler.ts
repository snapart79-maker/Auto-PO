/**
 * Global Error Handler
 *
 * 글로벌 에러 핸들러 - Supabase, Zod, 커스텀 에러 처리
 * PRD Section 8 참조
 */

import { toast } from 'sonner'
import { ZodError } from 'zod'
import type { PostgrestError } from '@supabase/supabase-js'

/**
 * Base API Error class
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public code?: string,
    public status?: number
  ) {
    super(message)
    this.name = 'ApiError'
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError)
    }
  }
}

/**
 * Duplicate data error (HTTP 409)
 */
export class DuplicateError extends ApiError {
  constructor(message: string) {
    super(message, 'DUPLICATE', 409)
    this.name = 'DuplicateError'
  }
}

/**
 * Not found error (HTTP 404)
 */
export class NotFoundError extends ApiError {
  constructor(message: string) {
    super(message, 'NOT_FOUND', 404)
    this.name = 'NotFoundError'
  }
}

/**
 * Validation error (HTTP 400)
 */
export class ValidationError extends ApiError {
  constructor(message: string) {
    super(message, 'VALIDATION', 400)
    this.name = 'ValidationError'
  }
}

/**
 * Supabase Postgrest 에러 타입 가드
 */
export function isPostgrestError(error: unknown): error is PostgrestError {
  // ApiError는 제외
  if (error instanceof Error) {
    return false
  }

  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error &&
    // PostgrestError는 details와 hint 속성을 가짐
    'details' in error
  )
}

/**
 * Postgrest 에러 코드를 한국어 메시지로 변환
 */
export function getPostgrestErrorMessage(error: PostgrestError): string {
  const errorMessages: Record<string, string> = {
    '23505': '이미 존재하는 데이터입니다.',
    '23503': '참조하는 데이터가 존재하지 않습니다.',
    '23502': '필수 항목이 누락되었습니다.',
    '42501': '권한이 없습니다.',
    'PGRST116': '데이터를 찾을 수 없습니다.',
  }

  return errorMessages[error.code] ?? error.message
}

/**
 * 글로벌 에러 핸들러
 *
 * @param error - 처리할 에러 객체
 * @example
 * ```ts
 * try {
 *   await supabase.from('products').insert(data)
 * } catch (error) {
 *   handleApiError(error)
 * }
 * ```
 */
export function handleApiError(error: unknown): void {
  console.error('API Error:', error)

  // Zod 유효성 검증 에러
  if (error instanceof ZodError) {
    const messages = error.errors.map((e) => e.message).join('\n')
    toast.error('입력값 오류', { description: messages })
    return
  }

  // Supabase Postgrest 에러
  if (isPostgrestError(error)) {
    const message = getPostgrestErrorMessage(error)
    toast.error('데이터베이스 오류', { description: message })
    return
  }

  // 커스텀 API 에러
  if (error instanceof ApiError) {
    toast.error(error.message)
    return
  }

  // 일반 Error
  if (error instanceof Error) {
    toast.error('오류가 발생했습니다.', { description: error.message })
    return
  }

  // 알 수 없는 에러
  toast.error('알 수 없는 오류가 발생했습니다.')
}

/**
 * 에러를 사용자 친화적 메시지로 변환
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof ZodError) {
    return error.errors.map((e) => e.message).join(', ')
  }

  if (isPostgrestError(error)) {
    return getPostgrestErrorMessage(error)
  }

  if (error instanceof Error) {
    return error.message
  }

  return '알 수 없는 오류가 발생했습니다.'
}
