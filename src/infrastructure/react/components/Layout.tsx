/**
 * Layout - 메인 레이아웃 컴포넌트
 * PRD 2.2 메뉴 구조에 따른 접이식 그룹 메뉴
 */

import { NavLink, Outlet } from 'react-router-dom'
import {
  Building2,
  Car,
  Users,
  Package,
  DollarSign,
  LayoutDashboard,
  Settings,
  PackageSearch,
  ArrowDownToLine,
  ArrowUpFromLine,
  ClipboardList,
  Calculator,
  FileText,
  Globe,
  Truck,
  PlusCircle,
  RefreshCcw,
} from 'lucide-react'
import { cn } from '../lib/utils'
import { NavGroup, type NavItem } from './NavGroup'

/**
 * 메뉴 그룹 정의 (PRD 2.2)
 */

// 기준관리 그룹
const masterDataItems: NavItem[] = [
  { to: '/company', icon: Building2, label: '회사정보' },
  { to: '/vehicle-models', icon: Car, label: '차종관리' },
  { to: '/partners', icon: Users, label: '거래처관리' },
  { to: '/products', icon: Package, label: '제품관리' },
  { to: '/exchange-rates', icon: DollarSign, label: '환율관리' },
]

// 입고/출고 그룹
const inventoryTransactionItems: NavItem[] = [
  { to: '/inbound', icon: ArrowDownToLine, label: '입고 현황' },
  { to: '/outbound', icon: ArrowUpFromLine, label: '출고 현황' },
]

// 재고 관리 그룹
const inventoryManagementItems: NavItem[] = [
  { to: '/inventory/status', icon: PackageSearch, label: '재고 현황' },
  { to: '/inventory/initial', icon: PlusCircle, label: '초기 재고 등록' },
  { to: '/inventory/adjustment', icon: RefreshCcw, label: '재고 조정' },
]

// 발주 관리 그룹
const orderManagementItems: NavItem[] = [
  { to: '/shipment-plan', icon: Truck, label: '출고 계획 등록' },
  { to: '/mrp', icon: Calculator, label: 'MRP 계산 / 발주 권고' },
  { to: '/orders', icon: FileText, label: '발주서 관리' },
  { to: '/mrp/vietnam', icon: Globe, label: '베트남 주간 발주' },
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
      <aside className="w-64 border-r bg-card flex flex-col" role="complementary" aria-label="사이드바">
        <div className="flex h-16 items-center border-b px-6">
          <h1 className="text-xl font-bold">Auto PO</h1>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-2" role="navigation" aria-label="메인 네비게이션">
          {/* 대시보드 (단독) */}
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )
            }
          >
            <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
            대시보드
          </NavLink>

          {/* 기준관리 그룹 */}
          <NavGroup
            title="기준관리"
            icon={Settings}
            items={masterDataItems}
            defaultOpen={true}
            testId="nav-master-data"
          />

          {/* 입고/출고 그룹 */}
          <NavGroup
            title="입고/출고"
            icon={ClipboardList}
            items={inventoryTransactionItems}
            defaultOpen={false}
            testId="nav-inventory-transaction"
          />

          {/* 재고 관리 그룹 */}
          <NavGroup
            title="재고 관리"
            icon={PackageSearch}
            items={inventoryManagementItems}
            defaultOpen={false}
            testId="nav-inventory-management"
          />

          {/* 발주 관리 그룹 */}
          <NavGroup
            title="발주 관리"
            icon={FileText}
            items={orderManagementItems}
            defaultOpen={false}
            testId="nav-order-management"
          />
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
