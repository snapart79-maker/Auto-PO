/**
 * Vehicle Model Zod Schemas
 *
 * 차종 관련 유효성 검증 스키마
 * PRD Section 6 참조
 */

import { z } from 'zod'
import { uuidSchema, isActiveSchema } from './common.schema'

/**
 * 차종 기본 스키마
 */
export const vehicleModelSchema = z.object({
  vehicle_code: z
    .string()
    .min(1, '차종 코드를 입력하세요.')
    .max(20, '차종 코드는 20자 이하여야 합니다.'),

  vehicle_name: z
    .string()
    .min(1, '차종명을 입력하세요.')
    .max(100, '차종명은 100자 이하여야 합니다.'),

  description: z
    .string()
    .max(500, '설명은 500자 이하여야 합니다.')
    .optional()
    .nullable(),

  is_active: isActiveSchema,
})

/**
 * 차종 폼 데이터 타입
 */
export type VehicleModelFormData = z.infer<typeof vehicleModelSchema>

/**
 * 차종 수정용 스키마 (ID 포함)
 */
export const vehicleModelUpdateSchema = vehicleModelSchema.extend({
  id: uuidSchema,
})

/**
 * 차종 수정 데이터 타입
 */
export type VehicleModelUpdateData = z.infer<typeof vehicleModelUpdateSchema>

/**
 * 차종 일괄 등록용 스키마
 */
export const vehicleModelBulkSchema = z.array(vehicleModelSchema)

/**
 * 차종 일괄 등록 데이터 타입
 */
export type VehicleModelBulkData = z.infer<typeof vehicleModelBulkSchema>

/**
 * 차종 필터 스키마
 */
export const vehicleModelFilterSchema = z.object({
  isActive: z.boolean().optional(),
  searchText: z.string().optional(),
})

/**
 * 차종 필터 타입
 */
export type VehicleModelFilter = z.infer<typeof vehicleModelFilterSchema>
