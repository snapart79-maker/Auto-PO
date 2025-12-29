/**
 * API Wrapper Functions
 *
 * Supabase API 호출을 래핑하여 일관된 에러 처리와 타입 안전성 제공
 * PRD Section 8.2 참조
 */

import { supabase } from '../supabase/client'
import { handleApiError, DuplicateError, NotFoundError } from './error-handler'
import type { PostgrestError } from '@supabase/supabase-js'

/**
 * API 호출 결과 타입
 */
export type ApiResult<T> = {
  data: T | null
  error: Error | null
}

/**
 * Supabase API 호출 래퍼
 *
 * @param fn - Supabase 쿼리를 반환하는 함수
 * @returns 데이터와 에러를 포함한 결과 객체
 *
 * @example
 * ```ts
 * const { data, error } = await apiCall(() =>
 *   supabase.from('products').select('*')
 * )
 * ```
 */
export async function apiCall<T>(
  fn: () => Promise<{ data: T | null; error: PostgrestError | null }>
): Promise<ApiResult<T>> {
  try {
    const { data, error } = await fn()

    if (error) {
      throw error
    }

    return { data, error: null }
  } catch (error) {
    handleApiError(error)
    return { data: null, error: error as Error }
  }
}

/**
 * 에러 표시 없이 API 호출 (조용한 모드)
 *
 * @param fn - Supabase 쿼리를 반환하는 함수
 * @returns 데이터와 에러를 포함한 결과 객체
 */
export async function apiCallSilent<T>(
  fn: () => Promise<{ data: T | null; error: PostgrestError | null }>
): Promise<ApiResult<T>> {
  try {
    const { data, error } = await fn()

    if (error) {
      console.error('API Error (silent):', error)
      return { data: null, error }
    }

    return { data, error: null }
  } catch (error) {
    console.error('API Error (silent):', error)
    return { data: null, error: error as Error }
  }
}

/**
 * 데이터가 있는지 확인하고 없으면 에러 발생
 *
 * @param result - apiCall 결과
 * @param errorMessage - 데이터가 없을 때 에러 메시지
 * @returns 데이터 (null이 아님을 보장)
 * @throws NotFoundError 데이터가 없을 경우
 */
export function requireData<T>(
  result: ApiResult<T>,
  errorMessage = '데이터를 찾을 수 없습니다.'
): T {
  if (result.error) {
    throw result.error
  }

  if (result.data === null) {
    throw new NotFoundError(errorMessage)
  }

  return result.data
}

/**
 * 중복 체크 유틸리티
 *
 * @param table - 테이블명
 * @param column - 체크할 컬럼
 * @param value - 체크할 값
 * @param excludeId - 제외할 ID (수정 시)
 * @returns 중복 여부
 */
export async function checkDuplicate(
  table: string,
  column: string,
  value: string,
  excludeId?: string
): Promise<boolean> {
  let query = supabase
    .from(table)
    .select('id')
    .eq(column, value)
    .limit(1)

  if (excludeId) {
    query = query.neq('id', excludeId)
  }

  const { data } = await query

  return !!data && data.length > 0
}

/**
 * 중복 체크 후 에러 발생
 *
 * @param table - 테이블명
 * @param column - 체크할 컬럼
 * @param value - 체크할 값
 * @param errorMessage - 중복 시 에러 메시지
 * @param excludeId - 제외할 ID (수정 시)
 * @throws DuplicateError 중복된 경우
 */
export async function throwIfDuplicate(
  table: string,
  column: string,
  value: string,
  errorMessage: string,
  excludeId?: string
): Promise<void> {
  const isDuplicate = await checkDuplicate(table, column, value, excludeId)

  if (isDuplicate) {
    throw new DuplicateError(errorMessage)
  }
}

export { supabase }
