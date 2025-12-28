/**
 * Inventory Repository Interface
 * 재고/입출고 저장소 인터페이스
 * 구현체는 @interface/gateways에서 제공
 */

import type { InventoryTransaction, TransactionType } from '../entities/InventoryTransaction'
import type { DateRange } from '../valueObjects/DateRange'

export interface InventoryFilter {
  productId?: string
  partnerId?: string
  transactionType?: TransactionType
  dateRange?: DateRange
  uploadBatchId?: string
}

export interface StockSummary {
  productId: string
  currentStock: number
  lastTransactionDate?: Date
}

export interface DailyAverage {
  productId: string
  averageQuantity: number
  periodDays: number
}

export interface IInventoryRepository {
  /**
   * ID로 조회
   */
  findById(id: string): Promise<InventoryTransaction | null>

  /**
   * 조건에 맞는 입출고 이력 조회
   */
  findAll(filter?: InventoryFilter): Promise<InventoryTransaction[]>

  /**
   * 기간 내 입출고 이력 조회
   */
  findByDateRange(dateRange: DateRange): Promise<InventoryTransaction[]>

  /**
   * 제품별 현재 재고 조회
   */
  getCurrentStock(productId: string): Promise<number>

  /**
   * 여러 제품의 현재 재고 조회
   */
  getStockSummaries(productIds: string[]): Promise<StockSummary[]>

  /**
   * 일평균 출하량 계산 (기간 지정)
   */
  getDailyAverageOutbound(productId: string, dateRange: DateRange): Promise<number>

  /**
   * 여러 제품의 일평균 출하량
   */
  getDailyAverages(productIds: string[], dateRange: DateRange): Promise<DailyAverage[]>

  /**
   * 저장
   */
  save(transaction: InventoryTransaction): Promise<InventoryTransaction>

  /**
   * 일괄 저장 (엑셀 업로드)
   */
  saveMany(transactions: InventoryTransaction[]): Promise<InventoryTransaction[]>

  /**
   * 배치별 삭제 (업로드 롤백)
   */
  deleteByBatch(uploadBatchId: string): Promise<void>
}
