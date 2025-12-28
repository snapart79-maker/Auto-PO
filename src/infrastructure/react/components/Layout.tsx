/**
 * Layout - 메인 레이아웃 컴포넌트
 */

import { NavLink, Outlet } from 'react-router-dom'
import {
  Building2,
  Car,
  Users,
  Package,
  DollarSign,
  LayoutDashboard,
  Upload,
  Calculator,
  FileText,
  ArrowDownToLine,
  Truck,
  Globe,
} from 'lucide-react'
import { cn } from '../lib/utils'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: '대시보드' },
  { to: '/company', icon: Building2, label: '회사정보' },
  { to: '/vehicle-models', icon: Car, label: '차종관리' },
  { to: '/partners', icon: Users, label: '거래처관리' },
  { to: '/products', icon: Package, label: '제품관리' },
  { to: '/exchange-rates', icon: DollarSign, label: '환율관리' },
]

const uploadItems = [
  { to: '/upload/inventory', icon: ArrowDownToLine, label: '입출고 업로드' },
  { to: '/upload/shipment', icon: Truck, label: '출고계획 업로드' },
]

const mrpItems = [
  { to: '/mrp', icon: Calculator, label: 'MRP 계산' },
  { to: '/mrp/vietnam', icon: Globe, label: '베트남 발주' },
]

const orderItems = [
  { to: '/orders', icon: FileText, label: '발주관리' },
]

export function Layout() {
  return (
    <div className="flex h-screen bg-background">
      {/* Skip Navigation Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-4 focus:left-4 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
      >
        메인 콘텐츠로 건너뛰기
      </a>

      {/* Sidebar */}
      <aside className="w-64 border-r bg-card" role="complementary" aria-label="사이드바">
        <div className="flex h-16 items-center border-b px-6">
          <h1 className="text-xl font-bold">Auto PO</h1>
        </div>
        <nav className="p-4 space-y-1" role="navigation" aria-label="메인 네비게이션">
          {/* 기본 메뉴 */}
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )
              }
            >
              <item.icon className="h-4 w-4" aria-hidden="true" />
              {item.label}
            </NavLink>
          ))}

          {/* 업로드 섹션 */}
          <div className="pt-4" role="group" aria-labelledby="upload-section-title">
            <div
              id="upload-section-title"
              className="flex items-center gap-3 px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider"
            >
              <Upload className="h-3 w-3" aria-hidden="true" />
              데이터 업로드
            </div>
            {uploadItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ml-2',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )
                }
              >
                <item.icon className="h-4 w-4" aria-hidden="true" />
                {item.label}
              </NavLink>
            ))}
          </div>

          {/* MRP 섹션 */}
          <div className="pt-4" role="group" aria-labelledby="mrp-section-title">
            <div
              id="mrp-section-title"
              className="flex items-center gap-3 px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider"
            >
              <Calculator className="h-3 w-3" aria-hidden="true" />
              MRP 관리
            </div>
            {mrpItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ml-2',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )
                }
              >
                <item.icon className="h-4 w-4" aria-hidden="true" />
                {item.label}
              </NavLink>
            ))}
          </div>

          {/* 발주 관리 */}
          <div className="pt-4" role="group" aria-labelledby="order-section-title">
            <div
              id="order-section-title"
              className="flex items-center gap-3 px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider"
            >
              <FileText className="h-3 w-3" aria-hidden="true" />
              발주 관리
            </div>
            {orderItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ml-2',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )
                }
              >
                <item.icon className="h-4 w-4" aria-hidden="true" />
                {item.label}
              </NavLink>
            ))}
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main
        id="main-content"
        className="flex-1 overflow-auto p-6"
        role="main"
        aria-label="메인 콘텐츠"
        tabIndex={-1}
      >
        <Outlet />
      </main>
    </div>
  )
}
