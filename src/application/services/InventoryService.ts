/**
 * InventoryService
 * 재고 관련 순수 계산 로직 서비스
 *
 * 외부 의존성 ZERO - 순수 TypeScript
 * Repository 호출 없이 계산만 담당
 */

import { StockStatus } from '@domain/entities/CurrentInventory'

/**
 * 재고 상태 판정 기준 (안전재고 대비 비율)
 */
export const StockStatusThreshold = {
  NORMAL: 0.7, // 70% 이상
  CAUTION: 0.5, // 50% 이상
  WARNING: 0.3, // 30% 이상
  // CRITICAL: 30% 미만
} as const

/**
 * 재고 상태 라벨 매핑
 */
const STATUS_LABELS: Record<StockStatus, string> = {
  [StockStatus.NORMAL]: '정상',
  [StockStatus.CAUTION]: '주의',
  [StockStatus.WARNING]: '경고',
  [StockStatus.CRITICAL]: '위험',
}

/**
 * 재고 상태 색상 매핑 (PRD 3.3)
 */
const STATUS_COLORS: Record<StockStatus, string> = {
  [StockStatus.NORMAL]: '#22C55E', // 초록
  [StockStatus.CAUTION]: '#F59E0B', // 노랑
  [StockStatus.WARNING]: '#F97316', // 주황
  [StockStatus.CRITICAL]: '#EF4444', // 빨강
}

/**
 * 현재고 계산 입력
 */
export interface CalculateCurrentStockInput {
  initialQty: number
  inboundQty: number
  outboundQty: number
  adjustmentQty: number
}

/**
 * 재고 조정 항목
 */
export interface AdjustmentItem {
  type: 'INCREASE' | 'DECREASE'
  quantity: number
}

/**
 * InventoryService
 * 재고 관련 계산 로직
 */
export class InventoryService {
  /**
   * 현재고 계산
   * 공식: 현재고 = 초기재고 + 입고 - 출고 + 조정
   *
   * @param input 계산 입력값
   * @returns 현재고
   */
  calculateCurrentStock(input: CalculateCurrentStockInput): number {
    const { initialQty, inboundQty, outboundQty, adjustmentQty } = input
    return initialQty + inboundQty - outboundQty + adjustmentQty
  }

  /**
   * 재고 상태 판정
   *
   * 기준 (PRD 5.2.3):
   * - NORMAL: 현재고 >= 안전재고 × 70%
   * - CAUTION: 안전재고 × 50% <= 현재고 < 안전재고 × 70%
   * - WARNING: 안전재고 × 30% <= 현재고 < 안전재고 × 50%
   * - CRITICAL: 현재고 < 안전재고 × 30% 또는 음수
   *
   * @param currentQty 현재고
   * @param safetyStock 안전재고
   * @returns 재고 상태
   */
  calculateStockStatus(currentQty: number, safetyStock: number): StockStatus {
    // 음수 재고는 항상 위험
    if (currentQty < 0) {
      return StockStatus.CRITICAL
    }

    // 안전재고가 0이면 현재고가 있으면 정상
    if (safetyStock === 0) {
      return StockStatus.NORMAL
    }

    const ratio = currentQty / safetyStock

    if (ratio >= StockStatusThreshold.NORMAL) {
      return StockStatus.NORMAL
    } else if (ratio >= StockStatusThreshold.CAUTION) {
      return StockStatus.CAUTION
    } else if (ratio >= StockStatusThreshold.WARNING) {
      return StockStatus.WARNING
    } else {
      return StockStatus.CRITICAL
    }
  }

  /**
   * 가용 재고 계산
   * 공식: 가용 재고 = 현재고 + 입고예정
   *
   * @param currentQty 현재고
   * @param pendingInbound 입고예정 수량
   * @returns 가용 재고
   */
  calculateAvailableStock(currentQty: number, pendingInbound: number): number {
    return currentQty + pendingInbound
  }

  /**
   * 일평균 출하량 계산
   *
   * @param totalQuantity 총 출고량
   * @param days 일수
   * @returns 일평균 (소수점 2자리)
   */
  getDailyAverageFromQuantities(totalQuantity: number, days: number): number {
    if (days === 0 || totalQuantity === 0) {
      return 0
    }
    return Math.round((totalQuantity / days) * 100) / 100
  }

  /**
   * 상태 한글 라벨 반환
   */
  getStatusLabel(status: StockStatus): string {
    return STATUS_LABELS[status]
  }

  /**
   * 상태 색상 코드 반환
   */
  getStatusColor(status: StockStatus): string {
    return STATUS_COLORS[status]
  }

  /**
   * 순 조정량 계산
   * 증가 - 감소 합계
   *
   * @param adjustments 조정 항목 배열
   * @returns 순 조정량 (양수 = 증가, 음수 = 감소)
   */
  calculateNetAdjustment(adjustments: AdjustmentItem[]): number {
    return adjustments.reduce((sum, adj) => {
      return adj.type === 'INCREASE' ? sum + adj.quantity : sum - adj.quantity
    }, 0)
  }

  /**
   * 재고 부족 상태 확인 (주의 또는 경고)
   */
  isStockLow(status: StockStatus): boolean {
    return status === StockStatus.CAUTION || status === StockStatus.WARNING
  }

  /**
   * 주의가 필요한 상태인지 확인 (정상이 아닌 모든 상태)
   */
  needsAttention(status: StockStatus): boolean {
    return status !== StockStatus.NORMAL
  }
}
