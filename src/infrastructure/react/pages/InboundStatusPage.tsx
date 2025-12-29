/**
 * InboundStatusPage - 입고 현황 페이지 (ERP 스타일)
 * PRD 4.1 입고 현황
 */

import { useMemo, useState, useCallback, useRef } from 'react'
import { format } from 'date-fns'
import * as XLSX from 'xlsx'
import { Plus, Upload, Download, Search, RefreshCw } from 'lucide-react'
import { ERPTable } from '../components/ERPTable'
import {
  ERPGroupBox,
  ERPFormField,
  ERPInput,
  ERPDateInput,
  ERPButton,
} from '../components/ERPGroupBox'
import { ERPSummaryPanel, ERPFunctionPanel } from '../components/ERPSummaryPanel'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { useToast } from '../components/ui/toast'
import { useTransactions } from '../hooks/useTransactions'
import { supabase } from '../../supabase/client'
import type { TransactionWithDetails } from '@application/dtos/TransactionWithDetails'
import type { ColumnDef } from '@tanstack/react-table'

function formatNumber(value: number | null): string {
  if (value === null) return '-'
  return new Intl.NumberFormat('ko-KR').format(value)
}

// 입고 데이터 Row 인터페이스
interface InboundRow {
  id: string
  transactionDate: string        // 입고일
  partnerCode: string           // 거래처코드
  partnerName: string           // 공급사
  productCode: string           // 고객품번
  productName: string           // 품명
  quantity: number              // 수량
  unitPrice: number             // 적용단가
  supplyAmount: number          // 공급가액
  currency: string              // 화폐단위
  vatRate: number               // 부가가치세(%)
  krwAmount: number             // 금액(원화)
  taxAmount: number             // 세금
  totalAmount: number           // 총금액
  warehouseCode: string         // 창고코드
  warehouseName: string         // 창고명
  closingKey: string            // 수불마감KEY
  registeredAt: string          // 등록일시
  registeredBy: string          // 등록자
  modifiedAt: string            // 수정일시
  modifiedBy: string            // 수정자
  returnNumber: string          // 반품번호
  transactionDetail: string     // 입출상세
}

