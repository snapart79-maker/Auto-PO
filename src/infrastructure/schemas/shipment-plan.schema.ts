/**
 * Shipment Plan Zod Schemas
 *
 * 출하 계획 유효성 검증 스키마
 * PRD Section 6.2 참조
 */

import { z } from 'zod'

/**
 * 계획 유형 스키마
 */
export const planTypeSchema = z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'], {
  required_error: '계획 유형을 선택하세요.',
  invalid_type_error: '계획 유형은 DAILY, WEEKLY, MONTHLY, YEARLY만 가능합니다.',
})

export type PlanType = z.infer<typeof planTypeSchema>

/**
 * 출하 계획 단일 항목 스키마 (업로드용)
 */
export const shipmentPlanRowSchema = z.object({
  partner_code: z
    .string()
    .min(1, '거래처코드를 입력하세요.')
    .max(50, '거래처코드는 50자 이하여야 합니다.'),

  product_code: z
    .string()
    .min(1, '품번을 입력하세요.')
    .max(50, '품번은 50자 이하여야 합니다.'),

  plan_date: z.coerce.date({
    required_error: '납품일을 입력하세요.',
    invalid_type_error: '올바른 날짜 형식이 아닙니다.',
  }),

  plan_type: planTypeSchema.default('DAILY'),

  planned_quantity: z
    .number()
    .int('수량은 정수여야 합니다.')
    .positive('수량은 1 이상이어야 합니다.'),

  vehicle_model_code: z.string().max(50).optional().nullable(),
})

/**
 * 출하 계획 단일 항목 타입
 */
export type ShipmentPlanRowData = z.infer<typeof shipmentPlanRowSchema>

/**
 * 출하 계획 일괄 등록 스키마
 */
export const shipmentPlanBulkSchema = z.array(shipmentPlanRowSchema).min(1, '등록할 데이터가 없습니다.')

/**
 * 출하 계획 일괄 등록 타입
 */
export type ShipmentPlanBulkData = z.infer<typeof shipmentPlanBulkSchema>

/**
 * 출하 계획 폼 데이터 스키마 (DB 저장용)
 */
export const shipmentPlanFormSchema = z.object({
  partner_id: z.string().uuid('유효한 거래처를 선택하세요.'),
  product_id: z.string().uuid('유효한 품목을 선택하세요.'),
  plan_date: z.coerce.date({
    required_error: '납품일을 입력하세요.',
    invalid_type_error: '올바른 날짜 형식이 아닙니다.',
  }),
  plan_type: planTypeSchema.default('DAILY'),
  planned_quantity: z
    .number()
    .int('수량은 정수여야 합니다.')
    .positive('수량은 1 이상이어야 합니다.'),
  vehicle_model_id: z.string().uuid().optional().nullable(),
})

/**
 * 출하 계획 폼 데이터 타입
 */
export type ShipmentPlanFormData = z.infer<typeof shipmentPlanFormSchema>

/**
 * 출하 계획 업로드 파싱 결과 검증 스키마
 */
export const shipmentPlanUploadRowSchema = z.object({
  rowNumber: z.number().int().positive(),
  partnerCode: z.string().min(1),
  productCode: z.string().min(1),
  planDate: z.date(),
  planType: planTypeSchema,
  plannedQuantity: z.number().int().positive(),
  vehicleModelCode: z.string().optional(),
})

/**
 * 출하 계획 업로드 행 타입
 */
export type ShipmentPlanUploadRow = z.infer<typeof shipmentPlanUploadRowSchema>
