/**
 * OrderStatusChart 컴포넌트
 * 발주 상태별 분포 차트
 */

import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import type { OrderStatusCount } from '../hooks/useDashboard'
import { ORDER_STATUS_LABELS } from '../hooks/useDashboard'

export interface OrderStatusChartProps {
  statusCounts: OrderStatusCount
  loading?: boolean
}

/**
 * 상태별 색상
 */
export const STATUS_COLORS: Record<string, string> = {
  DRAFT: '#94a3b8',        // slate-400
  CONFIRMED: '#3b82f6',    // blue-500
  SENT: '#8b5cf6',         // violet-500
  PARTIALLY_RECEIVED: '#f59e0b', // amber-500
  COMPLETED: '#22c55e',    // green-500
  CANCELLED: '#ef4444',    // red-500
}

/**
 * 차트 데이터 변환
 */
export function transformChartData(statusCounts: OrderStatusCount): Array<{
  name: string
  value: number
  color: string
  statusKey: string
}> {
  return Object.entries(statusCounts)
    .filter(([_, count]) => count > 0)
    .map(([status, count]) => ({
      name: ORDER_STATUS_LABELS[status] ?? status,
      value: count,
      color: STATUS_COLORS[status] ?? '#6b7280',
      statusKey: status,
    }))
}

/**
 * 총 발주 수 계산
 */
export function calculateTotalOrders(statusCounts: OrderStatusCount): number {
  return Object.values(statusCounts).reduce((sum, count) => sum + count, 0)
}

export function OrderStatusChart({ statusCounts, loading = false }: OrderStatusChartProps) {
  const chartData = transformChartData(statusCounts)
  const totalOrders = calculateTotalOrders(statusCounts)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">발주 상태 분포</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-[200px] flex items-center justify-center">
            <div className="h-32 w-32 rounded-full animate-pulse bg-gray-100" />
          </div>
        ) : totalOrders === 0 ? (
          <div className="h-[200px] flex items-center justify-center">
            <p className="text-muted-foreground">발주 데이터가 없습니다</p>
          </div>
        ) : (
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number | undefined, name: string | undefined) => [
                    `${value ?? 0}건`,
                    name ?? '',
                  ]}
                />
                <Legend
                  layout="horizontal"
                  verticalAlign="bottom"
                  align="center"
                  iconType="circle"
                  iconSize={8}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
        <div className="text-center mt-2">
          <span className="text-2xl font-bold">{totalOrders}</span>
          <span className="text-muted-foreground ml-1">건 총 발주</span>
        </div>
      </CardContent>
    </Card>
  )
}
