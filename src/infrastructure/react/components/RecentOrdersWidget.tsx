/**
 * RecentOrdersWidget 컴포넌트
 * 최근 발주 목록 표시
 */

import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { FileText } from 'lucide-react'
import type { RecentOrder } from '../hooks/useDashboard'
import { ORDER_STATUS_LABELS, ORDER_TYPE_LABELS } from '../hooks/useDashboard'

export interface RecentOrdersWidgetProps {
  orders: RecentOrder[]
  loading?: boolean
}

/**
 * 상태별 배지 variant
 */
export function getOrderStatusVariant(
  status: string
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'DRAFT':
      return 'secondary'
    case 'CONFIRMED':
    case 'SENT':
    case 'COMPLETED':
      return 'default'
    case 'PARTIALLY_RECEIVED':
      return 'outline'
    case 'CANCELLED':
      return 'destructive'
    default:
      return 'secondary'
  }
}

/**
 * 날짜 포맷팅
 */
export function formatOrderDate(date: Date): string {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

/**
 * 금액 포맷팅
 */
export function formatAmount(amount?: number): string {
  if (amount === undefined) return '-'
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function RecentOrdersWidget({ orders, loading = false }: RecentOrdersWidgetProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">최근 발주</CardTitle>
        <FileText className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 animate-pulse bg-gray-100 rounded" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            최근 발주가 없습니다
          </p>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">
                      {order.orderNumber}
                    </span>
                    <Badge variant={getOrderStatusVariant(order.status)}>
                      {ORDER_STATUS_LABELS[order.status] ?? order.status}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {ORDER_TYPE_LABELS[order.orderType] ?? order.orderType}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">
                      {order.partnerName}
                    </span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground">
                      {formatOrderDate(order.orderDate)}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-medium">
                    {formatAmount(order.totalAmount)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
