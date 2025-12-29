/**
 * ProductsPage - 제품 마스터 관리 페이지 (ERP 스타일)
 */

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import * as XLSX from 'xlsx'
import { ERPTable } from '../components/ERPTable'
import {
  ERPGroupBox,
  ERPFormField,
  ERPInput,
  ERPSelect,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Switch } from '../components/ui/switch'
import { useToast } from '../components/ui/toast'
import {
  SupabaseProductRepository,
  SupabasePartnerRepository,
  SupabaseVehicleModelRepository,
} from '@infrastructure/repositories'
import { Product } from '@domain/entities/Product'
import { SupplierType } from '@domain/valueObjects/SupplierType'
import { Money } from '@domain/valueObjects/Money'
import { Plus, Pencil, Trash2, Upload, RefreshCw, Search, FileDown } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'

const productRepository = new SupabaseProductRepository()
const partnerRepository = new SupabasePartnerRepository()
const vehicleModelRepository = new SupabaseVehicleModelRepository()

interface ProductRow {
  id: string
  projectCode: string
  productCode: string
  productName: string
  spec1: string | null
  spec2: string | null
  spec3: string | null
  moq: number
  productType: string
  unit: string
  effectiveStartDate: string | null
  effectiveEndDate: string | null
  updatedAt: string | null
  // 기존 필드 (호환성 유지)
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

const PRODUCT_TYPE_OPTIONS = ['완제품', '반제품', '원자재', '부자재', '기타']
const UNIT_OPTIONS = ['EA', 'SET', 'M', 'KG', 'L', 'BOX']

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-'
  return dateStr.slice(0, 10)
}

function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('ko-KR').format(value)
}

/**
 * Excel 시리얼 넘버를 Date로 변환
 */
function excelSerialToDate(serial: number): Date {
  // Excel 날짜는 1900-01-01부터의 일수 (1900 버그 포함)
  const excelEpoch = new Date(1899, 11, 30) // 1899-12-30
  const msPerDay = 24 * 60 * 60 * 1000
  return new Date(excelEpoch.getTime() + serial * msPerDay)
}

/**
 * Date를 YYYY-MM-DD 문자열로 변환
 */
function formatDateToString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * 다양한 형식의 날짜 값을 YYYY-MM-DD 문자열로 변환
 */
function parseExcelDate(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null

  // Date 객체인 경우 (cellDates: true 옵션 사용 시)
  if (value instanceof Date) {
    if (isNaN(value.getTime())) return null
    return formatDateToString(value)
  }

  // 숫자인 경우 (Excel 시리얼 넘버)
  if (typeof value === 'number') {
    const date = excelSerialToDate(value)
    return formatDateToString(date)
  }

  // 문자열인 경우
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return null

    // 이미 YYYY-MM-DD 형식인지 확인
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return trimmed
    }

    // 숫자 문자열인 경우 (시리얼 넘버)
    const num = parseFloat(trimmed)
    if (!isNaN(num) && num > 10000 && num < 100000) {
      const date = excelSerialToDate(num)
      return formatDateToString(date)
    }

    // 기타 날짜 문자열 파싱 시도
    const parsed = new Date(trimmed)
    if (!isNaN(parsed.getTime())) {
      return formatDateToString(parsed)
    }
  }

  return null
}

