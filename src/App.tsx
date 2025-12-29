import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ERPLayout } from '@infrastructure/react/components/ERPLayout'

// Lazy load pages for code splitting

// Dashboard
const DashboardPage = lazy(() => import('@infrastructure/react/pages/DashboardPage').then(m => ({ default: m.DashboardPage })))

// 기준관리
const CompanySettingsPage = lazy(() => import('@infrastructure/react/pages/CompanySettingsPage').then(m => ({ default: m.CompanySettingsPage })))
const VehicleModelsPage = lazy(() => import('@infrastructure/react/pages/VehicleModelsPage').then(m => ({ default: m.VehicleModelsPage })))
const PartnersPage = lazy(() => import('@infrastructure/react/pages/PartnersPage').then(m => ({ default: m.PartnersPage })))
const ProductsPage = lazy(() => import('@infrastructure/react/pages/ProductsPage').then(m => ({ default: m.ProductsPage })))
const ExchangeRatesPage = lazy(() => import('@infrastructure/react/pages/ExchangeRatesPage').then(m => ({ default: m.ExchangeRatesPage })))

// 입고/출고
const InboundStatusPage = lazy(() => import('@infrastructure/react/pages/InboundStatusPage').then(m => ({ default: m.InboundStatusPage })))
const OutboundStatusPage = lazy(() => import('@infrastructure/react/pages/OutboundStatusPage').then(m => ({ default: m.OutboundStatusPage })))

// 재고 관리
const InventoryStatusPage = lazy(() => import('@infrastructure/react/pages/InventoryStatusPage').then(m => ({ default: m.InventoryStatusPage })))
const InitialInventoryPage = lazy(() => import('@infrastructure/react/pages/InitialInventoryPage').then(m => ({ default: m.InitialInventoryPage })))
const InventoryAdjustmentPage = lazy(() => import('@infrastructure/react/pages/InventoryAdjustmentPage').then(m => ({ default: m.InventoryAdjustmentPage })))

// 발주 관리
const ShipmentPlanPage = lazy(() => import('@infrastructure/react/pages/ShipmentPlanPage').then(m => ({ default: m.ShipmentPlanPage })))
const MRPPage = lazy(() => import('@infrastructure/react/pages/MRPPage').then(m => ({ default: m.MRPPage })))
const PurchaseOrdersPage = lazy(() => import('@infrastructure/react/pages/PurchaseOrdersPage').then(m => ({ default: m.PurchaseOrdersPage })))
const VietnamOrderPage = lazy(() => import('@infrastructure/react/pages/VietnamOrderPage').then(m => ({ default: m.VietnamOrderPage })))

// Legacy (기존 업로드 페이지 - 필요시 유지)
const InventoryUploadPage = lazy(() => import('@infrastructure/react/pages/InventoryUploadPage').then(m => ({ default: m.InventoryUploadPage })))
const ShipmentUploadPage = lazy(() => import('@infrastructure/react/pages/ShipmentUploadPage').then(m => ({ default: m.ShipmentUploadPage })))

/**
 * 페이지 로딩 폴백 컴포넌트
 */
function PageLoadingFallback() {
  return (
    <div className="flex items-center justify-center h-64" role="status" aria-label="페이지 로딩 중">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">로딩 중...</p>
      </div>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ERPLayout />}>
          {/* Dashboard */}
          <Route
            index
            element={
              <Suspense fallback={<PageLoadingFallback />}>
                <DashboardPage />
              </Suspense>
            }
          />

          {/* 기준관리 */}
          <Route
            path="company"
            element={
              <Suspense fallback={<PageLoadingFallback />}>
                <CompanySettingsPage />
              </Suspense>
            }
          />
          <Route
            path="vehicle-models"
            element={
              <Suspense fallback={<PageLoadingFallback />}>
                <VehicleModelsPage />
              </Suspense>
            }
          />
          <Route
            path="partners"
            element={
              <Suspense fallback={<PageLoadingFallback />}>
                <PartnersPage />
              </Suspense>
            }
          />
          <Route
            path="products"
            element={
              <Suspense fallback={<PageLoadingFallback />}>
                <ProductsPage />
              </Suspense>
            }
          />
          <Route
            path="exchange-rates"
            element={
              <Suspense fallback={<PageLoadingFallback />}>
                <ExchangeRatesPage />
              </Suspense>
            }
          />

          {/* 입고/출고 */}
          <Route
            path="inbound"
            element={
              <Suspense fallback={<PageLoadingFallback />}>
                <InboundStatusPage />
              </Suspense>
            }
          />
          <Route
            path="outbound"
            element={
              <Suspense fallback={<PageLoadingFallback />}>
                <OutboundStatusPage />
              </Suspense>
            }
          />

          {/* 재고 관리 */}
          <Route
            path="inventory/status"
            element={
              <Suspense fallback={<PageLoadingFallback />}>
                <InventoryStatusPage />
              </Suspense>
            }
          />
          <Route
            path="inventory/initial"
            element={
              <Suspense fallback={<PageLoadingFallback />}>
                <InitialInventoryPage />
              </Suspense>
            }
          />
          <Route
            path="inventory/adjustment"
            element={
              <Suspense fallback={<PageLoadingFallback />}>
                <InventoryAdjustmentPage />
              </Suspense>
            }
          />

          {/* 발주 관리 */}
          <Route
            path="shipment-plan"
            element={
              <Suspense fallback={<PageLoadingFallback />}>
                <ShipmentPlanPage />
              </Suspense>
            }
          />
          <Route
            path="mrp"
            element={
              <Suspense fallback={<PageLoadingFallback />}>
                <MRPPage />
              </Suspense>
            }
          />
          <Route
            path="orders"
            element={
              <Suspense fallback={<PageLoadingFallback />}>
                <PurchaseOrdersPage />
              </Suspense>
            }
          />
          <Route
            path="mrp/vietnam"
            element={
              <Suspense fallback={<PageLoadingFallback />}>
                <VietnamOrderPage />
              </Suspense>
            }
          />

          {/* Legacy Upload Pages (기존 호환성 유지) */}
          <Route
            path="upload/inventory"
            element={
              <Suspense fallback={<PageLoadingFallback />}>
                <InventoryUploadPage />
              </Suspense>
            }
          />
          <Route
            path="upload/shipment"
            element={
              <Suspense fallback={<PageLoadingFallback />}>
                <ShipmentUploadPage />
              </Suspense>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
