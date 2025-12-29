/**
 * VehicleModelsPage - 차종 마스터 관리 페이지 (ERP 스타일)
 * 차종 선택 시 해당 품번 목록 조회 (읽기 전용)
 */

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import * as XLSX from 'xlsx'
import { ERPTable } from '../components/ERPTable'
import {
  ERPGroupBox,
  ERPFormField,
  ERPInput,
  ERPButton,
} from '../components/ERPGroupBox'
import { ERPFunctionPanel } from '../components/ERPSummaryPanel'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Switch } from '../components/ui/switch'
import { useToast } from '../components/ui/toast'
import { SupabaseVehicleModelRepository, SupabaseProductRepository } from '@infrastructure/repositories'
import { VehicleModel } from '@domain/entities/VehicleModel'
import { Plus, Pencil, Trash2, Upload, RefreshCw, Search, FileDown, ExternalLink } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'

const vehicleModelRepository = new SupabaseVehicleModelRepository()
const productRepository = new SupabaseProductRepository()

interface VehicleModelRow {
  id: string
  vehicleCode: string
  vehicleName: string
  description: string
  isActive: boolean
  productCount?: number
}

interface ProductRow {
  id: string
  productCode: string
  productName: string
  primarySupplier: string
  unitPrice: number
  currency: string
}

const SUPPLIER_TYPE_LABELS: Record<string, string> = {
  DOMESTIC: '국내',
  VIETNAM: '베트남',
  BOTH: '이원화',
}

