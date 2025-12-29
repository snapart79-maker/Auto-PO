/**
 * ERPLayout - ERP/MES 스타일 레이아웃 컴포넌트
 * 상단 메인 헤더 + 왼쪽 사이드바 하위 메뉴
 */

import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import {
  Building2,
  Car,
  Users,
  Package,
  DollarSign,
  LayoutDashboard,
  PackageSearch,
  ArrowDownToLine,
  ArrowUpFromLine,
  Calculator,
  FileText,
  Globe,
  Truck,
  PlusCircle,
  RefreshCcw,
  Search,
  Settings,
  X,
} from 'lucide-react'
import { cn } from '../lib/utils'

interface MenuItem {
  to: string
  icon: React.ComponentType<{ className?: string }>
  label: string
}

interface MenuGroup {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  items: MenuItem[]
}

const menuGroups: MenuGroup[] = [
  {
    id: 'dashboard',
    label: '대시보드',
    icon: LayoutDashboard,
    items: [
      { to: '/', icon: LayoutDashboard, label: '대시보드' },
    ],
  },
  {
    id: 'master',
    label: '기준관리',
    icon: Settings,
    items: [
      { to: '/company', icon: Building2, label: '회사정보' },
      { to: '/vehicle-models', icon: Car, label: '차종관리' },
      { to: '/partners', icon: Users, label: '거래처관리' },
      { to: '/products', icon: Package, label: '제품관리' },
      { to: '/exchange-rates', icon: DollarSign, label: '환율관리' },
    ],
  },
  {
    id: 'transaction',
    label: '입고/출고',
    icon: ArrowDownToLine,
    items: [
      { to: '/inbound', icon: ArrowDownToLine, label: '입고 현황' },
      { to: '/outbound', icon: ArrowUpFromLine, label: '출고 현황' },
    ],
  },
  {
    id: 'inventory',
    label: '재고 관리',
    icon: PackageSearch,
    items: [
      { to: '/inventory/status', icon: PackageSearch, label: '재고 현황' },
      { to: '/inventory/initial', icon: PlusCircle, label: '초기 재고 등록' },
      { to: '/inventory/adjustment', icon: RefreshCcw, label: '재고 조정' },
    ],
  },
  {
    id: 'order',
    label: '발주 관리',
    icon: FileText,
    items: [
      { to: '/shipment-plan', icon: Truck, label: '출고 계획 등록' },
      { to: '/mrp', icon: Calculator, label: 'MRP 계산' },
      { to: '/orders', icon: FileText, label: '발주서 관리' },
      { to: '/mrp/vietnam', icon: Globe, label: '베트남 발주' },
    ],
  },
]

// 경로에서 현재 그룹 찾기
function findCurrentGroup(pathname: string): MenuGroup {
  const found = menuGroups.find((group) =>
    group.items.some((item) => item.to === pathname)
  )
  // menuGroups[0]는 항상 존재 (대시보드)
  return found ?? menuGroups[0]!
}

// 경로에서 페이지 제목 찾기
function getPageTitle(pathname: string): string {
  for (const group of menuGroups) {
    const item = group.items.find((i) => i.to === pathname)
    if (item) return item.label
  }
  return '자동발주 시스템'
}

