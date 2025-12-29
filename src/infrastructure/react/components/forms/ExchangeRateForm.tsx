/**
 * ExchangeRateForm - 환율 등록 폼 컴포넌트
 * React Hook Form + Zod 통합
 */

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { Loader2 } from 'lucide-react'
import { exchangeRateSchema, type ExchangeRateFormData } from '@infrastructure/schemas'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import { ERPButton } from '../ERPGroupBox'
import { cn } from '../../lib/utils'

interface ExchangeRateFormProps {
  onSubmit: (data: ExchangeRateFormData) => void | Promise<void>
  onCancel: () => void
  defaultValues?: Partial<ExchangeRateFormData>
  isLoading?: boolean
  className?: string
}

export function ExchangeRateForm({
  onSubmit,
  onCancel,
  defaultValues,
  isLoading = false,
  className,
}: ExchangeRateFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
  } = useForm<ExchangeRateFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(exchangeRateSchema as any),
    defaultValues: {
      currency_code: defaultValues?.currency_code ?? 'USD',
      rate: defaultValues?.rate ?? 1300,
      effective_date: defaultValues?.effective_date ?? new Date(),
    },
  })

  const currencyCode = watch('currency_code')
  const disabled = isLoading || isSubmitting

  // 날짜 입력을 위한 포맷팅
  const effectiveDate = watch('effective_date')
  const formattedDate = effectiveDate instanceof Date
    ? format(effectiveDate, 'yyyy-MM-dd')
    : typeof effectiveDate === 'string'
      ? (effectiveDate as string).slice(0, 10)
      : format(new Date(), 'yyyy-MM-dd')

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={cn('space-y-4', className)}
    >
      {/* 통화 */}
      <div className="space-y-2">
        <Label htmlFor="currency_code" className="flex items-center gap-1">
          통화 <span className="text-destructive">*</span>
        </Label>
        <Select
          value={currencyCode}
          onValueChange={(v) => setValue('currency_code', v as ExchangeRateFormData['currency_code'])}
          disabled={disabled}
        >
          <SelectTrigger id="currency_code" aria-invalid={!!errors.currency_code}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="USD">USD (미국 달러)</SelectItem>
            <SelectItem value="EUR">EUR (유로)</SelectItem>
            <SelectItem value="JPY">JPY (일본 엔)</SelectItem>
            <SelectItem value="CNY">CNY (중국 위안)</SelectItem>
            <SelectItem value="VND">VND (베트남 동)</SelectItem>
          </SelectContent>
        </Select>
        {errors.currency_code && (
          <p className="text-sm text-destructive">{errors.currency_code.message}</p>
        )}
      </div>

      {/* 환율 */}
      <div className="space-y-2">
        <Label htmlFor="rate" className="flex items-center gap-1">
          환율 (1단위당 KRW) <span className="text-destructive">*</span>
        </Label>
        <Input
          id="rate"
          type="number"
          step="0.01"
          min={0}
          {...register('rate', { valueAsNumber: true })}
          disabled={disabled}
          aria-invalid={!!errors.rate}
        />
        {errors.rate && (
          <p className="text-sm text-destructive">{errors.rate.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          {currencyCode === 'VND' && 'VND는 보통 0.05~0.1 정도입니다.'}
          {currencyCode === 'JPY' && 'JPY는 보통 8~15 정도입니다.'}
          {currencyCode === 'USD' && 'USD는 보통 1300~1400 정도입니다.'}
        </p>
      </div>

      {/* 적용일 */}
      <div className="space-y-2">
        <Label htmlFor="effective_date" className="flex items-center gap-1">
          적용일 <span className="text-destructive">*</span>
        </Label>
        <Input
          id="effective_date"
          type="date"
          value={formattedDate}
          onChange={(e) => {
            const dateValue = e.target.value
            if (dateValue) {
              setValue('effective_date', new Date(dateValue))
            }
          }}
          disabled={disabled}
          aria-invalid={!!errors.effective_date}
        />
        {errors.effective_date && (
          <p className="text-sm text-destructive">{errors.effective_date.message}</p>
        )}
      </div>

      {/* 버튼 */}
      <div className="flex items-center justify-end gap-2 pt-4">
        <ERPButton type="button" onClick={onCancel} disabled={disabled}>
          취소
        </ERPButton>
        <ERPButton type="submit" variant="primary" disabled={disabled}>
          {disabled && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          저장
        </ERPButton>
      </div>
    </form>
  )
}