export function VehicleModelsPage() {
  const { toast } = useToast()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [data, setData] = useState<VehicleModelRow[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [filterCode, setFilterCode] = useState('')
  const [filterName, setFilterName] = useState('')
  const [editingItem, setEditingItem] = useState<VehicleModelRow | null>(null)
  const [formData, setFormData] = useState({
    vehicleCode: '',
    vehicleName: '',
    description: '',
    isActive: true,
  })

  // 선택된 차종 및 품번 목록
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleModelRow | null>(null)
  const [vehicleProducts, setVehicleProducts] = useState<ProductRow[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)

  // 업로드 다이얼로그 상태
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [uploadData, setUploadData] = useState<VehicleModelRow[]>([])
  const [uploadErrors, setUploadErrors] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)

  const columns: ColumnDef<VehicleModelRow, unknown>[] = useMemo(
    () => [
      { accessorKey: 'vehicleCode', header: '차종코드', size: 100 },
      { accessorKey: 'vehicleName', header: '차종명', size: 150 },
      { accessorKey: 'description', header: '설명', cell: ({ row }) => row.original.description || '-', size: 200 },
      {
        accessorKey: 'productCount',
        header: '품번 수',
        cell: ({ row }) => (
          <span className="text-right block font-medium text-blue-600">
            {row.original.productCount ?? 0}개
          </span>
        ),
        size: 80,
      },
      {
        accessorKey: 'isActive',
        header: '상태',
        cell: ({ row }) => (
          <span className={row.original.isActive ? 'text-green-600 font-medium' : 'text-gray-400'}>
            {row.original.isActive ? '활성' : '비활성'}
          </span>
        ),
        size: 60,
      },
      {
        id: 'actions',
        header: '작업',
        cell: ({ row }) => (
          <div className="flex gap-1">
            <button onClick={(e) => { e.stopPropagation(); handleEdit(row.original) }} className="text-blue-600 hover:text-blue-800">
              <Pencil className="h-4 w-4" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); handleDelete(row.original.id) }} className="text-red-600 hover:text-red-800">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ),
        size: 70,
      },
    ],
    []
  )

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [models, products] = await Promise.all([
        vehicleModelRepository.findAll(),
        productRepository.findAll(),
      ])

      // 차종별 품번 개수 계산
      const productCountMap = new Map<string, number>()
      for (const p of products) {
        if (p.vehicleModelId) {
          productCountMap.set(p.vehicleModelId, (productCountMap.get(p.vehicleModelId) ?? 0) + 1)
        }
      }

      setData(
        models.map((m) => ({
          id: m.id,
          vehicleCode: m.vehicleCode,
          vehicleName: m.vehicleName,
          description: m.description ?? '',
          isActive: m.isActive,
          productCount: productCountMap.get(m.id) ?? 0,
        }))
      )
    } catch (error) {
      console.error('데이터 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  // 차종 선택 시 품번 목록 로드
  const loadVehicleProducts = async (vehicleId: string) => {
    setLoadingProducts(true)
    try {
      const products = await productRepository.findAll({ vehicleModelId: vehicleId })
      setVehicleProducts(
        products.map((p) => ({
          id: p.id,
          productCode: p.productCode,
          productName: p.productName,
          primarySupplier: p.primarySupplier.value,
          unitPrice: p.unitPrice?.amount ?? 0,
          currency: p.unitPrice?.currency ?? 'KRW',
        }))
      )
    } catch (error) {
      console.error('품번 로드 실패:', error)
      setVehicleProducts([])
    } finally {
      setLoadingProducts(false)
    }
  }

  const handleRowClick = (row: VehicleModelRow) => {
    setSelectedVehicle(row)
    loadVehicleProducts(row.id)
  }

  const filteredData = useMemo(() => {
    let result = data
    if (filterCode.trim()) {
      result = result.filter((item) => item.vehicleCode.toLowerCase().includes(filterCode.toLowerCase()))
    }
    if (filterName.trim()) {
      result = result.filter((item) => item.vehicleName.toLowerCase().includes(filterName.toLowerCase()))
    }
    return result
  }, [data, filterCode, filterName])

  const handleReset = () => {
    setFilterCode('')
    setFilterName('')
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
      if (selectedVehicle?.id === id) {
        setSelectedVehicle(null)
        setVehicleProducts([])
      }
      toast({ title: '삭제 완료' })
    } catch (error) {
      console.error('삭제 실패:', error)
      toast({ title: '삭제 실패', variant: 'destructive' })
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
      toast({ title: editingItem ? '수정 완료' : '등록 완료' })
    } catch (error) {
      console.error('저장 실패:', error)
      toast({ title: '저장 실패', variant: 'destructive' })
    }
  }

  // 양식 다운로드
  const handleDownloadTemplate = useCallback(() => {
    const templateData = [
      ['차종코드', '차종명', '설명'],
      ['V001', '샘플차종', '설명입니다'],
    ]
    const ws = XLSX.utils.aoa_to_sheet(templateData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '차종')
    ws['!cols'] = [{ wch: 15 }, { wch: 20 }, { wch: 40 }]
    XLSX.writeFile(wb, '차종_양식.xlsx')
  }, [])

  // 엑셀 업로드
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const buffer = await file.arrayBuffer()
      const workbook = XLSX.read(buffer, { type: 'array' })
      const sheetName = workbook.SheetNames[0]
      if (!sheetName) throw new Error('시트를 찾을 수 없습니다')
      const sheet = workbook.Sheets[sheetName]
      if (!sheet) throw new Error('시트를 찾을 수 없습니다')
      const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 })

      const errors: string[] = []
      const parsedData: VehicleModelRow[] = []

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i]
        if (!row || row.length === 0) continue

        const vehicleCode = String(row[0] ?? '').trim()
        const vehicleName = String(row[1] ?? '').trim()
        const description = String(row[2] ?? '').trim()

        if (!vehicleCode) {
          errors.push(`행 ${i + 1}: 차종코드 필수`)
          continue
        }
        if (!vehicleName) {
          errors.push(`행 ${i + 1}: 차종명 필수`)
          continue
        }

        parsedData.push({
          id: crypto.randomUUID(),
          vehicleCode,
          vehicleName,
          description,
          isActive: true,
        })
      }

      setUploadData(parsedData)
      setUploadErrors(errors)
      setUploadDialogOpen(true)
    } catch (err) {
      toast({ title: '파일 처리 실패', description: err instanceof Error ? err.message : '알 수 없는 오류', variant: 'destructive' })
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }, [toast])

  // 업로드 데이터 저장
  const handleUploadSave = useCallback(async () => {
    if (uploadErrors.length > 0) {
      toast({ title: '오류가 있어 저장할 수 없습니다', variant: 'destructive' })
      return
    }

    setUploading(true)
    try {
      let savedCount = 0
      for (const row of uploadData) {
        const model = VehicleModel.create({
          id: row.id,
          vehicleCode: row.vehicleCode,
          vehicleName: row.vehicleName,
          description: row.description || undefined,
          isActive: true,
        })
        await vehicleModelRepository.save(model)
        savedCount++
      }

      toast({ title: '저장 완료', description: `${savedCount}건 저장됨` })
      setUploadDialogOpen(false)
      setUploadData([])
      setUploadErrors([])
      await loadData()
    } catch (err) {
      toast({ title: '저장 실패', description: err instanceof Error ? err.message : '알 수 없는 오류', variant: 'destructive' })
    } finally {
      setUploading(false)
    }
  }, [uploadData, uploadErrors, toast])

  // 제품관리로 이동 (선택된 차종 필터)
  const goToProducts = () => {
    if (selectedVehicle) {
      navigate(`/products?vehicleId=${selectedVehicle.id}`)
    } else {
      navigate('/products')
    }
  }

  return (
    <div className="h-full flex flex-col gap-2">
      {/* 상단 영역: 조회조건 + 기능 */}
      <div className="flex gap-2">
        <ERPGroupBox title="조회조건" className="flex-1">
          <div className="flex items-end gap-4">
            <ERPFormField label="차종코드">
              <ERPInput value={filterCode} onChange={(e) => setFilterCode(e.target.value)} placeholder="차종코드" inputSize="md" />
            </ERPFormField>
            <ERPFormField label="차종명">
              <ERPInput value={filterName} onChange={(e) => setFilterName(e.target.value)} placeholder="차종명" inputSize="lg" />
            </ERPFormField>
            <ERPButton variant="primary">
              <Search className="h-3 w-3 mr-1" />
              조회
            </ERPButton>
            <ERPButton onClick={handleReset}>초기화</ERPButton>
          </div>
        </ERPGroupBox>

        <ERPFunctionPanel
          title="기능"
          className="w-36"
          buttons={[
            { label: '개별등록', icon: <Plus className="h-3 w-3" />, onClick: handleAdd },
            { label: '일괄등록', icon: <Upload className="h-3 w-3" />, onClick: () => fileInputRef.current?.click() },
            { label: '양식다운로드', icon: <FileDown className="h-3 w-3" />, onClick: handleDownloadTemplate },
            { label: '새로고침', icon: <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />, onClick: loadData },
          ]}
        />
        <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={handleFileUpload} className="hidden" />
      </div>

      {/* 메인 영역: 차종 테이블 + 품번 목록 */}
      <div className="flex-1 flex gap-2 min-h-0">
        {/* 차종 목록 */}
        <div className="flex-1 min-w-0">
          <ERPTable
            columns={columns}
            data={filteredData}
            title={`차종 목록 (${filteredData.length}건)`}
            pageSize={15}
            onRowClick={handleRowClick}
          />
        </div>

        {/* 선택된 차종의 품번 목록 */}
        <div className="w-96 flex flex-col gap-2">
          {/* 선택된 차종 정보 */}
          <ERPGroupBox title="선택된 차종" className="shrink-0">
            {selectedVehicle ? (
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-xs text-gray-500">차종코드</span>
                  <span className="text-xs font-medium">{selectedVehicle.vehicleCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-gray-500">차종명</span>
                  <span className="text-xs font-medium">{selectedVehicle.vehicleName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-gray-500">등록 품번</span>
                  <span className="text-xs font-bold text-blue-600">{vehicleProducts.length}개</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-400 text-center py-2">
                왼쪽에서 차종을 선택하세요
              </p>
            )}
          </ERPGroupBox>

          {/* 품번 목록 (조회 전용) */}
          <div className="flex-1 min-h-0 flex flex-col">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-gray-700">품번 목록 (조회 전용)</span>
              {selectedVehicle && (
                <button
                  onClick={goToProducts}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                >
                  <ExternalLink className="h-3 w-3" />
                  제품관리
                </button>
              )}
            </div>
            <div className="flex-1 border border-[#999] bg-white overflow-auto">
              {loadingProducts ? (
                <div className="flex items-center justify-center h-full text-xs text-gray-400">
                  로딩 중...
                </div>
              ) : !selectedVehicle ? (
                <div className="flex items-center justify-center h-full text-xs text-gray-400">
                  차종을 선택하면 품번 목록이 표시됩니다
                </div>
              ) : vehicleProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-xs text-gray-400 gap-2">
                  <p>등록된 품번이 없습니다</p>
                  <button
                    onClick={goToProducts}
                    className="text-blue-600 hover:underline"
                  >
                    제품관리에서 등록하기
                  </button>
                </div>
              ) : (
                <table className="w-full text-xs border-collapse">
                  <thead className="sticky top-0">
                    <tr className="bg-gradient-to-b from-[#5a7fb5] to-[#4a6fa5] text-white">
                      <th className="border border-[#3d5a80] px-2 py-1 text-left">품번</th>
                      <th className="border border-[#3d5a80] px-2 py-1 text-left">품명</th>
                      <th className="border border-[#3d5a80] px-2 py-1 text-center">공급처</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vehicleProducts.map((p, idx) => (
                      <tr
                        key={p.id}
                        className={idx % 2 === 0 ? 'bg-white' : 'bg-[#f8f9fa]'}
                      >
                        <td className="border border-[#ddd] px-2 py-1 font-mono">{p.productCode}</td>
                        <td className="border border-[#ddd] px-2 py-1">{p.productName}</td>
                        <td className="border border-[#ddd] px-2 py-1 text-center">
                          {SUPPLIER_TYPE_LABELS[p.primarySupplier]}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="h-5 bg-[#e8e8e8] border border-t-0 border-[#999] flex items-center justify-center text-[10px] text-gray-600">
              {selectedVehicle ? `총 ${vehicleProducts.length}개 품번` : '-'}
            </div>
          </div>
        </div>
      </div>

      {/* 개별 등록/수정 다이얼로그 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? '차종 수정' : '차종 추가'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>차종코드 *</Label>
              <Input value={formData.vehicleCode} onChange={(e) => setFormData({ ...formData, vehicleCode: e.target.value })} disabled={!!editingItem} />
            </div>
            <div className="space-y-2">
              <Label>차종명 *</Label>
              <Input value={formData.vehicleName} onChange={(e) => setFormData({ ...formData, vehicleName: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>설명</Label>
              <Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={formData.isActive} onCheckedChange={(c) => setFormData({ ...formData, isActive: c })} />
              <Label>활성화</Label>
            </div>
          </div>
          <DialogFooter>
            <ERPButton onClick={() => setDialogOpen(false)}>취소</ERPButton>
            <ERPButton variant="primary" onClick={handleSubmit}>저장</ERPButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 일괄 업로드 확인 다이얼로그 */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>일괄등록 데이터 확인</DialogTitle>
          </DialogHeader>
          <div className="max-h-80 overflow-auto">
            {uploadErrors.length > 0 && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm">
                <p className="font-medium text-red-700 mb-2">오류 목록:</p>
                <ul className="list-disc list-inside text-red-600">
                  {uploadErrors.map((err, i) => <li key={i}>{err}</li>)}
                </ul>
              </div>
            )}
            <p className="text-sm mb-2">{uploadData.length}건의 데이터가 파싱되었습니다.</p>
            <table className="w-full text-xs border-collapse">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 border">차종코드</th>
                  <th className="p-2 border">차종명</th>
                  <th className="p-2 border">설명</th>
                </tr>
              </thead>
              <tbody>
                {uploadData.slice(0, 20).map((row, i) => (
                  <tr key={i}>
                    <td className="p-2 border">{row.vehicleCode}</td>
                    <td className="p-2 border">{row.vehicleName}</td>
                    <td className="p-2 border">{row.description || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <DialogFooter>
            <ERPButton onClick={() => { setUploadDialogOpen(false); setUploadData([]); setUploadErrors([]) }}>취소</ERPButton>
            <ERPButton variant="primary" onClick={handleUploadSave} disabled={uploading || uploadErrors.length > 0}>
              {uploading ? '저장 중...' : '저장'}
            </ERPButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
