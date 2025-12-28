/**
 * OrderFormDialog - 발주 생성/수정 다이얼로그
 */

import { useState, useEffect, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
// Badge - not currently used but kept for potential future use
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table'
import type { Partner } from '@domain/entities/Partner'
import type { Product } from '@domain/entities/Product'
import type { PurchaseOrder, OrderType } from '@domain/entities/PurchaseOrder'
import { Money, type Currency } from '@domain/valueObjects/Money'
import { Plus, Trash2, ShoppingCart, AlertCircle } from 'lucide-react'

// 발주 유형 레이블
export const ORDER_TYPE_OPTIONS = [
  { value: 'DOMESTIC', label: '국내' },
  { value: 'VIETNAM', label: '베트남' },
] as const

// 품목 데이터 타입
export interface OrderItemData {
  productId: string
  productCode: string
  productName: string
  quantity: number
  unitPrice: number
  currency: Currency
}

// 폼 데이터 타입
export interface OrderFormData {
  partnerId: string
  orderType: OrderType
  dueDate: string
  shipmentDate?: string
  notes?: string
  items: OrderItemData[]
}

// 초기 폼 데이터
const initialFormData: OrderFormData = {
  partnerId: '',
  orderType: 'DOMESTIC',
  dueDate: getDefaultDueDate(),
  shipmentDate: undefined,
  notes: '',
  items: [],
}

// 기본 납기일 (오늘 + 7일)
function getDefaultDueDate(): string {
  const date = new Date()
  date.setDate(date.getDate() + 7)
  const isoString = date.toISOString().split('T')[0]
  return isoString ?? ''
}

/**
 * 폼 유효성 검증
 */
export function validateOrderForm(data: OrderFormData): string[] {
  const errors: string[] = []

  if (!data.partnerId) {
    errors.push('거래처를 선택해주세요')
  }

  if (!data.orderType) {
    errors.push('발주 유형을 선택해주세요')
  }

  if (!data.dueDate) {
    errors.push('납기일을 입력해주세요')
  }

  if (data.orderType === 'VIETNAM' && !data.shipmentDate) {
    errors.push('베트남 발주는 선적일이 필수입니다')
  }

  if (!data.items || data.items.length === 0) {
    errors.push('최소 1개 이상의 품목을 추가해주세요')
  }

  // 품목별 검증
  data.items?.forEach((item, index) => {
    if (!item.productId) {
      errors.push(`품목 ${index + 1}: 제품을 선택해주세요`)
    }
    if (item.quantity <= 0) {
      errors.push(`품목 ${index + 1}: 수량은 0보다 커야 합니다`)
    }
    if (item.unitPrice < 0) {
      errors.push(`품목 ${index + 1}: 단가는 0 이상이어야 합니다`)
    }
  })

  return errors
}

/**
 * 총 금액 계산
 */
export function calculateTotalAmount(items: OrderItemData[]): Money {
  if (!items || items.length === 0) {
    return Money.create(0, 'KRW')
  }

  const firstItem = items[0]
  if (!firstItem) {
    return Money.create(0, 'KRW')
  }

  const currency = firstItem.currency
  let total = 0

  for (const item of items) {
    total += item.quantity * item.unitPrice
  }

  return Money.create(total, currency)
}

/**
 * 총 수량 계산
 */
export function calculateTotalQuantity(items: OrderItemData[]): number {
  if (!items || items.length === 0) {
    return 0
  }

  return items.reduce((sum, item) => sum + item.quantity, 0)
}

interface OrderFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  partners: Partner[]
  products: Product[]
  editingOrder?: PurchaseOrder | null
  onSubmit: (data: OrderFormData) => Promise<void>
  onCancel: () => void
}

