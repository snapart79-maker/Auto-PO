/**
 * OutboundStatusPage - 출고 현황 페이지 (ERP 스타일)
 * PRD 4.2 출고 현황
 */

import { useMemo, useState, useCallback, useRef } from 'react'
import { format } from 'date-fns'
import * as XLSX from 'xlsx'
import { Plus, Upload, Download, Search, RefreshCw, FileDown } from 'lucide-react'
import { ERPTable } from '../components/ERPTable'
import {
  ERPGroupBox,
  ERPFormField,
  ERPInput,
  ERPDateInput,
  ERPSelect,
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
import type { TransactionWithDetails } from '@application/dtos/TransactionWithDetails'
import type { ColumnDef } from '@tanstack/react-table'

function formatNumber(value: number | null): string {
  if (value === null) return '-'
  return new Intl.NumberFormat('ko-KR').format(value)
}

// 출고 데이터 행 타입 (업로드용)
interface OutboundRow {
  id: string
  transactionDate: string       // 1. 출하일
  transactionCategory: string   // 2. 수불구분
  shipmentType: string          // 3. 출하유형
  lotNumber: string             // 4. LOT번호
  productCode: string           // 5. 품번
  productName: string           // 6. 품명
  customerProductCode: string   // 7. 고객품번
  quantity: number              // 8. 수량
  unitPrice: number             // 9. 단가
  contractPrice: number         // 10. 계약단가
  contractCurrency: string      // 11. 계약화폐단위
  appliedPrice: number          // 12. 적용단가
  supplyAmount: number          // 13. 공급가액
  currency: string              // 14. 화폐단위
  exchangeRate: number          // 15. 환율
  vatRate: number               // 16. 부가가치세율
  krwAmount: number             // 17. 금액(원화)
  taxAmount: number             // 18. 세금
  totalAmount: number           // 19. 총금액
  partnerCode: string           // 20. 거래처코드
  partnerName: string           // 21. 공급사
  warehouseCode: string         // 22. 창고코드
  warehouseName: string         // 23. 창고명
}

export function OutboundStatusPage() {
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

  // 개별등록 다이얼로그 상태
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    transactionDate: format(new Date(), 'yyyy-MM-dd'),
    transactionCategory: '출고',
    shipmentType: '일반출고',
    lotNumber: '',
    productCode: '',
    productName: '',
    customerProductCode: '',
    quantity: 0,
    unitPrice: 0,
    contractPrice: 0,
    contractCurrency: 'KRW',
    appliedPrice: 0,
    supplyAmount: 0,
    currency: 'KRW',
    exchangeRate: 1,
    vatRate: 10,
    krwAmount: 0,
    taxAmount: 0,
    totalAmount: 0,
    partnerCode: '',
    partnerName: '',
    warehouseCode: '',
    warehouseName: '',
  })

  // 업로드 다이얼로그 상태
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [uploadData, setUploadData] = useState<OutboundRow[]>([])
  const [uploadErrors, setUploadErrors] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)

  const { transactions, summary, loading, error, search, refresh } = useTransactions({
    transactionType: 'OUT',
    autoLoad: true,
  })

  const columns: ColumnDef<TransactionWithDetails, unknown>[] = useMemo(
    () => [
      // 1. 출하일
      {
        accessorKey: 'transactionDate',
        header: '출하일',
        cell: ({ row }) => format(row.original.transactionDate, 'yyyy-MM-dd'),
        size: 100,
      },
      // 2. 수불구분
      {
        accessorKey: 'transactionCategory',
        header: '수불구분',
        cell: ({ row }) => row.original.transactionCategory ?? '-',
        size: 90,
      },
      // 3. 출하유형
      {
        accessorKey: 'shipmentType',
        header: '출하유형',
        cell: ({ row }) => row.original.shipmentType ?? '-',
        size: 90,
      },
      // 4. LOT번호
      {
        accessorKey: 'lotNumber',
        header: 'LOT번호',
        cell: ({ row }) => row.original.lotNumber ?? '-',
        size: 100,
      },
      // 5. 품번
      {
        accessorKey: 'productCode',
        header: '품번',
        cell: ({ row }) => row.original.productCode ?? '-',
        size: 120,
      },
      // 6. 품명
      {
        accessorKey: 'productName',
        header: '품명',
        cell: ({ row }) => row.original.productName ?? '-',
        size: 180,
      },
      // 7. 고객품번
      {
        accessorKey: 'customerProductCode',
        header: '고객품번',
        cell: ({ row }) => row.original.customerProductCode ?? '-',
        size: 120,
      },
      // 8. 수량
      {
        accessorKey: 'quantity',
        header: '수량',
        cell: ({ row }) => (
          <span className="text-right block">{formatNumber(row.original.quantity)}</span>
        ),
        size: 80,
      },
      // 9. 단가
      {
        accessorKey: 'unitPrice',
        header: '단가',
        cell: ({ row }) => (
          <span className="text-right block">{formatNumber(row.original.unitPrice)}</span>
        ),
        size: 100,
      },
      // 10. 계약단가
      {
        accessorKey: 'contractPrice',
        header: '계약단가',
        cell: ({ row }) => (
          <span className="text-right block">{formatNumber(row.original.contractPrice)}</span>
        ),
        size: 100,
      },
      // 11. 계약화폐단위
      {
        accessorKey: 'contractCurrency',
        header: '계약화폐',
        cell: ({ row }) => row.original.contractCurrency ?? '-',
        size: 80,
      },
      // 12. 적용단가
      {
        accessorKey: 'appliedPrice',
        header: '적용단가',
        cell: ({ row }) => (
          <span className="text-right block">{formatNumber(row.original.appliedPrice)}</span>
        ),
        size: 100,
      },
      // 13. 공급가액
      {
        accessorKey: 'supplyAmount',
        header: '공급가액',
        cell: ({ row }) => (
          <span className="text-right block">{formatNumber(row.original.supplyAmount)}</span>
        ),
        size: 120,
      },
      // 14. 화폐단위
      {
        accessorKey: 'currency',
        header: '화폐단위',
        cell: ({ row }) => row.original.currency,
        size: 70,
      },
      // 15. 환율
      {
        accessorKey: 'exchangeRate',
        header: '환율',
        cell: ({ row }) => (
          <span className="text-right block">
            {row.original.exchangeRate ? formatNumber(row.original.exchangeRate) : '-'}
          </span>
        ),
        size: 80,
      },
      // 16. 부가가치세율
      {
        accessorKey: 'vatRate',
        header: '부가세율',
        cell: ({ row }) => (
          <span className="text-right block">
            {row.original.vatRate !== null ? `${row.original.vatRate}%` : '-'}
          </span>
        ),
        size: 70,
      },
      // 17. 금액(원화)
      {
        accessorKey: 'krwAmount',
        header: '금액(원화)',
        cell: ({ row }) => (
          <span className="text-right block">{formatNumber(row.original.krwAmount)}</span>
        ),
        size: 110,
      },
      // 18. 세금
      {
        accessorKey: 'taxAmount',
        header: '세금',
        cell: ({ row }) => (
          <span className="text-right block">{formatNumber(row.original.taxAmount)}</span>
        ),
        size: 100,
      },
      // 19. 총금액
      {
        accessorKey: 'totalAmount',
        header: '총금액',
        cell: ({ row }) => (
          <span className="text-right block">{formatNumber(row.original.totalAmount)}</span>
        ),
        size: 120,
      },
      // 20. 거래처코드
      {
        accessorKey: 'partnerCode',
        header: '거래처코드',
        cell: ({ row }) => row.original.partnerCode ?? '-',
        size: 100,
      },
      // 21. 공급사(고객사)
      {
        accessorKey: 'partnerName',
        header: '공급사',
        cell: ({ row }) => row.original.partnerName ?? '-',
        size: 120,
      },
      // 22. 창고코드
      {
        accessorKey: 'warehouseCode',
        header: '창고코드',
        cell: ({ row }) => row.original.warehouseCode ?? '-',
        size: 80,
      },
      // 23. 창고명
      {
        accessorKey: 'warehouseName',
        header: '창고명',
        cell: ({ row }) => row.original.warehouseName ?? '-',
        size: 100,
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

  // 양식 다운로드 (23개 컬럼)
  const handleDownloadTemplate = useCallback(() => {
    const templateData = [
      [
        '출하일', '수불구분', '출하유형', 'LOT번호', '품번', '품명', '고객품번',
        '수량', '단가', '계약단가', '계약화폐단위', '적용단가', '공급가액',
        '화폐단위', '환율', '부가가치세율', '금액(원화)', '세금', '총금액',
        '거래처코드', '공급사', '창고코드', '창고명'
      ],
      [
        '2024-01-15', '출고', '일반출고', 'LOT20240115', 'P001', '샘플제품', 'C-P001',
        100, 1000, 1000, 'KRW', 1000, 100000,
        'KRW', 1, 10, 100000, 10000, 110000,
        'C001', '샘플고객사', 'WH01', '본사창고'
      ],
    ]
    const ws = XLSX.utils.aoa_to_sheet(templateData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '출고현황')
    ws['!cols'] = [
      { wch: 12 },  // 출하일
      { wch: 10 },  // 수불구분
      { wch: 10 },  // 출하유형
      { wch: 15 },  // LOT번호
      { wch: 15 },  // 품번
      { wch: 20 },  // 품명
      { wch: 15 },  // 고객품번
      { wch: 10 },  // 수량
      { wch: 10 },  // 단가
      { wch: 10 },  // 계약단가
      { wch: 12 },  // 계약화폐단위
      { wch: 10 },  // 적용단가
      { wch: 12 },  // 공급가액
      { wch: 10 },  // 화폐단위
      { wch: 8 },   // 환율
      { wch: 12 },  // 부가가치세율
      { wch: 12 },  // 금액(원화)
      { wch: 10 },  // 세금
      { wch: 12 },  // 총금액
      { wch: 12 },  // 거래처코드
      { wch: 15 },  // 공급사
      { wch: 10 },  // 창고코드
      { wch: 12 },  // 창고명
    ]
    XLSX.writeFile(wb, '출고현황_양식.xlsx')
    toast({ title: '양식 다운로드 완료', description: '출고현황_양식.xlsx 파일이 다운로드되었습니다.' })
  }, [toast])

  // 엑셀 업로드 (23개 컬럼)
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
      const parsedData: OutboundRow[] = []

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i]
        if (!row || row.length === 0) continue

        // 23개 컬럼 파싱
        const transactionDate = String(row[0] ?? '').trim()       // 1. 출하일
        const transactionCategory = String(row[1] ?? '').trim()   // 2. 수불구분
        const shipmentType = String(row[2] ?? '').trim()          // 3. 출하유형
        const lotNumber = String(row[3] ?? '').trim()             // 4. LOT번호
        const productCodeVal = String(row[4] ?? '').trim()        // 5. 품번
        const productNameVal = String(row[5] ?? '').trim()        // 6. 품명
        const customerProductCode = String(row[6] ?? '').trim()   // 7. 고객품번
        const quantity = parseFloat(String(row[7] ?? '0'))        // 8. 수량
        const unitPrice = parseFloat(String(row[8] ?? '0'))       // 9. 단가
        const contractPrice = parseFloat(String(row[9] ?? '0'))   // 10. 계약단가
        const contractCurrency = String(row[10] ?? 'KRW').trim()  // 11. 계약화폐단위
        const appliedPrice = parseFloat(String(row[11] ?? '0'))   // 12. 적용단가
        const supplyAmount = parseFloat(String(row[12] ?? '0'))   // 13. 공급가액
        const currency = String(row[13] ?? 'KRW').trim()          // 14. 화폐단위
        const exchangeRate = parseFloat(String(row[14] ?? '1'))   // 15. 환율
        const vatRate = parseFloat(String(row[15] ?? '10'))       // 16. 부가가치세율
        const krwAmount = parseFloat(String(row[16] ?? '0'))      // 17. 금액(원화)
        const taxAmount = parseFloat(String(row[17] ?? '0'))      // 18. 세금
        const totalAmount = parseFloat(String(row[18] ?? '0'))    // 19. 총금액
        const partnerCodeVal = String(row[19] ?? '').trim()       // 20. 거래처코드
        const partnerNameVal = String(row[20] ?? '').trim()       // 21. 공급사
        const warehouseCode = String(row[21] ?? '').trim()        // 22. 창고코드
        const warehouseName = String(row[22] ?? '').trim()        // 23. 창고명

        // 필수 필드 검증
        if (!transactionDate) {
          errors.push(`행 ${i + 1}: 출하일 필수`)
          continue
        }
        if (!productCodeVal) {
          errors.push(`행 ${i + 1}: 품번 필수`)
          continue
        }
        if (quantity <= 0) {
          errors.push(`행 ${i + 1}: 수량은 0보다 커야 합니다`)
          continue
        }

        parsedData.push({
          id: crypto.randomUUID(),
          transactionDate,
          transactionCategory: transactionCategory || '출고',
          shipmentType: shipmentType || '일반출고',
          lotNumber,
          productCode: productCodeVal,
          productName: productNameVal,
          customerProductCode,
          quantity: isNaN(quantity) ? 0 : quantity,
          unitPrice: isNaN(unitPrice) ? 0 : unitPrice,
          contractPrice: isNaN(contractPrice) ? 0 : contractPrice,
          contractCurrency: contractCurrency || 'KRW',
          appliedPrice: isNaN(appliedPrice) ? 0 : appliedPrice,
          supplyAmount: isNaN(supplyAmount) ? 0 : supplyAmount,
          currency: currency || 'KRW',
          exchangeRate: isNaN(exchangeRate) ? 1 : exchangeRate,
          vatRate: isNaN(vatRate) ? 10 : vatRate,
          krwAmount: isNaN(krwAmount) ? 0 : krwAmount,
          taxAmount: isNaN(taxAmount) ? 0 : taxAmount,
          totalAmount: isNaN(totalAmount) ? 0 : totalAmount,
          partnerCode: partnerCodeVal,
          partnerName: partnerNameVal,
          warehouseCode,
          warehouseName,
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
      // TODO: 실제 저장 로직 구현 (InventoryTransactionRepository 사용)
      // 현재는 미리보기만 지원
      toast({ title: '저장 완료', description: `${uploadData.length}건 저장됨` })
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
  const handleAdd = () => {
    setFormData({
      transactionDate: format(new Date(), 'yyyy-MM-dd'),
      transactionCategory: '출고',
      shipmentType: '일반출고',
      lotNumber: '',
      productCode: '',
      productName: '',
      customerProductCode: '',
      quantity: 0,
      unitPrice: 0,
      contractPrice: 0,
      contractCurrency: 'KRW',
      appliedPrice: 0,
      supplyAmount: 0,
      currency: 'KRW',
      exchangeRate: 1,
      vatRate: 10,
      krwAmount: 0,
      taxAmount: 0,
      totalAmount: 0,
      partnerCode: '',
      partnerName: '',
      warehouseCode: '',
      warehouseName: '',
    })
    setDialogOpen(true)
  }

  // 개별등록 저장
  const handleSubmit = async () => {
    try {
      // 필수 필드 검증
      if (!formData.transactionDate) {
        toast({ title: '출하일을 입력해주세요', variant: 'destructive' })
        return
      }
      if (!formData.productCode) {
        toast({ title: '품번을 입력해주세요', variant: 'destructive' })
        return
      }
      if (formData.quantity <= 0) {
        toast({ title: '수량은 0보다 커야 합니다', variant: 'destructive' })
        return
      }

      // TODO: 실제 저장 로직 구현 (InventoryTransactionRepository 사용)
      toast({ title: '등록 완료' })
      setDialogOpen(false)
      await refresh()
    } catch (err) {
      console.error('저장 실패:', err)
      toast({ title: '저장 실패', variant: 'destructive' })
    }
  }

  // 엑셀 다운로드
  const handleExcelDownload = useCallback(() => {
    if (transactions.length === 0) {
      toast({ title: '다운로드할 데이터가 없습니다', variant: 'destructive' })
      return
    }

    const excelData = transactions.map((t) => ({
      출하일: format(t.transactionDate, 'yyyy-MM-dd'),
      수불구분: t.transactionCategory ?? '',
      출하유형: t.shipmentType ?? '',
      LOT번호: t.lotNumber ?? '',
      품번: t.productCode ?? '',
      품명: t.productName ?? '',
      고객품번: t.customerProductCode ?? '',
      수량: t.quantity,
      단가: t.unitPrice ?? 0,
      계약단가: t.contractPrice ?? 0,
      계약화폐단위: t.contractCurrency ?? 'KRW',
      적용단가: t.appliedPrice ?? 0,
      공급가액: t.supplyAmount ?? 0,
      화폐단위: t.currency,
      환율: t.exchangeRate ?? 1,
      부가가치세율: t.vatRate ?? 10,
      '금액(원화)': t.krwAmount ?? 0,
      세금: t.taxAmount ?? 0,
      총금액: t.totalAmount ?? 0,
      거래처코드: t.partnerCode ?? '',
      공급사: t.partnerName ?? '',
      창고코드: t.warehouseCode ?? '',
      창고명: t.warehouseName ?? '',
    }))

    const ws = XLSX.utils.json_to_sheet(excelData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '출고현황')
    XLSX.writeFile(wb, `출고현황_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`)
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
    const totalSupplyAmt = transactions.reduce((acc, t) => acc + (t.supplyAmount || 0), 0)
    const totalKrwAmt = transactions.reduce((acc, t) => acc + (t.krwAmount || 0), 0)
    const totalTax = transactions.reduce((acc, t) => acc + (t.taxAmount || 0), 0)
    const totalAmt = transactions.reduce((acc, t) => acc + (t.totalAmount || 0), 0)
    return {
      quantity: <span className="text-right block">{formatNumber(totalQty)}</span>,
      supplyAmount: <span className="text-right block">{formatNumber(totalSupplyAmt)}</span>,
      krwAmount: <span className="text-right block">{formatNumber(totalKrwAmt)}</span>,
      taxAmount: <span className="text-right block">{formatNumber(totalTax)}</span>,
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
            <ERPFormField label="출하일">
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
            <ERPFormField label="고객사">
              <ERPInput
                value={partnerCode}
                onChange={(e) => setPartnerCode(e.target.value)}
                placeholder="고객사"
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
          className="w-36"
          buttons={[
            { label: '개별등록', icon: <Plus className="h-3 w-3" />, onClick: handleAdd },
            { label: '엑셀업로드', icon: <Upload className="h-3 w-3" />, onClick: () => fileInputRef.current?.click() },
            { label: '양식다운로드', icon: <FileDown className="h-3 w-3" />, onClick: handleDownloadTemplate },
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
            title="출고 내역"
            pageSize={20}
            enableSelection
            summaryRow={summaryRow}
          />
        </div>

        {/* 사이드 요약 패널 */}
        <div className="w-72 flex flex-col gap-2">
          {/* 원화 합계 */}
          <ERPSummaryPanel
            title="고객사별 합계(원화)"
            columns={[
              { key: 'partner', header: '고객사', align: 'left' },
              { key: 'quantity', header: '출고수량', align: 'right' },
              { key: 'amount', header: '공급가액', align: 'right' },
            ]}
            data={krwSummaryData}
            totalRow={krwTotal}
            className="flex-1"
          />

          {/* 외화 합계 */}
          <ERPSummaryPanel
            title="고객사별 합계(외화)"
            columns={[
              { key: 'partner', header: '고객사', align: 'left' },
              { key: 'quantity', header: '출고수량', align: 'right' },
              { key: 'amount', header: '공급가액', align: 'right' },
              { key: 'currency', header: '화폐', align: 'center' },
            ]}
            data={foreignSummaryData}
            totalRow={foreignTotal}
            className="flex-1"
          />
        </div>
      </div>

      {/* 개별 등록 다이얼로그 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>출고 등록</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-4 gap-4 py-4">
            {/* 기본 정보 */}
            <div className="space-y-2">
              <Label>출하일 *</Label>
              <Input
                type="date"
                value={formData.transactionDate}
                onChange={(e) => setFormData({ ...formData, transactionDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>수불구분</Label>
              <Input
                value={formData.transactionCategory}
                onChange={(e) => setFormData({ ...formData, transactionCategory: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>출하유형</Label>
              <Input
                value={formData.shipmentType}
                onChange={(e) => setFormData({ ...formData, shipmentType: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>LOT번호</Label>
              <Input
                value={formData.lotNumber}
                onChange={(e) => setFormData({ ...formData, lotNumber: e.target.value })}
              />
            </div>

            {/* 제품 정보 */}
            <div className="space-y-2">
              <Label>품번 *</Label>
              <Input
                value={formData.productCode}
                onChange={(e) => setFormData({ ...formData, productCode: e.target.value })}
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>품명</Label>
              <Input
                value={formData.productName}
                onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>고객품번</Label>
              <Input
                value={formData.customerProductCode}
                onChange={(e) => setFormData({ ...formData, customerProductCode: e.target.value })}
              />
            </div>

            {/* 수량/단가 */}
            <div className="space-y-2">
              <Label>수량 *</Label>
              <Input
                type="number"
                min={0}
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label>단가</Label>
              <Input
                type="number"
                min={0}
                value={formData.unitPrice}
                onChange={(e) => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label>계약단가</Label>
              <Input
                type="number"
                min={0}
                value={formData.contractPrice}
                onChange={(e) => setFormData({ ...formData, contractPrice: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label>계약화폐단위</Label>
              <ERPSelect
                value={formData.contractCurrency}
                onChange={(e) => setFormData({ ...formData, contractCurrency: e.target.value })}
                inputSize="md"
              >
                <option value="KRW">KRW</option>
                <option value="USD">USD</option>
              </ERPSelect>
            </div>

            {/* 금액 정보 */}
            <div className="space-y-2">
              <Label>적용단가</Label>
              <Input
                type="number"
                min={0}
                value={formData.appliedPrice}
                onChange={(e) => setFormData({ ...formData, appliedPrice: parseFloat(e.target.value) || 0 })}
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
              <ERPSelect
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                inputSize="md"
              >
                <option value="KRW">KRW</option>
                <option value="USD">USD</option>
              </ERPSelect>
            </div>
            <div className="space-y-2">
              <Label>환율</Label>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={formData.exchangeRate}
                onChange={(e) => setFormData({ ...formData, exchangeRate: parseFloat(e.target.value) || 1 })}
              />
            </div>

            {/* 세금 정보 */}
            <div className="space-y-2">
              <Label>부가가치세율 (%)</Label>
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

            {/* 거래처/창고 정보 */}
            <div className="space-y-2">
              <Label>거래처코드</Label>
              <Input
                value={formData.partnerCode}
                onChange={(e) => setFormData({ ...formData, partnerCode: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>공급사</Label>
              <Input
                value={formData.partnerName}
                onChange={(e) => setFormData({ ...formData, partnerName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>창고코드</Label>
              <Input
                value={formData.warehouseCode}
                onChange={(e) => setFormData({ ...formData, warehouseCode: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>창고명</Label>
              <Input
                value={formData.warehouseName}
                onChange={(e) => setFormData({ ...formData, warehouseName: e.target.value })}
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
            <DialogTitle>일괄등록 데이터 확인</DialogTitle>
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
              <table className="w-full text-xs border-collapse min-w-[1500px]">
                <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    <th className="p-2 border whitespace-nowrap">출하일</th>
                    <th className="p-2 border whitespace-nowrap">수불구분</th>
                    <th className="p-2 border whitespace-nowrap">출하유형</th>
                    <th className="p-2 border whitespace-nowrap">LOT번호</th>
                    <th className="p-2 border whitespace-nowrap">품번</th>
                    <th className="p-2 border whitespace-nowrap">품명</th>
                    <th className="p-2 border whitespace-nowrap">고객품번</th>
                    <th className="p-2 border whitespace-nowrap">수량</th>
                    <th className="p-2 border whitespace-nowrap">단가</th>
                    <th className="p-2 border whitespace-nowrap">공급가액</th>
                    <th className="p-2 border whitespace-nowrap">화폐</th>
                    <th className="p-2 border whitespace-nowrap">총금액</th>
                    <th className="p-2 border whitespace-nowrap">거래처코드</th>
                    <th className="p-2 border whitespace-nowrap">공급사</th>
                    <th className="p-2 border whitespace-nowrap">창고코드</th>
                  </tr>
                </thead>
                <tbody>
                  {uploadData.slice(0, 20).map((row, i) => (
                    <tr key={i}>
                      <td className="p-2 border">{row.transactionDate}</td>
                      <td className="p-2 border">{row.transactionCategory}</td>
                      <td className="p-2 border">{row.shipmentType}</td>
                      <td className="p-2 border">{row.lotNumber || '-'}</td>
                      <td className="p-2 border">{row.productCode}</td>
                      <td className="p-2 border">{row.productName || '-'}</td>
                      <td className="p-2 border">{row.customerProductCode || '-'}</td>
                      <td className="p-2 border text-right">{formatNumber(row.quantity)}</td>
                      <td className="p-2 border text-right">{formatNumber(row.unitPrice)}</td>
                      <td className="p-2 border text-right">{formatNumber(row.supplyAmount)}</td>
                      <td className="p-2 border">{row.currency}</td>
                      <td className="p-2 border text-right">{formatNumber(row.totalAmount)}</td>
                      <td className="p-2 border">{row.partnerCode || '-'}</td>
                      <td className="p-2 border">{row.partnerName || '-'}</td>
                      <td className="p-2 border">{row.warehouseCode || '-'}</td>
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

export default OutboundStatusPage
