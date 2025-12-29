/**
 * Partner Zod Schemas
 *
 * 거래처 관련 유효성 검증 스키마
 * PRD Section 6 참조
 */

import { z } from 'zod'
import {
  uuidSchema,
  optionalEmailSchema,
  optionalPhoneSchema,
  partnerTypeSchema,
  currencySchema,
  isActiveSchema,
} from './common.schema'

/**
 * 거래처 기본 스키마
 */
export const partnerSchema = z.object({
  partner_code: z
    .string()
    .min(1, '거래처 코드를 입력하세요.')
    .max(20, '거래처 코드는 20자 이하여야 합니다.'),

  partner_name: z
    .string()
    .min(1, '거래처명을 입력하세요.')
    .max(100, '거래처명은 100자 이하여야 합니다.'),

  partner_type: partnerTypeSchema,

  business_number: z
    .string()
    .max(20, '사업자번호는 20자 이하여야 합니다.')
    .optional()
    .nullable(),

  address: z
    .string()
    .max(200, '주소는 200자 이하여야 합니다.')
    .optional()
    .nullable(),

  contact_person: z
    .string()
    .max(50, '담당자명은 50자 이하여야 합니다.')
    .optional()
    .nullable(),

  contact_phone: optionalPhoneSchema,

  contact_email: optionalEmailSchema,

  currency: currencySchema.default('KRW'),

  is_active: isActiveSchema,

  // 확장 필드
  note: z.string().max(500).optional().nullable(),
  partner_group: z.string().max(50).optional().nullable(),
  ceo_name: z.string().max(50).optional().nullable(),
  foundation_date: z.coerce.date().optional().nullable(),
  postal_code: z.string().max(10).optional().nullable(),
  business_type: z.string().max(50).optional().nullable(),
  industry_type: z.string().max(50).optional().nullable(),
  country_code: z.string().max(3).optional().nullable(),
  incoterms: z.string().max(20).optional().nullable(),
  phone2: optionalPhoneSchema,
  website: z.string().url().max(200).optional().nullable(),
  partner_contact_phone: optionalPhoneSchema,
  manager: z.string().max(50).optional().nullable(),
  effective_start_date: z.coerce.date().optional().nullable(),
  effective_end_date: z.coerce.date().optional().nullable(),
})

/**
 * 거래처 폼 데이터 타입
 */
export type PartnerFormData = z.infer<typeof partnerSchema>

/**
 * 거래처 수정용 스키마 (ID 포함)
 */
export const partnerUpdateSchema = partnerSchema.extend({
  id: uuidSchema,
})

/**
 * 거래처 수정 데이터 타입
 */
export type PartnerUpdateData = z.infer<typeof partnerUpdateSchema>

/**
 * 거래처 일괄 등록용 스키마
 */
export const partnerBulkSchema = z.array(partnerSchema)

/**
 * 거래처 일괄 등록 데이터 타입
 */
export type PartnerBulkData = z.infer<typeof partnerBulkSchema>

/**
 * 조건부 검증이 포함된 거래처 스키마
 */
export const partnerSchemaWithValidation = partnerSchema.superRefine(
  (data, ctx) => {
    // 베트남 거래처인 경우 통화 검증
    if (data.partner_type === 'VIETNAM') {
      if (data.currency !== 'USD' && data.currency !== 'VND') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: '베트남 거래처는 USD 또는 VND를 사용해야 합니다.',
          path: ['currency'],
        })
      }
    }

    // 유효기간 검증
    if (data.effective_start_date && data.effective_end_date) {
      if (data.effective_start_date > data.effective_end_date) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: '유효 시작일은 종료일보다 이전이어야 합니다.',
          path: ['effective_start_date'],
        })
      }
    }
  }
)

/**
 * 거래처 필터 스키마
 */
export const partnerFilterSchema = z.object({
  partnerType: partnerTypeSchema.optional(),
  isActive: z.boolean().optional(),
  searchText: z.string().optional(),
})

/**
 * 거래처 필터 타입
 */
export type PartnerFilter = z.infer<typeof partnerFilterSchema>
