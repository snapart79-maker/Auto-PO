/**
 * useDashboard Hook
 * 대시보드 데이터 로드 및 통계 관리
 */

import { useState, useCallback, useMemo } from 'react'
import type { PurchaseOrder } from '@domain/entities/PurchaseOrder'
import type { Product } from '@domain/entities/Product'
import type { Partner } from '@domain/entities/Partner'
import type { IOrderRepository } from '@domain/repositories/IOrderRepository'
import type { IProductRepository } from '@domain/repositories/IProductRepository'
import type { IPartnerRepository } from '@domain/repositories/IPartnerRepository'
import type { IInventoryRepository, StockSummary } from '@domain/repositories/IInventoryRepository'
import { DateRange } from '@domain/valueObjects/DateRange'

export type DashboardStep = 'idle' | 'loading' | 'complete' | 'error'

export interface OrderStatusCount {
  DRAFT: number
  CONFIRMED: number
  SENT: number
  PARTIALLY_RECEIVED: number
  COMPLETED: number
  CANCELLED: number
}

export interface DashboardStats {
  totalProducts: number
  totalPartners: number
  pendingOrders: number
  lowStockItems: number
  orderStatusCounts?: OrderStatusCount
}

export interface RecentOrder {
  id: string
  orderNumber: string
  partnerName: string
  orderDate: Date
  status: string
  orderType: string
  totalAmount?: number
}

export interface MRPRecommendation {
  productId: string
  productCode: string
  productName: string
  currentStock: number
  reorderPoint: number
  recommendedQuantity: number
  supplierType: string
}

export interface UseDashboardOptions {
  orderRepository: IOrderRepository
  productRepository: IProductRepository
  partnerRepository: IPartnerRepository
  inventoryRepository: IInventoryRepository
}

export interface UseDashboardReturn {
  step: DashboardStep
  stats: DashboardStats
  recentOrders: RecentOrder[]
  lowStockProducts: MRPRecommendation[]
  orderStatusCounts: OrderStatusCount
  error: string | null
  loadDashboardData: () => Promise<void>
  refresh: () => Promise<void>
}

/**
 * 대시보드 통계 계산
 */
export function calculateDashboardStats(input: {
  totalProducts: number
  totalPartners: number
  pendingOrders: number
  lowStockItems: number
}): DashboardStats {
  return {
    totalProducts: input.totalProducts,
    totalPartners: input.totalPartners,
    pendingOrders: input.pendingOrders,
    lowStockItems: input.lowStockItems,
  }
}

/**
 * 숫자 포맷팅 (천 단위 콤마)
 */
export function formatStatValue(value: number): string {
  return value.toLocaleString('ko-KR')
}

/**
 * Stat Card variant 결정
 */
export function getStatCardVariant(
  type: string,
  value: number
): 'default' | 'warning' | 'success' | 'info' | 'danger' {
  if (type === 'lowStockItems') {
    return value > 0 ? 'warning' : 'default'
  }
  if (type === 'pendingOrders') {
    return 'info'
  }
  return 'default'
}

/**
 * 발주 상태별 카운트 계산
 */
function countOrdersByStatus(orders: PurchaseOrder[]): OrderStatusCount {
  const counts: OrderStatusCount = {
    DRAFT: 0,
    CONFIRMED: 0,
    SENT: 0,
    PARTIALLY_RECEIVED: 0,
    COMPLETED: 0,
    CANCELLED: 0,
  }

  for (const order of orders) {
    const status = order.status.value
    if (status in counts) {
      counts[status as keyof OrderStatusCount]++
    }
  }

  return counts
}

/**
 * 재고 부족 품목 필터링
 */
function findLowStockProducts(
  products: Product[],
  stockSummaries: StockSummary[],
  dailyAverages: Map<string, number>
): MRPRecommendation[] {
  const stockMap = new Map(stockSummaries.map((s) => [s.productId, s.currentStock]))
  const lowStockItems: MRPRecommendation[] = []

  for (const product of products) {
    const currentStock = stockMap.get(product.id) ?? 0
    const dailyAvg = dailyAverages.get(product.id) ?? 0
    const leadTime = product.primarySupplier.isVietnam()
      ? product.overseasLeadTime
      : product.domesticLeadTime

    // 안전재고 계산
    const safetyMultiplier = product.primarySupplier.isVietnam() ? 1.5 : 1.2
    const safetyStock = Math.ceil(dailyAvg * leadTime * safetyMultiplier)
    const reorderPoint = safetyStock + Math.ceil(dailyAvg * leadTime)

    if (currentStock < reorderPoint) {
      const recommendedQty = Math.max(0, reorderPoint - currentStock + Math.ceil(dailyAvg * 7))
      lowStockItems.push({
        productId: product.id,
        productCode: product.productCode,
        productName: product.productName,
        currentStock,
        reorderPoint,
        recommendedQuantity: recommendedQty,
        supplierType: product.primarySupplier.value,
      })
    }
  }

  return lowStockItems.slice(0, 10) // 상위 10개만 반환
}

