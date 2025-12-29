/**
 * NavGroup - 접이식 네비게이션 그룹 컴포넌트
 * PRD 2.2 메뉴 구조에 따른 그룹핑
 */

import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { ChevronDown, type LucideIcon } from 'lucide-react'
import { cn } from '../lib/utils'
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from './ui/collapsible'

/**
 * NavItem - 네비게이션 아이템 타입
 */
export interface NavItem {
  /** 라우트 경로 */
  to: string
  /** 아이콘 컴포넌트 */
  icon: LucideIcon
  /** 메뉴 라벨 */
  label: string
}

/**
 * NavGroupProps - NavGroup 컴포넌트 Props
 */
export interface NavGroupProps {
  /** 그룹 제목 */
  title: string
  /** 그룹 아이콘 */
  icon: LucideIcon
  /** 하위 메뉴 아이템들 */
  items: NavItem[]
  /** 기본 열림 상태 */
  defaultOpen?: boolean
  /** 테스트용 ID */
  testId?: string
}

/**
 * NavGroup 컴포넌트
 * 접이식 그룹 메뉴를 렌더링합니다.
 */
export function NavGroup({
  title,
  icon: Icon,
  items,
  defaultOpen = false,
  testId,
}: NavGroupProps) {
  const location = useLocation()
  const [isOpen, setIsOpen] = useState(defaultOpen)

  // 하위 메뉴 중 하나라도 활성 상태면 그룹 열기
  const hasActiveChild = items.some((item) => location.pathname === item.to)

  // 활성 자식이 있으면 자동으로 열기
  const effectiveOpen = isOpen || hasActiveChild

  return (
    <Collapsible
      open={effectiveOpen}
      onOpenChange={setIsOpen}
      className="group/nav-group"
      data-testid={testId}
    >
      <CollapsibleTrigger
        className={cn(
          'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
          'text-muted-foreground hover:bg-muted hover:text-foreground',
          hasActiveChild && 'text-foreground font-medium'
        )}
        aria-expanded={effectiveOpen}
        aria-controls={`${testId}-content`}
      >
        <Icon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
        <span className="flex-1 text-left">{title}</span>
        <ChevronDown
          className={cn(
            'h-4 w-4 transition-transform duration-200',
            effectiveOpen && 'rotate-180'
          )}
          aria-hidden="true"
        />
      </CollapsibleTrigger>

      <CollapsibleContent
        id={`${testId}-content`}
        className="overflow-hidden transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
      >
        <div className="ml-2 mt-1 space-y-1 border-l border-border pl-3">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )
              }
            >
              <item.icon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

export default NavGroup
