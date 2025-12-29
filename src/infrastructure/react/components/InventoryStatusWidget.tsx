/**
 * InventoryStatusWidget 컴포넌트
 * 재고 상태별 요약 및 도넛 차트 시각화
 */

import { useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Package } from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts'
import { useInventoryStatus } from '../hooks/useInventoryStatus'
import { StockStatus } from '@domain/entities/CurrentInventory'

export interface InventoryStatusWidgetProps {
  loading?: boolean
}

/**
 * 재고 상태별 색상
 */
export const STOCK_STATUS_COLORS: Record<StockStatus, string> = {
  [StockStatus.NORMAL]: '#22c55e',   // green-500
  [StockStatus.CAUTION]: '#eab308',  // yellow-500
  [StockStatus.WARNING]: '#f97316',  // orange-500
  [StockStatus.CRITICAL]: '#ef4444', // red-500
}

/**
 * 재고 상태별 라벨
 */
export const STOCK_STATUS_LABELS: Record<StockStatus, string> = {
  [StockStatus.NORMAL]: '정상',
  [StockStatus.CAUTION]: '주의',
  [StockStatus.WARNING]: '경고',
  [StockStatus.CRITICAL]: '위험',
}

/**
 * 재고 상태별 배지 variant
 */
export function getStockStatusBadgeVariant(
  status: StockStatus
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case StockStatus.NORMAL:
      return 'default'
    case StockStatus.CAUTION:
      return 'secondary'
    case StockStatus.WARNING:
      return 'outline'
    case StockStatus.CRITICAL:
      return 'destructive'
    default:
      return 'default'
  }
}

/**
 * 차트 데이터 변환
 */
export function transformChartData(summary: {
  normal: number
  caution: number
  warning: number
  critical: number
}): Array<{ name: string; value: number; status: StockStatus; color: string }> {
  const data = [
    { name: STOCK_STATUS_LABELS[StockStatus.NORMAL], value: summary.normal, status: StockStatus.NORMAL, color: STOCK_STATUS_COLORS[StockStatus.NORMAL] },
    { name: STOCK_STATUS_LABELS[StockStatus.CAUTION], value: summary.caution, status: StockStatus.CAUTION, color: STOCK_STATUS_COLORS[StockStatus.CAUTION] },
    { name: STOCK_STATUS_LABELS[StockStatus.WARNING], value: summary.warning, status: StockStatus.WARNING, color: STOCK_STATUS_COLORS[StockStatus.WARNING] },
    { name: STOCK_STATUS_LABELS[StockStatus.CRITICAL], value: summary.critical, status: StockStatus.CRITICAL, color: STOCK_STATUS_COLORS[StockStatus.CRITICAL] },
  ]
  return data.filter((d) => d.value > 0)
}

export function InventoryStatusWidget({ loading: externalLoading }: InventoryStatusWidgetProps) {
  const { summary, loading: hookLoading, refresh } = useInventoryStatus()
  const loading = externalLoading || hookLoading

  // 대시보드 로드 시 자동 새로고침
  useEffect(() => {
    refresh()
  }, [refresh])

  const chartData = transformChartData(summary)
  const hasData = chartData.length > 0

  const abnormalCount = summary.caution + summary.warning + summary.critical

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <span>재고 현황</span>
          {abnormalCount > 0 && (
            <Badge variant="destructive" className="text-xs">
              {abnormalCount}건 주의
            </Badge>
          )}
        </CardTitle>
        <Package className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-[200px] flex items-center justify-center">
            <div className="w-full h-full animate-pulse bg-gray-100 rounded" />
          </div>
        ) : !hasData ? (
          <div className="h-[200px] flex items-center justify-center">
            <p className="text-muted-foreground">재고 데이터가 없습니다</p>
          </div>
        ) : (
          <>
            <div className="h-[160px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={60}
                    paddingAngle={2}
                    dataKey="value"
                    nameKey="name"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number | undefined, name: string | undefined) => [
                      `${value ?? 0}개 품목`,
                      name ?? '',
                    ]}
                  />
                  <Legend
                    layout="horizontal"
                    verticalAlign="bottom"
                    align="center"
                    iconType="circle"
                    iconSize={10}
                    formatter={(value: string) => (
                      <span className="text-xs">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* 상태별 카운트 */}
            <div className="grid grid-cols-4 gap-2 mt-4">
              <div className="text-center p-2 rounded bg-green-50">
                <div className="text-lg font-bold text-green-600">{summary.normal}</div>
                <div className="text-xs text-green-700">정상</div>
              </div>
              <div className="text-center p-2 rounded bg-yellow-50">
                <div className="text-lg font-bold text-yellow-600">{summary.caution}</div>
                <div className="text-xs text-yellow-700">주의</div>
              </div>
              <div className="text-center p-2 rounded bg-orange-50">
                <div className="text-lg font-bold text-orange-600">{summary.warning}</div>
                <div className="text-xs text-orange-700">경고</div>
              </div>
              <div className="text-center p-2 rounded bg-red-50">
                <div className="text-lg font-bold text-red-600">{summary.critical}</div>
                <div className="text-xs text-red-700">위험</div>
              </div>
            </div>

            {/* 총계 */}
            <div className="text-center mt-3 text-sm text-muted-foreground">
              총 {summary.total}개 품목
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
