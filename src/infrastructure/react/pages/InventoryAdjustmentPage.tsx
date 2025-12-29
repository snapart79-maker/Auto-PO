/**
 * InventoryAdjustmentPage - 재고 조정 페이지 (ERP 스타일)
 * PRD 5.4 재고 조정
 * Phase 4: 일괄등록 기능 추가
 */

import { useMemo, useState, useCallback, useRef } from 'react'
import { format } from 'date-fns'
import * as XLSX from 'xlsx'
import { RefreshCcw, Download, Trash2, Search, RefreshCw, TrendingUp, TrendingDown, Upload } from 'lucide-react'
import { ERPTable } from '../components/ERPTable'
import {
  ERPGroupBox,
  ERPFormField,
  ERPDateInput,
  ERPButton,
} from '../components/ERPGroupBox'
import { ERPFunctionPanel } from '../components/ERPSummaryPanel'
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
import { Textarea } from '../components/ui/textarea'
import { useToast } from '../components/ui/toast'
import {
  useInventoryAdjustment,
  type InventoryAdjustmentItem,
  type InventoryAdjustmentInput,
} from '../hooks/useInventoryAdjustment'
import type { AdjustmentType, AdjustmentReason } from '@domain/entities/InventoryAdjustment'
import { supabase } from '@infrastructure/supabase/client'
import { ExcelParser } from '@infrastructure/excel/ExcelParser'
import { BulkUpload, type BulkUploadColumn, type ParseError as BulkParseError } from '../components/common/BulkUpload'
import type { InventoryAdjustmentRow } from '@infrastructure/excel/types'
import type { ColumnDef } from '@tanstack/react-table'

function formatNumber(value: number): string {
  return new Intl.NumberFormat('ko-KR').format(value)
}

const ADJUSTMENT_TYPE_OPTIONS: { value: AdjustmentType; label: string }[] = [
  { value: 'INCREASE', label: '증가 (+)' },
  { value: 'DECREASE', label: '감소 (-)' },
]

const REASON_OPTIONS: { value: AdjustmentReason; label: string }[] = [
  { value: 'PHYSICAL_COUNT', label: '실사' },
  { value: 'LOSS', label: '분실' },
  { value: 'DAMAGE', label: '파손' },
  { value: 'OTHER', label: '기타' },
]

interface ProductOption {
  id: string
  productCode: string
  productName: string
}

// 일괄업로드 타입 정의
interface BulkUploadData {
  productCode: string
  adjustmentDate: Date
  adjustmentType: 'INCREASE' | 'DECREASE'
  quantity: number
  reason: 'PHYSICAL_COUNT' | 'LOSS' | 'DAMAGE' | 'OTHER'
  remarks?: string
}

// 일괄업로드 컬럼 정의
const BULK_UPLOAD_COLUMNS: BulkUploadColumn<BulkUploadData>[] = [
  { key: 'productCode', header: '품번' },
  { key: 'adjustmentDate', header: '조정일', format: (v) => v instanceof Date ? format(v, 'yyyy-MM-dd') : String(v) },
  { key: 'adjustmentType', header: '조정유형', align: 'center', format: (v) => v === 'INCREASE' ? '증가' : '감소' },
  { key: 'quantity', header: '수량', align: 'right' },
  { key: 'reason', header: '사유', format: (v) => {
    const reasonLabels: Record<string, string> = { PHYSICAL_COUNT: '실사', LOSS: '분실', DAMAGE: '파손', OTHER: '기타' }
    return reasonLabels[String(v)] ?? String(v)
  }},
  { key: 'remarks', header: '비고' },
]

// 일괄업로드 템플릿 데이터
const BULK_UPLOAD_TEMPLATE = [
  ['품번', '조정일', '조정유형', '수량', '사유', '비고'],
  ['SAMPLE-001', '2024-01-15', '증가', 100, '실사', '재고 실사 후 추가'],
  ['SAMPLE-002', '2024-01-15', '감소', 50, '파손', '운반 중 파손'],
]

