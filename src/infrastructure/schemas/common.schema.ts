/**
 * Common Zod Schemas
 *
 * 공통으로 사용되는 유효성 검증 스키마
 * PRD Section 6 참조
 */

import { z } from 'zod'

/**
 * UUID 스키마
 */
export const uuidSchema = z.string().uuid('유효한 ID 형식이 아닙니다.')

/**
 * 이메일 스키마
 */
export const emailSchema = z.string().email('유효한 이메일 형식을 입력하세요.')

/**
 * 전화번호 스키마 (한국 전화번호)
 */
export const phoneSchema = z
  .string()
  .regex(
    /^(0[0-9]{1,2})?-?([0-9]{3,4})-?([0-9]{4})$/,
    '유효한 전화번호 형식을 입력하세요.'
  )

/**
 * 통화 코드 스키마
 */
export const currencySchema = z.enum(['KRW', 'USD', 'EUR', 'VND'], {
  errorMap: () => ({ message: '유효한 통화를 선택하세요.' }),
})

/**
 * 통화 타입
 */
export type Currency = z.infer<typeof currencySchema>

/**
 * 날짜 스키마
 */
export const dateSchema = z.coerce.date({
  errorMap: () => ({ message: '유효한 날짜를 입력하세요.' }),
})

/**
 * 양수 스키마
 */
export const positiveNumberSchema = z
  .number()
  .positive('0보다 큰 값을 입력하세요.')

/**
 * 퍼센트 스키마 (0-100)
 */
export const percentageSchema = z
  .number()
  .min(0, '비율은 0% 이상이어야 합니다.')
  .max(100, '비율은 100% 이하여야 합니다.')

/**
 * 정수 퍼센트 스키마 (0-100)
 */
export const intPercentageSchema = percentageSchema.int('정수를 입력하세요.')

/**
 * 한글 포함 텍스트 스키마
 */
export const koreanTextSchema = z.string()

/**
 * 선택적 UUID 스키마
 */
export const optionalUuidSchema = z
  .string()
  .uuid('유효한 ID 형식이 아닙니다.')
  .optional()
  .nullable()

/**
 * 선택적 이메일 스키마
 */
export const optionalEmailSchema = z
  .union([z.string().email('유효한 이메일 형식을 입력하세요.'), z.literal('')])
  .optional()
  .nullable()

/**
 * 선택적 전화번호 스키마
 */
export const optionalPhoneSchema = z
  .union([
    z
      .string()
      .regex(
        /^(0[0-9]{1,2})?-?([0-9]{3,4})-?([0-9]{4})$/,
        '유효한 전화번호 형식을 입력하세요.'
      ),
    z.literal(''),
  ])
  .optional()
  .nullable()

/**
 * 공급처 유형 스키마
 */
export const supplierTypeSchema = z.enum(['DOMESTIC', 'VIETNAM', 'BOTH'], {
  errorMap: () => ({ message: '유효한 공급처를 선택하세요.' }),
})

/**
 * 공급처 타입
 */
export type SupplierType = z.infer<typeof supplierTypeSchema>

/**
 * 거래처 유형 스키마
 */
export const partnerTypeSchema = z.enum(['SUPPLIER', 'CUSTOMER', 'VIETNAM'], {
  errorMap: () => ({ message: '유효한 거래처 유형을 선택하세요.' }),
})

/**
 * 거래처 타입
 */
export type PartnerType = z.infer<typeof partnerTypeSchema>

/**
 * 리드타임 스키마 (1-365일)
 */
export const leadTimeSchema = z
  .number()
  .int('정수를 입력하세요.')
  .min(1, '리드타임은 1일 이상이어야 합니다.')
  .max(365, '리드타임은 365일 이하여야 합니다.')

/**
 * 활성 상태 스키마
 */
export const isActiveSchema = z.boolean().default(true)

/**
 * 페이지네이션 스키마
 */
export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(10),
})

/**
 * 정렬 스키마
 */
export const sortSchema = z.object({
  field: z.string(),
  direction: z.enum(['asc', 'desc']).default('asc'),
})
