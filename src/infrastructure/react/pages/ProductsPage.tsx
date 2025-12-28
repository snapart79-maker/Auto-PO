/**
 * ProductsPage - 제품 마스터 관리 페이지
 */

import { useState, useEffect, useMemo } from 'react'
import { PageHeader } from '../components/PageHeader'
import { DataTable, type ColumnDef } from '../components/DataTable'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Switch } from '../components/ui/switch'
import { Badge } from '../components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog'
import {
  SupabaseProductRepository,
  SupabasePartnerRepository,
  SupabaseVehicleModelRepository,
} from '@infrastructure/repositories'
import { Product } from '@domain/entities/Product'
import { SupplierType } from '@domain/valueObjects/SupplierType'
import { Money } from '@domain/valueObjects/Money'
import { Plus, Pencil, Trash2, Upload } from 'lucide-react'

const productRepository = new SupabaseProductRepository()
const partnerRepository = new SupabasePartnerRepository()
const vehicleModelRepository = new SupabaseVehicleModelRepository()

interface ProductRow {
  id: string
  productCode: string
  productName: string
  vehicleModelId: string
  primarySupplier: string
  domesticRatio: number
  domesticLeadTime: number
  overseasLeadTime: number
  unitPrice: number
  currency: string
  isActive: boolean
}

interface SelectOption {
  value: string
  label: string
}

const SUPPLIER_TYPE_LABELS: Record<string, string> = {
  DOMESTIC: '국내',
  VIETNAM: '베트남',
  BOTH: '이원화',
}

