/**
 * GeneratePurchaseOrderUseCase
 * 발주서 생성 UseCase
 *
 * 발주 권고를 기반으로 발주서 생성
 * @domain만 import 가능
 */

import { PurchaseOrder, type OrderType } from '@domain/entities/PurchaseOrder'
import { OrderStatus } from '@domain/valueObjects/OrderStatus'
import { Money } from '@domain/valueObjects/Money'
import type { IOrderRepository } from '@domain/repositories/IOrderRepository'
import type { IPartnerRepository } from '@domain/repositories/IPartnerRepository'

/**
 * 발주 항목
 */
export interface OrderItem {
  productId: string
  productCode: string
  productName: string
  quantity: number
  unitPrice: Money
}

/**
 * 발주서 생성 입력
 */
export interface GenerateOrderInput {
  partnerId: string
  companyId: string
  items: OrderItem[]
  orderType: OrderType
  shipmentDate?: Date
  dueDate?: Date
}

/**
 * 발주서 생성 UseCase 의존성
 */
export interface GeneratePurchaseOrderDependencies {
  orderRepository: IOrderRepository
  partnerRepository: IPartnerRepository
}

/**
 * 발주서 생성 UseCase
 */
export class GeneratePurchaseOrderUseCase {
  constructor(private readonly deps: GeneratePurchaseOrderDependencies) {}

  /**
   * 발주서 생성 실행
   *
   * @param input 발주서 생성 입력
   * @returns 생성된 발주서
   */
  async execute(input: GenerateOrderInput): Promise<PurchaseOrder> {
    // 검증: 빈 항목 체크
    if (!input.items || input.items.length === 0) {
      throw new Error('발주 항목이 비어있습니다')
    }

    // 검증: 거래처 존재 확인
    const partner = await this.deps.partnerRepository.findById(input.partnerId)
    if (!partner) {
      throw new Error(`존재하지 않는 거래처: ${input.partnerId}`)
    }

    // 검증: 베트남 발주는 선적일 필수
    if (input.orderType === 'VIETNAM' && !input.shipmentDate) {
      throw new Error('베트남 발주는 선적일이 필수입니다')
    }

    // 발주번호 생성
    const today = new Date()
    const sequence = await this.deps.orderRepository.getNextSequence(today)
    const orderNumber = PurchaseOrder.generateOrderNumber(today, sequence)

    // 총수량 계산
    const totalQuantity = input.items.reduce((sum, item) => sum + item.quantity, 0)

    // 총금액 계산
    const currency = input.items[0]?.unitPrice.currency ?? 'KRW'
    let totalAmount = Money.create(0, currency)

    for (const item of input.items) {
      const itemTotal = item.unitPrice.multiply(item.quantity)
      totalAmount = totalAmount.add(itemTotal)
    }

    // 납기일 기본값 (주문일 + 7일)
    const dueDate = input.dueDate ?? this.addDays(today, 7)

    // 발주서 생성
    const order = PurchaseOrder.create({
      id: this.generateId(),
      orderNumber,
      orderDate: today,
      dueDate,
      partnerId: input.partnerId,
      companyId: input.companyId,
      orderType: input.orderType,
      status: OrderStatus.DRAFT,
      totalQuantity,
      totalAmount,
      shipmentDate: input.shipmentDate,
    })

    return order
  }

  /**
   * 여러 발주서 일괄 생성
   */
  async executeBatch(inputs: GenerateOrderInput[]): Promise<PurchaseOrder[]> {
    const orders: PurchaseOrder[] = []

    for (const input of inputs) {
      const order = await this.execute(input)
      orders.push(order)
    }

    return orders
  }

  /**
   * UUID 생성
   */
  private generateId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0
      const v = c === 'x' ? r : (r & 0x3) | 0x8
      return v.toString(16)
    })
  }

  /**
   * 날짜에 일수 추가
   */
  private addDays(date: Date, days: number): Date {
    const result = new Date(date)
    result.setDate(result.getDate() + days)
    return result
  }
}
