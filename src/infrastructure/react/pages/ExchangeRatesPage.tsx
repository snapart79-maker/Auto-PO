/**
 * ExchangeRatesPage - 환율 관리 페이지
 */

import { useState, useEffect, useMemo } from 'react'
import { format } from 'date-fns'
import { PageHeader } from '../components/PageHeader'
import { DataTable, type ColumnDef } from '../components/DataTable'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
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
import { SupabaseExchangeRateRepository } from '@infrastructure/repositories'
import { ExchangeRate } from '@domain/entities/ExchangeRate'
import type { Currency } from '@domain/valueObjects/Money'
import { Plus, Trash2 } from 'lucide-react'

const exchangeRateRepository = new SupabaseExchangeRateRepository()

interface ExchangeRateRow {
  id: string
  currencyCode: string
  rate: number
  effectiveDate: string
  createdAt: string
}

export function ExchangeRatesPage() {
  const [data, setData] = useState<ExchangeRateRow[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    currencyCode: 'USD',
    rate: 1300,
    effectiveDate: format(new Date(), 'yyyy-MM-dd'),
  })

  const columns: ColumnDef<ExchangeRateRow>[] = useMemo(
    () => [
      {
        accessorKey: 'effectiveDate',
        header: '적용일',
        cell: ({ row }) => format(new Date(row.original.effectiveDate), 'yyyy-MM-dd'),
      },
      {
        accessorKey: 'currencyCode',
        header: '통화',
      },
      {
        accessorKey: 'rate',
        header: '환율 (KRW)',
        cell: ({ row }) => row.original.rate.toLocaleString(),
      },
      {
        accessorKey: 'createdAt',
        header: '등록일시',
        cell: ({ row }) => format(new Date(row.original.createdAt), 'yyyy-MM-dd HH:mm'),
      },
      {
        id: 'actions',
        header: '작업',
        cell: ({ row }) => (
          <Button variant="ghost" size="icon" onClick={() => handleDelete(row.original.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
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

  const handleAdd = () => {
    setFormData({
      currencyCode: 'USD',
      rate: 1300,
      effectiveDate: format(new Date(), 'yyyy-MM-dd'),
    })
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('이 환율을 삭제하시겠습니까?')) return

    try {
      await exchangeRateRepository.delete(id)
      await loadData()
    } catch (error) {
      console.error('삭제 실패:', error)
      alert('삭제 중 오류가 발생했습니다.')
    }
  }

  const handleSubmit = async () => {
    try {
      const rate = ExchangeRate.create({
        id: crypto.randomUUID(),
        currencyCode: formData.currencyCode as Currency,
        rate: formData.rate,
        effectiveDate: new Date(formData.effectiveDate),
      })

      await exchangeRateRepository.save(rate)
      setDialogOpen(false)
      await loadData()
    } catch (error) {
      console.error('저장 실패:', error)
      alert(error instanceof Error ? error.message : '저장 중 오류가 발생했습니다.')
    }
  }

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
        title="환율 관리"
        description="외화 거래에 적용할 환율을 관리합니다."
        actions={
          <Button onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-2" />
            환율 등록
          </Button>
        }
      />

      <div className="flex-1 p-6 overflow-auto space-y-6">
        {/* 최신 환율 요약 */}
        <div className="grid grid-cols-4 gap-4">
          {latestRates.map((rate) => (
            <div key={rate.id} className="rounded-lg border bg-card p-4">
              <div className="text-sm text-muted-foreground">{rate.currencyCode}</div>
              <div className="text-2xl font-bold">{rate.rate.toLocaleString()} KRW</div>
              <div className="text-xs text-muted-foreground">
                적용일: {format(new Date(rate.effectiveDate), 'yyyy-MM-dd')}
              </div>
            </div>
          ))}
        </div>

        {/* 환율 이력 */}
        <div>
          <h3 className="text-lg font-semibold mb-4">환율 이력</h3>
          <DataTable columns={columns} data={data} searchPlaceholder="통화코드로 검색..." />
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>환율 등록</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="currencyCode">통화</Label>
              <Select
                value={formData.currencyCode}
                onValueChange={(value) => setFormData({ ...formData, currencyCode: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD (미국 달러)</SelectItem>
                  <SelectItem value="EUR">EUR (유로)</SelectItem>
                  <SelectItem value="JPY">JPY (일본 엔)</SelectItem>
                  <SelectItem value="CNY">CNY (중국 위안)</SelectItem>
                  <SelectItem value="VND">VND (베트남 동)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rate">환율 (1단위당 KRW)</Label>
              <Input
                id="rate"
                type="number"
                min={0}
                step={0.01}
                value={formData.rate}
                onChange={(e) => setFormData({ ...formData, rate: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="effectiveDate">적용일</Label>
              <Input
                id="effectiveDate"
                type="date"
                value={formData.effectiveDate}
                onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
              />
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
