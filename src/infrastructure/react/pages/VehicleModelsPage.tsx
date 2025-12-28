/**
 * VehicleModelsPage - 차종 마스터 관리 페이지
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog'
import { SupabaseVehicleModelRepository } from '@infrastructure/repositories'
import { VehicleModel } from '@domain/entities/VehicleModel'
import { Plus, Pencil, Trash2, Upload } from 'lucide-react'

const vehicleModelRepository = new SupabaseVehicleModelRepository()

interface VehicleModelRow {
  id: string
  vehicleCode: string
  vehicleName: string
  description: string
  isActive: boolean
}

export function VehicleModelsPage() {
  const [data, setData] = useState<VehicleModelRow[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<VehicleModelRow | null>(null)
  const [formData, setFormData] = useState({
    vehicleCode: '',
    vehicleName: '',
    description: '',
    isActive: true,
  })

  const columns: ColumnDef<VehicleModelRow>[] = useMemo(
    () => [
      {
        accessorKey: 'vehicleCode',
        header: '차종코드',
      },
      {
        accessorKey: 'vehicleName',
        header: '차종명',
      },
      {
        accessorKey: 'description',
        header: '설명',
        cell: ({ row }) => row.original.description || '-',
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
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDelete(row.original.id)}
            >
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
      const models = await vehicleModelRepository.findAll()
      setData(
        models.map((m) => ({
          id: m.id,
          vehicleCode: m.vehicleCode,
          vehicleName: m.vehicleName,
          description: m.description ?? '',
          isActive: m.isActive,
        }))
      )
    } catch (error) {
      console.error('데이터 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setEditingItem(null)
    setFormData({ vehicleCode: '', vehicleName: '', description: '', isActive: true })
    setDialogOpen(true)
  }

  const handleEdit = (item: VehicleModelRow) => {
    setEditingItem(item)
    setFormData({
      vehicleCode: item.vehicleCode,
      vehicleName: item.vehicleName,
      description: item.description,
      isActive: item.isActive,
    })
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('이 차종을 삭제하시겠습니까?')) return

    try {
      await vehicleModelRepository.delete(id)
      await loadData()
    } catch (error) {
      console.error('삭제 실패:', error)
      alert('삭제 중 오류가 발생했습니다.')
    }
  }

  const handleSubmit = async () => {
    try {
      const model = VehicleModel.create({
        id: editingItem?.id ?? crypto.randomUUID(),
        vehicleCode: formData.vehicleCode,
        vehicleName: formData.vehicleName,
        description: formData.description || undefined,
        isActive: formData.isActive,
      })

      await vehicleModelRepository.save(model)
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
        title="차종 관리"
        description="차량 모델을 관리합니다."
        actions={
          <div className="flex gap-2">
            <Button variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              일괄등록
            </Button>
            <Button onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-2" />
              차종 추가
            </Button>
          </div>
        }
      />

      <div className="flex-1 p-6 overflow-auto">
        <DataTable
          columns={columns}
          data={data}
          searchPlaceholder="차종코드 또는 차종명으로 검색..."
        />
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? '차종 수정' : '차종 추가'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="vehicleCode">차종코드 *</Label>
              <Input
                id="vehicleCode"
                value={formData.vehicleCode}
                onChange={(e) => setFormData({ ...formData, vehicleCode: e.target.value })}
                disabled={!!editingItem}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vehicleName">차종명 *</Label>
              <Input
                id="vehicleName"
                value={formData.vehicleName}
                onChange={(e) => setFormData({ ...formData, vehicleName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">설명</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-2">
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
