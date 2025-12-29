/**
 * FormWrapper - React Hook Form + Zod 통합 폼 래퍼 컴포넌트
 */
import * as React from 'react'
import { useForm, UseFormReturn, FieldValues, DefaultValues, SubmitHandler, Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { ZodSchema } from 'zod'
import { cn } from '../../lib/utils'
import { Label } from '../ui/label'

// FormWrapper Props
interface FormWrapperProps<TFormData extends FieldValues> {
  schema: ZodSchema<TFormData>
  onSubmit: SubmitHandler<TFormData>
  defaultValues?: DefaultValues<TFormData>
  children:
    | React.ReactNode
    | ((methods: UseFormReturn<TFormData>) => React.ReactNode)
  className?: string
  id?: string
}

export function FormWrapper<TFormData extends FieldValues>({
  schema,
  onSubmit,
  defaultValues,
  children,
  className,
  id,
}: FormWrapperProps<TFormData>) {
  const methods = useForm<TFormData>({
    // zodResolver의 타입 호환성 문제로 any 사용
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema as any) as Resolver<TFormData>,
    defaultValues,
    mode: 'onBlur',
  })

  return (
    <form
      id={id}
      role="form"
      onSubmit={methods.handleSubmit(onSubmit)}
      className={cn('space-y-4', className)}
    >
      {typeof children === 'function' ? children(methods) : children}
    </form>
  )
}

// FormField Props
interface FormFieldProps {
  name: string
  label: string
  children: React.ReactNode
  required?: boolean
  error?: string
  helpText?: string
  className?: string
}

export function FormField({
  name,
  label,
  children,
  required = false,
  error,
  helpText,
  className,
}: FormFieldProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={name} className="flex items-center gap-1">
        {label}
        {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
      {helpText && !error && (
        <p className="text-sm text-muted-foreground">{helpText}</p>
      )}
    </div>
  )
}

// FormActions Props
interface FormActionsProps {
  children: React.ReactNode
  className?: string
}

export function FormActions({ children, className }: FormActionsProps) {
  return (
    <div className={cn('flex items-center justify-end gap-2 pt-4', className)}>
      {children}
    </div>
  )
}

// FormSection Props
interface FormSectionProps {
  title?: string
  description?: string
  children: React.ReactNode
  className?: string
}

export function FormSection({
  title,
  description,
  children,
  className,
}: FormSectionProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {(title || description) && (
        <div className="space-y-1">
          {title && (
            <h3 className="text-lg font-medium leading-none tracking-tight">
              {title}
            </h3>
          )}
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      )}
      <div className="space-y-4">{children}</div>
    </div>
  )
}

// Export hook type for external use
export type { UseFormReturn }
