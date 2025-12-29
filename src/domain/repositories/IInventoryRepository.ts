/**
 * Inventory Repository Interface
 * 재고/입출고 저장소 인터페이스
 * 구현체는 @interface/gateways에서 제공
 */

import type { InventoryTransaction, TransactionType } from '../entities/InventoryTransaction'
import type { InitialInventory } from '../entities/InitialInventory'
import type {
  InventoryAdjustment,
  AdjustmentType,
  AdjustmentReason,
} from '../entities/InventoryAdjustment'
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

// ============================================
// 초기 재고 관련 인터페이스
// ============================================

export interface InitialInventoryFilter {
  productId?: string
  baseDate?: Date
  baseDateRange?: DateRange
}

export interface IInitialInventoryRepository {
  /**
   * ID로 조회
   */
  findById(id: string): Promise<InitialInventory | null>

  /**
   * 품목 ID와 기준일로 조회
   */
  findByProductAndDate(productId: string, baseDate: Date): Promise<InitialInventory | null>

  /**
   * 품목의 가장 최근 초기 재고 조회
   */
  findLatestByProduct(productId: string): Promise<InitialInventory | null>

  /**
   * 조건에 맞는 초기 재고 조회
   */
  findAll(filter?: InitialInventoryFilter): Promise<InitialInventory[]>

  /**
   * 저장 (생성 또는 업데이트)
   */
  save(initialInventory: InitialInventory): Promise<InitialInventory>

  /**
   * 일괄 저장
   */
  saveMany(initialInventories: InitialInventory[]): Promise<InitialInventory[]>

  /**
   * 삭제
   */
  delete(id: string): Promise<void>
}

// ============================================
// 재고 조정 관련 인터페이스
// ============================================

export interface AdjustmentFilter {
  productId?: string
  adjustmentType?: AdjustmentType
  reason?: AdjustmentReason
  dateRange?: DateRange
}

export interface AdjustmentSummary {
  productId: string
  totalIncrease: number
  totalDecrease: number
  netAdjustment: number
}

export interface IInventoryAdjustmentRepository {
  /**
   * ID로 조회
   */
  findById(id: string): Promise<InventoryAdjustment | null>

  /**
   * 조건에 맞는 재고 조정 조회
   */
  findAll(filter?: AdjustmentFilter): Promise<InventoryAdjustment[]>

  /**
   * 품목별 재고 조정 조회
   */
  findByProduct(productId: string): Promise<InventoryAdjustment[]>

  /**
   * 기간 내 재고 조정 조회
   */
  findByDateRange(dateRange: DateRange): Promise<InventoryAdjustment[]>

  /**
   * 품목별 조정 합계 조회
   */
  getAdjustmentSummary(productId: string): Promise<AdjustmentSummary>

  /**
   * 여러 품목의 조정 합계 조회
   */
  getAdjustmentSummaries(productIds: string[]): Promise<AdjustmentSummary[]>

  /**
   * 저장
   */
  save(adjustment: InventoryAdjustment): Promise<InventoryAdjustment>

  /**
   * 삭제
   */
  delete(id: string): Promise<void>
}
