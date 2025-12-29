/**
 * ProductForm - 제품 등록/수정 폼 컴포넌트
 * React Hook Form + Zod 통합 (조건부 검증 포함)
 */

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { productSchemaWithValidation, type ProductFormData } from '@infrastructure/schemas'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Switch } from '../ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import { ERPButton } from '../ERPGroupBox'
import { cn } from '../../lib/utils'

interface SelectOption {
  value: string
  label: string
}

interface ProductFormProps {
  onSubmit: (data: ProductFormData) => void | Promise<void>
  onCancel: () => void
  defaultValues?: Partial<ProductFormData>
  vehicleModels?: SelectOption[]
  partners?: SelectOption[]
  isEdit?: boolean
  isLoading?: boolean
  className?: string
}

const PRODUCT_TYPE_OPTIONS = ['완제품', '반제품', '원자재', '부자재', '기타']
const UNIT_OPTIONS = ['EA', 'SET', 'M', 'KG', 'L', 'BOX']

export function ProductForm({
  onSubmit,
  onCancel,
  defaultValues,
  vehicleModels = [],
  partners = [],
  isEdit = false,
  isLoading = false,
  className,
}: ProductFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
  } = useForm<ProductFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(productSchemaWithValidation as any),
    defaultValues: {
      product_code: defaultValues?.product_code ?? '',
      product_name: defaultValues?.product_name ?? '',
      vehicle_model_id: defaultValues?.vehicle_model_id ?? null,
      primary_supplier: defaultValues?.primary_supplier ?? 'DOMESTIC',
      main_partner_id: defaultValues?.main_partner_id ?? null,
      sub_partner_id: defaultValues?.sub_partner_id ?? null,
      domestic_ratio: defaultValues?.domestic_ratio ?? 100,
      domestic_lead_time: defaultValues?.domestic_lead_time ?? 3,
      overseas_lead_time: defaultValues?.overseas_lead_time ?? 21,
      unit_price: defaultValues?.unit_price ?? null,
      currency: defaultValues?.currency ?? 'KRW',
      is_active: defaultValues?.is_active ?? true,
      project_code: defaultValues?.project_code ?? null,
      spec1: defaultValues?.spec1 ?? null,
      spec2: defaultValues?.spec2 ?? null,
      spec3: defaultValues?.spec3 ?? null,
      moq: defaultValues?.moq ?? null,
      product_type: defaultValues?.product_type ?? null,
      unit: defaultValues?.unit ?? null,
    },
  })

  const isActive = watch('is_active')
  const primarySupplier = watch('primary_supplier')
  const disabled = isLoading || isSubmitting
  const showBothFields = primarySupplier === 'BOTH'
  const showVietnamFields = primarySupplier === 'VIETNAM' || primarySupplier === 'BOTH'

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={cn('space-y-4', className)}
    >
      <div className="grid grid-cols-3 gap-4">
        {/* 기본 정보 */}
        <div className="space-y-2">
          <Label htmlFor="project_code">프로젝트코드</Label>
          <Input
            id="project_code"
            {...register('project_code')}
            disabled={disabled}
            placeholder="예: Y200"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="product_code" className="flex items-center gap-1">
            품번 <span className="text-destructive">*</span>
          </Label>
          <Input
            id="product_code"
            {...register('product_code')}
            disabled={isEdit || disabled}
            placeholder="품번"
            aria-invalid={!!errors.product_code}
          />
          {errors.product_code && (
            <p className="text-sm text-destructive">{errors.product_code.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="product_name" className="flex items-center gap-1">
            품명 <span className="text-destructive">*</span>
          </Label>
          <Input
            id="product_name"
            {...register('product_name')}
            disabled={disabled}
            placeholder="품명"
            aria-invalid={!!errors.product_name}
          />
          {errors.product_name && (
            <p className="text-sm text-destructive">{errors.product_name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="vehicle_model_id">차종</Label>
          <Select
            value={watch('vehicle_model_id') ?? ''}
            onValueChange={(v) => setValue('vehicle_model_id', v || null)}
            disabled={disabled}
          >
            <SelectTrigger id="vehicle_model_id">
              <SelectValue placeholder="선택..." />
            </SelectTrigger>
            <SelectContent>
              {vehicleModels.map((v) => (
                <SelectItem key={v.value} value={v.value}>{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 사양 정보 */}
        <div className="space-y-2">
          <Label htmlFor="spec1">사양1</Label>
          <Input
            id="spec1"
            {...register('spec1')}
            disabled={disabled}
            placeholder="사양1"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="spec2">사양2</Label>
          <Input
            id="spec2"
            {...register('spec2')}
            disabled={disabled}
            placeholder="사양2"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="spec3">사양3</Label>
          <Input
            id="spec3"
            {...register('spec3')}
            disabled={disabled}
            placeholder="사양3"
          />
        </div>

        {/* 수량/유형 */}
        <div className="space-y-2">
          <Label htmlFor="moq">MOQ</Label>
          <Input
            id="moq"
            type="number"
            {...register('moq', { valueAsNumber: true })}
            disabled={disabled}
            placeholder="최소주문수량"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="product_type">품목유형</Label>
          <Select
            value={watch('product_type') ?? ''}
            onValueChange={(v) => setValue('product_type', v || null)}
            disabled={disabled}
          >
            <SelectTrigger id="product_type">
              <SelectValue placeholder="선택..." />
            </SelectTrigger>
            <SelectContent>
              {PRODUCT_TYPE_OPTIONS.map((type) => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="unit">단위</Label>
          <Select
            value={watch('unit') ?? ''}
            onValueChange={(v) => setValue('unit', v || null)}
            disabled={disabled}
          >
            <SelectTrigger id="unit">
              <SelectValue placeholder="선택..." />
            </SelectTrigger>
            <SelectContent>
              {UNIT_OPTIONS.map((u) => (
                <SelectItem key={u} value={u}>{u}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 공급 정보 */}
        <div className="space-y-2">
          <Label htmlFor="primary_supplier" className="flex items-center gap-1">
            공급처 유형 <span className="text-destructive">*</span>
          </Label>
          <Select
            value={primarySupplier}
            onValueChange={(v) => setValue('primary_supplier', v as ProductFormData['primary_supplier'])}
            disabled={disabled}
          >
            <SelectTrigger id="primary_supplier" aria-invalid={!!errors.primary_supplier}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DOMESTIC">국내</SelectItem>
              <SelectItem value="VIETNAM">베트남</SelectItem>
              <SelectItem value="BOTH">이원화</SelectItem>
            </SelectContent>
          </Select>
          {errors.primary_supplier && (
            <p className="text-sm text-destructive">{errors.primary_supplier.message}</p>
          )}
        </div>

        {showBothFields && (
          <div className="space-y-2">
            <Label htmlFor="domestic_ratio" className="flex items-center gap-1">
              국내 비율 (%) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="domestic_ratio"
              type="number"
              min={1}
              max={99}
              {...register('domestic_ratio', { valueAsNumber: true })}
              disabled={disabled}
              aria-invalid={!!errors.domestic_ratio}
            />
            {errors.domestic_ratio && (
              <p className="text-sm text-destructive">{errors.domestic_ratio.message}</p>
            )}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="main_partner_id" className={cn(showBothFields && 'flex items-center gap-1')}>
            국내 거래처 {showBothFields && <span className="text-destructive">*</span>}
          </Label>
          <Select
            value={watch('main_partner_id') ?? ''}
            onValueChange={(v) => setValue('main_partner_id', v || null)}
            disabled={disabled}
          >
            <SelectTrigger id="main_partner_id" aria-invalid={!!errors.main_partner_id}>
              <SelectValue placeholder="선택..." />
            </SelectTrigger>
            <SelectContent>
              {partners.map((p) => (
                <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.main_partner_id && (
            <p className="text-sm text-destructive">{errors.main_partner_id.message}</p>
          )}
        </div>

        {showVietnamFields && (
          <div className="space-y-2">
            <Label htmlFor="sub_partner_id" className={cn(showBothFields && 'flex items-center gap-1')}>
              베트남 거래처 {showBothFields && <span className="text-destructive">*</span>}
            </Label>
            <Select
              value={watch('sub_partner_id') ?? ''}
              onValueChange={(v) => setValue('sub_partner_id', v || null)}
              disabled={disabled}
            >
              <SelectTrigger id="sub_partner_id" aria-invalid={!!errors.sub_partner_id}>
                <SelectValue placeholder="선택..." />
              </SelectTrigger>
              <SelectContent>
                {partners.map((p) => (
                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.sub_partner_id && (
              <p className="text-sm text-destructive">{errors.sub_partner_id.message}</p>
            )}
          </div>
        )}

        {/* 리드타임 */}
        <div className="space-y-2">
          <Label htmlFor="domestic_lead_time">국내 리드타임 (일)</Label>
          <Input
            id="domestic_lead_time"
            type="number"
            min={1}
            {...register('domestic_lead_time', { valueAsNumber: true })}
            disabled={disabled}
          />
          {errors.domestic_lead_time && (
            <p className="text-sm text-destructive">{errors.domestic_lead_time.message}</p>
          )}
        </div>

        {showVietnamFields && (
          <div className="space-y-2">
            <Label htmlFor="overseas_lead_time" className="flex items-center gap-1">
              해외 리드타임 (일) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="overseas_lead_time"
              type="number"
              min={1}
              {...register('overseas_lead_time', { valueAsNumber: true })}
              disabled={disabled}
              aria-invalid={!!errors.overseas_lead_time}
            />
            {errors.overseas_lead_time && (
              <p className="text-sm text-destructive">{errors.overseas_lead_time.message}</p>
            )}
          </div>
        )}

        {/* 단가 */}
        <div className="space-y-2">
          <Label htmlFor="unit_price">단가</Label>
          <Input
            id="unit_price"
            type="number"
            min={0}
            {...register('unit_price', { valueAsNumber: true })}
            disabled={disabled}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="currency">통화</Label>
          <Select
            value={watch('currency')}
            onValueChange={(v) => setValue('currency', v as ProductFormData['currency'])}
            disabled={disabled}
          >
            <SelectTrigger id="currency">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="KRW">KRW</SelectItem>
              <SelectItem value="USD">USD</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 pt-6">
          <Switch
            id="is_active"
            checked={isActive}
            onCheckedChange={(checked) => setValue('is_active', checked)}
            disabled={disabled}
          />
          <Label htmlFor="is_active">활성화</Label>
        </div>
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
