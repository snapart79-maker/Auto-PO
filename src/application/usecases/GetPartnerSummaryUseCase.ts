/**
 * GetPartnerSummaryUseCase
 * 거래처별 합계 조회 (원화/외화 분리)
 */

import type {
  TransactionQueryFilter,
  PartnerSummary,
  PartnerSummaryResult,
} from '../dtos/TransactionWithDetails'
import { GetTransactionsWithDetailsUseCase } from './GetTransactionsWithDetailsUseCase'

export class GetPartnerSummaryUseCase {
  private getTransactionsUseCase: GetTransactionsWithDetailsUseCase

  constructor() {
    this.getTransactionsUseCase = new GetTransactionsWithDetailsUseCase()
  }

  async execute(filter: TransactionQueryFilter): Promise<PartnerSummaryResult> {
    // 트랜잭션 조회 (페이지네이션 없이 전체)
    const transactions = await this.getTransactionsUseCase.execute({
      ...filter,
      limit: undefined,
      offset: undefined,
    })

    // 거래처별로 그룹핑
    const summaryMap = new Map<string, PartnerSummary>()

    for (const tx of transactions) {
      if (!tx.partnerId) continue

      const key = `${tx.partnerId}-${tx.currency}`
      const existing = summaryMap.get(key)

      if (existing) {
        existing.totalQuantity += tx.quantity
        existing.totalAmount += tx.totalAmount ?? tx.supplyAmount ?? 0
      } else {
        summaryMap.set(key, {
          partnerId: tx.partnerId,
          partnerCode: tx.partnerCode ?? '',
          partnerName: tx.partnerName ?? '알 수 없음',
          currency: tx.currency,
          totalQuantity: tx.quantity,
          totalAmount: tx.totalAmount ?? tx.supplyAmount ?? 0,
        })
      }
    }

    // 원화/외화 분리
    const allSummaries = Array.from(summaryMap.values())

    const krwSummaries = allSummaries
      .filter((s) => s.currency === 'KRW')
      .sort((a, b) => b.totalAmount - a.totalAmount)

    const foreignSummaries = allSummaries
      .filter((s) => s.currency !== 'KRW')
      .sort((a, b) => b.totalAmount - a.totalAmount)

    return {
      krwSummaries,
      foreignSummaries,
    }
  }
}
