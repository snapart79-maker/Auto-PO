/**
 * StatCard 컴포넌트
 * 대시보드용 통계 카드
 */

import type { LucideIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { cn } from '../lib/utils'

export type StatCardVariant = 'default' | 'warning' | 'success' | 'info' | 'danger'

export interface StatCardProps {
  title: string
  value: string | number
  description?: string
  icon?: LucideIcon
  variant?: StatCardVariant
  loading?: boolean
}

interface StatCardClasses {
  container: string
  icon: string
  value: string
}

/**
 * variant별 스타일 클래스 반환
 */
export function getStatCardClasses(variant: StatCardVariant): StatCardClasses {
  switch (variant) {
    case 'warning':
      return {
        container: 'border-orange-200 bg-orange-50',
        icon: 'text-orange-500',
        value: 'text-orange-600',
      }
    case 'success':
      return {
        container: 'border-green-200 bg-green-50',
        icon: 'text-green-500',
        value: 'text-green-600',
      }
    case 'info':
      return {
        container: 'border-blue-200 bg-blue-50',
        icon: 'text-blue-500',
        value: 'text-blue-600',
      }
    case 'danger':
      return {
        container: 'border-red-200 bg-red-50',
        icon: 'text-red-500',
        value: 'text-red-600',
      }
    default:
      return {
        container: 'bg-card',
        icon: 'text-muted-foreground',
        value: 'text-foreground',
      }
  }
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  variant = 'default',
  loading = false,
}: StatCardProps) {
  const classes = getStatCardClasses(variant)

  return (
    <Card className={cn('transition-all', classes.container)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {Icon && <Icon className={cn('h-4 w-4', classes.icon)} />}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-8 w-16 animate-pulse bg-gray-200 rounded" />
        ) : (
          <div className={cn('text-2xl font-bold', classes.value)}>
            {typeof value === 'number' ? value.toLocaleString('ko-KR') : value}
          </div>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  )
}