export function OrderFormDialog({
  open,
  onOpenChange,
  partners,
  products,
  editingOrder,
  onSubmit,
  onCancel,
}: OrderFormDialogProps) {
  const [formData, setFormData] = useState<OrderFormData>(initialFormData)
  const [errors, setErrors] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 수정 모드일 때 폼 데이터 초기화
  useEffect(() => {
    if (editingOrder) {
      const dueDateString = editingOrder.dueDate.toISOString().split('T')[0] ?? ''
      const shipmentDateString = editingOrder.shipmentDate?.toISOString().split('T')[0]
      setFormData({
        partnerId: editingOrder.partnerId,
        orderType: editingOrder.orderType,
        dueDate: dueDateString,
        shipmentDate: shipmentDateString,
        notes: editingOrder.notes ?? '',
        items: [], // 품목은 별도 로드 필요
      })
    } else {
      setFormData(initialFormData)
    }
    setErrors([])
  }, [editingOrder, open])

  // 거래처 필터링 (발주 유형에 따라)
  const filteredPartners = useMemo(() => {
    return partners.filter((p) => {
      if (formData.orderType === 'DOMESTIC') {
        return p.partnerType.value === 'SUPPLIER'
      } else if (formData.orderType === 'VIETNAM') {
        return p.partnerType.value === 'VIETNAM'
      }
      return true
    })
  }, [partners, formData.orderType])

  // 총 금액 및 수량 계산
  const totalAmount = useMemo(() => calculateTotalAmount(formData.items), [formData.items])
  const totalQuantity = useMemo(() => calculateTotalQuantity(formData.items), [formData.items])

  // 통화 (발주 유형에 따라)
  const currency: Currency = formData.orderType === 'VIETNAM' ? 'USD' : 'KRW'

  // 폼 필드 변경 핸들러
  const handleFieldChange = (field: keyof OrderFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))

    // 발주 유형 변경 시 거래처 초기화 및 통화 업데이트
    if (field === 'orderType') {
      const newCurrency: Currency = value === 'VIETNAM' ? 'USD' : 'KRW'
      setFormData((prev) => ({
        ...prev,
        orderType: value as OrderType,
        partnerId: '',
        items: prev.items.map((item) => ({
          ...item,
          currency: newCurrency,
        })),
      }))
    }
  }

  // 품목 추가
  const handleAddItem = () => {
    const newItem: OrderItemData = {
      productId: '',
      productCode: '',
      productName: '',
      quantity: 0,
      unitPrice: 0,
      currency,
    }

    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }))
  }

  // 품목 삭제
  const handleRemoveItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }))
  }

  // 품목 업데이트
  const handleItemChange = (index: number, field: keyof OrderItemData, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item, i) => {
        if (i !== index) return item

        // 제품 선택 시 코드/이름/단가 자동 설정
        if (field === 'productId') {
          const product = products.find((p) => p.id === value)
          if (product) {
            return {
              ...item,
              productId: product.id,
              productCode: product.productCode,
              productName: product.productName,
              unitPrice: product.unitPrice?.amount ?? 0,
            }
          }
        }

        return { ...item, [field]: value }
      }),
    }))
  }

  // 폼 제출
  const handleSubmit = async () => {
    const validationErrors = validateOrderForm(formData)
    if (validationErrors.length > 0) {
      setErrors(validationErrors)
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(formData)
      setFormData(initialFormData)
      setErrors([])
    } catch (err) {
      setErrors([err instanceof Error ? err.message : '발주 생성 실패'])
    } finally {
      setIsSubmitting(false)
    }
  }

  // 취소 핸들러
  const handleCancel = () => {
    setFormData(initialFormData)
    setErrors([])
    onCancel()
  }

  const isEditMode = !!editingOrder

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            {isEditMode ? '발주 수정' : '신규 발주'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* 에러 표시 */}
          {errors.length > 0 && (
            <Card className="border-destructive">
              <CardContent className="pt-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                  <ul className="text-sm text-destructive space-y-1">
                    {errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 기본 정보 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">기본 정보</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {/* 발주 유형 */}
                <div className="space-y-2">
                  <Label htmlFor="orderType">발주 유형 *</Label>
                  <Select
                    value={formData.orderType}
                    onValueChange={(value) => handleFieldChange('orderType', value)}
                    disabled={isEditMode}
                  >
                    <SelectTrigger id="orderType">
                      <SelectValue placeholder="발주 유형 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {ORDER_TYPE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 거래처 */}
                <div className="space-y-2">
                  <Label htmlFor="partnerId">거래처 *</Label>
                  <Select
                    value={formData.partnerId}
                    onValueChange={(value) => handleFieldChange('partnerId', value)}
                    disabled={isEditMode}
                  >
                    <SelectTrigger id="partnerId">
                      <SelectValue placeholder="거래처 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredPartners.map((partner) => (
                        <SelectItem key={partner.id} value={partner.id}>
                          {partner.partnerName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 납기일 */}
                <div className="space-y-2">
                  <Label htmlFor="dueDate">납기일 *</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => handleFieldChange('dueDate', e.target.value)}
                  />
                </div>

                {/* 선적일 (베트남만) */}
                {formData.orderType === 'VIETNAM' && (
                  <div className="space-y-2">
                    <Label htmlFor="shipmentDate">선적일 *</Label>
                    <Input
                      id="shipmentDate"
                      type="date"
                      value={formData.shipmentDate ?? ''}
                      onChange={(e) => handleFieldChange('shipmentDate', e.target.value)}
                    />
                  </div>
                )}
              </div>

              {/* 비고 */}
              <div className="mt-4 space-y-2">
                <Label htmlFor="notes">비고</Label>
                <Textarea
                  id="notes"
                  placeholder="비고 사항을 입력하세요..."
                  value={formData.notes ?? ''}
                  onChange={(e) => handleFieldChange('notes', e.target.value)}
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* 품목 목록 */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">품목 목록</CardTitle>
                <Button size="sm" variant="outline" onClick={handleAddItem}>
                  <Plus className="h-4 w-4 mr-1" />
                  품목 추가
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {formData.items.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>품목을 추가해주세요</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[250px]">제품</TableHead>
                      <TableHead className="w-[120px] text-right">수량</TableHead>
                      <TableHead className="w-[150px] text-right">단가 ({currency})</TableHead>
                      <TableHead className="w-[150px] text-right">금액</TableHead>
                      <TableHead className="w-[60px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {formData.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Select
                            value={item.productId}
                            onValueChange={(value) => handleItemChange(index, 'productId', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="제품 선택" />
                            </SelectTrigger>
                            <SelectContent>
                              {products.map((product) => (
                                <SelectItem key={product.id} value={product.id}>
                                  {product.productCode} - {product.productName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={0}
                            value={item.quantity || ''}
                            onChange={(e) =>
                              handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)
                            }
                            className="text-right"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={0}
                            step={0.01}
                            value={item.unitPrice || ''}
                            onChange={(e) =>
                              handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)
                            }
                            className="text-right"
                          />
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {(item.quantity * item.unitPrice).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveItem(index)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {/* 합계 */}
              {formData.items.length > 0 && (
                <div className="mt-4 pt-4 border-t flex justify-end gap-8">
                  <div className="text-sm">
                    <span className="text-muted-foreground">총 수량:</span>{' '}
                    <span className="font-bold">{totalQuantity.toLocaleString()}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">총 금액:</span>{' '}
                    <span className="font-bold">{totalAmount.format()}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={handleCancel} disabled={isSubmitting}>
            취소
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? '저장 중...' : isEditMode ? '수정' : '생성'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