export function ProductsPage() {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [data, setData] = useState<ProductRow[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [filterCode, setFilterCode] = useState('')
  const [filterName, setFilterName] = useState('')
  const [filterSupplier, setFilterSupplier] = useState('ALL')
  const [editingItem, setEditingItem] = useState<ProductRow | null>(null)
  const [vehicleModels, setVehicleModels] = useState<SelectOption[]>([])
  const [partners, setPartners] = useState<SelectOption[]>([])
  const [formData, setFormData] = useState({
    projectCode: '',
    productCode: '',
    productName: '',
    spec1: '',
    spec2: '',
    spec3: '',
    moq: 1,
    productType: '완제품',
    unit: 'EA',
    effectiveStartDate: '',
    effectiveEndDate: '',
    // 기존 필드 (호환성 유지)
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

  // 업로드 다이얼로그 상태
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [uploadData, setUploadData] = useState<ProductRow[]>([])
  const [uploadErrors, setUploadErrors] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)

  const columns: ColumnDef<ProductRow, unknown>[] = useMemo(
    () => [
      { accessorKey: 'projectCode', header: '프로젝트코드', cell: ({ row }) => <span className="font-mono">{row.original.projectCode || '-'}</span>, size: 120 },
      { accessorKey: 'productCode', header: '품번', cell: ({ row }) => <span className="font-mono">{row.original.productCode}</span>, size: 120 },
      { accessorKey: 'productName', header: '품명', size: 180 },
      { accessorKey: 'spec1', header: '사양1', cell: ({ row }) => row.original.spec1 || '-', size: 100 },
      { accessorKey: 'spec2', header: '사양2', cell: ({ row }) => row.original.spec2 || '-', size: 100 },
      { accessorKey: 'spec3', header: '사양3', cell: ({ row }) => row.original.spec3 || '-', size: 100 },
      {
        accessorKey: 'moq',
        header: 'MOQ',
        cell: ({ row }) => <span className="text-right block">{formatNumber(row.original.moq)}</span>,
        size: 80,
      },
      { accessorKey: 'productType', header: '품목유형', cell: ({ row }) => row.original.productType || '-', size: 80 },
      { accessorKey: 'unit', header: '단위', cell: ({ row }) => row.original.unit || 'EA', size: 60 },
      {
        accessorKey: 'effectiveStartDate',
        header: '적용시작일',
        cell: ({ row }) => formatDate(row.original.effectiveStartDate),
        size: 100,
      },
      {
        accessorKey: 'effectiveEndDate',
        header: '적용완료일',
        cell: ({ row }) => formatDate(row.original.effectiveEndDate),
        size: 100,
      },
      {
        accessorKey: 'updatedAt',
        header: '수정일시',
        cell: ({ row }) => formatDateTime(row.original.updatedAt),
        size: 140,
      },
      {
        id: 'actions',
        header: '작업',
        cell: ({ row }) => (
          <div className="flex gap-1">
            <button onClick={() => handleEdit(row.original)} className="text-blue-600 hover:text-blue-800">
              <Pencil className="h-4 w-4" />
            </button>
            <button onClick={() => handleDelete(row.original.id)} className="text-red-600 hover:text-red-800">
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
    loadSelectOptions()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const products = await productRepository.findAll()
      setData(
        products.map((p) => ({
          id: p.id,
          projectCode: (p as unknown as Record<string, unknown>).projectCode as string ?? '',
          productCode: p.productCode,
          productName: p.productName,
          spec1: (p as unknown as Record<string, unknown>).spec1 as string | null ?? null,
          spec2: (p as unknown as Record<string, unknown>).spec2 as string | null ?? null,
          spec3: (p as unknown as Record<string, unknown>).spec3 as string | null ?? null,
          moq: (p as unknown as Record<string, unknown>).moq as number ?? 1,
          productType: (p as unknown as Record<string, unknown>).productType as string ?? '완제품',
          unit: (p as unknown as Record<string, unknown>).unit as string ?? 'EA',
          effectiveStartDate: (p as unknown as Record<string, unknown>).effectiveStartDate as string | null ?? null,
          effectiveEndDate: (p as unknown as Record<string, unknown>).effectiveEndDate as string | null ?? null,
          updatedAt: (p as unknown as Record<string, unknown>).updatedAt as string | null ?? null,
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

  const filteredData = useMemo(() => {
    let result = data
    if (filterCode.trim()) {
      result = result.filter((item) => item.productCode.toLowerCase().includes(filterCode.toLowerCase()))
    }
    if (filterName.trim()) {
      result = result.filter((item) => item.productName.toLowerCase().includes(filterName.toLowerCase()))
    }
    if (filterSupplier !== 'ALL') {
      result = result.filter((item) => item.primarySupplier === filterSupplier)
    }
    return result
  }, [data, filterCode, filterName, filterSupplier])

  const handleReset = () => {
    setFilterCode('')
    setFilterName('')
    setFilterSupplier('ALL')
  }

  const handleAdd = () => {
    setEditingItem(null)
    setFormData({
      projectCode: '',
      productCode: '',
      productName: '',
      spec1: '',
      spec2: '',
      spec3: '',
      moq: 1,
      productType: '완제품',
      unit: 'EA',
      effectiveStartDate: new Date().toISOString().slice(0, 10),
      effectiveEndDate: '2099-12-31',
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
      projectCode: item.projectCode,
      productCode: item.productCode,
      productName: item.productName,
      spec1: item.spec1 ?? '',
      spec2: item.spec2 ?? '',
      spec3: item.spec3 ?? '',
      moq: item.moq,
      productType: item.productType,
      unit: item.unit,
      effectiveStartDate: item.effectiveStartDate ?? '',
      effectiveEndDate: item.effectiveEndDate ?? '',
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
      toast({ title: '삭제 완료' })
    } catch (error) {
      console.error('삭제 실패:', error)
      toast({ title: '삭제 실패', variant: 'destructive' })
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
      toast({ title: editingItem ? '수정 완료' : '등록 완료' })
    } catch (error) {
      console.error('저장 실패:', error)
      toast({ title: '저장 실패', description: error instanceof Error ? error.message : '', variant: 'destructive' })
    }
  }

  // 양식 다운로드
  const handleDownloadTemplate = useCallback(() => {
    const templateData = [
      ['프로젝트코드', '품번', '품명', '사양1', '사양2', '사양3', 'MOQ', '품목유형', '단위', '적용시작일', '적용완료일'],
      ['Y200', 'P001', '샘플제품', 'SMALL', null, null, 100, '완제품', 'EA', '2024-01-01', '2099-12-31'],
      ['Y200', 'P002', '다른제품', 'MEDIUM', 'TYPE-A', null, 50, '반제품', 'EA', '2024-01-01', '2099-12-31'],
    ]
    const ws = XLSX.utils.aoa_to_sheet(templateData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '제품')
    ws['!cols'] = [
      { wch: 15 }, // 프로젝트코드
      { wch: 15 }, // 품번
      { wch: 20 }, // 품명
      { wch: 12 }, // 사양1
      { wch: 12 }, // 사양2
      { wch: 12 }, // 사양3
      { wch: 8 },  // MOQ
      { wch: 10 }, // 품목유형
      { wch: 8 },  // 단위
      { wch: 12 }, // 적용시작일
      { wch: 12 }, // 적용완료일
    ]
    XLSX.writeFile(wb, '제품_양식.xlsx')
  }, [])

  // 엑셀 업로드
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const buffer = await file.arrayBuffer()
      const workbook = XLSX.read(buffer, { type: 'array', cellDates: true })
      const sheetName = workbook.SheetNames[0]
      if (!sheetName) throw new Error('시트를 찾을 수 없습니다')
      const sheet = workbook.Sheets[sheetName]
      if (!sheet) throw new Error('시트를 찾을 수 없습니다')
      const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: false, dateNF: 'yyyy-mm-dd' })

      const errors: string[] = []
      const parsedData: ProductRow[] = []
      const validProductTypes = PRODUCT_TYPE_OPTIONS
      const validUnits = UNIT_OPTIONS

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i]
        if (!row || row.length === 0) continue

        // 새로운 12개 컬럼 파싱: 프로젝트코드, 품번, 품명, 사양1, 사양2, 사양3, MOQ, 품목유형, 단위, 적용시작일, 적용완료일
        const projectCode = String(row[0] ?? '').trim()
        const productCode = String(row[1] ?? '').trim()
        const productName = String(row[2] ?? '').trim()
        const spec1 = row[3] != null ? String(row[3]).trim() : null
        const spec2 = row[4] != null ? String(row[4]).trim() : null
        const spec3 = row[5] != null ? String(row[5]).trim() : null
        const moq = parseInt(String(row[6] ?? '1'), 10)
        const productType = String(row[7] ?? '완제품').trim()
        const unit = String(row[8] ?? 'EA').trim().toUpperCase()
        // 날짜 필드는 parseExcelDate로 변환
        const effectiveStartDate = parseExcelDate(row[9])
        const effectiveEndDate = parseExcelDate(row[10])

        if (!projectCode) {
          errors.push(`행 ${i + 1}: 프로젝트코드 필수`)
          continue
        }
        if (!productCode) {
          errors.push(`행 ${i + 1}: 품번 필수`)
          continue
        }
        if (!productName) {
          errors.push(`행 ${i + 1}: 품명 필수`)
          continue
        }
        if (productType && !validProductTypes.includes(productType)) {
          errors.push(`행 ${i + 1}: 품목유형은 ${validProductTypes.join('/')} 중 하나`)
          continue
        }
        if (unit && !validUnits.includes(unit)) {
          errors.push(`행 ${i + 1}: 단위는 ${validUnits.join('/')} 중 하나`)
          continue
        }

        parsedData.push({
          id: crypto.randomUUID(),
          projectCode,
          productCode,
          productName,
          spec1: spec1 || null,
          spec2: spec2 || null,
          spec3: spec3 || null,
          moq: isNaN(moq) ? 1 : moq,
          productType: productType || '완제품',
          unit: unit || 'EA',
          effectiveStartDate: effectiveStartDate || null,
          effectiveEndDate: effectiveEndDate || null,
          updatedAt: null,
          // 기본값 (호환성 유지)
          vehicleModelId: '',
          primarySupplier: 'DOMESTIC',
          domesticRatio: 100,
          domesticLeadTime: 3,
          overseasLeadTime: 14,
          unitPrice: 0,
          currency: 'KRW',
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

  // 업로드 데이터 저장 (배치 처리)
  const handleUploadSave = async () => {
    console.log('=== 저장 시작 ===')
    console.log('uploadErrors:', uploadErrors)
    console.log('uploadData.length:', uploadData.length)

    if (uploadErrors.length > 0) {
      const msg = '오류가 있어 저장할 수 없습니다: ' + uploadErrors.join(', ')
      alert(msg)
      toast({ title: '오류가 있어 저장할 수 없습니다', variant: 'destructive' })
      return
    }

    if (uploadData.length === 0) {
      alert('저장할 데이터가 없습니다')
      toast({ title: '저장할 데이터가 없습니다', variant: 'destructive' })
      return
    }

    setUploading(true)
    try {
      // Product 엔티티 배열 생성
      console.log('Product 엔티티 생성 시작...')
      const products: Product[] = []
      for (const [i, row] of uploadData.entries()) {
        try {
          const product = Product.create({
            id: row.id,
            productCode: row.productCode,
            productName: row.productName,
            primarySupplier: SupplierType.fromString(row.primarySupplier),
            domesticRatio: row.domesticRatio,
            domesticLeadTime: row.domesticLeadTime,
            overseasLeadTime: row.overseasLeadTime,
            unitPrice: row.unitPrice ? Money.create(row.unitPrice, row.currency as 'KRW' | 'USD') : undefined,
            isActive: true,
            // 확장 필드 추가
            projectCode: row.projectCode || undefined,
            spec1: row.spec1 || undefined,
            spec2: row.spec2 || undefined,
            spec3: row.spec3 || undefined,
            moq: row.moq || undefined,
            productType: row.productType || undefined,
            unit: row.unit || undefined,
            effectiveStartDate: row.effectiveStartDate ? new Date(row.effectiveStartDate) : undefined,
            effectiveEndDate: row.effectiveEndDate ? new Date(row.effectiveEndDate) : undefined,
          })
          products.push(product)
        } catch (createErr) {
          const errMsg = `행 ${i + 1} (${row.productCode}) 생성 실패: ${createErr instanceof Error ? createErr.message : '알 수 없는 오류'}`
          console.error(errMsg, row)
          alert(errMsg)
          throw createErr
        }
      }
      console.log(`Product 엔티티 ${products.length}개 생성 완료`)

      // 배치 처리 (100개씩)
      const BATCH_SIZE = 100
      let savedCount = 0
      for (let i = 0; i < products.length; i += BATCH_SIZE) {
        const batch = products.slice(i, i + BATCH_SIZE)
        try {
          await productRepository.saveMany(batch)
          savedCount += batch.length
          console.log(`저장 진행: ${savedCount}/${products.length}`)
        } catch (saveErr) {
          const errMsg = `배치 ${Math.floor(i / BATCH_SIZE) + 1} 저장 실패: ${saveErr instanceof Error ? saveErr.message : '알 수 없는 오류'}`
          console.error(errMsg, saveErr)
          alert(errMsg)
          throw saveErr
        }
      }

      toast({ title: '저장 완료', description: `${savedCount}건 저장됨` })
      alert(`저장 완료: ${savedCount}건`)
      setUploadDialogOpen(false)
      setUploadData([])
      setUploadErrors([])
      await loadData()
    } catch (err) {
      console.error('저장 실패:', err)
      const errMsg = err instanceof Error ? err.message : '알 수 없는 오류'
      toast({ title: '저장 실패', description: errMsg, variant: 'destructive' })
    } finally {
      setUploading(false)
    }
  }

  // 공급처별 통계
  const supplierSummary = useMemo(() => ({
    total: data.length,
    domestic: data.filter((d) => d.primarySupplier === 'DOMESTIC').length,
    vietnam: data.filter((d) => d.primarySupplier === 'VIETNAM').length,
    both: data.filter((d) => d.primarySupplier === 'BOTH').length,
  }), [data])

  return (
    <div className="h-full flex flex-col gap-2">
      {/* 상단 영역: 조회조건 + 기능 */}
      <div className="flex gap-2">
        <ERPGroupBox title="조회조건" className="flex-1">
          <div className="grid grid-cols-4 gap-x-4 gap-y-2">
            <ERPFormField label="품번">
              <ERPInput value={filterCode} onChange={(e) => setFilterCode(e.target.value)} placeholder="품번" inputSize="md" />
            </ERPFormField>
            <ERPFormField label="품명">
              <ERPInput value={filterName} onChange={(e) => setFilterName(e.target.value)} placeholder="품명" inputSize="lg" />
            </ERPFormField>
            <ERPFormField label="공급처">
              <ERPSelect value={filterSupplier} onChange={(e) => setFilterSupplier(e.target.value)} inputSize="md">
                <option value="ALL">전체 ({supplierSummary.total})</option>
                <option value="DOMESTIC">{SUPPLIER_TYPE_LABELS.DOMESTIC} ({supplierSummary.domestic})</option>
                <option value="VIETNAM">{SUPPLIER_TYPE_LABELS.VIETNAM} ({supplierSummary.vietnam})</option>
                <option value="BOTH">{SUPPLIER_TYPE_LABELS.BOTH} ({supplierSummary.both})</option>
              </ERPSelect>
            </ERPFormField>
            <div className="flex items-end gap-2">
              <ERPButton variant="primary">
                <Search className="h-3 w-3 mr-1" />
                조회
              </ERPButton>
              <ERPButton onClick={handleReset}>초기화</ERPButton>
            </div>
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

      {/* 메인 테이블 */}
      <div className="flex-1 min-h-0">
        <ERPTable columns={columns} data={filteredData} title="제품 목록" pageSize={20} enableSelection />
      </div>

      {/* 개별 등록/수정 다이얼로그 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? '제품 수정' : '제품 추가'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-4 py-4">
            {/* 기본 정보 */}
            <div className="space-y-2">
              <Label>프로젝트코드 *</Label>
              <Input value={formData.projectCode} onChange={(e) => setFormData({ ...formData, projectCode: e.target.value })} placeholder="Y200" />
            </div>
            <div className="space-y-2">
              <Label>품번 *</Label>
              <Input value={formData.productCode} onChange={(e) => setFormData({ ...formData, productCode: e.target.value })} disabled={!!editingItem} />
            </div>
            <div className="space-y-2">
              <Label>품명 *</Label>
              <Input value={formData.productName} onChange={(e) => setFormData({ ...formData, productName: e.target.value })} />
            </div>

            {/* 사양 정보 */}
            <div className="space-y-2">
              <Label>사양1</Label>
              <Input value={formData.spec1} onChange={(e) => setFormData({ ...formData, spec1: e.target.value })} placeholder="사양1" />
            </div>
            <div className="space-y-2">
              <Label>사양2</Label>
              <Input value={formData.spec2} onChange={(e) => setFormData({ ...formData, spec2: e.target.value })} placeholder="사양2" />
            </div>
            <div className="space-y-2">
              <Label>사양3</Label>
              <Input value={formData.spec3} onChange={(e) => setFormData({ ...formData, spec3: e.target.value })} placeholder="사양3" />
            </div>

            {/* 수량/유형 정보 */}
            <div className="space-y-2">
              <Label>MOQ</Label>
              <Input type="number" min={1} value={formData.moq} onChange={(e) => setFormData({ ...formData, moq: parseInt(e.target.value) || 1 })} />
            </div>
            <div className="space-y-2">
              <Label>품목유형</Label>
              <Select value={formData.productType} onValueChange={(v) => setFormData({ ...formData, productType: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRODUCT_TYPE_OPTIONS.map((type) => (<SelectItem key={type} value={type}>{type}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>단위</Label>
              <Select value={formData.unit} onValueChange={(v) => setFormData({ ...formData, unit: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {UNIT_OPTIONS.map((u) => (<SelectItem key={u} value={u}>{u}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>

            {/* 적용 기간 */}
            <div className="space-y-2">
              <Label>적용시작일</Label>
              <Input type="date" value={formData.effectiveStartDate} onChange={(e) => setFormData({ ...formData, effectiveStartDate: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>적용완료일</Label>
              <Input type="date" value={formData.effectiveEndDate} onChange={(e) => setFormData({ ...formData, effectiveEndDate: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>차종</Label>
              <Select value={formData.vehicleModelId} onValueChange={(v) => setFormData({ ...formData, vehicleModelId: v })}>
                <SelectTrigger><SelectValue placeholder="선택..." /></SelectTrigger>
                <SelectContent>
                  {vehicleModels.map((vm) => (<SelectItem key={vm.value} value={vm.value}>{vm.label}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>

            {/* 공급 정보 */}
            <div className="space-y-2">
              <Label>공급처 유형</Label>
              <Select value={formData.primarySupplier} onValueChange={(v) => setFormData({ ...formData, primarySupplier: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="DOMESTIC">국내</SelectItem>
                  <SelectItem value="VIETNAM">베트남</SelectItem>
                  <SelectItem value="BOTH">이원화</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.primarySupplier === 'BOTH' && (
              <div className="space-y-2">
                <Label>국내 비율 (%)</Label>
                <Input type="number" min={0} max={100} value={formData.domesticRatio} onChange={(e) => setFormData({ ...formData, domesticRatio: parseInt(e.target.value) || 0 })} />
              </div>
            )}
            <div className="space-y-2">
              <Label>국내 거래처</Label>
              <Select value={formData.mainPartnerId} onValueChange={(v) => setFormData({ ...formData, mainPartnerId: v })}>
                <SelectTrigger><SelectValue placeholder="선택..." /></SelectTrigger>
                <SelectContent>{partners.map((p) => (<SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            {(formData.primarySupplier === 'BOTH' || formData.primarySupplier === 'VIETNAM') && (
              <div className="space-y-2">
                <Label>베트남 거래처</Label>
                <Select value={formData.subPartnerId} onValueChange={(v) => setFormData({ ...formData, subPartnerId: v })}>
                  <SelectTrigger><SelectValue placeholder="선택..." /></SelectTrigger>
                  <SelectContent>{partners.map((p) => (<SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>))}</SelectContent>
                </Select>
              </div>
            )}

            {/* 리드타임 및 단가 */}
            <div className="space-y-2">
              <Label>국내 리드타임 (일)</Label>
              <Input type="number" min={1} value={formData.domesticLeadTime} onChange={(e) => setFormData({ ...formData, domesticLeadTime: parseInt(e.target.value) || 1 })} />
            </div>
            <div className="space-y-2">
              <Label>해외 리드타임 (일)</Label>
              <Input type="number" min={1} value={formData.overseasLeadTime} onChange={(e) => setFormData({ ...formData, overseasLeadTime: parseInt(e.target.value) || 1 })} />
            </div>
            <div className="space-y-2">
              <Label>단가</Label>
              <Input type="number" min={0} value={formData.unitPrice} onChange={(e) => setFormData({ ...formData, unitPrice: parseInt(e.target.value) || 0 })} />
            </div>
            <div className="space-y-2">
              <Label>통화</Label>
              <Select value={formData.currency} onValueChange={(v) => setFormData({ ...formData, currency: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="KRW">KRW</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 col-span-2">
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
        <DialogContent className="max-w-4xl">
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
                  <th className="p-2 border">프로젝트코드</th>
                  <th className="p-2 border">품번</th>
                  <th className="p-2 border">품명</th>
                  <th className="p-2 border">사양1</th>
                  <th className="p-2 border">사양2</th>
                  <th className="p-2 border">사양3</th>
                  <th className="p-2 border">MOQ</th>
                  <th className="p-2 border">품목유형</th>
                  <th className="p-2 border">단위</th>
                  <th className="p-2 border">적용시작일</th>
                  <th className="p-2 border">적용완료일</th>
                </tr>
              </thead>
              <tbody>
                {uploadData.slice(0, 20).map((row, i) => (
                  <tr key={i}>
                    <td className="p-2 border font-mono">{row.projectCode}</td>
                    <td className="p-2 border font-mono">{row.productCode}</td>
                    <td className="p-2 border">{row.productName}</td>
                    <td className="p-2 border">{row.spec1 || '-'}</td>
                    <td className="p-2 border">{row.spec2 || '-'}</td>
                    <td className="p-2 border">{row.spec3 || '-'}</td>
                    <td className="p-2 border text-right">{formatNumber(row.moq)}</td>
                    <td className="p-2 border text-center">{row.productType}</td>
                    <td className="p-2 border text-center">{row.unit}</td>
                    <td className="p-2 border text-center">{formatDate(row.effectiveStartDate)}</td>
                    <td className="p-2 border text-center">{formatDate(row.effectiveEndDate)}</td>
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
