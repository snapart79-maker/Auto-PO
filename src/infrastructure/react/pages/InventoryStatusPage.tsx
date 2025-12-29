/**
 * InventoryStatusPage - 재고 현황 페이지 (ERP 스타일)
 * PRD 5.2 재고 현황
 */

import { useMemo, useState } from 'react'
import { Download, Search, RefreshCw } from 'lucide-react'
import { ERPTable } from '../components/ERPTable'
import {
  ERPGroupBox,
  ERPFormField,
  ERPInput,
  ERPSelect,
  ERPButton,
} from '../components/ERPGroupBox'
import { ERPSummaryPanel, ERPFunctionPanel } from '../components/ERPSummaryPanel'
import { StockStatusBadge, formatStockRatio } from '../components/StockStatusBadge'
import { useInventoryStatus, type InventoryStatusItem, type InventoryStatusFilter } from '../hooks/useInventoryStatus'
import { StockStatus } from '@domain/entities/CurrentInventory'
import type { ColumnDef } from '@tanstack/react-table'

function formatNumber(value: number): string {
  return new Intl.NumberFormat('ko-KR').format(value)
}

export function InventoryStatusPage() {
  const { items, summary, loading, error, search, refresh } = useInventoryStatus()

  // 조회조건 상태
  const [productCode, setProductCode] = useState('')
  const [productName, setProductName] = useState('')
  const [stockStatusFilter, setStockStatusFilter] = useState<string>('ALL')

  const columns: ColumnDef<InventoryStatusItem, unknown>[] = useMemo(
    () => [
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
        accessorKey: 'vehicleName',
        header: '차종',
        cell: ({ row }) => row.original.vehicleName ?? '-',
        size: 100,
      },
      {
        accessorKey: 'currentQty',
        header: '현재고',
        cell: ({ row }) => (
          <span className="text-right block font-medium">{formatNumber(row.original.currentQty)}</span>
        ),
        size: 80,
      },
      {
        accessorKey: 'safetyStock',
        header: '안전재고',
        cell: ({ row }) => (
          <span className="text-right block">{formatNumber(row.original.safetyStock)}</span>
        ),
        size: 80,
      },
      {
        accessorKey: 'stockStatus',
        header: '재고상태',
        cell: ({ row }) => <StockStatusBadge status={row.original.stockStatus} />,
        size: 80,
      },
      {
        accessorKey: 'stockRatio',
        header: '재고비율',
        cell: ({ row }) => formatStockRatio(row.original.stockRatio),
        size: 80,
      },
      {
        accessorKey: 'inboundPending',
        header: '입고예정',
        cell: ({ row }) => (
          <span className="text-right block">{formatNumber(row.original.inboundPending)}</span>
        ),
        size: 80,
      },
      {
        accessorKey: 'availableStock',
        header: '가용재고',
        cell: ({ row }) => (
          <span className="text-right block font-medium text-blue-600">
            {formatNumber(row.original.availableStock)}
          </span>
        ),
        size: 80,
      },
    ],
    []
  )

  const handleSearch = () => {
    const filter: InventoryStatusFilter = {}

    if (productCode.trim()) {
      filter.productCodes = productCode.split(',').map((c) => c.trim())
    }
    if (productName.trim()) {
      filter.productName = productName.trim()
    }
    if (stockStatusFilter !== 'ALL') {
      filter.stockStatus = stockStatusFilter as StockStatus
    }

    search(filter)
  }

  const handleReset = () => {
    setProductCode('')
    setProductName('')
    setStockStatusFilter('ALL')
    search({})
  }

  // 재고 상태별 요약 데이터
  const statusSummaryData = useMemo(() => [
    { status: '정상', count: `${summary.normal}건`, color: 'text-green-600' },
    { status: '주의', count: `${summary.caution}건`, color: 'text-yellow-600' },
    { status: '경고', count: `${summary.warning}건`, color: 'text-orange-600' },
    { status: '위험', count: `${summary.critical}건`, color: 'text-red-600' },
  ], [summary])

  return (
    <div className="h-full flex flex-col gap-2">
      {/* 상단 영역: 조회조건 + 기능 */}
      <div className="flex gap-2">
        {/* 조회조건 */}
        <ERPGroupBox title="조회조건" className="flex-1">
          <div className="grid grid-cols-4 gap-x-6 gap-y-2">
            <ERPFormField label="품번">
              <ERPInput
                value={productCode}
                onChange={(e) => setProductCode(e.target.value)}
                placeholder="콤마(,)로 구분"
                inputSize="lg"
              />
            </ERPFormField>
            <ERPFormField label="품명">
              <ERPInput
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="품명 검색"
                inputSize="lg"
              />
            </ERPFormField>
            <ERPFormField label="재고상태">
              <ERPSelect
                value={stockStatusFilter}
                onChange={(e) => setStockStatusFilter(e.target.value)}
                inputSize="md"
              >
                <option value="ALL">전체</option>
                <option value="NORMAL">정상</option>
                <option value="CAUTION">주의</option>
                <option value="WARNING">경고</option>
                <option value="CRITICAL">위험</option>
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
            { label: '엑셀다운로드', icon: <Download className="h-3 w-3" />, disabled: true },
            {
              label: '새로고침',
              icon: <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />,
              onClick: refresh,
            },
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
            title="재고 목록"
            pageSize={20}
            enableSelection
          />
        </div>

        {/* 사이드 요약 패널 */}
        <div className="w-64 flex flex-col gap-2">
          {/* 재고 상태 요약 */}
          <ERPSummaryPanel
            title="재고 상태 요약"
            columns={[
              { key: 'status', header: '상태', align: 'left' },
              { key: 'count', header: '건수', align: 'right' },
            ]}
            data={statusSummaryData}
            totalRow={{ count: `${summary.total}건` }}
          />

          {/* 부족 재고 알림 */}
          {(summary.warning > 0 || summary.critical > 0) && (
            <div className="border border-orange-400 bg-orange-50 rounded p-3">
              <div className="text-xs font-medium text-orange-700 mb-2">
                부족 재고 알림
              </div>
              <p className="text-xs text-orange-600">
                경고/위험 상태 품목 {summary.warning + summary.critical}건에 대한
                발주 검토가 필요합니다.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default InventoryStatusPage