export function ERPLayout() {
  const location = useLocation()
  const [activeGroup, setActiveGroup] = useState<MenuGroup>(() => findCurrentGroup(location.pathname))
  const pageTitle = getPageTitle(location.pathname)

  // 경로 변경 시 활성 그룹 업데이트
  useEffect(() => {
    const currentGroup = findCurrentGroup(location.pathname)
    setActiveGroup(currentGroup)
  }, [location.pathname])

  return (
    <div className="flex flex-col h-screen bg-[#e8e8e8]">
      {/* 상단 타이틀 바 */}
      <header className="h-8 bg-gradient-to-b from-[#4a6fa5] to-[#3d5a80] flex items-center px-3 border-b border-[#2c4a6e]">
        <div className="flex items-center gap-2 text-white font-bold text-sm">
          <Package className="h-4 w-4" />
          <span>Auto PO - 자동발주시스템</span>
        </div>
        <div className="flex-1" />
        <div className="text-white/80 text-xs">
          경림테크(주)
        </div>
      </header>

      {/* 상단 메인 메뉴 바 */}
      <nav className="h-9 bg-gradient-to-b from-[#f8f8f8] to-[#e0e0e0] border-b border-[#bbb] flex items-center px-1">
        {menuGroups.map((group) => {
          const isActive = activeGroup.id === group.id
          const Icon = group.icon
          return (
            <button
              key={group.id}
              onClick={() => setActiveGroup(group)}
              className={cn(
                'flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium rounded-t border-t border-l border-r',
                'transition-colors',
                isActive
                  ? 'bg-white border-[#999] text-[#1a3a5c] -mb-[1px] relative z-10'
                  : 'bg-transparent border-transparent text-gray-600 hover:bg-[#e8e8e8] hover:text-gray-800'
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {group.label}
            </button>
          )
        })}

        <div className="flex-1" />

        {/* 우측 버튼들 */}
        <div className="flex items-center gap-1 mr-2">
          <button className="flex items-center gap-1 px-2 py-1 text-xs hover:bg-[#d0d0d0] rounded">
            <Search className="h-3.5 w-3.5 text-[#4a6fa5]" />
            조회
          </button>
          <button className="flex items-center gap-1 px-2 py-1 text-xs hover:bg-[#d0d0d0] rounded">
            <Settings className="h-3.5 w-3.5 text-[#4a6fa5]" />
            설정
          </button>
          <button className="flex items-center gap-1 px-2 py-1 text-xs hover:bg-[#d0d0d0] rounded text-red-600">
            <X className="h-3.5 w-3.5" />
            닫기
          </button>
        </div>
      </nav>

      <div className="flex-1 flex min-h-0">
        {/* 왼쪽 사이드바 - 하위 메뉴 */}
        <aside className="w-44 bg-[#f5f5f5] border-r border-[#ccc] flex flex-col">
          {/* 그룹 제목 */}
          <div className="h-8 bg-gradient-to-b from-[#5a7fb5] to-[#4a6fa5] flex items-center px-3 border-b border-[#3d5a80]">
            <span className="text-white text-xs font-medium">{activeGroup.label}</span>
          </div>

          {/* 하위 메뉴 목록 */}
          <nav className="flex-1 py-1">
            {activeGroup.items.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2 px-3 py-2 text-xs border-l-3',
                      'transition-colors',
                      isActive
                        ? 'bg-[#cde4ff] border-l-[#4a6fa5] text-[#1a3a5c] font-medium'
                        : 'border-l-transparent text-gray-700 hover:bg-[#e8e8e8] hover:text-gray-900'
                    )
                  }
                >
                  <Icon className="h-3.5 w-3.5" />
                  {item.label}
                </NavLink>
              )
            })}
          </nav>
        </aside>

        {/* 메인 영역 */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* 페이지 제목 바 */}
          <div className="h-7 bg-white border-b border-[#ccc] flex items-center px-3">
            <span className="text-xs font-semibold text-[#333]">▶ {pageTitle}</span>
          </div>

          {/* 메인 콘텐츠 */}
          <main className="flex-1 overflow-auto p-2 bg-[#f0f0f0]">
            <Outlet />
          </main>
        </div>
      </div>

      {/* 하단 상태 바 */}
      <footer className="h-5 bg-[#e0e0e0] border-t border-[#bbb] flex items-center justify-between px-3 text-[10px] text-gray-600">
        <span>[Auto-PO] v1.0.0</span>
        <span>{new Date().toLocaleDateString('ko-KR', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          weekday: 'short',
          hour: '2-digit',
          minute: '2-digit'
        })}</span>
      </footer>
    </div>
  )
}
