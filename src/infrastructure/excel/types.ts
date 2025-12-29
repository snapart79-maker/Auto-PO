/**
 * Excel Parser Types
 * Excel 파싱 관련 타입 정의
 */

/**
 * 파싱된 행 데이터 (공통)
 */
export interface ParsedRow {
  rowNumber: number
  partnerCode: string
  productCode: string
  quantity: number
  transactionDate: Date
  currency?: 'KRW' | 'USD'
  unitPrice?: number
  itemType?: string // 원재료, 반제품, 완제품
  remarks?: string
}

/**
 * 입고 데이터 행
 */
export interface InventoryUploadRow extends ParsedRow {
  transactionType: 'IN' | 'OUT'
}

/**
 * 출고 계획 행
 */
export interface ShipmentPlanRow extends ParsedRow {
  planType: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'
  vehicleModelCode?: string
}

/**
 * 초기 재고 행
 */
export interface InitialInventoryRow {
  rowNumber: number
  productCode: string
  quantity: number
  baseDate: Date
  remarks?: string
}

/**
 * 재고 조정 행
 */
export interface InventoryAdjustmentRow {
  rowNumber: number
  productCode: string
  adjustmentDate: Date
  adjustmentType: 'INCREASE' | 'DECREASE'
  quantity: number
  reason: 'PHYSICAL_COUNT' | 'LOSS' | 'DAMAGE' | 'OTHER'
  remarks?: string
}

/**
 * Excel 파서 옵션
 */
export interface ExcelParserOptions {
  /** 헤더 행 번호 (0-indexed) */
  headerRow?: number
  /** 시작 데이터 행 (0-indexed) */
  startRow?: number
  /** 날짜 형식 */
  dateFormat?: string
  /** 시트 이름 또는 인덱스 */
  sheet?: string | number
}

/**
 * 컬럼 매핑
 */
export interface ColumnMapping {
  partnerCode: string // 거래처코드
  productCode: string // 품번
  quantity: string // 수량
  transactionDate: string // 거래일자
  currency?: string // 통화
  unitPrice?: string // 단가
  itemType?: string // 품목유형
  remarks?: string // 비고
  vehicleModelCode?: string // 차종코드 (출고계획)
  planType?: string // 계획유형 (출고계획)
  transactionType?: string // 입출고구분
}

/**
 * 파싱 결과
 */
export interface ParseResult<T extends ParsedRow> {
  success: boolean
  rows: T[]
  errors: ParseError[]
  totalRows: number
}

/**
 * 파싱 에러
 */
export interface ParseError {
  row: number
  column: string
  message: string
  value?: unknown
}

/**
 * 기본 컬럼 매핑 (한글 헤더)
 */
export const DEFAULT_COLUMN_MAPPING: ColumnMapping = {
  partnerCode: '거래처코드',
  productCode: '품번',
  quantity: '수량',
  transactionDate: '거래일자',
  currency: '통화',
  unitPrice: '단가',
  itemType: '품목유형',
  remarks: '비고',
  vehicleModelCode: '차종코드',
  planType: '계획유형',
  transactionType: '입출고구분',
}

/**
 * 영문 컬럼 매핑 (대체)
 */
export const ENGLISH_COLUMN_MAPPING: ColumnMapping = {
  partnerCode: 'partner_code',
  productCode: 'product_code',
  quantity: 'quantity',
  transactionDate: 'transaction_date',
  currency: 'currency',
  unitPrice: 'unit_price',
  itemType: 'item_type',
  remarks: 'remarks',
  vehicleModelCode: 'vehicle_model_code',
  planType: 'plan_type',
  transactionType: 'transaction_type',
}
