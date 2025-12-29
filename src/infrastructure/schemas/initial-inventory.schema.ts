/**
 * Initial Inventory Zod Schemas
 *
 * 초기 재고 유효성 검증 스키마
 * PRD Section 5.3 참조
 */

import { z } from 'zod'

/**
 * 초기 재고 단일 항목 스키마
 */
export const initialInventoryRowSchema = z.object({
  product_code: z
    .string()
    .min(1, '품번을 입력하세요.')
    .max(50, '품번은 50자 이하여야 합니다.'),

  quantity: z
    .number()
    .int('수량은 정수여야 합니다.')
    .min(0, '수량은 0 이상이어야 합니다.'),

  base_date: z.coerce.date({
    required_error: '기준일을 입력하세요.',
    invalid_type_error: '올바른 날짜 형식이 아닙니다.',
  }),

  remarks: z.string().max(500, '비고는 500자 이하여야 합니다.').optional().nullable(),
})

/**
 * 초기 재고 단일 항목 타입
 */
export type InitialInventoryRowData = z.infer<typeof initialInventoryRowSchema>

/**
 * 초기 재고 일괄 등록 스키마
 */
export const initialInventoryBulkSchema = z.array(initialInventoryRowSchema).min(1, '등록할 데이터가 없습니다.')

/**
 * 초기 재고 일괄 등록 타입
 */
export type InitialInventoryBulkData = z.infer<typeof initialInventoryBulkSchema>

/**
 * 초기 재고 폼 데이터 스키마 (DB 저장용)
 */
export const initialInventoryFormSchema = z.object({
  product_id: z.string().uuid('유효한 품목을 선택하세요.'),
  base_date: z.coerce.date({
    required_error: '기준일을 입력하세요.',
    invalid_type_error: '올바른 날짜 형식이 아닙니다.',
  }),
  quantity: z
    .number()
    .int('수량은 정수여야 합니다.')
    .min(0, '수량은 0 이상이어야 합니다.'),
  remarks: z.string().max(500).optional().nullable(),
})

/**
 * 초기 재고 폼 데이터 타입
 */
export type InitialInventoryFormData = z.infer<typeof initialInventoryFormSchema>

/**
 * 초기 재고 업로드 파싱 결과 검증 스키마
 */
export const initialInventoryUploadRowSchema = z.object({
  rowNumber: z.number().int().positive(),
  productCode: z.string().min(1),
  quantity: z.number().int().min(0),
  baseDate: z.date(),
  remarks: z.string().optional(),
})

/**
 * 초기 재고 업로드 행 타입
 */
export type InitialInventoryUploadRow = z.infer<typeof initialInventoryUploadRowSchema>