export function InboundStatusPage() {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 조회 조건 상태
  const [startDate, setStartDate] = useState(() => {
    const date = new Date()
    date.setMonth(date.getMonth() - 1)
    return format(date, 'yyyy-MM-dd')
  })
  const [endDate, setEndDate] = useState(() => format(new Date(), 'yyyy-MM-dd'))
  const [productCode, setProductCode] = useState('')
  const [productName, setProductName] = useState('')
  const [partnerCode, setPartnerCode] = useState('')

  // 다이얼로그 상태
  const [dialogOpen, setDialogOpen] = useState(false)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [uploadData, setUploadData] = useState<InboundRow[]>([])
  const [uploadErrors, setUploadErrors] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)

  // 개별등록 폼 데이터
  const [formData, setFormData] = useState({
    transactionDate: format(new Date(), 'yyyy-MM-dd'),
    partnerCode: '',
    partnerName: '',
    productCode: '',
    productName: '',
    quantity: 0,
    unitPrice: 0,
    supplyAmount: 0,
    currency: 'KRW',
    vatRate: 10,
    krwAmount: 0,
    taxAmount: 0,
    totalAmount: 0,
    warehouseCode: '',
    warehouseName: '',
    closingKey: '',
    registeredBy: '',
    returnNumber: '',
    transactionDetail: '',
  })

  const { transactions, summary, loading, error, search, refresh } = useTransactions({
    transactionType: 'IN',
    autoLoad: true,
  })

  const columns: ColumnDef<TransactionWithDetails, unknown>[] = useMemo(
    () => [
      {
        accessorKey: 'transactionDate',
        header: '입고일',
        cell: ({ row }) => format(row.original.transactionDate, 'yyyy-MM-dd'),
        size: 100,
      },
      {
        accessorKey: 'partnerCode',
        header: '거래처코드',
        cell: ({ row }) => row.original.partnerCode ?? '-',
        size: 100,
      },
      {
        accessorKey: 'partnerName',
        header: '공급사',
        cell: ({ row }) => row.original.partnerName ?? '-',
        size: 120,
      },
      {
        accessorKey: 'productCode',
        header: '고객품번',
        cell: ({ row }) => row.original.productCode ?? '-',
        size: 120,
      },
      {
        accessorKey: 'productName',
        header: '품명',
        cell: ({ row }) => row.original.productName ?? '-',
        size: 180,
      },
      {
        accessorKey: 'quantity',
        header: '수량',
        cell: ({ row }) => (
          <span className="text-right block">{formatNumber(row.original.quantity)}</span>
        ),
        size: 80,
      },
      {
        accessorKey: 'unitPrice',
        header: '적용단가',
        cell: ({ row }) => (
          <span className="text-right block">{formatNumber(row.original.unitPrice)}</span>
        ),
        size: 100,
      },
      {
        accessorKey: 'supplyAmount',
        header: '공급가액',
        cell: ({ row }) => (
          <span className="text-right block">{formatNumber(row.original.supplyAmount)}</span>
        ),
        size: 120,
      },
      {
        accessorKey: 'currency',
        header: '화폐단위',
        cell: ({ row }) => row.original.currency,
        size: 80,
      },
      {
        accessorKey: 'vatRate',
        header: '부가가치세(%)',
        cell: ({ row }) => (
          <span className="text-right block">
            {row.original.vatRate !== null ? `${row.original.vatRate}%` : '-'}
          </span>
        ),
        size: 100,
      },
      {
        accessorKey: 'krwAmount',
        header: '금액(원화)',
        cell: ({ row }) => (
          <span className="text-right block">{formatNumber(row.original.krwAmount)}</span>
        ),
        size: 120,
      },
      {
        accessorKey: 'taxAmount',
        header: '세금',
        cell: ({ row }) => (
          <span className="text-right block">{formatNumber(row.original.taxAmount)}</span>
        ),
        size: 100,
      },
      {
        accessorKey: 'totalAmount',
        header: '총금액',
        cell: ({ row }) => (
          <span className="text-right block">{formatNumber(row.original.totalAmount)}</span>
        ),
        size: 120,
      },
      {
        accessorKey: 'warehouseCode',
        header: '창고코드',
        cell: ({ row }) => row.original.warehouseCode ?? '-',
        size: 80,
      },
      {
        accessorKey: 'warehouseName',
        header: '창고명',
        cell: ({ row }) => row.original.warehouseName ?? '-',
        size: 100,
      },
      {
        accessorKey: 'closingKey',
        header: '수불마감KEY',
        cell: ({ row }) => row.original.closingKey ?? '-',
        size: 120,
      },
      {
        accessorKey: 'registeredAt',
        header: '등록일시',
        cell: ({ row }) =>
          row.original.registeredAt
            ? format(row.original.registeredAt, 'yyyy-MM-dd HH:mm')
            : '-',
        size: 130,
      },
      {
        accessorKey: 'registeredBy',
        header: '등록자',
        cell: ({ row }) => row.original.registeredBy ?? '-',
        size: 80,
      },
      {
        accessorKey: 'modifiedAt',
        header: '수정일시',
        cell: ({ row }) =>
          row.original.modifiedAt
            ? format(row.original.modifiedAt, 'yyyy-MM-dd HH:mm')
            : '-',
        size: 130,
      },
      {
        accessorKey: 'modifiedBy',
        header: '수정자',
        cell: ({ row }) => row.original.modifiedBy ?? '-',
        size: 80,
      },
      {
        accessorKey: 'returnNumber',
        header: '반품번호',
        cell: ({ row }) => row.original.returnNumber ?? '-',
        size: 100,
      },
      {
        accessorKey: 'transactionDetail',
        header: '입출상세',
        cell: ({ row }) => row.original.transactionDetail ?? '-',
        size: 120,
      },
    ],
    []
  )

  const handleSearch = () => {
    search({
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      productCodes: productCode ? [productCode] : undefined,
      productName: productName || undefined,
      partnerCodes: partnerCode ? [partnerCode] : undefined,
    })
  }

  const handleReset = () => {
    const date = new Date()
    date.setMonth(date.getMonth() - 1)
    setStartDate(format(date, 'yyyy-MM-dd'))
    setEndDate(format(new Date(), 'yyyy-MM-dd'))
    setProductCode('')
    setProductName('')
    setPartnerCode('')
  }

  // 양식 다운로드 (22개 컬럼)
  const handleDownloadTemplate = useCallback(() => {
    const templateData = [
      [
        '입고일', '거래처코드', '공급사', '고객품번', '품명', '수량', '적용단가', '공급가액',
        '화폐단위', '부가가치세(%)', '금액(원화)', '세금', '총금액', '창고코드', '창고명',
        '수불마감KEY', '등록일시', '등록자', '수정일시', '수정자', '반품번호', '입출상세'
      ],
      [
        '2024-01-15', 'S001', '샘플공급사', 'P001', '샘플제품', 100, 1000, 100000,
        'KRW', 10, 100000, 10000, 110000, 'WH01', '본사창고',
        'CL2024011501', '2024-01-15 09:00', 'admin', '', '', '', '정상입고'
      ],
    ]
    const ws = XLSX.utils.aoa_to_sheet(templateData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '입고현황')
    ws['!cols'] = [
      { wch: 12 }, // 입고일
      { wch: 12 }, // 거래처코드
      { wch: 15 }, // 공급사
      { wch: 15 }, // 고객품번
      { wch: 20 }, // 품명
      { wch: 10 }, // 수량
      { wch: 12 }, // 적용단가
      { wch: 12 }, // 공급가액
      { wch: 10 }, // 화폐단위
      { wch: 12 }, // 부가가치세(%)
      { wch: 12 }, // 금액(원화)
      { wch: 10 }, // 세금
      { wch: 12 }, // 총금액
      { wch: 10 }, // 창고코드
      { wch: 12 }, // 창고명
      { wch: 15 }, // 수불마감KEY
      { wch: 18 }, // 등록일시
      { wch: 10 }, // 등록자
      { wch: 18 }, // 수정일시
      { wch: 10 }, // 수정자
      { wch: 12 }, // 반품번호
      { wch: 15 }, // 입출상세
    ]
    XLSX.writeFile(wb, '입고현황_양식.xlsx')
    toast({ title: '양식 다운로드 완료' })
  }, [toast])

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
      const parsedData: InboundRow[] = []

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i]
        if (!row || row.length === 0) continue

        // 22개 컬럼 파싱
        const transactionDate = String(row[0] ?? '').trim()   // 1. 입고일
        const partnerCodeVal = String(row[1] ?? '').trim()    // 2. 거래처코드
        const partnerName = String(row[2] ?? '').trim()       // 3. 공급사
        const productCodeVal = String(row[3] ?? '').trim()    // 4. 고객품번
        const productName = String(row[4] ?? '').trim()       // 5. 품명
        const quantity = parseFloat(String(row[5] ?? '0'))    // 6. 수량
        const unitPrice = parseFloat(String(row[6] ?? '0'))   // 7. 적용단가
        const supplyAmount = parseFloat(String(row[7] ?? '0')) // 8. 공급가액
        const currency = String(row[8] ?? 'KRW').trim().toUpperCase() // 9. 화폐단위
        const vatRate = parseFloat(String(row[9] ?? '10'))    // 10. 부가가치세(%)
        const krwAmount = parseFloat(String(row[10] ?? '0'))  // 11. 금액(원화)
        const taxAmount = parseFloat(String(row[11] ?? '0'))  // 12. 세금
        const totalAmount = parseFloat(String(row[12] ?? '0')) // 13. 총금액
        const warehouseCode = String(row[13] ?? '').trim()    // 14. 창고코드
        const warehouseName = String(row[14] ?? '').trim()    // 15. 창고명
        const closingKey = String(row[15] ?? '').trim()       // 16. 수불마감KEY
        const registeredAt = String(row[16] ?? '').trim()     // 17. 등록일시
        const registeredBy = String(row[17] ?? '').trim()     // 18. 등록자
        const modifiedAt = String(row[18] ?? '').trim()       // 19. 수정일시
        const modifiedBy = String(row[19] ?? '').trim()       // 20. 수정자
        const returnNumber = String(row[20] ?? '').trim()     // 21. 반품번호
        const transactionDetail = String(row[21] ?? '').trim() // 22. 입출상세

        // 필수 필드 검증
        if (!transactionDate) {
          errors.push(`행 ${i + 1}: 입고일 필수`)
          continue
        }
        if (!productCodeVal && !productName) {
          errors.push(`행 ${i + 1}: 고객품번 또는 품명 필수`)
          continue
        }
        if (isNaN(quantity) || quantity <= 0) {
          errors.push(`행 ${i + 1}: 수량은 0보다 커야 합니다`)
          continue
        }

        parsedData.push({
          id: crypto.randomUUID(),
          transactionDate,
          partnerCode: partnerCodeVal,
          partnerName,
          productCode: productCodeVal,
          productName,
          quantity,
          unitPrice: isNaN(unitPrice) ? 0 : unitPrice,
          supplyAmount: isNaN(supplyAmount) ? 0 : supplyAmount,
          currency: ['KRW', 'USD'].includes(currency) ? currency : 'KRW',
          vatRate: isNaN(vatRate) ? 10 : vatRate,
          krwAmount: isNaN(krwAmount) ? 0 : krwAmount,
          taxAmount: isNaN(taxAmount) ? 0 : taxAmount,
          totalAmount: isNaN(totalAmount) ? 0 : totalAmount,
          warehouseCode,
          warehouseName,
          closingKey,
          registeredAt,
          registeredBy,
          modifiedAt,
          modifiedBy,
          returnNumber,
          transactionDetail,
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
      const batchId = crypto.randomUUID()
      let savedCount = 0

      for (const row of uploadData) {
        const insertData = {
          id: row.id,
          transaction_date: row.transactionDate,
          transaction_type: 'IN' as const,
          partner_code: row.partnerCode || null,
          quantity: row.quantity,
          unit_price: row.unitPrice || null,
          supply_amount: row.supplyAmount || null,
          currency: row.currency,
          vat_rate: row.vatRate || null,
          krw_amount: row.krwAmount || null,
          tax_amount: row.taxAmount || null,
          total_amount: row.totalAmount || null,
          warehouse_code: row.warehouseCode || null,
          warehouse_name: row.warehouseName || null,
          closing_key: row.closingKey || null,
          registered_at: row.registeredAt || null,
          registered_by: row.registeredBy || null,
          modified_at: row.modifiedAt || null,
          modified_by: row.modifiedBy || null,
          return_number: row.returnNumber || null,
          transaction_detail: row.transactionDetail || null,
          upload_batch_id: batchId,
        }

        const { error } = await supabase
          .from('inventory_transactions')
          .insert(insertData as never)

        if (error) {
          console.error('저장 실패:', error)
          continue
        }
        savedCount++
      }

      toast({ title: '저장 완료', description: `${savedCount}건 저장됨` })
      setUploadDialogOpen(false)
      setUploadData([])
      setUploadErrors([])
      await refresh()
    } catch (err) {
      toast({ title: '저장 실패', description: err instanceof Error ? err.message : '알 수 없는 오류', variant: 'destructive' })
    } finally {
      setUploading(false)
    }
  }, [uploadData, uploadErrors, toast, refresh])

  // 개별등록 다이얼로그 열기
  const handleOpenAddDialog = () => {
    setFormData({
      transactionDate: format(new Date(), 'yyyy-MM-dd'),
      partnerCode: '',
      partnerName: '',
      productCode: '',
      productName: '',
      quantity: 0,
      unitPrice: 0,
      supplyAmount: 0,
      currency: 'KRW',
      vatRate: 10,
      krwAmount: 0,
      taxAmount: 0,
      totalAmount: 0,
      warehouseCode: '',
      warehouseName: '',
      closingKey: '',
      registeredBy: '',
      returnNumber: '',
      transactionDetail: '',
    })
    setDialogOpen(true)
  }

  // 개별등록 저장
  const handleSubmit = async () => {
    // 필수값 검증
    if (!formData.transactionDate) {
      toast({ title: '입고일을 입력해주세요', variant: 'destructive' })
      return
    }
    if (!formData.productCode && !formData.productName) {
      toast({ title: '고객품번 또는 품명을 입력해주세요', variant: 'destructive' })
      return
    }
    if (formData.quantity <= 0) {
      toast({ title: '수량은 0보다 커야 합니다', variant: 'destructive' })
      return
    }

    try {
      const insertData = {
        id: crypto.randomUUID(),
        transaction_date: formData.transactionDate,
        transaction_type: 'IN' as const,
        partner_code: formData.partnerCode || null,
        quantity: formData.quantity,
        unit_price: formData.unitPrice || null,
        supply_amount: formData.supplyAmount || null,
        currency: formData.currency,
        vat_rate: formData.vatRate || null,
        krw_amount: formData.krwAmount || null,
        tax_amount: formData.taxAmount || null,
        total_amount: formData.totalAmount || null,
        warehouse_code: formData.warehouseCode || null,
        warehouse_name: formData.warehouseName || null,
        closing_key: formData.closingKey || null,
        registered_at: new Date().toISOString(),
        registered_by: formData.registeredBy || null,
        return_number: formData.returnNumber || null,
        transaction_detail: formData.transactionDetail || null,
      }

      const { error } = await supabase
        .from('inventory_transactions')
        .insert(insertData as never)

      if (error) throw new Error(error.message)

      toast({ title: '등록 완료' })
      setDialogOpen(false)
      await refresh()
    } catch (err) {
      toast({ title: '등록 실패', description: err instanceof Error ? err.message : '알 수 없는 오류', variant: 'destructive' })
    }
  }

  // 엑셀 다운로드 (현재 데이터)
  const handleExcelDownload = useCallback(() => {
    if (transactions.length === 0) {
      toast({ title: '다운로드할 데이터가 없습니다', variant: 'destructive' })
      return
    }

    const excelData = transactions.map((t) => ({
      '입고일': format(t.transactionDate, 'yyyy-MM-dd'),
      '거래처코드': t.partnerCode ?? '',
      '공급사': t.partnerName ?? '',
      '고객품번': t.productCode ?? '',
      '품명': t.productName ?? '',
      '수량': t.quantity,
      '적용단가': t.unitPrice ?? '',
      '공급가액': t.supplyAmount ?? '',
      '화폐단위': t.currency,
      '부가가치세(%)': t.vatRate ?? '',
      '금액(원화)': t.krwAmount ?? '',
      '세금': t.taxAmount ?? '',
      '총금액': t.totalAmount ?? '',
      '창고코드': t.warehouseCode ?? '',
      '창고명': t.warehouseName ?? '',
      '수불마감KEY': t.closingKey ?? '',
      '등록일시': t.registeredAt ? format(t.registeredAt, 'yyyy-MM-dd HH:mm') : '',
      '등록자': t.registeredBy ?? '',
      '수정일시': t.modifiedAt ? format(t.modifiedAt, 'yyyy-MM-dd HH:mm') : '',
      '수정자': t.modifiedBy ?? '',
      '반품번호': t.returnNumber ?? '',
      '입출상세': t.transactionDetail ?? '',
    }))

    const ws = XLSX.utils.json_to_sheet(excelData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '입고현황')
    XLSX.writeFile(wb, `입고현황_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`)
    toast({ title: '엑셀 다운로드 완료' })
  }, [transactions, toast])

  // 원화 요약 데이터
  const krwSummaryData = useMemo(() => {
    return summary.krwSummaries.map((s) => ({
      partner: s.partnerName,
      quantity: formatNumber(s.totalQuantity),
      amount: formatNumber(s.totalAmount),
    }))
  }, [summary])

  const krwTotal = useMemo(() => {
    const totalQty = summary.krwSummaries.reduce((acc, s) => acc + s.totalQuantity, 0)
    const totalAmt = summary.krwSummaries.reduce((acc, s) => acc + s.totalAmount, 0)
    return {
      quantity: formatNumber(totalQty),
      amount: formatNumber(totalAmt),
    }
  }, [summary])

  // 외화 요약 데이터
  const foreignSummaryData = useMemo(() => {
    return summary.foreignSummaries.map((s) => ({
      partner: s.partnerName,
      quantity: formatNumber(s.totalQuantity),
      amount: formatNumber(s.totalAmount),
      currency: s.currency,
    }))
  }, [summary])

  const foreignTotal = useMemo(() => {
    const totalQty = summary.foreignSummaries.reduce((acc, s) => acc + s.totalQuantity, 0)
    const totalAmt = summary.foreignSummaries.reduce((acc, s) => acc + s.totalAmount, 0)
    return {
      quantity: formatNumber(totalQty),
      amount: formatNumber(totalAmt),
    }
  }, [summary])

  // 합계 행
  const summaryRow = useMemo(() => {
    const totalQty = transactions.reduce((acc, t) => acc + (t.quantity || 0), 0)
    const totalAmt = transactions.reduce((acc, t) => acc + (t.totalAmount || 0), 0)
    return {
      quantity: <span className="text-right block">{formatNumber(totalQty)}</span>,
      totalAmount: <span className="text-right block">{formatNumber(totalAmt)}</span>,
    }
  }, [transactions])

  return (
    <div className="h-full flex flex-col gap-2">
      {/* 상단 영역: 조회조건 + 기능 */}
      <div className="flex gap-2">
        {/* 조회조건 */}
        <ERPGroupBox title="조회조건" className="flex-1">
          <div className="grid grid-cols-4 gap-x-6 gap-y-2">
            <ERPFormField label="입고일">
              <div className="flex items-center gap-1">
                <ERPDateInput value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                <span className="text-xs">~</span>
                <ERPDateInput value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </ERPFormField>
            <ERPFormField label="품번">
              <ERPInput
                value={productCode}
                onChange={(e) => setProductCode(e.target.value)}
                placeholder="품번"
                inputSize="md"
              />
            </ERPFormField>
            <ERPFormField label="품명">
              <ERPInput
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="품명"
                inputSize="lg"
              />
            </ERPFormField>
            <ERPFormField label="거래처">
              <ERPInput
                value={partnerCode}
                onChange={(e) => setPartnerCode(e.target.value)}
                placeholder="거래처"
                inputSize="md"
              />
            </ERPFormField>
          </div>
          <div className="flex justify-end gap-2 mt-3">
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
          className="w-40"
          buttons={[
            { label: '개별등록', icon: <Plus className="h-3 w-3" />, onClick: handleOpenAddDialog },
            { label: '엑셀업로드', icon: <Upload className="h-3 w-3" />, onClick: () => fileInputRef.current?.click() },
            { label: '양식다운로드', icon: <Download className="h-3 w-3" />, onClick: handleDownloadTemplate },
            { label: '엑셀다운로드', icon: <Download className="h-3 w-3" />, onClick: handleExcelDownload },
            {
              label: '새로고침',
              icon: <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />,
              onClick: refresh,
            },
          ]}
        />
        <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={handleFileUpload} className="hidden" />
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
            data={transactions}
            title="입고 내역"
            pageSize={20}
            enableSelection
            summaryRow={summaryRow}
          />
        </div>

        {/* 사이드 요약 패널 */}
        <div className="w-72 flex flex-col gap-2">
          {/* 원화 합계 */}
          <ERPSummaryPanel
            title="거래처별 합계(원화)"
            columns={[
              { key: 'partner', header: '공급사', align: 'left' },
              { key: 'quantity', header: '입고수량', align: 'right' },
              { key: 'amount', header: '공급가액', align: 'right' },
            ]}
            data={krwSummaryData}
            totalRow={krwTotal}
            className="flex-1"
          />

          {/* 외화 합계 */}
          <ERPSummaryPanel
            title="거래처별 합계(외화)"
            columns={[
              { key: 'partner', header: '공급사', align: 'left' },
              { key: 'quantity', header: '입고수량', align: 'right' },
              { key: 'amount', header: '공급가액', align: 'right' },
              { key: 'currency', header: '화폐', align: 'center' },
            ]}
            data={foreignSummaryData}
            totalRow={foreignTotal}
            className="flex-1"
          />
        </div>
      </div>

      {/* 개별등록 다이얼로그 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>입고 등록</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-4 gap-4 py-4">
            {/* 기본 정보 */}
            <div className="space-y-2">
              <Label>입고일 *</Label>
              <Input
                type="date"
                value={formData.transactionDate}
                onChange={(e) => setFormData({ ...formData, transactionDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>거래처코드</Label>
              <Input
                value={formData.partnerCode}
                onChange={(e) => setFormData({ ...formData, partnerCode: e.target.value })}
                placeholder="S001"
              />
            </div>
            <div className="space-y-2">
              <Label>공급사</Label>
              <Input
                value={formData.partnerName}
                onChange={(e) => setFormData({ ...formData, partnerName: e.target.value })}
                placeholder="공급사명"
              />
            </div>
            <div className="space-y-2">
              <Label>고객품번 *</Label>
              <Input
                value={formData.productCode}
                onChange={(e) => setFormData({ ...formData, productCode: e.target.value })}
                placeholder="P001"
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label>품명</Label>
              <Input
                value={formData.productName}
                onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                placeholder="품명"
              />
            </div>
            <div className="space-y-2">
              <Label>수량 *</Label>
              <Input
                type="number"
                min={1}
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label>적용단가</Label>
              <Input
                type="number"
                min={0}
                value={formData.unitPrice}
                onChange={(e) => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div className="space-y-2">
              <Label>공급가액</Label>
              <Input
                type="number"
                min={0}
                value={formData.supplyAmount}
                onChange={(e) => setFormData({ ...formData, supplyAmount: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label>화폐단위</Label>
              <Input
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value.toUpperCase() })}
                placeholder="KRW"
              />
            </div>
            <div className="space-y-2">
              <Label>부가가치세(%)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={formData.vatRate}
                onChange={(e) => setFormData({ ...formData, vatRate: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label>금액(원화)</Label>
              <Input
                type="number"
                min={0}
                value={formData.krwAmount}
                onChange={(e) => setFormData({ ...formData, krwAmount: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div className="space-y-2">
              <Label>세금</Label>
              <Input
                type="number"
                min={0}
                value={formData.taxAmount}
                onChange={(e) => setFormData({ ...formData, taxAmount: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label>총금액</Label>
              <Input
                type="number"
                min={0}
                value={formData.totalAmount}
                onChange={(e) => setFormData({ ...formData, totalAmount: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label>창고코드</Label>
              <Input
                value={formData.warehouseCode}
                onChange={(e) => setFormData({ ...formData, warehouseCode: e.target.value })}
                placeholder="WH01"
              />
            </div>
            <div className="space-y-2">
              <Label>창고명</Label>
              <Input
                value={formData.warehouseName}
                onChange={(e) => setFormData({ ...formData, warehouseName: e.target.value })}
                placeholder="본사창고"
              />
            </div>

            <div className="space-y-2">
              <Label>수불마감KEY</Label>
              <Input
                value={formData.closingKey}
                onChange={(e) => setFormData({ ...formData, closingKey: e.target.value })}
                placeholder="CL2024010101"
              />
            </div>
            <div className="space-y-2">
              <Label>등록자</Label>
              <Input
                value={formData.registeredBy}
                onChange={(e) => setFormData({ ...formData, registeredBy: e.target.value })}
                placeholder="admin"
              />
            </div>
            <div className="space-y-2">
              <Label>반품번호</Label>
              <Input
                value={formData.returnNumber}
                onChange={(e) => setFormData({ ...formData, returnNumber: e.target.value })}
                placeholder=""
              />
            </div>
            <div className="space-y-2">
              <Label>입출상세</Label>
              <Input
                value={formData.transactionDetail}
                onChange={(e) => setFormData({ ...formData, transactionDetail: e.target.value })}
                placeholder="정상입고"
              />
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
        <DialogContent className="max-w-6xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>입고 일괄등록 데이터 확인</DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-auto">
            {uploadErrors.length > 0 && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm">
                <p className="font-medium text-red-700 mb-2">오류 목록:</p>
                <ul className="list-disc list-inside text-red-600">
                  {uploadErrors.map((err, i) => <li key={i}>{err}</li>)}
                </ul>
              </div>
            )}
            <p className="text-sm mb-2">{uploadData.length}건의 데이터가 파싱되었습니다.</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse min-w-[1600px]">
                <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    <th className="p-2 border whitespace-nowrap">입고일</th>
                    <th className="p-2 border whitespace-nowrap">거래처코드</th>
                    <th className="p-2 border whitespace-nowrap">공급사</th>
                    <th className="p-2 border whitespace-nowrap">고객품번</th>
                    <th className="p-2 border whitespace-nowrap">품명</th>
                    <th className="p-2 border whitespace-nowrap">수량</th>
                    <th className="p-2 border whitespace-nowrap">적용단가</th>
                    <th className="p-2 border whitespace-nowrap">공급가액</th>
                    <th className="p-2 border whitespace-nowrap">화폐</th>
                    <th className="p-2 border whitespace-nowrap">VAT(%)</th>
                    <th className="p-2 border whitespace-nowrap">총금액</th>
                    <th className="p-2 border whitespace-nowrap">창고코드</th>
                    <th className="p-2 border whitespace-nowrap">입출상세</th>
                  </tr>
                </thead>
                <tbody>
                  {uploadData.slice(0, 20).map((row, i) => (
                    <tr key={i}>
                      <td className="p-2 border">{row.transactionDate}</td>
                      <td className="p-2 border">{row.partnerCode || '-'}</td>
                      <td className="p-2 border">{row.partnerName || '-'}</td>
                      <td className="p-2 border">{row.productCode || '-'}</td>
                      <td className="p-2 border">{row.productName || '-'}</td>
                      <td className="p-2 border text-right">{formatNumber(row.quantity)}</td>
                      <td className="p-2 border text-right">{formatNumber(row.unitPrice)}</td>
                      <td className="p-2 border text-right">{formatNumber(row.supplyAmount)}</td>
                      <td className="p-2 border text-center">{row.currency}</td>
                      <td className="p-2 border text-right">{row.vatRate}%</td>
                      <td className="p-2 border text-right">{formatNumber(row.totalAmount)}</td>
                      <td className="p-2 border">{row.warehouseCode || '-'}</td>
                      <td className="p-2 border">{row.transactionDetail || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {uploadData.length > 20 && (
              <p className="text-sm text-gray-500 mt-2">... 외 {uploadData.length - 20}건</p>
            )}
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

export default InboundStatusPage
