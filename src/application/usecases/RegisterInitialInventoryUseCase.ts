/**
 * RegisterInitialInventoryUseCase
 * 초기재고 등록 UseCase
 */

import type { IProductRepository } from '@domain/repositories/IProductRepository'
import type { IInitialInventoryRepository } from '@domain/repositories/IInventoryRepository'
import { InitialInventory } from '@domain/entities/InitialInventory'

// UUID 생성 헬퍼
const generateUUID = (): string => {
  return crypto.randomUUID()
}

/**
 * 초기재고 등록 입력
 */
export interface RegisterInitialInventoryInput {
  productId: string
  baseDate: Date
  quantity: number
  remarks?: string
  createdBy?: string
}

/**
 * UseCase 의존성
 */
export interface RegisterInitialInventoryDependencies {
  productRepository: IProductRepository
  initialInventoryRepository: IInitialInventoryRepository
}

/**
 * 초기재고 등록 UseCase
 */
export class RegisterInitialInventoryUseCase {
  constructor(private readonly deps: RegisterInitialInventoryDependencies) {}

  /**
   * 단일 초기재고 등록
   * - 같은 품목+기준일에 이미 등록된 경우 업데이트
   *
   * @param input 등록 입력
   * @returns 등록/업데이트된 InitialInventory
   */
  async execute(input: RegisterInitialInventoryInput): Promise<InitialInventory> {
    // 1. 품목 존재 여부 확인
    const product = await this.deps.productRepository.findById(input.productId)
    if (!product) {
      throw new Error('품목을 찾을 수 없습니다')
    }

    // 2. 수량 검증
    if (input.quantity < 0) {
      throw new Error('수량은 0 이상이어야 합니다')
    }

    // 3. 기존 초기재고 확인 (같은 품목+기준일)
    const existing = await this.deps.initialInventoryRepository.findByProductAndDate(
      input.productId,
      input.baseDate
    )

    // 4. 엔티티 생성 (기존 ID 유지 또는 새로 생성)
    const initialInventory = InitialInventory.create({
      id: existing?.id ?? generateUUID(),
      productId: input.productId,
      baseDate: input.baseDate,
      quantity: input.quantity,
      remarks: input.remarks,
      createdBy: input.createdBy,
    })

    // 5. 저장
    return this.deps.initialInventoryRepository.save(initialInventory)
  }

  /**
   * 일괄 초기재고 등록
   * - 에러가 발생한 항목은 건너뛰고 성공한 것만 반환
   *
   * @param inputs 등록 입력 배열
   * @returns 성공적으로 등록된 InitialInventory 배열
   */
  async executeMany(inputs: RegisterInitialInventoryInput[]): Promise<InitialInventory[]> {
    if (inputs.length === 0) {
      return []
    }

    const results: InitialInventory[] = []

    for (const input of inputs) {
      try {
        // 품목 존재 여부 확인
        const product = await this.deps.productRepository.findById(input.productId)
        if (!product) {
          console.warn(`품목을 찾을 수 없습니다: ${input.productId}`)
          continue
        }

        // 수량 검증
        if (input.quantity < 0) {
          console.warn(`수량이 유효하지 않습니다: ${input.quantity}`)
          continue
        }

        // 기존 초기재고 확인
        const existing = await this.deps.initialInventoryRepository.findByProductAndDate(
          input.productId,
          input.baseDate
        )

        // 엔티티 생성
        const initialInventory = InitialInventory.create({
          id: existing?.id ?? generateUUID(),
          productId: input.productId,
          baseDate: input.baseDate,
          quantity: input.quantity,
          remarks: input.remarks,
          createdBy: input.createdBy,
        })

        results.push(initialInventory)
      } catch (error) {
        console.warn(`초기재고 등록 실패: ${input.productId}`, error)
      }
    }

    // 일괄 저장
    if (results.length > 0) {
      return this.deps.initialInventoryRepository.saveMany(results)
    }

    return []
  }
}
