/**
 * InventoryChart 컴포넌트
 * 재고 현황 차트 (재고 부족 품목 시각화)
 */

import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import type { MRPRecommendation } from '../hooks/useDashboard'

export interface InventoryChartProps {
  lowStockProducts: MRPRecommendation[]
  loading?: boolean
}

/**
 * 차트 데이터 변환
 */
export function transformInventoryChartData(products: MRPRecommendation[]): Array<{
  name: string
  currentStock: number
  reorderPoint: number
  gap: number
}> {
  return products.slice(0, 8).map((product) => ({
    name: product.productCode.length > 10
      ? product.productCode.substring(0, 10) + '...'
      : product.productCode,
    currentStock: product.currentStock,
    reorderPoint: product.reorderPoint,
    gap: product.reorderPoint - product.currentStock,
  }))
}

/**
 * 재고율에 따른 바 색상
 */
export function getBarColor(currentStock: number, reorderPoint: number): string {
  const ratio = currentStock / reorderPoint
  if (ratio < 0.3) return '#ef4444'  // red-500
  if (ratio < 0.5) return '#f97316'  // orange-500
  if (ratio < 0.7) return '#eab308'  // yellow-500
  return '#22c55e'  // green-500
}

export function InventoryChart({ lowStockProducts, loading = false }: InventoryChartProps) {
  const chartData = transformInventoryChartData(lowStockProducts)

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle className="text-lg">재고 부족 품목 현황</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-[250px] flex items-center justify-center">
            <div className="w-full h-full animate-pulse bg-gray-100 rounded" />
          </div>
        ) : lowStockProducts.length === 0 ? (
          <div className="h-[250px] flex items-center justify-center">
            <p className="text-muted-foreground">재고 부족 품목이 없습니다</p>
          </div>
        ) : (
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value: number | undefined, name: string | undefined) => {
                    const labels: Record<string, string> = {
                      currentStock: '현재 재고',
                      reorderPoint: '발주점',
                    }
                    const displayName = name ?? ''
                    return [(value ?? 0).toLocaleString(), labels[displayName] ?? displayName]
                  }}
                />
                <Bar
                  dataKey="currentStock"
                  name="currentStock"
                  radius={[4, 4, 0, 0]}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={getBarColor(entry.currentStock, entry.reorderPoint)}
                    />
                  ))}
                </Bar>
                <Bar
                  dataKey="reorderPoint"
                  name="reorderPoint"
                  fill="#94a3b8"
                  opacity={0.3}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        <div className="flex items-center justify-center gap-6 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-red-500" />
            <span className="text-muted-foreground">위험 (&lt;30%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-orange-500" />
            <span className="text-muted-foreground">주의 (30-50%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-yellow-500" />
            <span className="text-muted-foreground">경고 (50-70%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-slate-400 opacity-30" />
            <span className="text-muted-foreground">발주점</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