export function InventoryAdjustmentPage() {
  const { items, summary, loading, error, search, refresh, create, remove } = useInventoryAdjustment()
  const { toast } = useToast()

  // 조회조건 상태
  const [startDate, setStartDate] = useState(() => {
    const date = new Date()
    date.setMonth(date.getMonth() - 1)
    return format(date, 'yyyy-MM-dd')
  })
  const [endDate, setEndDate] = useState(() => format(new Date(), 'yyyy-MM-dd'))

  // 등록 다이얼로그 상태
  const [dialogOpen, setDialogOpen] = useState(false)
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false)
  const [products, setProducts] = useState<ProductOption[]>([])
  const [selectedProductId, setSelectedProductId] = useState<string>('')
  const [adjustmentDate, setAdjustmentDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'))
  const [adjustmentType, setAdjustmentType] = useState<AdjustmentType>('INCREASE')
  const [quantity, setQuantity] = useState<string>('')
  const [reason, setReason] = useState<AdjustmentReason>('PHYSICAL_COUNT')
  const [remarks, setRemarks] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)

  // 제품 목록 로드
  const loadProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('id, product_code, product_name')
      .eq('is_active', true)
      .order('product_code')

    if (data) {
      setProducts(
        (data as { id: string; product_code: string; product_name: string }[]).map((p) => ({
          id: p.id,
          productCode: p.product_code,
          productName: p.product_name,
        }))
      )
    }
  }

  const columns: ColumnDef<InventoryAdjustmentItem, unknown>[] = useMemo(
    () => [
      {
        accessorKey: 'adjustmentDate',
        header: '조정일',
        cell: ({ row }) => format(row.original.adjustmentDate, 'yyyy-MM-dd'),
        size: 100,
      },
      {
        accessorKey: 'productCode',
        header: '품번',
        cell: ({ row }) => (
          <span className="font-mono">{row.original.productCode}</span>
        ),
        size: 120,
      },
      {
        accessorKey: 'productName',
        header: '품명',
        size: 180,
      },
      {
        accessorKey: 'adjustmentType',
        header: '유형',
        cell: ({ row }) => (
          <span className={row.original.adjustmentType === 'INCREASE' ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
            {row.original.adjustmentType === 'INCREASE' ? '증가' : '감소'}
          </span>
        ),
        size: 60,
      },
      {
        accessorKey: 'quantity',
        header: '수량',
        cell: ({ row }) => {
          const isIncrease = row.original.adjustmentType === 'INCREASE'
          return (
            <span className={`text-right block font-medium ${isIncrease ? 'text-green-600' : 'text-red-600'}`}>
              {isIncrease ? '+' : '-'}{formatNumber(row.original.quantity)}
            </span>
          )
        },
        size: 80,
      },
      {
        accessorKey: 'reasonLabel',
        header: '사유',
        size: 80,
      },
      {
        accessorKey: 'remarks',
        header: '비고',
        cell: ({ row }) => row.original.remarks ?? '-',
        size: 150,
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
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    })
  }

  const handleReset = () => {
    const date = new Date()
    date.setMonth(date.getMonth() - 1)
    setStartDate(format(date, 'yyyy-MM-dd'))
    setEndDate(format(new Date(), 'yyyy-MM-dd'))
    search({})
  }

  const handleOpenDialog = async () => {
    await loadProducts()
    setSelectedProductId('')
    setAdjustmentDate(format(new Date(), 'yyyy-MM-dd'))
    setAdjustmentType('INCREASE')
    setQuantity('')
    setReason('PHYSICAL_COUNT')
    setRemarks('')
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!selectedProductId || !quantity) return

    setSubmitting(true)
    try {
      const input: InventoryAdjustmentInput = {
        adjustmentDate: new Date(adjustmentDate),
        productId: selectedProductId,
        adjustmentType,
        quantity: parseInt(quantity, 10),
        reason,
        remarks: remarks || undefined,
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
    const result = parser.parseInventoryAdjustmentData(rawData)

    const rows: BulkUploadData[] = result.rows.map((row: InventoryAdjustmentRow) => ({
      productCode: row.productCode,
      adjustmentDate: row.adjustmentDate,
      adjustmentType: row.adjustmentType,
      quantity: row.quantity,
      reason: row.reason,
      remarks: row.remarks,
    }))

    return { rows, errors: result.errors }
  }, [])

  // 일괄업로드 저장
  const handleBulkUploadSave = useCallback(async (data: BulkUploadData[]) => {
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

    // 존재하지 않는 품번 확인
    const missingCodes = productCodes.filter(code => !productMap.has(code))
    if (missingCodes.length > 0) {
      throw new Error(`존재하지 않는 품번: ${missingCodes.join(', ')}`)
    }

    // 순차적으로 저장 (useInventoryAdjustment의 create 사용)
    let successCount = 0
    const errors: string[] = []

    for (const row of data) {
      try {
        const productId = productMap.get(row.productCode)
        if (!productId) continue

        const input: InventoryAdjustmentInput = {
          adjustmentDate: row.adjustmentDate,
          productId,
          adjustmentType: row.adjustmentType,
          quantity: row.quantity,
          reason: row.reason,
          remarks: row.remarks,
        }
        await create(input)
        successCount++
      } catch (err) {
        errors.push(`${row.productCode}: ${err instanceof Error ? err.message : '저장 실패'}`)
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

  return (
    <div className="h-full flex flex-col gap-2">
      {/* 상단 영역: 조회조건 + 기능 */}
      <div className="flex gap-2">
        {/* 조회조건 */}
        <ERPGroupBox title="조회조건" className="flex-1">
          <div className="flex items-end gap-4">
            <ERPFormField label="기간">
              <div className="flex items-center gap-1">
                <ERPDateInput value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                <span className="text-xs">~</span>
                <ERPDateInput value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </ERPFormField>
            <ERPButton variant="primary" onClick={handleSearch} disabled={loading}>
              <Search className="h-3 w-3 mr-1" />
              조회
            </ERPButton>
            <ERPButton onClick={handleReset}>초기화</ERPButton>
          </div>
        </ERPGroupBox>

        {/* 기능 버튼 */}
        <ERPFunctionPanel
          title="기능"
          className="w-36"
          buttons={[
            { label: '재고 조정', icon: <RefreshCcw className="h-3 w-3" />, onClick: handleOpenDialog },
            { label: '엑셀업로드', icon: <Upload className="h-3 w-3" />, onClick: () => setBulkUploadOpen(true) },
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
            title="재고 조정 이력"
            pageSize={20}
            enableSelection
          />
        </div>

        {/* 사이드 요약 패널 */}
        <div className="w-64 flex flex-col gap-2">
          {/* 조정 요약 */}
          <div className="border border-[#999] bg-white rounded">
            <div className="bg-gradient-to-b from-[#5a7fb5] to-[#4a6fa5] text-white text-xs font-medium px-3 py-1.5">
              조정 요약
            </div>
            <div className="p-3 space-y-2">
              <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="text-xs">총 증가</span>
                </div>
                <span className="font-bold text-green-600 text-sm">
                  +{formatNumber(summary.totalIncrease)}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 bg-red-50 rounded">
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-red-500" />
                  <span className="text-xs">총 감소</span>
                </div>
                <span className="font-bold text-red-600 text-sm">
                  -{formatNumber(summary.totalDecrease)}
                </span>
              </div>
              <div className="border-t pt-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium">순 변동</span>
                  <span className={`font-bold text-sm ${summary.netAdjustment >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {summary.netAdjustment >= 0 ? '+' : ''}{formatNumber(summary.netAdjustment)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 사유별 통계 */}
          <div className="border border-[#999] bg-white rounded">
            <div className="bg-gradient-to-b from-[#5a7fb5] to-[#4a6fa5] text-white text-xs font-medium px-3 py-1.5">
              사유별 건수
            </div>
            <div className="p-3 space-y-1">
              {REASON_OPTIONS.map((opt) => {
                const count = items.filter((i) => i.reason === opt.value).length
                return (
                  <div key={opt.value} className="flex justify-between items-center p-1.5 bg-gray-50 rounded text-xs">
                    <span>{opt.label}</span>
                    <span className="font-medium">{count}건</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 재고 조정 등록 다이얼로그 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>재고 조정 등록</DialogTitle>
            <DialogDescription>
              재고 실사, 분실, 파손 등에 의한 재고 변동을 입력합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>조정일 *</Label>
              <Input
                type="date"
                value={adjustmentDate}
                onChange={(e) => setAdjustmentDate(e.target.value)}
              />
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>조정 유형 *</Label>
                <Select value={adjustmentType} onValueChange={(v) => setAdjustmentType(v as AdjustmentType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ADJUSTMENT_TYPE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>수량 *</Label>
                <Input
                  type="number"
                  min="1"
                  placeholder="조정 수량"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>조정 사유 *</Label>
              <Select value={reason} onValueChange={(v) => setReason(v as AdjustmentReason)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REASON_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>비고</Label>
              <Textarea
                placeholder="상세 메모 (선택)"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <ERPButton onClick={() => setDialogOpen(false)}>취소</ERPButton>
            <ERPButton
              variant="primary"
              onClick={handleSubmit}
              disabled={submitting || !selectedProductId || !quantity}
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
            <DialogTitle>재고 조정 일괄등록</DialogTitle>
            <DialogDescription>
              엑셀 파일을 업로드하여 재고 조정 내역을 일괄 등록합니다.
            </DialogDescription>
          </DialogHeader>
          <BulkUpload<BulkUploadData>
            title="재고 조정 일괄등록"
            columns={BULK_UPLOAD_COLUMNS}
            parseFile={handleParseFile}
            onSave={handleBulkUploadSave}
            onCancel={() => setBulkUploadOpen(false)}
            templateFileName="재고조정_일괄등록_템플릿.xlsx"
            templateData={BULK_UPLOAD_TEMPLATE}
            templateSheetName="재고조정"
            columnWidths={[{ wch: 15 }, { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 8 }, { wch: 30 }]}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default InventoryAdjustmentPage
