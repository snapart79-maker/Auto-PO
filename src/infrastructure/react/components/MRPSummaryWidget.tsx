/**
 * MRPSummaryWidget 컴포넌트
 * MRP 권고 품목 및 재고 부족 경고 표시
 */

import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { AlertTriangle, Package, TrendingDown } from 'lucide-react'
import type { MRPRecommendation } from '../hooks/useDashboard'

export interface MRPSummaryWidgetProps {
  lowStockProducts: MRPRecommendation[]
  loading?: boolean
}

/**
 * 공급처 타입에 따른 배지 variant
 */
export function getSupplierBadgeVariant(
  supplierType: string
): 'default' | 'secondary' | 'outline' {
  switch (supplierType) {
    case 'DOMESTIC':
      return 'default'
    case 'VIETNAM':
      return 'secondary'
    case 'BOTH':
      return 'outline'
    default:
      return 'default'
  }
}

/**
 * 공급처 타입 라벨
 */
export const SUPPLIER_TYPE_LABELS: Record<string, string> = {
  DOMESTIC: '국내',
  VIETNAM: '베트남',
  BOTH: '국내/베트남',
}

/**
 * 수량 포맷팅
 */
export function formatQuantity(quantity: number): string {
  return quantity.toLocaleString('ko-KR')
}

/**
 * 재고 위험도 계산
 */
export function getStockRiskLevel(
  currentStock: number,
  reorderPoint: number
): 'critical' | 'warning' | 'normal' {
  const ratio = currentStock / reorderPoint
  if (ratio < 0.3) return 'critical'
  if (ratio < 0.7) return 'warning'
  return 'normal'
}

/**
 * 위험도별 색상 클래스
 */
export function getRiskColorClass(risk: 'critical' | 'warning' | 'normal'): string {
  switch (risk) {
    case 'critical':
      return 'text-red-600 bg-red-50'
    case 'warning':
      return 'text-orange-600 bg-orange-50'
    default:
      return 'text-yellow-600 bg-yellow-50'
  }
}

export function MRPSummaryWidget({ lowStockProducts, loading = false }: MRPSummaryWidgetProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <span>MRP 권고 현황</span>
          {lowStockProducts.length > 0 && (
            <Badge variant="destructive" className="text-xs">
              {lowStockProducts.length}건
            </Badge>
          )}
        </CardTitle>
        <Package className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-14 animate-pulse bg-gray-100 rounded" />
            ))}
          </div>
        ) : lowStockProducts.length === 0 ? (
          <div className="text-center py-8">
            <TrendingDown className="h-12 w-12 mx-auto text-green-500 mb-2" />
            <p className="text-green-600 font-medium">재고 정상</p>
            <p className="text-muted-foreground text-sm mt-1">
              모든 품목이 안전 재고 이상입니다
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {lowStockProducts.map((product) => {
              const riskLevel = getStockRiskLevel(product.currentStock, product.reorderPoint)
              const riskClass = getRiskColorClass(riskLevel)

              return (
                <div
                  key={product.productId}
                  className={`p-3 rounded-lg border ${riskClass}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                        <span className="font-medium text-sm truncate">
                          {product.productCode}
                        </span>
                        <Badge variant={getSupplierBadgeVariant(product.supplierType)}>
                          {SUPPLIER_TYPE_LABELS[product.supplierType] ?? product.supplierType}
                        </Badge>
                      </div>
                      <p className="text-xs mt-1 truncate">{product.productName}</p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <div className="text-xs text-muted-foreground">
                        현재고: {formatQuantity(product.currentStock)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        발주점: {formatQuantity(product.reorderPoint)}
                      </div>
                      <div className="text-sm font-bold mt-1">
                        권고: {formatQuantity(product.recommendedQuantity)}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
