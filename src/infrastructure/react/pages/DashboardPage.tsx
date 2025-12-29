/**
 * DashboardPage - 대시보드 페이지
 * 시스템 전체 현황을 한눈에 파악
 */

import { useEffect } from 'react'
import { PageHeader } from '../components/PageHeader'
import { StatCard } from '../components/StatCard'
import { RecentOrdersWidget } from '../components/RecentOrdersWidget'
import { MRPSummaryWidget } from '../components/MRPSummaryWidget'
import { OrderStatusChart } from '../components/OrderStatusChart'
import { InventoryChart } from '../components/InventoryChart'
import { InventoryStatusWidget } from '../components/InventoryStatusWidget'
import { useDashboard, getStatCardVariant } from '../hooks/useDashboard'
import { SupabaseOrderRepository } from '@infrastructure/repositories/SupabaseOrderRepository'
import { SupabaseProductRepository } from '@infrastructure/repositories/SupabaseProductRepository'
import { SupabasePartnerRepository } from '@infrastructure/repositories/SupabasePartnerRepository'
import { SupabaseInventoryRepository } from '@infrastructure/repositories/SupabaseInventoryRepository'
import { Package, Users, FileText, AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '../components/ui/button'

// Repository 인스턴스
const orderRepository = new SupabaseOrderRepository()
const productRepository = new SupabaseProductRepository()
const partnerRepository = new SupabasePartnerRepository()
const inventoryRepository = new SupabaseInventoryRepository()

export function DashboardPage() {
  const {
    step,
    stats,
    recentOrders,
    lowStockProducts,
    orderStatusCounts,
    error,
    loadDashboardData,
    refresh,
  } = useDashboard({
    orderRepository,
    productRepository,
    partnerRepository,
    inventoryRepository,
  })

  const isLoading = step === 'loading'

  // 초기 데이터 로드
  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title="대시보드"
        description="Auto PO 시스템 현황을 한눈에 확인하세요."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            새로고침
          </Button>
        }
      />

      <div className="flex-1 p-6 overflow-auto">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <StatCard
            title="총 제품수"
            value={stats.totalProducts}
            description="활성 제품 기준"
            icon={Package}
            variant={getStatCardVariant('totalProducts', stats.totalProducts)}
            loading={isLoading}
          />

          <StatCard
            title="거래처"
            value={stats.totalPartners}
            description="협력사/고객사 합계"
            icon={Users}
            variant={getStatCardVariant('totalPartners', stats.totalPartners)}
            loading={isLoading}
          />

          <StatCard
            title="진행중 발주"
            value={stats.pendingOrders}
            description="미완료 발주건"
            icon={FileText}
            variant={getStatCardVariant('pendingOrders', stats.pendingOrders)}
            loading={isLoading}
          />

          <StatCard
            title="긴급 알림"
            value={stats.lowStockItems}
            description="재고 부족 품목"
            icon={AlertTriangle}
            variant={getStatCardVariant('lowStockItems', stats.lowStockItems)}
            loading={isLoading}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <OrderStatusChart
            statusCounts={orderStatusCounts}
            loading={isLoading}
          />
          <InventoryStatusWidget loading={isLoading} />
          <InventoryChart
            lowStockProducts={lowStockProducts}
            loading={isLoading}
          />
        </div>

        {/* Widgets Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecentOrdersWidget
            orders={recentOrders}
            loading={isLoading}
          />
          <MRPSummaryWidget
            lowStockProducts={lowStockProducts}
            loading={isLoading}
          />
        </div>
      </div>
    </div>
  )
}
