/**
 * InitialInventoryPage - 초기 재고 등록 페이지 (ERP 스타일)
 * PRD 5.3 초기 재고 등록
 */

import { useMemo, useState, useCallback, useRef } from 'react'
import { format } from 'date-fns'
import { PlusCircle, Upload, Download, Trash2, Search, RefreshCw } from 'lucide-react'
import * as XLSX from 'xlsx'
import { ERPTable } from '../components/ERPTable'
import {
  ERPGroupBox,
  ERPFormField,
  ERPDateInput,
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
import { Textarea } from '../components/ui/textarea'
import { useToast } from '../components/ui/toast'
import {
  useInitialInventory,
  type InitialInventoryItem,
  type InitialInventoryInput,
} from '../hooks/useInitialInventory'
import { ExcelParser } from '@infrastructure/excel/ExcelParser'
import type { InitialInventoryRow, ParseError } from '@infrastructure/excel/types'
import { supabase } from '@infrastructure/supabase/client'
import type { ColumnDef } from '@tanstack/react-table'

function formatNumber(value: number): string {
  return new Intl.NumberFormat('ko-KR').format(value)
}

interface ProductOption {
  id: string
  productCode: string
  productName: string
}

export function InitialInventoryPage() {
  const { items, loading, error, search, refresh, create, remove } = useInitialInventory()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 조회조건 상태
  const [filterDate, setFilterDate] = useState<string>('')

  // 등록 다이얼로그 상태
  const [dialogOpen, setDialogOpen] = useState(false)
  const [products, setProducts] = useState<ProductOption[]>([])
  const [selectedProductId, setSelectedProductId] = useState<string>('')
  const [baseDate, setBaseDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'))
  const [quantity, setQuantity] = useState<string>('')
  const [remarks, setRemarks] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)

  // 업로드 상태
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [uploadData, setUploadData] = useState<InitialInventoryRow[]>([])
  const [uploadErrors, setUploadErrors] = useState<ParseError[]>([])
  const [uploading, setUploading] = useState(false)

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

  const columns: ColumnDef<InitialInventoryItem, unknown>[] = useMemo(
    () => [
      {
        accessorKey: 'baseDate',
        header: '기준일',
        cell: ({ row }) => format(row.original.baseDate, 'yyyy-MM-dd'),
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
        accessorKey: 'quantity',
        header: '수량',
        cell: ({ row }) => (
          <span className="text-right block font-medium">{formatNumber(row.original.quantity)}</span>
        ),
        size: 100,
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
    search({ baseDate: filterDate ? new Date(filterDate) : undefined })
  }

  const handleReset = () => {
    setFilterDate('')
    search({})
  }

  const handleOpenDialog = async () => {
    await loadProducts()
    setSelectedProductId('')
    setBaseDate(format(new Date(), 'yyyy-MM-dd'))
    setQuantity('')
    setRemarks('')
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!selectedProductId || !quantity) return

    setSubmitting(true)
    try {
      const input: InitialInventoryInput = {
        productId: selectedProductId,
        baseDate: new Date(baseDate),
        quantity: parseInt(quantity, 10),
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

  // Excel 파일 업로드 처리
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const buffer = await file.arrayBuffer()
      const parser = new ExcelParser()
      const sheetData = parser.parseFromBuffer(buffer)
      const result = parser.parseInitialInventoryData(sheetData)

      setUploadData(result.rows)
      setUploadErrors(result.errors)

      if (result.rows.length === 0 && result.errors.length === 0) {
        toast({
          title: '데이터 없음',
          description: '파일에 유효한 데이터가 없습니다.',
          variant: 'destructive',
        })
        return
      }

      setUploadDialogOpen(true)
    } catch (err) {
      toast({
        title: '파일 처리 실패',
        description: err instanceof Error ? err.message : '알 수 없는 오류',
        variant: 'destructive',
      })
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }, [toast])

  // 업로드 데이터 저장
  const handleUploadSave = useCallback(async () => {
    if (uploadErrors.length > 0) {
      toast({
        title: '저장 불가',
        description: '오류가 있는 데이터는 저장할 수 없습니다.',
        variant: 'destructive',
      })
      return
    }

    setUploading(true)
    try {
      const productMap = new Map<string, string>()
      const uniqueCodes = [...new Set(uploadData.map((r) => r.productCode))]

      for (const code of uniqueCodes) {
        const result = await supabase
          .from('products')
          .select('id')
          .eq('product_code', code)
          .single()

        const product = result.data as { id: string } | null
        if (product?.id) {
          productMap.set(code, product.id)
        }
      }

      const missingCodes = uniqueCodes.filter((c) => !productMap.has(c))
      if (missingCodes.length > 0) {
        toast({
          title: '품번 오류',
          description: `존재하지 않는 품번: ${missingCodes.join(', ')}`,
          variant: 'destructive',
        })
        return
      }

      let savedCount = 0
      for (const row of uploadData) {
        const productId = productMap.get(row.productCode)
        if (productId) {
          await create({
            productId,
            baseDate: row.baseDate,
            quantity: row.quantity,
            remarks: row.remarks,
          })
          savedCount++
        }
      }

      toast({
        title: '저장 완료',
        description: `${savedCount}건의 초기 재고가 저장되었습니다.`,
      })

      setUploadDialogOpen(false)
      setUploadData([])
      setUploadErrors([])
    } catch (err) {
      toast({
        title: '저장 실패',
        description: err instanceof Error ? err.message : '알 수 없는 오류',
        variant: 'destructive',
      })
    } finally {
      setUploading(false)
    }
  }, [uploadData, uploadErrors, create, toast])

  // Excel 템플릿 다운로드
  const handleDownloadTemplate = useCallback(() => {
    const templateData = [
      ['품번', '수량', '기준일', '비고'],
      ['SAMPLE-001', 100, '2025-01-01', '예시 데이터'],
    ]

    const ws = XLSX.utils.aoa_to_sheet(templateData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '초기재고')
    ws['!cols'] = [{ wch: 20 }, { wch: 10 }, { wch: 12 }, { wch: 30 }]
    XLSX.writeFile(wb, '초기재고_템플릿.xlsx')
  }, [])

  // 현재 데이터 Excel 다운로드
  const handleDownloadData = useCallback(() => {
    if (items.length === 0) {
      toast({
        title: '다운로드 불가',
        description: '다운로드할 데이터가 없습니다.',
        variant: 'destructive',
      })
      return
    }

    const exportData = items.map((item) => ({
      품번: item.productCode,
      품명: item.productName,
      수량: item.quantity,
      기준일: format(item.baseDate, 'yyyy-MM-dd'),
      비고: item.remarks ?? '',
      등록일시: format(item.createdAt, 'yyyy-MM-dd HH:mm'),
    }))

    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '초기재고')
    XLSX.writeFile(wb, `초기재고_${format(new Date(), 'yyyyMMdd')}.xlsx`)
  }, [items, toast])

  // 기준일별 요약
  const dateSummary = useMemo(() => {
    const map = new Map<string, { count: number; totalQty: number }>()
    for (const item of items) {
      const dateKey = format(item.baseDate, 'yyyy-MM-dd')
      const existing = map.get(dateKey) ?? { count: 0, totalQty: 0 }
      map.set(dateKey, {
        count: existing.count + 1,
        totalQty: existing.totalQty + item.quantity,
      })
    }
    return Array.from(map.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .slice(0, 5)
      .map(([date, { count, totalQty }]) => ({
        date,
        count: `${count}개 품목`,
        qty: formatNumber(totalQty),
      }))
  }, [items])

  return (
    <div className="h-full flex flex-col gap-2">
      {/* 상단 영역: 조회조건 + 기능 */}
      <div className="flex gap-2">
        {/* 조회조건 */}
        <ERPGroupBox title="조회조건" className="flex-1">
          <div className="flex items-end gap-4">
            <ERPFormField label="기준일">
              <ERPDateInput
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
              />
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
            { label: '개별등록', icon: <PlusCircle className="h-3 w-3" />, onClick: handleOpenDialog },
            { label: '엑셀업로드', icon: <Upload className="h-3 w-3" />, onClick: () => fileInputRef.current?.click(), disabled: uploading },
            { label: '엑셀다운로드', icon: <Download className="h-3 w-3" />, onClick: handleDownloadData },
            { label: '템플릿', icon: <Download className="h-3 w-3" />, onClick: handleDownloadTemplate },
            { label: '새로고침', icon: <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />, onClick: refresh },
          ]}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileUpload}
          className="hidden"
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
            title="초기 재고 목록"
            pageSize={20}
            enableSelection
          />
        </div>

        {/* 사이드 요약 패널 */}
        <div className="w-64">
          <ERPSummaryPanel
            title="기준일별 요약"
            columns={[
              { key: 'date', header: '기준일', align: 'left' },
              { key: 'count', header: '품목', align: 'center' },
              { key: 'qty', header: '총수량', align: 'right' },
            ]}
            data={dateSummary}
          />
        </div>
      </div>

      {/* 개별 등록 다이얼로그 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>초기 재고 등록</DialogTitle>
            <DialogDescription>
              품목의 초기 재고를 입력합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>기준일 *</Label>
              <Input
                type="date"
                value={baseDate}
                onChange={(e) => setBaseDate(e.target.value)}
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
            <div className="space-y-2">
              <Label>수량 *</Label>
              <Input
                type="number"
                placeholder="초기 재고 수량"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>비고</Label>
              <Textarea
                placeholder="메모 (선택)"
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

      {/* 업로드 확인 다이얼로그 */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>업로드 데이터 확인</DialogTitle>
            <DialogDescription>
              {uploadData.length}건의 데이터가 파싱되었습니다.
              {uploadErrors.length > 0 && (
                <span className="text-red-600"> ({uploadErrors.length}건의 오류)</span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-80 overflow-auto">
            {uploadErrors.length > 0 && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
                <p className="font-medium text-red-700 mb-2">오류 목록:</p>
                <ul className="text-sm space-y-1">
                  {uploadErrors.map((err, i) => (
                    <li key={i} className="text-red-600">행 {err.row}: {err.message}</li>
                  ))}
                </ul>
              </div>
            )}

            <table className="w-full text-xs border-collapse">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 border text-left">행</th>
                  <th className="p-2 border text-left">품번</th>
                  <th className="p-2 border text-right">수량</th>
                  <th className="p-2 border text-left">기준일</th>
                  <th className="p-2 border text-left">비고</th>
                </tr>
              </thead>
              <tbody>
                {uploadData.slice(0, 20).map((row) => (
                  <tr key={row.rowNumber} className="border-b">
                    <td className="p-2 border">{row.rowNumber}</td>
                    <td className="p-2 border font-mono">{row.productCode}</td>
                    <td className="p-2 border text-right">{formatNumber(row.quantity)}</td>
                    <td className="p-2 border">{format(row.baseDate, 'yyyy-MM-dd')}</td>
                    <td className="p-2 border">{row.remarks ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <DialogFooter>
            <ERPButton onClick={() => { setUploadDialogOpen(false); setUploadData([]); setUploadErrors([]) }}>
              취소
            </ERPButton>
            <ERPButton
              variant="primary"
              onClick={handleUploadSave}
              disabled={uploading || uploadErrors.length > 0}
            >
              {uploading ? '저장 중...' : '저장'}
            </ERPButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default InitialInventoryPage
