/**
 * PartnersPage - 거래처 마스터 관리 페이지
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { SupabasePartnerRepository } from '@infrastructure/repositories'
import { Partner } from '@domain/entities/Partner'
import { PartnerType } from '@domain/valueObjects/PartnerType'
import { Plus, Pencil, Trash2, Upload } from 'lucide-react'

const partnerRepository = new SupabasePartnerRepository()

interface PartnerRow {
  id: string
  partnerCode: string
  partnerName: string
  partnerType: string
  businessNumber: string
  contactPerson: string
  contactPhone: string
  currency: string
  isActive: boolean
}

const PARTNER_TYPE_LABELS: Record<string, string> = {
  SUPPLIER: '협력사',
  CUSTOMER: '고객사',
  VIETNAM: '베트남',
}

export function PartnersPage() {
  const [data, setData] = useState<PartnerRow[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('all')
  const [editingItem, setEditingItem] = useState<PartnerRow | null>(null)
  const [formData, setFormData] = useState({
    partnerCode: '',
    partnerName: '',
    partnerType: 'SUPPLIER',
    businessNumber: '',
    address: '',
    contactPerson: '',
    contactPhone: '',
    contactEmail: '',
    currency: 'KRW',
    isActive: true,
  })

  const columns: ColumnDef<PartnerRow>[] = useMemo(
    () => [
      {
        accessorKey: 'partnerCode',
        header: '거래처코드',
      },
      {
        accessorKey: 'partnerName',
        header: '거래처명',
      },
      {
        accessorKey: 'partnerType',
        header: '유형',
        cell: ({ row }) => {
          const type = row.original.partnerType
          const variant =
            type === 'SUPPLIER' ? 'default' : type === 'VIETNAM' ? 'warning' : 'secondary'
          return <Badge variant={variant}>{PARTNER_TYPE_LABELS[type] ?? type}</Badge>
        },
      },
      {
        accessorKey: 'contactPerson',
        header: '담당자',
        cell: ({ row }) => row.original.contactPerson || '-',
      },
      {
        accessorKey: 'contactPhone',
        header: '연락처',
        cell: ({ row }) => row.original.contactPhone || '-',
      },
      {
        accessorKey: 'currency',
        header: '통화',
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
  }, [])

  const loadData = async () => {
    try {
      const partners = await partnerRepository.findAll()
      setData(
        partners.map((p) => ({
          id: p.id,
          partnerCode: p.partnerCode,
          partnerName: p.partnerName,
          partnerType: p.partnerType.value,
          businessNumber: p.businessNumber ?? '',
          contactPerson: p.contactPerson ?? '',
          contactPhone: p.contactPhone ?? '',
          currency: p.currency,
          isActive: p.isActive,
        }))
      )
    } catch (error) {
      console.error('데이터 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredData = useMemo(() => {
    if (activeTab === 'all') return data
    return data.filter((item) => item.partnerType === activeTab)
  }, [data, activeTab])

  const handleAdd = () => {
    setEditingItem(null)
    setFormData({
      partnerCode: '',
      partnerName: '',
      partnerType: 'SUPPLIER',
      businessNumber: '',
      address: '',
      contactPerson: '',
      contactPhone: '',
      contactEmail: '',
      currency: 'KRW',
      isActive: true,
    })
    setDialogOpen(true)
  }

  const handleEdit = (item: PartnerRow) => {
    setEditingItem(item)
    setFormData({
      partnerCode: item.partnerCode,
      partnerName: item.partnerName,
      partnerType: item.partnerType,
      businessNumber: item.businessNumber,
      address: '',
      contactPerson: item.contactPerson,
      contactPhone: item.contactPhone,
      contactEmail: '',
      currency: item.currency,
      isActive: item.isActive,
    })
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('이 거래처를 삭제하시겠습니까?')) return

    try {
      await partnerRepository.delete(id)
      await loadData()
    } catch (error) {
      console.error('삭제 실패:', error)
      alert('삭제 중 오류가 발생했습니다.')
    }
  }

  const handleSubmit = async () => {
    try {
      const partner = Partner.create({
        id: editingItem?.id ?? crypto.randomUUID(),
        partnerCode: formData.partnerCode,
        partnerName: formData.partnerName,
        partnerType: PartnerType.fromString(formData.partnerType),
        businessNumber: formData.businessNumber || undefined,
        address: formData.address || undefined,
        contactPerson: formData.contactPerson || undefined,
        contactPhone: formData.contactPhone || undefined,
        contactEmail: formData.contactEmail || undefined,
        currency: formData.currency,
        isActive: formData.isActive,
      })

      await partnerRepository.save(partner)
      setDialogOpen(false)
      await loadData()
    } catch (error) {
      console.error('저장 실패:', error)
      alert('저장 중 오류가 발생했습니다.')
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
        title="거래처 관리"
        description="협력사, 고객사, 베트남 거래처를 관리합니다."
        actions={
          <div className="flex gap-2">
            <Button variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              일괄등록
            </Button>
            <Button onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-2" />
              거래처 추가
            </Button>
          </div>
        }
      />

      <div className="flex-1 p-6 overflow-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">전체 ({data.length})</TabsTrigger>
            <TabsTrigger value="SUPPLIER">
              협력사 ({data.filter((d) => d.partnerType === 'SUPPLIER').length})
            </TabsTrigger>
            <TabsTrigger value="CUSTOMER">
              고객사 ({data.filter((d) => d.partnerType === 'CUSTOMER').length})
            </TabsTrigger>
            <TabsTrigger value="VIETNAM">
              베트남 ({data.filter((d) => d.partnerType === 'VIETNAM').length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            <DataTable
              columns={columns}
              data={filteredData}
              searchPlaceholder="거래처코드 또는 거래처명으로 검색..."
            />
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingItem ? '거래처 수정' : '거래처 추가'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="partnerCode">거래처코드 *</Label>
              <Input
                id="partnerCode"
                value={formData.partnerCode}
                onChange={(e) => setFormData({ ...formData, partnerCode: e.target.value })}
                disabled={!!editingItem}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="partnerType">유형 *</Label>
              <Select
                value={formData.partnerType}
                onValueChange={(value) => setFormData({ ...formData, partnerType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SUPPLIER">협력사</SelectItem>
                  <SelectItem value="CUSTOMER">고객사</SelectItem>
                  <SelectItem value="VIETNAM">베트남</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="partnerName">거래처명 *</Label>
              <Input
                id="partnerName"
                value={formData.partnerName}
                onChange={(e) => setFormData({ ...formData, partnerName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="businessNumber">사업자등록번호</Label>
              <Input
                id="businessNumber"
                value={formData.businessNumber}
                onChange={(e) => setFormData({ ...formData, businessNumber: e.target.value })}
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
            <div className="space-y-2">
              <Label htmlFor="contactPerson">담당자</Label>
              <Input
                id="contactPerson"
                value={formData.contactPerson}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactPhone">연락처</Label>
              <Input
                id="contactPhone"
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="contactEmail">이메일</Label>
              <Input
                id="contactEmail"
                type="email"
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="address">주소</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
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
