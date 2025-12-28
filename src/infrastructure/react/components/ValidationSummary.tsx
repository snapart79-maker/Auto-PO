/**
 * ValidationSummary Component
 * 검증 결과 요약 표시
 */

import { cn } from '../lib/utils'

export interface ValidationSummaryProps {
  totalRows: number
  validRows: number
  errorCount: number
  className?: string
}

export function ValidationSummary({
  totalRows,
  validRows,
  errorCount,
  className,
}: ValidationSummaryProps) {
  const hasErrors = errorCount > 0

  return (
    <div
      className={cn(
        'flex items-center gap-4 rounded-lg border p-4',
        hasErrors ? 'border-destructive/50 bg-destructive/5' : 'border-green-500/50 bg-green-500/5',
        className
      )}
    >
      {/* 상태 아이콘 */}
      <div
        className={cn(
          'flex h-10 w-10 items-center justify-center rounded-full',
          hasErrors ? 'bg-destructive/10' : 'bg-green-500/10'
        )}
      >
        {hasErrors ? (
          <AlertCircleIcon className="h-5 w-5 text-destructive" />
        ) : (
          <CheckCircleIcon className="h-5 w-5 text-green-500" />
        )}
      </div>

      {/* 통계 */}
      <div className="flex flex-1 items-center gap-6">
        <StatItem label="총 행" value={totalRows} />
        <StatItem label="유효" value={validRows} className="text-green-600" />
        <StatItem
          label="오류"
          value={errorCount}
          className={hasErrors ? 'text-destructive' : undefined}
        />
      </div>

      {/* 상태 텍스트 */}
      <div className={cn('text-sm font-medium', hasErrors ? 'text-destructive' : 'text-green-600')}>
        {hasErrors
          ? `${errorCount}건의 오류가 있습니다. 수정 후 다시 시도하세요.`
          : '모든 데이터가 유효합니다.'}
      </div>
    </div>
  )
}

/**
 * 통계 아이템
 */
function StatItem({
  label,
  value,
  className,
}: {
  label: string
  value: number
  className?: string
}) {
  return (
    <div className="text-center">
      <div className={cn('text-2xl font-bold', className)}>{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  )
}

/**
 * 경고 아이콘
 */
function AlertCircleIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  )
}

/**
 * 체크 아이콘
 */
function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  )
}
