/**
 * PartnerSummaryPanel - 거래처별 합계 사이드 패널
 * PRD 4.1.3 사이드 요약 (거래처별 합계)
 */

import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'

export interface PartnerSummaryItem {
  partnerId: string
  partnerCode: string
  partnerName: string
  currency: string
  totalQuantity: number
  totalAmount: number
}

export interface PartnerSummaryData {
  krwSummaries: PartnerSummaryItem[]
  foreignSummaries: PartnerSummaryItem[]
}

interface PartnerSummaryPanelProps {
  data: PartnerSummaryData
  transactionType: 'IN' | 'OUT'
  loading?: boolean
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('ko-KR').format(value)
}

function formatCurrency(value: number, currency: string): string {
  if (currency === 'KRW') {
    return `${formatNumber(value)}원`
  }
  if (currency === 'USD') {
    return `$${formatNumber(value)}`
  }
  return `${formatNumber(value)} ${currency}`
}

function SummaryTable({
  items,
  transactionType,
  showCurrency = false,
}: {
  items: PartnerSummaryItem[]
  transactionType: 'IN' | 'OUT'
  showCurrency?: boolean
}) {
  const partnerLabel = transactionType === 'IN' ? '공급사' : '고객사'
  const qtyLabel = transactionType === 'IN' ? '입고수량' : '출고수량'

  const totalQty = items.reduce((sum, item) => sum + item.totalQuantity, 0)
  const totalAmt = items.reduce((sum, item) => sum + item.totalAmount, 0)

  if (items.length === 0) {
    return (
      <div className="text-sm text-muted-foreground text-center py-4">
        데이터 없음
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left py-2 font-medium">{partnerLabel}</th>
            <th className="text-right py-2 font-medium">{qtyLabel}</th>
            <th className="text-right py-2 font-medium">금액</th>
            {showCurrency && <th className="text-center py-2 font-medium">통화</th>}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.partnerId} className="border-b">
              <td className="py-2 truncate max-w-[100px]" title={item.partnerName}>
                {item.partnerName}
              </td>
              <td className="text-right py-2">{formatNumber(item.totalQuantity)}</td>
              <td className="text-right py-2">
                {formatCurrency(item.totalAmount, item.currency)}
              </td>
              {showCurrency && (
                <td className="text-center py-2">
                  <Badge variant="outline">{item.currency}</Badge>
                </td>
              )}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="font-semibold bg-muted/50">
            <td className="py-2">합계</td>
            <td className="text-right py-2">{formatNumber(totalQty)}</td>
            <td className="text-right py-2">
              {items.length > 0
                ? formatCurrency(totalAmt, items[0]?.currency ?? 'KRW')
                : '-'}
            </td>
            {showCurrency && <td />}
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

export function PartnerSummaryPanel({
  data,
  transactionType,
  loading = false,
}: PartnerSummaryPanelProps) {
  const { krwSummaries, foreignSummaries } = data

  if (loading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="py-8">
            <div className="flex items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 원화 합계 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            거래처별 합계
            <Badge variant="secondary">원화</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SummaryTable items={krwSummaries} transactionType={transactionType} />
        </CardContent>
      </Card>

      {/* 외화 합계 */}
      {foreignSummaries.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              거래처별 합계
              <Badge variant="outline">외화</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SummaryTable
              items={foreignSummaries}
              transactionType={transactionType}
              showCurrency
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
