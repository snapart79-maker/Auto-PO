/**
 * GetTransactionsWithDetailsUseCase
 * 거래처/제품 정보가 포함된 입출고 이력 조회
 */

import { supabase } from '@infrastructure/supabase/client'
import type {
  TransactionWithDetails,
  TransactionQueryFilter,
} from '../dtos/TransactionWithDetails'

interface TransactionRow {
  id: string
  transaction_date: string
  transaction_type: string
  partner_id: string | null
  product_id: string | null
  quantity: number
  unit_price: number | null
  supply_amount: number | null
  currency: string | null
  exchange_rate: number | null
  total_amount: number | null
  item_type: string | null
  upload_batch_id: string | null
  created_at: string
  partners: { id: string; partner_code: string; partner_name: string } | null
  products: { id: string; product_code: string; product_name: string } | null
}

export class GetTransactionsWithDetailsUseCase {
  async execute(filter: TransactionQueryFilter): Promise<TransactionWithDetails[]> {
    let query = supabase
      .from('inventory_transactions')
      .select(`
        id,
        transaction_date,
        transaction_type,
        partner_id,
        product_id,
        quantity,
        unit_price,
        supply_amount,
        currency,
        exchange_rate,
        total_amount,
        item_type,
        upload_batch_id,
        created_at,
        partners (
          id,
          partner_code,
          partner_name
        ),
        products (
          id,
          product_code,
          product_name
        )
      `)

    // 트랜잭션 타입 필터
    if (filter.transactionType) {
      query = query.eq('transaction_type', filter.transactionType)
    }

    // 날짜 범위 필터
    if (filter.startDate) {
      const startStr = filter.startDate.toISOString().split('T')[0]!
      query = query.gte('transaction_date', startStr)
    }
    if (filter.endDate) {
      const endStr = filter.endDate.toISOString().split('T')[0]!
      query = query.lte('transaction_date', endStr)
    }

    // 정렬
    query = query.order('transaction_date', { ascending: false })

    // 페이지네이션
    if (filter.limit) {
      query = query.limit(filter.limit)
    }
    if (filter.offset) {
      query = query.range(filter.offset, filter.offset + (filter.limit ?? 100) - 1)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`입출고 이력 조회 실패: ${error.message}`)
    }

    if (!data) {
      return []
    }

    // 결과 매핑
    let results = (data as unknown as TransactionRow[]).map((row): TransactionWithDetails => {
      const partner = row.partners
      const product = row.products

      return {
        id: row.id,
        transactionDate: new Date(row.transaction_date),
        transactionType: row.transaction_type as 'IN' | 'OUT',
        partnerId: row.partner_id,
        partnerCode: partner?.partner_code ?? null,
        partnerName: partner?.partner_name ?? null,
        productId: row.product_id,
        productCode: product?.product_code ?? null,
        productName: product?.product_name ?? null,
        customerProductCode: null, // 고객품번 - DB 컬럼 추가 필요
        quantity: row.quantity,
        unitPrice: row.unit_price,
        supplyAmount: row.supply_amount,
        currency: row.currency ?? 'KRW',
        exchangeRate: row.exchange_rate,
        totalAmount: row.total_amount,
        // 계약 정보
        contractPrice: null, // 계약단가 - DB 컬럼 추가 필요
        contractCurrency: null, // 계약화폐단위 - DB 컬럼 추가 필요
        appliedPrice: row.unit_price, // 적용단가 (현재는 단가와 동일)
        // 세금 관련
        vatRate: null, // 부가가치세율 - DB 컬럼 추가 필요
        krwAmount: row.currency === 'KRW' ? row.total_amount : null, // 금액(원화)
        taxAmount: null, // 세금 - DB 컬럼 추가 필요
        // 출고 관련
        transactionCategory: null, // 수불구분 - DB 컬럼 추가 필요
        shipmentType: null, // 출하유형 - DB 컬럼 추가 필요
        lotNumber: null, // LOT번호 - DB 컬럼 추가 필요
        // 창고 정보
        warehouseCode: null, // 창고코드 - DB 컬럼 추가 필요
        warehouseName: null, // 창고명 - DB 컬럼 추가 필요
        // 관리 정보
        closingKey: null, // 수불마감KEY - DB 컬럼 추가 필요
        registeredAt: new Date(row.created_at), // 등록일시
        registeredBy: null, // 등록자 - DB 컬럼 추가 필요
        modifiedAt: null, // 수정일시 - DB 컬럼 추가 필요
        modifiedBy: null, // 수정자 - DB 컬럼 추가 필요
        returnNumber: null, // 반품번호 - DB 컬럼 추가 필요
        transactionDetail: null, // 입출상세 - DB 컬럼 추가 필요
        // 기타
        itemType: row.item_type,
        uploadBatchId: row.upload_batch_id,
        createdAt: new Date(row.created_at),
      }
    })

    // 품번 필터 (여러 개)
    if (filter.productCodes && filter.productCodes.length > 0) {
      const codes = filter.productCodes.map((c) => c.toLowerCase())
      results = results.filter((r) =>
        r.productCode && codes.some((code) => r.productCode!.toLowerCase().includes(code))
      )
    }

    // 품명 필터 (부분 검색)
    if (filter.productName) {
      const name = filter.productName.toLowerCase()
      results = results.filter((r) =>
        r.productName && r.productName.toLowerCase().includes(name)
      )
    }

    // 거래처 필터 (여러 개)
    if (filter.partnerCodes && filter.partnerCodes.length > 0) {
      const codes = filter.partnerCodes.map((c) => c.toLowerCase())
      results = results.filter((r) =>
        (r.partnerCode && codes.some((code) => r.partnerCode!.toLowerCase().includes(code))) ||
        (r.partnerName && codes.some((code) => r.partnerName!.toLowerCase().includes(code)))
      )
    }

    return results
  }
}
