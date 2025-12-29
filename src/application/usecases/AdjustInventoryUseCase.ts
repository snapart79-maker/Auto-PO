/**
 * AdjustInventoryUseCase
 * 재고 조정 UseCase
 *
 * 재고 증가/감소 조정 등록 및 이력 관리
 */

import type { IProductRepository } from '@domain/repositories/IProductRepository'
import type {
  IInventoryAdjustmentRepository,
  AdjustmentSummary,
} from '@domain/repositories/IInventoryRepository'
import {
  InventoryAdjustment,
  type AdjustmentType,
  type AdjustmentReason,
} from '@domain/entities/InventoryAdjustment'

// UUID 생성 헬퍼
const generateUUID = (): string => {
  return crypto.randomUUID()
}

/**
 * 재고 조정 입력
 */
export interface AdjustInventoryInput {
  productId: string
  adjustmentDate: Date
  adjustmentType: AdjustmentType
  quantity: number
  reason: AdjustmentReason
  remarks?: string
  createdBy?: string
}

/**
 * UseCase 의존성
 */
export interface AdjustInventoryDependencies {
  productRepository: IProductRepository
  adjustmentRepository: IInventoryAdjustmentRepository
}

/**
 * 재고 조정 UseCase
 */
export class AdjustInventoryUseCase {
  constructor(private readonly deps: AdjustInventoryDependencies) {}

  /**
   * 재고 조정 등록
   *
   * @param input 조정 입력
   * @returns 등록된 InventoryAdjustment
   */
  async execute(input: AdjustInventoryInput): Promise<InventoryAdjustment> {
    // 1. 품목 존재 여부 확인
    const product = await this.deps.productRepository.findById(input.productId)
    if (!product) {
      throw new Error('품목을 찾을 수 없습니다')
    }

    // 2. 수량 검증 (InventoryAdjustment.create에서도 검증하지만 UseCase에서도 명시적으로)
    if (input.quantity <= 0) {
      throw new Error('조정 수량은 0보다 커야 합니다')
    }

    // 3. 엔티티 생성
    const adjustment = InventoryAdjustment.create({
      id: generateUUID(),
      productId: input.productId,
      adjustmentDate: input.adjustmentDate,
      adjustmentType: input.adjustmentType,
      quantity: input.quantity,
      reason: input.reason,
      remarks: input.remarks,
      createdBy: input.createdBy,
    })

    // 4. 저장
    return this.deps.adjustmentRepository.save(adjustment)
  }

  /**
   * 품목별 재고 조정 이력 조회
   *
   * @param productId 품목 ID
   * @returns InventoryAdjustment 배열
   */
  async getAdjustmentHistory(productId: string): Promise<InventoryAdjustment[]> {
    return this.deps.adjustmentRepository.findByProduct(productId)
  }

  /**
   * 품목별 조정 합계 조회
   *
   * @param productId 품목 ID
   * @returns AdjustmentSummary
   */
  async getAdjustmentSummary(productId: string): Promise<AdjustmentSummary> {
    return this.deps.adjustmentRepository.getAdjustmentSummary(productId)
  }
}
