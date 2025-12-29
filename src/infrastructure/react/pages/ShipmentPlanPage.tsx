/**
 * ShipmentPlanPage - 출고 계획 등록 페이지 (ERP 스타일)
 * PRD 6.2 출고 계획 등록
 * Phase 4: 일괄등록 기능 추가
 */

import { useMemo, useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { PlusCircle, Upload, Download, Trash2, Search, RefreshCw } from 'lucide-react'
import { ERPTable } from '../components/ERPTable'
import {
  ERPGroupBox,
  ERPFormField,
  ERPDateInput,
  ERPSelect,
  ERPButton,
} from '../components/ERPGroupBox'
import { ERPSummaryPanel, ERPFunctionPanel } from '../components/ERPSummaryPanel'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { useToast } from '../components/ui/toast'
import {
  useShipmentPlan,
  type ShipmentPlanItem,
  type ShipmentPlanInput,
} from '../hooks/useShipmentPlan'
import type { PlanType } from '@domain/entities/ShipmentPlan'
import { supabase } from '@infrastructure/supabase/client'
import { ExcelParser } from '@infrastructure/excel/ExcelParser'
import { BulkUpload, type BulkUploadColumn, type ParseError as BulkParseError } from '../components/common/BulkUpload'
import type { ColumnDef } from '@tanstack/react-table'

function formatNumber(value: number): string {
  return new Intl.NumberFormat('ko-KR').format(value)
}

const PLAN_TYPE_LABELS: Record<PlanType, string> = {
  DAILY: '일자별',
  WEEKLY: '주간별',
  MONTHLY: '월간별',
  YEARLY: '연간별',
}

interface PartnerOption {
  id: string
  partnerCode: string
  partnerName: string
}

interface ProductOption {
  id: string
  productCode: string
  productName: string
}

// 일괄업로드 타입 정의
interface BulkUploadData {
  partnerCode: string
  productCode: string
  planDate: Date
  planType: PlanType
  plannedQuantity: number
  vehicleModelCode?: string
}

// 일괄업로드 컬럼 정의
const BULK_UPLOAD_COLUMNS: BulkUploadColumn<BulkUploadData>[] = [
  { key: 'partnerCode', header: '고객사코드' },
  { key: 'productCode', header: '품번' },
  { key: 'planDate', header: '납품일', format: (v) => v instanceof Date ? format(v, 'yyyy-MM-dd') : String(v) },
  { key: 'planType', header: '유형', align: 'center', format: (v) => {
    const labels: Record<string, string> = { DAILY: '일자별', WEEKLY: '주간별', MONTHLY: '월간별', YEARLY: '연간별' }
    return labels[String(v)] ?? String(v)
  }},
  { key: 'plannedQuantity', header: '수량', align: 'right' },
  { key: 'vehicleModelCode', header: '차종코드' },
]

// 일괄업로드 템플릿 데이터
const BULK_UPLOAD_TEMPLATE = [
  ['고객사코드', '품번', '납품일', '유형', '수량', '차종코드'],
  ['CUST-001', 'PROD-001', '2024-01-15', '일자별', 100, 'VM-001'],
  ['CUST-001', 'PROD-002', '2024-01-15', '주간별', 500, ''],
]

export function ShipmentPlanPage() {
  const { items, loading, error, search, refresh, create, remove, summary } = useShipmentPlan()
  const { toast } = useToast()

  // 조회조건 상태
  const [filterStartDate, setFilterStartDate] = useState<string>('')
  const [filterEndDate, setFilterEndDate] = useState<string>('')
  const [filterPartnerId, setFilterPartnerId] = useState<string>('')
  const [filterPlanType, setFilterPlanType] = useState<string>('ALL')

  // 등록 다이얼로그 상태
  const [dialogOpen, setDialogOpen] = useState(false)
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false)
  const [partners, setPartners] = useState<PartnerOption[]>([])
  const [products, setProducts] = useState<ProductOption[]>([])
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>('')
  const [selectedProductId, setSelectedProductId] = useState<string>('')
  const [planDate, setPlanDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'))
  const [planType, setPlanType] = useState<PlanType>('DAILY')
  const [plannedQuantity, setPlannedQuantity] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)

  // 거래처/제품 목록 로드
  const loadOptions = async () => {
    const { data: partnerData } = await supabase
      .from('partners')
      .select('id, partner_code, partner_name')
      .eq('is_active', true)
      .eq('partner_type', 'CUSTOMER')
      .order('partner_code')

    if (partnerData) {
      setPartners(
        (partnerData as { id: string; partner_code: string; partner_name: string }[]).map((p) => ({
          id: p.id,
          partnerCode: p.partner_code,
          partnerName: p.partner_name,
        }))
      )
    }

    const { data: productData } = await supabase
      .from('products')
      .select('id, product_code, product_name')
      .eq('is_active', true)
      .order('product_code')

    if (productData) {
      setProducts(
        (productData as { id: string; product_code: string; product_name: string }[]).map((p) => ({
          id: p.id,
          productCode: p.product_code,
          productName: p.product_name,
        }))
      )
    }
  }

  useEffect(() => {
    loadOptions()
  }, [])

  const columns: ColumnDef<ShipmentPlanItem, unknown>[] = useMemo(
    () => [
      {
        accessorKey: 'planDate',
        header: '납품일',
        cell: ({ row }) => format(row.original.planDate, 'yyyy-MM-dd'),
        size: 100,
      },
      {
        accessorKey: 'planType',
        header: '유형',
        cell: ({ row }) => PLAN_TYPE_LABELS[row.original.planType],
        size: 70,
      },
      {
        accessorKey: 'partnerName',
        header: '고객사',
        size: 120,
      },
      {
        accessorKey: 'productCode',
        header: '품번',
        cell: ({ row }) => <span className="font-mono">{row.original.productCode}</span>,
        size: 120,
      },
      {
        accessorKey: 'productName',
        header: '품명',
        size: 180,
      },
      {
        accessorKey: 'vehicleName',
        header: '차종',
        cell: ({ row }) => row.original.vehicleName ?? '-',
        size: 100,
      },
      {
        accessorKey: 'plannedQuantity',
        header: '수량',
        cell: ({ row }) => (
          <span className="text-right block font-medium">{formatNumber(row.original.plannedQuantity)}</span>
        ),
        size: 80,
      },
      {
        accessorKey: 'source',
        header: '등록방식',
        cell: ({ row }) => {
          const sourceLabels = { MANUAL: '수동', UPLOAD: '업로드', AUTO: '자동' }
          return sourceLabels[row.original.source] ?? row.original.source
        },
        size: 80,
      },
      {
        accessorKey: 'createdAt',
        header: '등록일시',
        cell: ({ row }) => format(row.original.createdAt, 'yyyy-MM-dd HH:mm'),
        size: 130,
      },
      {
        id: 'actions',
        header: '삭제',
        cell: ({ row }) => (
          <button
            onClick={() => handleDelete(row.original.id)}
            className="text-red-600 hover:text-red-800"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        ),
        size: 50,
      },
    ],
    []
  )

  const handleSearch = () => {
    search({
      startDate: filterStartDate ? new Date(filterStartDate) : undefined,
      endDate: filterEndDate ? new Date(filterEndDate) : undefined,
      partnerId: filterPartnerId || undefined,
      planType: filterPlanType === 'ALL' ? undefined : (filterPlanType as PlanType),
    })
  }

  const handleReset = () => {
    setFilterStartDate('')
    setFilterEndDate('')
    setFilterPartnerId('')
    setFilterPlanType('ALL')
    search({})
  }

  const handleOpenDialog = () => {
    setSelectedPartnerId('')
    setSelectedProductId('')
    setPlanDate(format(new Date(), 'yyyy-MM-dd'))
    setPlanType('DAILY')
    setPlannedQuantity('')
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!selectedPartnerId || !selectedProductId || !plannedQuantity) return

    setSubmitting(true)
    try {
      const input: ShipmentPlanInput = {
        planDate: new Date(planDate),
        planType,
        partnerId: selectedPartnerId,
        productId: selectedProductId,
        plannedQuantity: parseInt(plannedQuantity, 10),
      }
      await create(input)
      setDialogOpen(false)
    } catch (err) {
      console.error('등록 실패:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return
    try {
      await remove(id)
    } catch (err) {
      console.error('삭제 실패:', err)
    }
  }

  // 일괄업로드 파일 파싱
  const handleParseFile = useCallback(async (buffer: ArrayBuffer): Promise<{ rows: BulkUploadData[]; errors: BulkParseError[] }> => {
    const parser = new ExcelParser()
    const rawData = parser.parseFromBuffer(buffer)
    const result = parser.parseShipmentPlanData(rawData)

    const rows: BulkUploadData[] = result.rows.map((row) => ({
      partnerCode: row.partnerCode,
      productCode: row.productCode,
      planDate: row.transactionDate,
      planType: row.planType ?? 'DAILY',
      plannedQuantity: row.plannedQuantity,
      vehicleModelCode: row.vehicleModelCode,
    }))

    return { rows, errors: result.errors }
  }, [])

  // 일괄업로드 저장
  const handleBulkUploadSave = useCallback(async (data: BulkUploadData[]) => {
    // 고객사코드로 partner_id 조회
    const partnerCodes = [...new Set(data.map(d => d.partnerCode))]
    const { data: partnersData, error: partnersError } = await supabase
      .from('partners')
      .select('id, partner_code')
      .in('partner_code', partnerCodes)
      .eq('is_active', true)

    if (partnersError) {
      throw new Error('고객사 정보 조회에 실패했습니다.')
    }

    const partnerMap = new Map((partnersData ?? []).map(p => [p.partner_code, p.id]))

    // 품번으로 product_id 조회
    const productCodes = [...new Set(data.map(d => d.productCode))]
    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select('id, product_code')
      .in('product_code', productCodes)
      .eq('is_active', true)

    if (productsError) {
      throw new Error('품목 정보 조회에 실패했습니다.')
    }

    const productMap = new Map((productsData ?? []).map(p => [p.product_code, p.id]))

    // 존재하지 않는 코드 확인
    const missingPartners = partnerCodes.filter(code => !partnerMap.has(code))
    const missingProducts = productCodes.filter(code => !productMap.has(code))

    if (missingPartners.length > 0) {
      throw new Error(`존재하지 않는 고객사: ${missingPartners.join(', ')}`)
    }
    if (missingProducts.length > 0) {
      throw new Error(`존재하지 않는 품번: ${missingProducts.join(', ')}`)
    }

    // 순차적으로 저장
    let successCount = 0
    const errors: string[] = []

    for (const row of data) {
      try {
        const partnerId = partnerMap.get(row.partnerCode)
        const productId = productMap.get(row.productCode)
        if (!partnerId || !productId) continue

        const input: ShipmentPlanInput = {
          planDate: row.planDate,
          planType: row.planType,
          partnerId,
          productId,
          plannedQuantity: row.plannedQuantity,
        }
        await create(input)
        successCount++
      } catch (err) {
        errors.push(`${row.partnerCode}/${row.productCode}: ${err instanceof Error ? err.message : '저장 실패'}`)
      }
    }

    if (errors.length > 0) {
      toast({
        title: '일부 저장 실패',
        description: `${successCount}건 저장, ${errors.length}건 실패`,
        variant: 'destructive',
      })
    } else {
      toast({
        title: '일괄 등록 완료',
        description: `${successCount}건이 성공적으로 등록되었습니다.`,
      })
    }

    setBulkUploadOpen(false)
    refresh()
  }, [create, refresh, toast])

  // 고객사별 요약
  const partnerSummary = useMemo(() => {
    const map = new Map<string, { name: string; count: number; totalQty: number }>()
    for (const item of items) {
      const key = item.partnerId ?? 'unknown'
      const existing = map.get(key) ?? { name: item.partnerName, count: 0, totalQty: 0 }
      map.set(key, {
        name: item.partnerName,
        count: existing.count + 1,
        totalQty: existing.totalQty + item.plannedQuantity,
      })
    }
    return Array.from(map.entries())
      .sort((a, b) => b[1].totalQty - a[1].totalQty)
      .slice(0, 5)
      .map(([, { name, count, totalQty }]) => ({
        partner: name,
        count: `${count}건`,
        qty: formatNumber(totalQty),
      }))
  }, [items])

  return (
    <div className="h-full flex flex-col gap-2">
      {/* 상단 영역: 조회조건 + 기능 */}
      <div className="flex gap-2">
        {/* 조회조건 */}
        <ERPGroupBox title="조회조건" className="flex-1">
          <div className="grid grid-cols-5 gap-x-4 gap-y-2">
            <ERPFormField label="시작일">
              <ERPDateInput value={filterStartDate} onChange={(e) => setFilterStartDate(e.target.value)} />
            </ERPFormField>
            <ERPFormField label="종료일">
              <ERPDateInput value={filterEndDate} onChange={(e) => setFilterEndDate(e.target.value)} />
            </ERPFormField>
            <ERPFormField label="고객사">
              <ERPSelect value={filterPartnerId} onChange={(e) => setFilterPartnerId(e.target.value)} inputSize="lg">
                <option value="">전체</option>
                {partners.map((p) => (
                  <option key={p.id} value={p.id}>{p.partnerName}</option>
                ))}
              </ERPSelect>
            </ERPFormField>
            <ERPFormField label="유형">
              <ERPSelect value={filterPlanType} onChange={(e) => setFilterPlanType(e.target.value)} inputSize="md">
                <option value="ALL">전체</option>
                <option value="DAILY">일자별</option>
                <option value="WEEKLY">주간별</option>
                <option value="MONTHLY">월간별</option>
              </ERPSelect>
            </ERPFormField>
            <div className="flex items-end gap-2">
              <ERPButton variant="primary" onClick={handleSearch} disabled={loading}>
                <Search className="h-3 w-3 mr-1" />
                조회
              </ERPButton>
              <ERPButton onClick={handleReset}>초기화</ERPButton>
            </div>
          </div>
        </ERPGroupBox>

        {/* 기능 버튼 */}
        <ERPFunctionPanel
          title="기능"
          className="w-36"
          buttons={[
            { label: '개별등록', icon: <PlusCircle className="h-3 w-3" />, onClick: handleOpenDialog },
            { label: '엑셀업로드', icon: <Upload className="h-3 w-3" />, onClick: () => setBulkUploadOpen(true) },
            { label: '엑셀다운로드', icon: <Download className="h-3 w-3" />, disabled: true },
            { label: '새로고침', icon: <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />, onClick: refresh },
          ]}
        />
      </div>

      {/* 에러 표시 */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded text-xs">
          {error}
        </div>
      )}

      {/* 메인 영역: 테이블 + 사이드 요약 */}
      <div className="flex-1 flex gap-2 min-h-0">
        {/* 메인 테이블 */}
        <div className="flex-1 min-w-0">
          <ERPTable
            columns={columns}
            data={items}
            title="출고 계획 목록"
            pageSize={20}
            enableSelection
          />
        </div>

        {/* 사이드 요약 패널 */}
        <div className="w-64 flex flex-col gap-2">
          {/* 요약 통계 */}
          <div className="border border-[#999] bg-white rounded">
            <div className="bg-gradient-to-b from-[#5a7fb5] to-[#4a6fa5] text-white text-xs font-medium px-3 py-1.5">
              요약 통계
            </div>
            <div className="p-3 space-y-2">
              <div className="flex justify-between items-center p-1.5 bg-gray-50 rounded text-xs">
                <span>총 계획 수</span>
                <span className="font-bold">{summary.totalPlans}건</span>
              </div>
              <div className="flex justify-between items-center p-1.5 bg-gray-50 rounded text-xs">
                <span>총 수량</span>
                <span className="font-bold">{formatNumber(summary.totalQuantity)}</span>
              </div>
              <div className="border-t pt-2 space-y-1">
                {summary.byPlanType.map(({ planType: pt, count, quantity }) => (
                  <div key={pt} className="flex justify-between items-center text-xs">
                    <span>{PLAN_TYPE_LABELS[pt]}</span>
                    <span>{count}건 / {formatNumber(quantity)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 고객사별 요약 */}
          <ERPSummaryPanel
            title="고객사별 요약 (Top 5)"
            columns={[
              { key: 'partner', header: '고객사', align: 'left' },
              { key: 'count', header: '건수', align: 'center' },
              { key: 'qty', header: '수량', align: 'right' },
            ]}
            data={partnerSummary}
          />
        </div>
      </div>

      {/* 개별 등록 다이얼로그 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>출고 계획 등록</DialogTitle>
            <DialogDescription>
              고객사에 납품할 출고 계획을 입력합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>납품일 *</Label>
                <Input
                  type="date"
                  value={planDate}
                  onChange={(e) => setPlanDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>계획 유형 *</Label>
                <Select value={planType} onValueChange={(v) => setPlanType(v as PlanType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DAILY">일자별</SelectItem>
                    <SelectItem value="WEEKLY">주간별</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>고객사 *</Label>
              <Select value={selectedPartnerId} onValueChange={setSelectedPartnerId}>
                <SelectTrigger>
                  <SelectValue placeholder="고객사 선택" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {partners.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.partnerCode} - {p.partnerName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>품목 *</Label>
              <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                <SelectTrigger>
                  <SelectValue placeholder="품목 선택" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.productCode} - {p.productName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>수량 *</Label>
              <Input
                type="number"
                placeholder="납품 수량"
                value={plannedQuantity}
                onChange={(e) => setPlannedQuantity(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <ERPButton onClick={() => setDialogOpen(false)}>취소</ERPButton>
            <ERPButton
              variant="primary"
              onClick={handleSubmit}
              disabled={submitting || !selectedPartnerId || !selectedProductId || !plannedQuantity}
            >
              {submitting ? '등록 중...' : '등록'}
            </ERPButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 일괄업로드 다이얼로그 */}
      <Dialog open={bulkUploadOpen} onOpenChange={setBulkUploadOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>출고 계획 일괄등록</DialogTitle>
            <DialogDescription>
              엑셀 파일을 업로드하여 출고 계획을 일괄 등록합니다.
            </DialogDescription>
          </DialogHeader>
          <BulkUpload<BulkUploadData>
            title="출고 계획 일괄등록"
            columns={BULK_UPLOAD_COLUMNS}
            parseFile={handleParseFile}
            onSave={handleBulkUploadSave}
            onCancel={() => setBulkUploadOpen(false)}
            templateFileName="출고계획_일괄등록_템플릿.xlsx"
            templateData={BULK_UPLOAD_TEMPLATE}
            templateSheetName="출고계획"
            columnWidths={[{ wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 12 }]}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ShipmentPlanPage
