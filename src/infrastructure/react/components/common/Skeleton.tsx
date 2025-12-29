/**
 * Skeleton - 로딩 플레이스홀더 컴포넌트
 */
import * as React from 'react'
import { cn } from '../../lib/utils'

// Base Skeleton Props
interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'rectangular' | 'circular' | 'text'
  width?: number | string
  height?: number | string
}

export function Skeleton({
  className,
  variant = 'rectangular',
  width,
  height,
  ...props
}: SkeletonProps) {
  const variantClasses = {
    rectangular: 'rounded-md',
    circular: 'rounded-full',
    text: 'rounded',
  }

  const style: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  }

  return (
    <div
      className={cn(
        'animate-pulse bg-muted',
        variantClasses[variant],
        className
      )}
      style={style}
      {...props}
    />
  )
}

// SkeletonText Props
interface SkeletonTextProps extends React.HTMLAttributes<HTMLDivElement> {
  lines?: number
}

export function SkeletonText({
  lines = 3,
  className,
  ...props
}: SkeletonTextProps) {
  return (
    <div className={cn('space-y-2', className)} {...props}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          variant="text"
          className={cn(
            'h-4',
            index === lines - 1 ? 'w-3/4' : 'w-full'
          )}
        />
      ))}
    </div>
  )
}

// SkeletonCard Props
interface SkeletonCardProps extends React.HTMLAttributes<HTMLDivElement> {
  showImage?: boolean
}

export function SkeletonCard({
  showImage = true,
  className,
  ...props
}: SkeletonCardProps) {
  return (
    <div
      className={cn('rounded-lg border bg-card p-4 space-y-4', className)}
      {...props}
    >
      {showImage && (
        <Skeleton className="h-48 w-full" />
      )}
      <div className="space-y-2">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    </div>
  )
}

// SkeletonTable Props
interface SkeletonTableProps extends React.HTMLAttributes<HTMLDivElement> {
  rows?: number
  columns?: number
  showHeader?: boolean
}

export function SkeletonTable({
  rows = 5,
  columns = 4,
  showHeader = true,
  className,
  ...props
}: SkeletonTableProps) {
  return (
    <div className={cn('space-y-2', className)} {...props}>
      {showHeader && (
        <div
          className="flex gap-4 p-3 border-b bg-muted/50"
          data-testid="skeleton-header"
        >
          {Array.from({ length: columns }).map((_, index) => (
            <Skeleton
              key={`header-${index}`}
              className="h-5 flex-1"
            />
          ))}
        </div>
      )}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={`row-${rowIndex}`}
          className="flex gap-4 p-3 border-b"
          data-testid="skeleton-row"
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton
              key={`cell-${rowIndex}-${colIndex}`}
              className="h-4 flex-1"
            />
          ))}
        </div>
      ))}
    </div>
  )
}

// SkeletonForm Props
interface SkeletonFormProps extends React.HTMLAttributes<HTMLDivElement> {
  fields?: number
  showActions?: boolean
}

export function SkeletonForm({
  fields = 4,
  showActions = true,
  className,
  ...props
}: SkeletonFormProps) {
  return (
    <div className={cn('space-y-6', className)} {...props}>
      {Array.from({ length: fields }).map((_, index) => (
        <div
          key={`field-${index}`}
          className="space-y-2"
          data-testid="skeleton-field"
        >
          <Skeleton className="h-4 w-24" /> {/* Label */}
          <Skeleton className="h-10 w-full" /> {/* Input */}
        </div>
      ))}
      {showActions && (
        <div
          className="flex justify-end gap-2 pt-4"
          data-testid="skeleton-actions"
        >
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-20" />
        </div>
      )}
    </div>
  )
}

// SkeletonList Props
interface SkeletonListProps extends React.HTMLAttributes<HTMLDivElement> {
  items?: number
  showAvatar?: boolean
}

export function SkeletonList({
  items = 5,
  showAvatar = false,
  className,
  ...props
}: SkeletonListProps) {
  return (
    <div className={cn('space-y-4', className)} {...props}>
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="flex items-center gap-4">
          {showAvatar && (
            <Skeleton variant="circular" className="h-10 w-10" />
          )}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  )
}
