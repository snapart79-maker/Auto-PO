/**
 * StockStatusBadge - 재고 상태 뱃지 컴포넌트
 * PRD 5.2.3 재고 상태 기준 적용
 *
 * 상태별 색상 (PRD 3.3):
 * - 정상 (NORMAL): 초록 (#22C55E)
 * - 주의 (CAUTION): 노랑 (#F59E0B)
 * - 경고 (WARNING): 주황 (#F97316)
 * - 위험 (CRITICAL): 빨강 (#EF4444)
 */

import { Badge } from './ui/badge'
import { StockStatus } from '@domain/entities/CurrentInventory'
import { cn } from '../lib/utils'

interface StockStatusBadgeProps {
  status: StockStatus
  className?: string
  showLabel?: boolean
}

const STATUS_CONFIG: Record<
  StockStatus,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className: string }
> = {
  [StockStatus.NORMAL]: {
    label: '정상',
    variant: 'default',
    className: 'bg-green-500 hover:bg-green-500/90 text-white',
  },
  [StockStatus.CAUTION]: {
    label: '주의',
    variant: 'default',
    className: 'bg-yellow-500 hover:bg-yellow-500/90 text-white',
  },
  [StockStatus.WARNING]: {
    label: '경고',
    variant: 'default',
    className: 'bg-orange-500 hover:bg-orange-500/90 text-white',
  },
  [StockStatus.CRITICAL]: {
    label: '위험',
    variant: 'destructive',
    className: 'bg-red-500 hover:bg-red-500/90 text-white',
  },
}

export function StockStatusBadge({
  status,
  className,
  showLabel = true,
}: StockStatusBadgeProps) {
  const config = STATUS_CONFIG[status]

  return (
    <Badge
      variant={config.variant}
      className={cn(config.className, className)}
    >
      {showLabel ? config.label : status}
    </Badge>
  )
}

/**
 * 재고 상태에 따른 아이콘 색상 클래스 반환
 */
export function getStockStatusColorClass(status: StockStatus): string {
  switch (status) {
    case StockStatus.NORMAL:
      return 'text-green-500'
    case StockStatus.CAUTION:
      return 'text-yellow-500'
    case StockStatus.WARNING:
      return 'text-orange-500'
    case StockStatus.CRITICAL:
      return 'text-red-500'
    default:
      return 'text-gray-500'
  }
}

/**
 * 재고 비율을 퍼센트 문자열로 변환
 */
export function formatStockRatio(ratio: number): string {
  if (ratio === Infinity) return '-'
  if (ratio < 0) return '0%'
  return `${Math.round(ratio * 100)}%`
}

export default StockStatusBadge
