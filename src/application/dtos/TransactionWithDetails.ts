/**
 * TransactionWithDetails DTO
 * 거래처/제품 정보가 포함된 입출고 이력
 */

export interface TransactionWithDetails {
  id: string
  transactionDate: Date
  transactionType: 'IN' | 'OUT'

  // 거래처 정보
  partnerId: string | null
  partnerCode: string | null
  partnerName: string | null

  // 제품 정보
  productId: string | null
  productCode: string | null
  productName: string | null
  customerProductCode: string | null // 고객품번

  // 수량/금액
  quantity: number
  unitPrice: number | null
  supplyAmount: number | null
  currency: string
  exchangeRate: number | null
  totalAmount: number | null

  // 계약 정보
  contractPrice: number | null // 계약단가
  contractCurrency: string | null // 계약화폐단위
  appliedPrice: number | null // 적용단가

  // 세금 관련
  vatRate: number | null // 부가가치세율 (%)
  krwAmount: number | null // 금액(원화)
  taxAmount: number | null // 세금

  // 출고 관련 (출고 현황용)
  transactionCategory: string | null // 수불구분
  shipmentType: string | null // 출하유형
  lotNumber: string | null // LOT번호

  // 창고 정보
  warehouseCode: string | null // 창고코드
  warehouseName: string | null // 창고명

  // 관리 정보
  closingKey: string | null // 수불마감KEY
  registeredAt: Date | null // 등록일시
  registeredBy: string | null // 등록자
  modifiedAt: Date | null // 수정일시
  modifiedBy: string | null // 수정자
  returnNumber: string | null // 반품번호
  transactionDetail: string | null // 입출상세

  // 기타
  itemType: string | null
  uploadBatchId: string | null
  createdAt: Date
}

export interface TransactionQueryFilter {
  transactionType?: 'IN' | 'OUT'
  startDate?: Date
  endDate?: Date
  productCodes?: string[]
  productName?: string
  partnerCodes?: string[]
  limit?: number
  offset?: number
}

export interface PartnerSummary {
  partnerId: string
  partnerCode: string
  partnerName: string
  currency: string
  totalQuantity: number
  totalAmount: number
}

export interface PartnerSummaryResult {
  krwSummaries: PartnerSummary[]
  foreignSummaries: PartnerSummary[]
}