export function useDashboard(options: UseDashboardOptions): UseDashboardReturn {
  const { orderRepository, productRepository, partnerRepository, inventoryRepository } = options

  const [step, setStep] = useState<DashboardStep>('idle')
  const [error, setError] = useState<string | null>(null)

  // 데이터 상태
  const [products, setProducts] = useState<Product[]>([])
  const [partners, setPartners] = useState<Partner[]>([])
  const [orders, setOrders] = useState<PurchaseOrder[]>([])
  const [lowStockProducts, setLowStockProducts] = useState<MRPRecommendation[]>([])

  // 통계 계산
  const stats = useMemo<DashboardStats>(() => {
    const pendingOrders = orders.filter(
      (o) => !['COMPLETED', 'CANCELLED'].includes(o.status.value)
    ).length

    return {
      totalProducts: products.filter((p) => p.isActive).length,
      totalPartners: partners.length,
      pendingOrders,
      lowStockItems: lowStockProducts.length,
    }
  }, [products, partners, orders, lowStockProducts])

  // 발주 상태별 카운트
  const orderStatusCounts = useMemo(() => countOrdersByStatus(orders), [orders])

  // 최근 발주 5건
  const recentOrders = useMemo<RecentOrder[]>(() => {
    const partnerMap = new Map(partners.map((p) => [p.id, p.partnerName]))

    return orders
      .sort((a, b) => b.orderDate.getTime() - a.orderDate.getTime())
      .slice(0, 5)
      .map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        partnerName: partnerMap.get(order.partnerId) ?? '알 수 없음',
        orderDate: order.orderDate,
        status: order.status.value,
        orderType: order.orderType,
        totalAmount: order.totalAmount?.amount,
      }))
  }, [orders, partners])

  // 대시보드 데이터 로드
  const loadDashboardData = useCallback(async () => {
    setStep('loading')
    setError(null)

    try {
      // 병렬로 데이터 로드 (개별 실패 허용)
      const [productsResult, partnersResult, ordersResult] = await Promise.allSettled([
        productRepository.findAll(),
        partnerRepository.findAll(),
        orderRepository.findAll(),
      ])

      const loadedProducts = productsResult.status === 'fulfilled' ? productsResult.value : []
      const loadedPartners = partnersResult.status === 'fulfilled' ? partnersResult.value : []
      const loadedOrders = ordersResult.status === 'fulfilled' ? ordersResult.value : []

      setProducts(loadedProducts)
      setPartners(loadedPartners)
      setOrders(loadedOrders)

      // 재고 데이터 로드 (활성 제품만)
      const activeProducts = loadedProducts.filter((p) => p.isActive)
      const productIds = activeProducts.map((p) => p.id)

      if (productIds.length > 0) {
        try {
          // 최근 30일 일평균 출고량 조회
          const endDate = new Date()
          const startDate = new Date()
          startDate.setDate(startDate.getDate() - 30)
          const dateRange = DateRange.create(startDate, endDate)

          const [stockSummaries, dailyAverages] = await Promise.all([
            inventoryRepository.getStockSummaries(productIds),
            inventoryRepository.getDailyAverages(productIds, dateRange),
          ])

          const dailyAvgMap = new Map(dailyAverages.map((d) => [d.productId, d.averageQuantity]))
          const lowStock = findLowStockProducts(activeProducts, stockSummaries, dailyAvgMap)
          setLowStockProducts(lowStock)
        } catch {
          // 재고 데이터 로드 실패해도 계속 진행
          setLowStockProducts([])
        }
      }

      // 일부 데이터 로드 실패 시 경고
      const hasErrors = [productsResult, partnersResult, ordersResult].some(r => r.status === 'rejected')
      if (hasErrors) {
        setError('일부 데이터를 불러오지 못했습니다. Supabase 연결을 확인하세요.')
      }

      setStep('complete')
    } catch (err) {
      // 전체 실패 시에도 빈 데이터로 표시
      setProducts([])
      setPartners([])
      setOrders([])
      setLowStockProducts([])
      setError(err instanceof Error ? err.message : '대시보드 데이터 로드 실패')
      setStep('complete') // 에러가 있어도 complete로 전환하여 UI 표시
    }
  }, [orderRepository, productRepository, partnerRepository, inventoryRepository])

  const refresh = useCallback(async () => {
    await loadDashboardData()
  }, [loadDashboardData])

  return {
    step,
    stats,
    recentOrders,
    lowStockProducts,
    orderStatusCounts,
    error,
    loadDashboardData,
    refresh,
  }
}

/**
 * 발주 상태 한글 라벨
 */
export const ORDER_STATUS_LABELS: Record<string, string> = {
  DRAFT: '초안',
  CONFIRMED: '확정',
  SENT: '발송',
  PARTIALLY_RECEIVED: '부분입고',
  COMPLETED: '완료',
  CANCELLED: '취소',
}

/**
 * 발주 유형 한글 라벨
 */
export const ORDER_TYPE_LABELS: Record<string, string> = {
  DOMESTIC: '국내',
  VIETNAM: '베트남',
}
