/**
 * CurrentInventory Entity
 * 현재고 상태를 표현하는 도메인 엔티티
 *
 * 공식: 현재고 = 초기재고 + 입고 - 출고 + 조정
 *
 * 재고 상태 기준 (PRD 섹션 5.2.3):
 * - 🟢 정상 (NORMAL): 현재고 >= 안전재고 × 70%
 * - 🟡 주의 (CAUTION): 안전재고 × 50% <= 현재고 < 안전재고 × 70%
 * - 🟠 경고 (WARNING): 안전재고 × 30% <= 현재고 < 안전재고 × 50%
 * - 🔴 위험 (CRITICAL): 현재고 < 안전재고 × 30%
 */

/**
 * 재고 상태 열거형
 */
export enum StockStatus {
  NORMAL = 'NORMAL', // 정상
  CAUTION = 'CAUTION', // 주의
  WARNING = 'WARNING', // 경고
  CRITICAL = 'CRITICAL', // 위험
}

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
 * 재고 상태 판정 기준 (안전재고 대비 비율)
 */
const STATUS_THRESHOLDS = {
  NORMAL: 0.7, // 70% 이상
  CAUTION: 0.5, // 50% 이상
  WARNING: 0.3, // 30% 이상
  // CRITICAL: 30% 미만
}

/**
 * CurrentInventory Props
 */
export interface CurrentInventoryProps {
  productId: string
  productCode: string
  productName: string
  vehicleName?: string
  initialQty: number
  inboundQty: number
  outboundQty: number
  adjustmentQty: number // 순 조정량 (증가 - 감소)
  safetyStock?: number
}

/**
 * CurrentInventory PlainObject (직렬화용)
 */
export interface CurrentInventoryPlainObject extends CurrentInventoryProps {
  currentQty: number
  stockStatus: StockStatus
  stockRatio: number
}

/**
 * CurrentInventory 도메인 엔티티
 * 현재 재고 상태를 계산하고 표현
 */
export class CurrentInventory {
  private readonly _currentQty: number

  private constructor(private readonly props: CurrentInventoryProps) {
    // 현재고 계산: 초기 + 입고 - 출고 + 조정
    this._currentQty =
      props.initialQty + props.inboundQty - props.outboundQty + props.adjustmentQty
  }

  // ============================================
  // Factory Method
  // ============================================

  /**
   * CurrentInventory 생성
   */
  static create(props: CurrentInventoryProps): CurrentInventory {
    return new CurrentInventory({
      ...props,
      safetyStock: props.safetyStock ?? 0,
    })
  }

  // ============================================
  // Getters
  // ============================================

  get productId(): string {
    return this.props.productId
  }

  get productCode(): string {
    return this.props.productCode
  }

  get productName(): string {
    return this.props.productName
  }

  get vehicleName(): string | undefined {
    return this.props.vehicleName
  }

  get initialQty(): number {
    return this.props.initialQty
  }

  get inboundQty(): number {
    return this.props.inboundQty
  }

  get outboundQty(): number {
    return this.props.outboundQty
  }

  get adjustmentQty(): number {
    return this.props.adjustmentQty
  }

  get safetyStock(): number {
    return this.props.safetyStock ?? 0
  }

  /**
   * 현재고 (계산된 값)
   */
  get currentQty(): number {
    return this._currentQty
  }

  // ============================================
  // Stock Status Methods
  // ============================================

  /**
   * 재고 상태 반환
   *
   * 기준:
   * - NORMAL: 현재고 >= 안전재고 × 70%
   * - CAUTION: 안전재고 × 50% <= 현재고 < 안전재고 × 70%
   * - WARNING: 안전재고 × 30% <= 현재고 < 안전재고 × 50%
   * - CRITICAL: 현재고 < 안전재고 × 30% 또는 음수
   */
  getStockStatus(): StockStatus {
    // 음수 재고는 항상 위험
    if (this._currentQty < 0) {
      return StockStatus.CRITICAL
    }

    // 안전재고가 0이면 현재고가 있으면 정상
    if (this.safetyStock === 0) {
      return StockStatus.NORMAL
    }

    const ratio = this._currentQty / this.safetyStock

    if (ratio >= STATUS_THRESHOLDS.NORMAL) {
      return StockStatus.NORMAL
    } else if (ratio >= STATUS_THRESHOLDS.CAUTION) {
      return StockStatus.CAUTION
    } else if (ratio >= STATUS_THRESHOLDS.WARNING) {
      return StockStatus.WARNING
    } else {
      return StockStatus.CRITICAL
    }
  }

  /**
   * 현재고/안전재고 비율
   */
  getStockRatio(): number {
    if (this.safetyStock === 0) {
      return this._currentQty === 0 ? 0 : Infinity
    }
    return this._currentQty / this.safetyStock
  }

  /**
   * 정상 상태인지 확인
   */
  isNormal(): boolean {
    return this.getStockStatus() === StockStatus.NORMAL
  }

  /**
   * 재고 부족 상태인지 확인 (주의 또는 경고)
   */
  isLow(): boolean {
    const status = this.getStockStatus()
    return status === StockStatus.CAUTION || status === StockStatus.WARNING
  }

  /**
   * 위험 상태인지 확인
   */
  isCritical(): boolean {
    return this.getStockStatus() === StockStatus.CRITICAL
  }

  /**
   * 상태 한글 라벨
   */
  getStatusLabel(): string {
    return STATUS_LABELS[this.getStockStatus()]
  }

  /**
   * 상태 색상 코드
   */
  getStatusColor(): string {
    return STATUS_COLORS[this.getStockStatus()]
  }

  // ============================================
  // Equality & Serialization
  // ============================================

  /**
   * 동일성 비교 (productId 기준)
   */
  equals(other: CurrentInventory): boolean {
    return this.productId === other.productId
  }

  /**
   * 일반 객체로 변환
   */
  toPlainObject(): CurrentInventoryPlainObject {
    return {
      productId: this.productId,
      productCode: this.productCode,
      productName: this.productName,
      vehicleName: this.vehicleName,
      initialQty: this.initialQty,
      inboundQty: this.inboundQty,
      outboundQty: this.outboundQty,
      adjustmentQty: this.adjustmentQty,
      safetyStock: this.safetyStock,
      currentQty: this.currentQty,
      stockStatus: this.getStockStatus(),
      stockRatio: this.getStockRatio(),
    }
  }
}
