/**
 * Order Repository Interface
 * 발주 관련 저장소 인터페이스
 * 구현체는 @interface/gateways에서 제공
 */

import type { PurchaseOrder, OrderType } from '../entities/PurchaseOrder'
import type { PurchaseOrderLog } from '../entities/PurchaseOrderLog'
import type { OrderStatus } from '../valueObjects/OrderStatus'
import type { DateRange } from '../valueObjects/DateRange'

export interface OrderFilter {
  partnerId?: string
  orderType?: OrderType
  status?: OrderStatus
  dateRange?: DateRange
}

export interface PendingOrderSummary {
  productId: string
  pendingQuantity: number
}

export interface IOrderRepository {
  /**
   * ID로 조회
   */
  findById(id: string): Promise<PurchaseOrder | null>

  /**
   * 발주번호로 조회
   */
  findByOrderNumber(orderNumber: string): Promise<PurchaseOrder | null>

  /**
   * 조건에 맞는 발주 목록 조회
   */
  findAll(filter?: OrderFilter): Promise<PurchaseOrder[]>

  /**
   * 거래처별 발주 목록
   */
  findByPartner(partnerId: string): Promise<PurchaseOrder[]>

  /**
   * 미완료 발주 목록 (DRAFT, CONFIRMED, SENT, PARTIALLY_RECEIVED)
   */
  findPending(): Promise<PurchaseOrder[]>

  /**
   * 제품별 미입고 수량 조회
   */
  getPendingQuantity(productId: string): Promise<number>

  /**
   * 여러 제품의 미입고 수량
   */
  getPendingQuantities(productIds: string[]): Promise<PendingOrderSummary[]>

  /**
   * 오늘 날짜 기준 다음 발주 시퀀스 번호 조회
   */
  getNextSequence(date: Date): Promise<number>

  /**
   * 저장
   */
  save(order: PurchaseOrder): Promise<PurchaseOrder>

  /**
   * 삭제 (DRAFT 상태만 가능)
   */
  delete(id: string): Promise<void>

  // ========== 발주 이력 관련 ==========

  /**
   * 발주 이력 저장
   */
  saveLog(log: PurchaseOrderLog): Promise<PurchaseOrderLog>

  /**
   * 발주 ID로 이력 조회
   */
  findLogsByOrderId(orderId: string): Promise<PurchaseOrderLog[]>
}
