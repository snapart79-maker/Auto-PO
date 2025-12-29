/**
 * Inventory Adjustment Zod Schemas
 *
 * 재고 조정 유효성 검증 스키마
 * PRD Section 5.4 참조
 */

import { z } from 'zod'

/**
 * 조정 유형 스키마
 */
export const adjustmentTypeSchema = z.enum(['INCREASE', 'DECREASE'], {
  required_error: '조정 유형을 선택하세요.',
  invalid_type_error: '조정 유형은 INCREASE 또는 DECREASE만 가능합니다.',
})

export type AdjustmentType = z.infer<typeof adjustmentTypeSchema>

/**
 * 조정 사유 스키마
 */
export const adjustmentReasonSchema = z.enum(['PHYSICAL_COUNT', 'LOSS', 'DAMAGE', 'OTHER'], {
  required_error: '조정 사유를 선택하세요.',
  invalid_type_error: '올바른 조정 사유를 선택하세요.',
})

export type AdjustmentReason = z.infer<typeof adjustmentReasonSchema>

/**
 * 재고 조정 단일 항목 스키마 (업로드용)
 */
export const inventoryAdjustmentRowSchema = z.object({
  product_code: z
    .string()
    .min(1, '품번을 입력하세요.')
    .max(50, '품번은 50자 이하여야 합니다.'),

  adjustment_date: z.coerce.date({
    required_error: '조정일을 입력하세요.',
    invalid_type_error: '올바른 날짜 형식이 아닙니다.',
  }),

  adjustment_type: adjustmentTypeSchema,

  quantity: z
    .number()
    .int('수량은 정수여야 합니다.')
    .positive('수량은 1 이상이어야 합니다.'),

  reason: adjustmentReasonSchema,

  remarks: z.string().max(500, '비고는 500자 이하여야 합니다.').optional().nullable(),
})

/**
 * 재고 조정 단일 항목 타입
 */
export type InventoryAdjustmentRowData = z.infer<typeof inventoryAdjustmentRowSchema>

/**
 * 재고 조정 일괄 등록 스키마
 */
export const inventoryAdjustmentBulkSchema = z.array(inventoryAdjustmentRowSchema).min(1, '등록할 데이터가 없습니다.')

/**
 * 재고 조정 일괄 등록 타입
 */
export type InventoryAdjustmentBulkData = z.infer<typeof inventoryAdjustmentBulkSchema>

/**
 * 재고 조정 폼 데이터 스키마 (DB 저장용)
 */
export const inventoryAdjustmentFormSchema = z.object({
  product_id: z.string().uuid('유효한 품목을 선택하세요.'),
  adjustment_date: z.coerce.date({
    required_error: '조정일을 입력하세요.',
    invalid_type_error: '올바른 날짜 형식이 아닙니다.',
  }),
  adjustment_type: adjustmentTypeSchema,
  quantity: z
    .number()
    .int('수량은 정수여야 합니다.')
    .positive('수량은 1 이상이어야 합니다.'),
  reason: adjustmentReasonSchema,
  remarks: z.string().max(500).optional().nullable(),
})

/**
 * 재고 조정 폼 데이터 타입
 */
export type InventoryAdjustmentFormData = z.infer<typeof inventoryAdjustmentFormSchema>

/**
 * 재고 조정 업로드 파싱 결과 검증 스키마
 */
export const inventoryAdjustmentUploadRowSchema = z.object({
  rowNumber: z.number().int().positive(),
  productCode: z.string().min(1),
  adjustmentDate: z.date(),
  adjustmentType: adjustmentTypeSchema,
  quantity: z.number().int().positive(),
  reason: adjustmentReasonSchema,
  remarks: z.string().optional(),
})

/**
 * 재고 조정 업로드 행 타입
 */
export type InventoryAdjustmentUploadRow = z.infer<typeof inventoryAdjustmentUploadRowSchema>
