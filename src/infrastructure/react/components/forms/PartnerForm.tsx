/**
 * PartnerForm - 거래처 등록/수정 폼 컴포넌트
 * React Hook Form + Zod 통합
 */

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { partnerSchema, type PartnerFormData } from '@infrastructure/schemas'
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

interface PartnerFormProps {
  onSubmit: (data: PartnerFormData) => void | Promise<void>
  onCancel: () => void
  defaultValues?: Partial<PartnerFormData>
  isEdit?: boolean
  isLoading?: boolean
  className?: string
}

export function PartnerForm({
  onSubmit,
  onCancel,
  defaultValues,
  isEdit = false,
  isLoading = false,
  className,
}: PartnerFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
  } = useForm<PartnerFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(partnerSchema as any),
    defaultValues: {
      partner_code: defaultValues?.partner_code ?? '',
      partner_name: defaultValues?.partner_name ?? '',
      partner_type: defaultValues?.partner_type ?? 'SUPPLIER',
      business_number: defaultValues?.business_number ?? '',
      address: defaultValues?.address ?? '',
      contact_person: defaultValues?.contact_person ?? '',
      contact_phone: defaultValues?.contact_phone ?? '',
      contact_email: defaultValues?.contact_email ?? '',
      currency: defaultValues?.currency ?? 'KRW',
      is_active: defaultValues?.is_active ?? true,
      note: defaultValues?.note ?? '',
      partner_group: defaultValues?.partner_group ?? '',
      ceo_name: defaultValues?.ceo_name ?? '',
      postal_code: defaultValues?.postal_code ?? '',
      business_type: defaultValues?.business_type ?? '',
      industry_type: defaultValues?.industry_type ?? '',
      country_code: defaultValues?.country_code ?? '대한민국',
      incoterms: defaultValues?.incoterms ?? '도착도',
    },
  })

  const isActive = watch('is_active')
  const partnerType = watch('partner_type')
  const disabled = isLoading || isSubmitting

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={cn('space-y-4', className)}
    >
      <div className="grid grid-cols-4 gap-4">
        {/* 기본 정보 */}
        <div className="space-y-2">
          <Label htmlFor="partner_code" className="flex items-center gap-1">
            거래처코드 <span className="text-destructive">*</span>
          </Label>
          <Input
            id="partner_code"
            {...register('partner_code')}
            disabled={isEdit || disabled}
            placeholder="예: P001"
            aria-invalid={!!errors.partner_code}
          />
          {errors.partner_code && (
            <p className="text-sm text-destructive">{errors.partner_code.message}</p>
          )}
        </div>

        <div className="space-y-2 col-span-2">
          <Label htmlFor="partner_name" className="flex items-center gap-1">
            거래처명 <span className="text-destructive">*</span>
          </Label>
          <Input
            id="partner_name"
            {...register('partner_name')}
            disabled={disabled}
            placeholder="거래처명"
            aria-invalid={!!errors.partner_name}
          />
          {errors.partner_name && (
            <p className="text-sm text-destructive">{errors.partner_name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="partner_type" className="flex items-center gap-1">
            거래처 유형 <span className="text-destructive">*</span>
          </Label>
          <Select
            value={partnerType}
            onValueChange={(v) => setValue('partner_type', v as PartnerFormData['partner_type'])}
            disabled={disabled}
          >
            <SelectTrigger id="partner_type" aria-invalid={!!errors.partner_type}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SUPPLIER">협력사</SelectItem>
              <SelectItem value="CUSTOMER">고객사</SelectItem>
              <SelectItem value="VIETNAM">베트남</SelectItem>
            </SelectContent>
          </Select>
          {errors.partner_type && (
            <p className="text-sm text-destructive">{errors.partner_type.message}</p>
          )}
        </div>

        {/* 사업자 정보 */}
        <div className="space-y-2">
          <Label htmlFor="business_number">사업자등록번호</Label>
          <Input
            id="business_number"
            {...register('business_number')}
            disabled={disabled}
            placeholder="123-45-67890"
          />
          {errors.business_number && (
            <p className="text-sm text-destructive">{errors.business_number.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="ceo_name">대표자명</Label>
          <Input
            id="ceo_name"
            {...register('ceo_name')}
            disabled={disabled}
            placeholder="대표자명"
          />
        </div>

        <div className="space-y-2 col-span-2">
          <Label htmlFor="address">주소</Label>
          <Input
            id="address"
            {...register('address')}
            disabled={disabled}
            placeholder="주소"
          />
          {errors.address && (
            <p className="text-sm text-destructive">{errors.address.message}</p>
          )}
        </div>

        {/* 연락처 정보 */}
        <div className="space-y-2">
          <Label htmlFor="contact_person">담당자명</Label>
          <Input
            id="contact_person"
            {...register('contact_person')}
            disabled={disabled}
            placeholder="담당자명"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="contact_phone">전화번호</Label>
          <Input
            id="contact_phone"
            {...register('contact_phone')}
            disabled={disabled}
            placeholder="02-1234-5678"
          />
          {errors.contact_phone && (
            <p className="text-sm text-destructive">{errors.contact_phone.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="contact_email">이메일</Label>
          <Input
            id="contact_email"
            type="email"
            {...register('contact_email')}
            disabled={disabled}
            placeholder="email@company.com"
          />
          {errors.contact_email && (
            <p className="text-sm text-destructive">{errors.contact_email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="currency">화폐단위</Label>
          <Select
            value={watch('currency')}
            onValueChange={(v) => setValue('currency', v as PartnerFormData['currency'])}
            disabled={disabled}
          >
            <SelectTrigger id="currency">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="KRW">KRW</SelectItem>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="VND">VND</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 기타 정보 */}
        <div className="space-y-2 col-span-3">
          <Label htmlFor="note">비고</Label>
          <Input
            id="note"
            {...register('note')}
            disabled={disabled}
            placeholder="비고"
          />
        </div>

        <div className="flex items-center gap-2 pt-6">
          <Switch
            id="is_active"
            checked={isActive}
            onCheckedChange={(checked) => setValue('is_active', checked)}
            disabled={disabled}
          />
          <Label htmlFor="is_active">사용여부</Label>
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
