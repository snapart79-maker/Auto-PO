/**
 * TransactionSearchForm - 입고/출고 조회조건 폼
 * PRD 4.1.1 / 4.2 조회조건 구현
 */

import { useState, useCallback } from 'react'
import { Search, RotateCcw } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent } from './ui/card'
import { DateRangePicker } from './ui/date-picker'

export interface TransactionFilter {
  startDate?: Date
  endDate?: Date
  productCodes?: string[]
  productName?: string
  partnerCodes?: string[]
}

interface TransactionSearchFormProps {
  transactionType: 'IN' | 'OUT'
  onSearch: (filter: TransactionFilter) => void
  loading?: boolean
}

export function TransactionSearchForm({
  transactionType,
  onSearch,
  loading = false,
}: TransactionSearchFormProps) {
  const [startDate, setStartDate] = useState<Date | undefined>(
    () => {
      const date = new Date()
      date.setMonth(date.getMonth() - 1)
      return date
    }
  )
  const [endDate, setEndDate] = useState<Date | undefined>(() => new Date())
  const [productCodesInput, setProductCodesInput] = useState('')
  const [productName, setProductName] = useState('')
  const [partnerCodesInput, setPartnerCodesInput] = useState('')

  const partnerLabel = transactionType === 'IN' ? '공급사' : '고객사'

  const parseCommaSeparated = (input: string): string[] => {
    return input
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
  }

  const handleSearch = useCallback(() => {
    const filter: TransactionFilter = {
      startDate,
      endDate,
      productCodes: parseCommaSeparated(productCodesInput),
      productName: productName.trim() || undefined,
      partnerCodes: parseCommaSeparated(partnerCodesInput),
    }
    onSearch(filter)
  }, [startDate, endDate, productCodesInput, productName, partnerCodesInput, onSearch])

  const handleReset = useCallback(() => {
    const defaultStart = new Date()
    defaultStart.setMonth(defaultStart.getMonth() - 1)
    setStartDate(defaultStart)
    setEndDate(new Date())
    setProductCodesInput('')
    setProductName('')
    setPartnerCodesInput('')
  }, [])

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 기간 */}
          <div className="lg:col-span-2 space-y-2">
            <Label>기간</Label>
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
              disabled={loading}
            />
          </div>

          {/* 품번 */}
          <div className="space-y-2">
            <Label htmlFor="productCodes">품번</Label>
            <Input
              id="productCodes"
              placeholder="콤마(,)로 구분하여 입력"
              value={productCodesInput}
              onChange={(e) => setProductCodesInput(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* 품명 */}
          <div className="space-y-2">
            <Label htmlFor="productName">품명</Label>
            <Input
              id="productName"
              placeholder="품명 검색"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* 거래처 */}
          <div className="space-y-2">
            <Label htmlFor="partnerCodes">{partnerLabel}</Label>
            <Input
              id="partnerCodes"
              placeholder="콤마(,)로 구분하여 입력"
              value={partnerCodesInput}
              onChange={(e) => setPartnerCodesInput(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* 버튼 */}
          <div className="flex items-end gap-2 lg:col-span-3 justify-end">
            <Button variant="outline" onClick={handleReset} disabled={loading}>
              <RotateCcw className="h-4 w-4 mr-2" />
              초기화
            </Button>
            <Button onClick={handleSearch} disabled={loading}>
              <Search className="h-4 w-4 mr-2" />
              조회
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
