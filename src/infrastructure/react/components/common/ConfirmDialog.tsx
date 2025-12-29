/**
 * ConfirmDialog - 확인/취소 다이얼로그 컴포넌트
 * confirm() 대신 사용하는 커스텀 확인 다이얼로그
 */
import * as React from 'react'
import { Loader2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog'
import { buttonVariants } from '../ui/button'
import { cn } from '../../lib/utils'

export interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  onConfirm: () => void | Promise<void>
  onCancel?: () => void
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'destructive'
  loading?: boolean
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  onCancel,
  confirmText = '확인',
  cancelText = '취소',
  variant = 'default',
  loading = false,
}: ConfirmDialogProps) {
  const handleConfirm = async () => {
    await onConfirm()
    onOpenChange(false)
  }

  const handleCancel = () => {
    onCancel?.()
    onOpenChange(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>{cancelText}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={loading}
            className={cn(
              buttonVariants({
                variant: variant === 'destructive' ? 'destructive' : 'default',
              })
            )}
          >
            {loading && (
              <Loader2
                className="mr-2 h-4 w-4 animate-spin"
                data-testid="loading-spinner"
              />
            )}
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// useConfirmDialog Hook
interface ConfirmOptions {
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'destructive'
}

interface UseConfirmDialogReturn {
  isOpen: boolean
  confirm: (options: ConfirmOptions) => Promise<boolean>
  ConfirmDialogComponent: React.FC
}

export function useConfirmDialog(): UseConfirmDialogReturn {
  const [isOpen, setIsOpen] = React.useState(false)
  const [options, setOptions] = React.useState<ConfirmOptions | null>(null)
  const resolveRef = React.useRef<((value: boolean) => void) | null>(null)

  const confirm = React.useCallback((opts: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setOptions(opts)
      setIsOpen(true)
      resolveRef.current = resolve
    })
  }, [])

  const handleConfirm = React.useCallback(() => {
    resolveRef.current?.(true)
    setIsOpen(false)
    setOptions(null)
  }, [])

  const handleCancel = React.useCallback(() => {
    resolveRef.current?.(false)
    setIsOpen(false)
    setOptions(null)
  }, [])

  const ConfirmDialogComponent: React.FC = React.useCallback(() => {
    if (!options) return null

    return (
      <ConfirmDialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) handleCancel()
        }}
        title={options.title}
        description={options.description}
        confirmText={options.confirmText}
        cancelText={options.cancelText}
        variant={options.variant}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    )
  }, [isOpen, options, handleConfirm, handleCancel])

  return {
    isOpen,
    confirm,
    ConfirmDialogComponent,
  }
}
