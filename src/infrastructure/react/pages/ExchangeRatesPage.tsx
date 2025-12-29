/**
 * ExchangeRatesPage - 환율 관리 페이지 (ERP 스타일)
 * Phase 3: React Hook Form + Zod + ConfirmDialog 적용
 */

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { format } from 'date-fns'
import * as XLSX from 'xlsx'
import { ERPTable } from '../components/ERPTable'
import {
  ERPGroupBox,
  ERPFormField,
  ERPSelect,
  ERPDateInput,
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
import { useToast } from '../components/ui/toast'
import { SupabaseExchangeRateRepository } from '@infrastructure/repositories'
import { ExchangeRate } from '@domain/entities/ExchangeRate'
import type { Currency } from '@domain/valueObjects/Money'
import { Plus, Trash2, Upload, RefreshCw, Search, FileDown } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import { ExchangeRateForm } from '../components/forms/ExchangeRateForm'
import { useConfirmDialog } from '../components/common/ConfirmDialog'
import type { ExchangeRateFormData } from '@infrastructure/schemas'

const exchangeRateRepository = new SupabaseExchangeRateRepository()

interface ExchangeRateRow {
  id: string
  currencyCode: string
  rate: number
  effectiveDate: string
  createdAt: string
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('ko-KR').format(value)
}

export function ExchangeRatesPage() {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { confirm, ConfirmDialogComponent } = useConfirmDialog()

  const [data, setData] = useState<ExchangeRateRow[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [filterCurrency, setFilterCurrency] = useState('ALL')
  const [filterDate, setFilterDate] = useState('')
  const [formLoading, setFormLoading] = useState(false)

  // 업로드 다이얼로그 상태
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [uploadData, setUploadData] = useState<ExchangeRateRow[]>([])
  const [uploadErrors, setUploadErrors] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)

  const columns: ColumnDef<ExchangeRateRow, unknown>[] = useMemo(
    () => [
      {
        accessorKey: 'effectiveDate',
        header: '적용일',
        cell: ({ row }) => format(new Date(row.original.effectiveDate), 'yyyy-MM-dd'),
        size: 120,
      },
      { accessorKey: 'currencyCode', header: '통화', size: 80 },
      {
        accessorKey: 'rate',
        header: '환율 (KRW)',
        cell: ({ row }) => <span className="text-right block font-medium">{formatNumber(row.original.rate)}</span>,
        size: 120,
      },
      {
        accessorKey: 'createdAt',
        header: '등록일시',
        cell: ({ row }) => format(new Date(row.original.createdAt), 'yyyy-MM-dd HH:mm'),
        size: 150,
      },
      {
        id: 'actions',
        header: '삭제',
        cell: ({ row }) => (
          <button onClick={() => handleDelete(row.original.id)} className="text-red-600 hover:text-red-800">
            <Trash2 className="h-4 w-4" />
          </button>
        ),
        size: 60,
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
      const rates = await exchangeRateRepository.findAll()
      setData(
        rates.map((r) => ({
          id: r.id,
          currencyCode: r.currencyCode,
          rate: r.rate,
          effectiveDate: r.effectiveDate.toISOString(),
          createdAt: r.createdAt.toISOString(),
        }))
      )
    } catch (error) {
      console.error('데이터 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredData = useMemo(() => {
    let result = data
    if (filterCurrency !== 'ALL') {
      result = result.filter((item) => item.currencyCode === filterCurrency)
    }
    if (filterDate) {
      result = result.filter((item) => item.effectiveDate.startsWith(filterDate))
    }
    return result.sort((a, b) => b.effectiveDate.localeCompare(a.effectiveDate))
  }, [data, filterCurrency, filterDate])

  const handleReset = () => {
    setFilterCurrency('ALL')
    setFilterDate('')
  }

  const handleAdd = () => {
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: '환율 삭제',
      description: '이 환율을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.',
      confirmText: '삭제',
      cancelText: '취소',
      variant: 'destructive',
    })

    if (!confirmed) return

    try {
      await exchangeRateRepository.delete(id)
      await loadData()
      toast({ title: '삭제 완료' })
    } catch (error) {
      console.error('삭제 실패:', error)
      toast({ title: '삭제 실패', description: error instanceof Error ? error.message : '알 수 없는 오류', variant: 'destructive' })
    }
  }

  const handleFormSubmit = async (formData: ExchangeRateFormData) => {
    setFormLoading(true)
    try {
      const rate = ExchangeRate.create({
        id: crypto.randomUUID(),
        currencyCode: formData.currency_code as Currency,
        rate: formData.rate,
        effectiveDate: new Date(formData.effective_date),
      })

      await exchangeRateRepository.save(rate)
      setDialogOpen(false)
      await loadData()
      toast({ title: '등록 완료' })
    } catch (error) {
      console.error('저장 실패:', error)
      toast({ title: '저장 실패', description: error instanceof Error ? error.message : '알 수 없는 오류', variant: 'destructive' })
    } finally {
      setFormLoading(false)
    }
  }

  const handleFormCancel = () => {
    setDialogOpen(false)
  }

  // 양식 다운로드
  const handleDownloadTemplate = useCallback(() => {
    const templateData = [
      ['통화(USD/VND 등)', '환율(KRW)', '적용일(YYYY-MM-DD)'],
      ['USD', 1350, '2025-01-01'],
      ['VND', 0.055, '2025-01-01'],
    ]
    const ws = XLSX.utils.aoa_to_sheet(templateData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '환율')
    ws['!cols'] = [{ wch: 20 }, { wch: 15 }, { wch: 20 }]
    XLSX.writeFile(wb, '환율_양식.xlsx')
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
      const parsedData: ExchangeRateRow[] = []
      const validCurrencies = ['USD', 'EUR', 'JPY', 'CNY', 'VND']

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i]
        if (!row || row.length === 0) continue

        const currencyCode = String(row[0] ?? '').trim().toUpperCase()
        const rateValue = parseFloat(String(row[1] ?? '0'))
        const effectiveDateStr = String(row[2] ?? '').trim()

        if (!currencyCode) {
          errors.push(`행 ${i + 1}: 통화 필수`)
          continue
        }
        if (!validCurrencies.includes(currencyCode)) {
          errors.push(`행 ${i + 1}: 지원 통화: ${validCurrencies.join(', ')}`)
          continue
        }
        if (isNaN(rateValue) || rateValue <= 0) {
          errors.push(`행 ${i + 1}: 환율은 0보다 커야 함`)
          continue
        }
        if (!effectiveDateStr || isNaN(Date.parse(effectiveDateStr))) {
          errors.push(`행 ${i + 1}: 적용일 형식 오류 (YYYY-MM-DD)`)
          continue
        }

        parsedData.push({
          id: crypto.randomUUID(),
          currencyCode,
          rate: rateValue,
          effectiveDate: new Date(effectiveDateStr).toISOString(),
          createdAt: new Date().toISOString(),
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
        const rate = ExchangeRate.create({
          id: row.id,
          currencyCode: row.currencyCode as Currency,
          rate: row.rate,
          effectiveDate: new Date(row.effectiveDate),
        })
        await exchangeRateRepository.save(rate)
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

  // 최신 환율 표시
  const latestRates = useMemo(() => {
    const grouped = data.reduce(
      (acc, rate) => {
        if (!acc[rate.currencyCode] || rate.effectiveDate > acc[rate.currencyCode]!.effectiveDate) {
          acc[rate.currencyCode] = rate
        }
        return acc
      },
      {} as Record<string, ExchangeRateRow>
    )
    return Object.values(grouped)
  }, [data])

  return (
    <div className="h-full flex flex-col gap-2">
      {/* 상단 영역: 조회조건 + 기능 */}
      <div className="flex gap-2">
        <ERPGroupBox title="조회조건" className="flex-1">
          <div className="flex items-end gap-4">
            <ERPFormField label="통화">
              <ERPSelect value={filterCurrency} onChange={(e) => setFilterCurrency(e.target.value)} inputSize="md">
                <option value="ALL">전체</option>
                <option value="USD">USD</option>
                <option value="VND">VND</option>
                <option value="EUR">EUR</option>
                <option value="JPY">JPY</option>
                <option value="CNY">CNY</option>
              </ERPSelect>
            </ERPFormField>
            <ERPFormField label="적용일">
              <ERPDateInput value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
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
            { label: '환율등록', icon: <Plus className="h-3 w-3" />, onClick: handleAdd },
            { label: '일괄등록', icon: <Upload className="h-3 w-3" />, onClick: () => fileInputRef.current?.click() },
            { label: '양식다운로드', icon: <FileDown className="h-3 w-3" />, onClick: handleDownloadTemplate },
            { label: '새로고침', icon: <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />, onClick: loadData },
          ]}
        />
        <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={handleFileUpload} className="hidden" />
      </div>

      {/* 최신 환율 요약 */}
      <ERPGroupBox title="현재 적용 환율" className="shrink-0">
        <div className="grid grid-cols-5 gap-4">
          {latestRates.map((rate) => (
            <div key={rate.id} className="p-3 bg-white border border-[#ccc] rounded text-center">
              <div className="text-xs text-gray-500">{rate.currencyCode}</div>
              <div className="text-lg font-bold text-[#4a6fa5]">{formatNumber(rate.rate)} KRW</div>
              <div className="text-xs text-gray-400">
                적용: {format(new Date(rate.effectiveDate), 'yyyy-MM-dd')}
              </div>
            </div>
          ))}
          {latestRates.length === 0 && (
            <div className="col-span-5 text-center text-gray-400 text-sm py-4">
              등록된 환율이 없습니다.
            </div>
          )}
        </div>
      </ERPGroupBox>

      {/* 메인 테이블 */}
      <div className="flex-1 min-h-0">
        <ERPTable columns={columns} data={filteredData} title="환율 이력" pageSize={15} />
      </div>

      {/* 환율 등록 다이얼로그 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>환율 등록</DialogTitle>
          </DialogHeader>
          <ExchangeRateForm
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
            isLoading={formLoading}
          />
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <ConfirmDialogComponent />

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
                  <th className="p-2 border">통화</th>
                  <th className="p-2 border">환율</th>
                  <th className="p-2 border">적용일</th>
                </tr>
              </thead>
              <tbody>
                {uploadData.slice(0, 20).map((row, i) => (
                  <tr key={i}>
                    <td className="p-2 border text-center">{row.currencyCode}</td>
                    <td className="p-2 border text-right">{formatNumber(row.rate)}</td>
                    <td className="p-2 border text-center">{format(new Date(row.effectiveDate), 'yyyy-MM-dd')}</td>
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
