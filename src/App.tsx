import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from '@infrastructure/react/components/Layout'

// Lazy load pages for code splitting
const DashboardPage = lazy(() => import('@infrastructure/react/pages/DashboardPage').then(m => ({ default: m.DashboardPage })))
const CompanySettingsPage = lazy(() => import('@infrastructure/react/pages/CompanySettingsPage').then(m => ({ default: m.CompanySettingsPage })))
const VehicleModelsPage = lazy(() => import('@infrastructure/react/pages/VehicleModelsPage').then(m => ({ default: m.VehicleModelsPage })))
const PartnersPage = lazy(() => import('@infrastructure/react/pages/PartnersPage').then(m => ({ default: m.PartnersPage })))
const ProductsPage = lazy(() => import('@infrastructure/react/pages/ProductsPage').then(m => ({ default: m.ProductsPage })))
const ExchangeRatesPage = lazy(() => import('@infrastructure/react/pages/ExchangeRatesPage').then(m => ({ default: m.ExchangeRatesPage })))
const InventoryUploadPage = lazy(() => import('@infrastructure/react/pages/InventoryUploadPage').then(m => ({ default: m.InventoryUploadPage })))
const ShipmentUploadPage = lazy(() => import('@infrastructure/react/pages/ShipmentUploadPage').then(m => ({ default: m.ShipmentUploadPage })))
const MRPPage = lazy(() => import('@infrastructure/react/pages/MRPPage').then(m => ({ default: m.MRPPage })))
const VietnamOrderPage = lazy(() => import('@infrastructure/react/pages/VietnamOrderPage').then(m => ({ default: m.VietnamOrderPage })))
const PurchaseOrdersPage = lazy(() => import('@infrastructure/react/pages/PurchaseOrdersPage').then(m => ({ default: m.PurchaseOrdersPage })))

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
        <Route path="/" element={<Layout />}>
          <Route
            index
            element={
              <Suspense fallback={<PageLoadingFallback />}>
                <DashboardPage />
              </Suspense>
            }
          />
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
          {/* Phase 5: Excel Upload */}
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
          {/* Phase 6: MRP + Vietnam */}
          <Route
            path="mrp"
            element={
              <Suspense fallback={<PageLoadingFallback />}>
                <MRPPage />
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
          {/* Phase 7: Purchase Orders */}
          <Route
            path="orders"
            element={
              <Suspense fallback={<PageLoadingFallback />}>
                <PurchaseOrdersPage />
              </Suspense>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
