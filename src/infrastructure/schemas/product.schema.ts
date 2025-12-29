/**
 * Product Zod Schemas
 *
 * 제품 관련 유효성 검증 스키마
 * PRD Section 6 참조
 */

import { z } from 'zod'
import {
  uuidSchema,
  optionalUuidSchema,
  supplierTypeSchema,
  currencySchema,
  leadTimeSchema,
  intPercentageSchema,
  isActiveSchema,
} from './common.schema'

/**
 * 제품 기본 스키마
 */
export const productSchema = z.object({
  product_code: z
    .string()
    .min(1, '품번을 입력하세요.')
    .max(50, '품번은 50자 이하여야 합니다.')
    .regex(/^[A-Za-z0-9-]+$/, '품번은 영문, 숫자, 하이픈만 가능합니다.'),

  product_name: z
    .string()
    .min(1, '품명을 입력하세요.')
    .max(200, '품명은 200자 이하여야 합니다.'),

  vehicle_model_id: z
    .string()
    .uuid('유효한 차종을 선택하세요.')
    .optional()
    .nullable(),

  domestic_lead_time: leadTimeSchema.default(3),

  overseas_lead_time: leadTimeSchema.default(21),

  primary_supplier: supplierTypeSchema.default('DOMESTIC'),

  main_partner_id: optionalUuidSchema,

  sub_partner_id: optionalUuidSchema,

  domestic_ratio: intPercentageSchema.default(100),

  unit_price: z
    .number()
    .positive('단가는 0보다 커야 합니다.')
    .optional()
    .nullable(),

  currency: currencySchema.default('KRW'),

  is_active: isActiveSchema,

  // 확장 필드
  project_code: z.string().max(50).optional().nullable(),
  spec1: z.string().max(100).optional().nullable(),
  spec2: z.string().max(100).optional().nullable(),
  spec3: z.string().max(100).optional().nullable(),
  moq: z.number().int().positive().optional().nullable(),
  product_type: z.string().max(50).optional().nullable(),
  unit: z.string().max(20).optional().nullable(),
  effective_start_date: z.coerce.date().optional().nullable(),
  effective_end_date: z.coerce.date().optional().nullable(),
})

/**
 * 제품 폼 데이터 타입
 */
export type ProductFormData = z.infer<typeof productSchema>

/**
 * 제품 수정용 스키마 (ID 포함)
 */
export const productUpdateSchema = productSchema.extend({
  id: uuidSchema,
})

/**
 * 제품 수정 데이터 타입
 */
export type ProductUpdateData = z.infer<typeof productUpdateSchema>

/**
 * 제품 일괄 등록용 스키마
 */
export const productBulkSchema = z.array(productSchema)

/**
 * 제품 일괄 등록 데이터 타입
 */
export type ProductBulkData = z.infer<typeof productBulkSchema>

/**
 * 조건부 검증이 포함된 제품 스키마
 * - BOTH 선택 시 비율 1-99% 필수
 * - BOTH 선택 시 양쪽 거래처 필수
 */
export const productSchemaWithValidation = productSchema.superRefine(
  (data, ctx) => {
    // BOTH인 경우 비율 검증
    if (data.primary_supplier === 'BOTH') {
      if (data.domestic_ratio <= 0 || data.domestic_ratio >= 100) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: '이원화(BOTH) 선택 시 국내 비율은 1~99% 사이여야 합니다.',
          path: ['domestic_ratio'],
        })
      }

      if (!data.main_partner_id) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: '이원화(BOTH) 선택 시 국내 거래처는 필수입니다.',
          path: ['main_partner_id'],
        })
      }

      if (!data.sub_partner_id) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: '이원화(BOTH) 선택 시 베트남 거래처는 필수입니다.',
          path: ['sub_partner_id'],
        })
      }
    }

    // 해외 공급 시 해외 리드타임 검증
    if (data.primary_supplier !== 'DOMESTIC') {
      if (!data.overseas_lead_time || data.overseas_lead_time < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: '해외 공급 시 해외 리드타임을 입력하세요.',
          path: ['overseas_lead_time'],
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
 * 제품 필터 스키마
 */
export const productFilterSchema = z.object({
  vehicleModelId: z.string().uuid().optional(),
  primarySupplier: supplierTypeSchema.optional(),
  mainPartnerId: z.string().uuid().optional(),
  isActive: z.boolean().optional(),
  searchText: z.string().optional(),
})

/**
 * 제품 필터 타입
 */
export type ProductFilter = z.infer<typeof productFilterSchema>
