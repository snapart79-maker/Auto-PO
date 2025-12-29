/**
 * VehicleModelForm - 차종 등록/수정 폼 컴포넌트
 * React Hook Form + Zod 통합
 */

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { vehicleModelSchema, type VehicleModelFormData } from '@infrastructure/schemas'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Switch } from '../ui/switch'
import { ERPButton } from '../ERPGroupBox'
import { cn } from '../../lib/utils'

interface VehicleModelFormProps {
  onSubmit: (data: VehicleModelFormData) => void | Promise<void>
  onCancel: () => void
  defaultValues?: Partial<VehicleModelFormData>
  isEdit?: boolean
  isLoading?: boolean
  className?: string
}

export function VehicleModelForm({
  onSubmit,
  onCancel,
  defaultValues,
  isEdit = false,
  isLoading = false,
  className,
}: VehicleModelFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
  } = useForm<VehicleModelFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(vehicleModelSchema as any),
    defaultValues: {
      vehicle_code: defaultValues?.vehicle_code ?? '',
      vehicle_name: defaultValues?.vehicle_name ?? '',
      description: defaultValues?.description ?? '',
      is_active: defaultValues?.is_active ?? true,
    },
  })

  const isActive = watch('is_active')
  const disabled = isLoading || isSubmitting

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={cn('space-y-4', className)}
    >
      {/* 차종 코드 */}
      <div className="space-y-2">
        <Label htmlFor="vehicle_code" className="flex items-center gap-1">
          차종 코드 <span className="text-destructive">*</span>
        </Label>
        <Input
          id="vehicle_code"
          {...register('vehicle_code')}
          disabled={isEdit || disabled}
          placeholder="예: V001"
          aria-invalid={!!errors.vehicle_code}
        />
        {errors.vehicle_code && (
          <p className="text-sm text-destructive">{errors.vehicle_code.message}</p>
        )}
      </div>

      {/* 차종명 */}
      <div className="space-y-2">
        <Label htmlFor="vehicle_name" className="flex items-center gap-1">
          차종명 <span className="text-destructive">*</span>
        </Label>
        <Input
          id="vehicle_name"
          {...register('vehicle_name')}
          disabled={disabled}
          placeholder="예: 아반떼"
          aria-invalid={!!errors.vehicle_name}
        />
        {errors.vehicle_name && (
          <p className="text-sm text-destructive">{errors.vehicle_name.message}</p>
        )}
      </div>

      {/* 설명 */}
      <div className="space-y-2">
        <Label htmlFor="description">설명</Label>
        <Input
          id="description"
          {...register('description')}
          disabled={disabled}
          placeholder="설명 (선택사항)"
        />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description.message}</p>
        )}
      </div>

      {/* 활성화 */}
      <div className="flex items-center gap-2">
        <Switch
          id="is_active"
          checked={isActive}
          onCheckedChange={(checked) => setValue('is_active', checked)}
          disabled={disabled}
        />
        <Label htmlFor="is_active">활성화</Label>
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