export function ProductsPage() {
  const [data, setData] = useState<ProductRow[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<ProductRow | null>(null)
  const [vehicleModels, setVehicleModels] = useState<SelectOption[]>([])
  const [partners, setPartners] = useState<SelectOption[]>([])
  const [formData, setFormData] = useState({
    productCode: '',
    productName: '',
    vehicleModelId: '',
    primarySupplier: 'DOMESTIC',
    mainPartnerId: '',
    subPartnerId: '',
    domesticRatio: 100,
    domesticLeadTime: 3,
    overseasLeadTime: 14,
    unitPrice: 0,
    currency: 'KRW',
    isActive: true,
  })

  const columns: ColumnDef<ProductRow>[] = useMemo(
    () => [
      {
        accessorKey: 'productCode',
        header: '품번',
      },
      {
        accessorKey: 'productName',
        header: '품명',
      },
      {
        accessorKey: 'primarySupplier',
        header: '공급처',
        cell: ({ row }) => {
          const type = row.original.primarySupplier
          const variant =
            type === 'BOTH' ? 'warning' : type === 'VIETNAM' ? 'secondary' : 'default'
          return <Badge variant={variant}>{SUPPLIER_TYPE_LABELS[type] ?? type}</Badge>
        },
      },
      {
        accessorKey: 'domesticRatio',
        header: '국내비율',
        cell: ({ row }) => {
          if (row.original.primarySupplier === 'BOTH') {
            return `${row.original.domesticRatio}%`
          }
          return '-'
        },
      },
      {
        accessorKey: 'domesticLeadTime',
        header: '국내 L/T',
        cell: ({ row }) => `${row.original.domesticLeadTime}일`,
      },
      {
        accessorKey: 'overseasLeadTime',
        header: '해외 L/T',
        cell: ({ row }) => `${row.original.overseasLeadTime}일`,
      },
      {
        accessorKey: 'unitPrice',
        header: '단가',
        cell: ({ row }) => {
          if (!row.original.unitPrice) return '-'
          return `${row.original.unitPrice.toLocaleString()} ${row.original.currency}`
        },
      },
      {
        accessorKey: 'isActive',
        header: '상태',
        cell: ({ row }) => (
          <Badge variant={row.original.isActive ? 'success' : 'secondary'}>
            {row.original.isActive ? '활성' : '비활성'}
          </Badge>
        ),
      },
      {
        id: 'actions',
        header: '작업',
        cell: ({ row }) => (
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={() => handleEdit(row.original)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => handleDelete(row.original.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    []
  )

  useEffect(() => {
    loadData()
    loadSelectOptions()
  }, [])

  const loadData = async () => {
    try {
      const products = await productRepository.findAll()
      setData(
        products.map((p) => ({
          id: p.id,
          productCode: p.productCode,
          productName: p.productName,
          vehicleModelId: p.vehicleModelId ?? '',
          primarySupplier: p.primarySupplier.value,
          domesticRatio: p.domesticRatio,
          domesticLeadTime: p.domesticLeadTime,
          overseasLeadTime: p.overseasLeadTime,
          unitPrice: p.unitPrice?.amount ?? 0,
          currency: p.unitPrice?.currency ?? 'KRW',
          isActive: p.isActive,
        }))
      )
    } catch (error) {
      console.error('데이터 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadSelectOptions = async () => {
    try {
      const [vms, pts] = await Promise.all([
        vehicleModelRepository.findAll({ isActive: true }),
        partnerRepository.findAll({ isActive: true }),
      ])

      setVehicleModels(vms.map((v) => ({ value: v.id, label: `${v.vehicleCode} - ${v.vehicleName}` })))
      setPartners(pts.map((p) => ({ value: p.id, label: `${p.partnerCode} - ${p.partnerName}` })))
    } catch (error) {
      console.error('선택 옵션 로드 실패:', error)
    }
  }

  const handleAdd = () => {
    setEditingItem(null)
    setFormData({
      productCode: '',
      productName: '',
      vehicleModelId: '',
      primarySupplier: 'DOMESTIC',
      mainPartnerId: '',
      subPartnerId: '',
      domesticRatio: 100,
      domesticLeadTime: 3,
      overseasLeadTime: 14,
      unitPrice: 0,
      currency: 'KRW',
      isActive: true,
    })
    setDialogOpen(true)
  }

  const handleEdit = (item: ProductRow) => {
    setEditingItem(item)
    setFormData({
      productCode: item.productCode,
      productName: item.productName,
      vehicleModelId: item.vehicleModelId,
      primarySupplier: item.primarySupplier,
      mainPartnerId: '',
      subPartnerId: '',
      domesticRatio: item.domesticRatio,
      domesticLeadTime: item.domesticLeadTime,
      overseasLeadTime: item.overseasLeadTime,
      unitPrice: item.unitPrice,
      currency: item.currency,
      isActive: item.isActive,
    })
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('이 제품을 삭제하시겠습니까?')) return

    try {
      await productRepository.delete(id)
      await loadData()
    } catch (error) {
      console.error('삭제 실패:', error)
      alert('삭제 중 오류가 발생했습니다.')
    }
  }

  const handleSubmit = async () => {
    try {
      const product = Product.create({
        id: editingItem?.id ?? crypto.randomUUID(),
        productCode: formData.productCode,
        productName: formData.productName,
        vehicleModelId: formData.vehicleModelId || undefined,
        primarySupplier: SupplierType.fromString(formData.primarySupplier),
        mainPartnerId: formData.mainPartnerId || undefined,
        subPartnerId: formData.subPartnerId || undefined,
        domesticRatio: formData.domesticRatio,
        domesticLeadTime: formData.domesticLeadTime,
        overseasLeadTime: formData.overseasLeadTime,
        unitPrice: formData.unitPrice
          ? Money.create(formData.unitPrice, formData.currency as 'KRW' | 'USD')
          : undefined,
        isActive: formData.isActive,
      })

      await productRepository.save(product)
      setDialogOpen(false)
      await loadData()
    } catch (error) {
      console.error('저장 실패:', error)
      alert(error instanceof Error ? error.message : '저장 중 오류가 발생했습니다.')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>로딩 중...</p>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title="제품 관리"
        description="제품 마스터 및 이원화 설정을 관리합니다."
        actions={
          <div className="flex gap-2">
            <Button variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              일괄등록
            </Button>
            <Button onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-2" />
              제품 추가
            </Button>
          </div>
        }
      />

      <div className="flex-1 p-6 overflow-auto">
        <DataTable
          columns={columns}
          data={data}
          searchPlaceholder="품번 또는 품명으로 검색..."
        />
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? '제품 수정' : '제품 추가'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="productCode">품번 *</Label>
              <Input
                id="productCode"
                value={formData.productCode}
                onChange={(e) => setFormData({ ...formData, productCode: e.target.value })}
                disabled={!!editingItem}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vehicleModelId">차종</Label>
              <Select
                value={formData.vehicleModelId}
                onValueChange={(value) => setFormData({ ...formData, vehicleModelId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="선택..." />
                </SelectTrigger>
                <SelectContent>
                  {vehicleModels.map((vm) => (
                    <SelectItem key={vm.value} value={vm.value}>
                      {vm.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="productName">품명 *</Label>
              <Input
                id="productName"
                value={formData.productName}
                onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="primarySupplier">공급처 유형 *</Label>
              <Select
                value={formData.primarySupplier}
                onValueChange={(value) => setFormData({ ...formData, primarySupplier: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DOMESTIC">국내</SelectItem>
                  <SelectItem value="VIETNAM">베트남</SelectItem>
                  <SelectItem value="BOTH">이원화</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.primarySupplier === 'BOTH' && (
              <div className="space-y-2">
                <Label htmlFor="domesticRatio">국내 비율 (%)</Label>
                <Input
                  id="domesticRatio"
                  type="number"
                  min={0}
                  max={100}
                  value={formData.domesticRatio}
                  onChange={(e) =>
                    setFormData({ ...formData, domesticRatio: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="mainPartnerId">국내 거래처</Label>
              <Select
                value={formData.mainPartnerId}
                onValueChange={(value) => setFormData({ ...formData, mainPartnerId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="선택..." />
                </SelectTrigger>
                <SelectContent>
                  {partners.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {(formData.primarySupplier === 'BOTH' || formData.primarySupplier === 'VIETNAM') && (
              <div className="space-y-2">
                <Label htmlFor="subPartnerId">베트남 거래처</Label>
                <Select
                  value={formData.subPartnerId}
                  onValueChange={(value) => setFormData({ ...formData, subPartnerId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="선택..." />
                  </SelectTrigger>
                  <SelectContent>
                    {partners.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="domesticLeadTime">국내 리드타임 (일)</Label>
              <Input
                id="domesticLeadTime"
                type="number"
                min={1}
                value={formData.domesticLeadTime}
                onChange={(e) =>
                  setFormData({ ...formData, domesticLeadTime: parseInt(e.target.value) || 1 })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="overseasLeadTime">해외 리드타임 (일)</Label>
              <Input
                id="overseasLeadTime"
                type="number"
                min={1}
                value={formData.overseasLeadTime}
                onChange={(e) =>
                  setFormData({ ...formData, overseasLeadTime: parseInt(e.target.value) || 1 })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unitPrice">단가</Label>
              <Input
                id="unitPrice"
                type="number"
                min={0}
                value={formData.unitPrice}
                onChange={(e) =>
                  setFormData({ ...formData, unitPrice: parseInt(e.target.value) || 0 })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">통화</Label>
              <Select
                value={formData.currency}
                onValueChange={(value) => setFormData({ ...formData, currency: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="KRW">KRW</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 col-span-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
              <Label htmlFor="isActive">활성화</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleSubmit}>저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
