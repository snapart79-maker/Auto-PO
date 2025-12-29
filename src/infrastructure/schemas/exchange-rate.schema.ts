/**
 * Exchange Rate Zod Schemas
 *
 * 환율 관련 유효성 검증 스키마
 * PRD Section 6 참조
 */

import { z } from 'zod'
import { uuidSchema, dateSchema } from './common.schema'

/**
 * 환율용 통화 코드 스키마 (KRW 제외)
 */
export const exchangeRateCurrencySchema = z.enum(['USD', 'EUR', 'JPY', 'CNY', 'VND'], {
  errorMap: () => ({ message: '지원하는 통화를 선택하세요. (USD, EUR, JPY, CNY, VND)' }),
})

/**
 * 환율 기본 스키마
 */
export const exchangeRateSchema = z.object({
  currency_code: exchangeRateCurrencySchema,

  rate: z
    .number()
    .positive('환율은 0보다 커야 합니다.')
    .max(100000000, '환율이 너무 큽니다.'),

  effective_date: dateSchema,
})

/**
 * 환율 폼 데이터 타입
 */
export type ExchangeRateFormData = z.infer<typeof exchangeRateSchema>

/**
 * 환율 수정용 스키마 (ID 포함)
 */
export const exchangeRateUpdateSchema = exchangeRateSchema.extend({
  id: uuidSchema,
})

/**
 * 환율 수정 데이터 타입
 */
export type ExchangeRateUpdateData = z.infer<typeof exchangeRateUpdateSchema>

/**
 * 환율 일괄 등록용 스키마
 */
export const exchangeRateBulkSchema = z.array(exchangeRateSchema)

/**
 * 환율 일괄 등록 데이터 타입
 */
export type ExchangeRateBulkData = z.infer<typeof exchangeRateBulkSchema>

/**
 * 조건부 검증이 포함된 환율 스키마
 * - VND는 소수점 허용
 * - 기타 통화는 정수 권장
 */
export const exchangeRateSchemaWithValidation = exchangeRateSchema.superRefine(
  (data, ctx) => {
    // VND 환율은 매우 작은 값이므로 소수점 허용
    if (data.currency_code === 'VND' && data.rate >= 1) {
      // VND는 보통 0.05 ~ 0.1 정도
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'VND 환율은 일반적으로 1보다 작습니다. (예: 0.055)',
        path: ['rate'],
      })
    }

    // JPY 환율 검증 (보통 8~15 정도)
    if (data.currency_code === 'JPY' && (data.rate < 5 || data.rate > 30)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '환율 범위를 확인하세요. (일반적인 JPY 환율: 8~15원)',
        path: ['rate'],
      })
    }
  }
)

/**
 * 환율 필터 스키마
 */
export const exchangeRateFilterSchema = z.object({
  currencyCode: exchangeRateCurrencySchema.optional(),
  effectiveDate: dateSchema.optional(),
})

/**
 * 환율 필터 타입
 */
export type ExchangeRateFilter = z.infer<typeof exchangeRateFilterSchema>
