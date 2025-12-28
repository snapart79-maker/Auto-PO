/**
 * MRPPage - MRP 계산 결과 페이지
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { PageHeader } from '../components/PageHeader'
import { MRPResultsTable } from '../components/MRPResultsTable'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select'
import { Switch } from '../components/ui/switch'
import { Label } from '../components/ui/label'
import { useMRP } from '../hooks/useMRP'
import { DateRange } from '@domain/valueObjects/DateRange'
import { SupabaseProductRepository } from '../../repositories/SupabaseProductRepository'
import { SupabaseInventoryRepository } from '../../repositories/SupabaseInventoryRepository'
import { SupabaseOrderRepository } from '../../repositories/SupabaseOrderRepository'
import { SupabaseVehicleModelRepository } from '../../repositories/SupabaseVehicleModelRepository'
import type { VehicleModel } from '@domain/entities/VehicleModel'

// Repository 인스턴스
const productRepository = new SupabaseProductRepository()
const inventoryRepository = new SupabaseInventoryRepository()
const orderRepository = new SupabaseOrderRepository()
const vehicleModelRepository = new SupabaseVehicleModelRepository()

export function MRPPage() {
  const {
    step,
    results,
    orderRecommendations,
    products,
    error,
    loadProducts,
    calculateWithSplit,
  } = useMRP({
    productRepository,
    inventoryRepository,
    orderRepository,
  })

  // 필터 상태
  const [vehicleModels, setVehicleModels] = useState<VehicleModel[]>([])
  const [selectedVehicleModelId, setSelectedVehicleModelId] = useState<string>('all')
  const [showOnlyNeedsOrder, setShowOnlyNeedsOrder] = useState(false)
  const [dateRangeDays, setDateRangeDays] = useState(30)

  // 차종 목록 로드
  useEffect(() => {
    const loadVehicleModels = async () => {
      try {
        const models = await vehicleModelRepository.findAll({ isActive: true })
        setVehicleModels(models)
      } catch (err) {
        console.error('차종 로드 실패:', err)
      }
    }
    loadVehicleModels()
  }, [])

  // 제품 로드
  useEffect(() => {
    loadProducts({
      vehicleModelId: selectedVehicleModelId === 'all' ? undefined : selectedVehicleModelId,
      isActive: true,
    })
  }, [loadProducts, selectedVehicleModelId])

  // DateRange 계산
  const dateRange = useMemo(() => {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - dateRangeDays)
    return DateRange.create(startDate, endDate)
  }, [dateRangeDays])

  // MRP 계산 실행
  const handleCalculate = useCallback(async () => {
    if (products.length === 0) return
    const productIds = products.map((p) => p.id)
    await calculateWithSplit(productIds, dateRange)
  }, [calculateWithSplit, products, dateRange])

  // 통계 계산
  const stats = useMemo(() => {
    const total = results.length
    const needsOrderCount = orderRecommendations.length
    const totalRecommendedQty = orderRecommendations.reduce(
      (sum, r) => sum + r.recommendedQuantity,
      0
    )
    const dualSourcingCount = results.filter((r) => r.supplierType === 'BOTH').length

    return { total, needsOrderCount, totalRecommendedQty, dualSourcingCount }
  }, [results, orderRecommendations])

  return (
    <div className="space-y-6">
      <PageHeader
        title="MRP 계산"
        description="제품별 안전재고, 발주점, 순소요량을 계산합니다"
      />

      {/* 필터 및 옵션 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">계산 옵션</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            {/* 차종 필터 */}
            <div className="space-y-2">
              <Label>차종</Label>
              <Select
                value={selectedVehicleModelId}
                onValueChange={setSelectedVehicleModelId}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="전체" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  {vehicleModels.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.vehicleName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 기간 설정 */}
            <div className="space-y-2">
              <Label>일평균 계산 기간</Label>
              <Select
                value={String(dateRangeDays)}
                onValueChange={(v) => setDateRangeDays(parseInt(v, 10))}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">최근 7일</SelectItem>
                  <SelectItem value="14">최근 14일</SelectItem>
                  <SelectItem value="30">최근 30일</SelectItem>
                  <SelectItem value="60">최근 60일</SelectItem>
                  <SelectItem value="90">최근 90일</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 발주 필요 필터 */}
            <div className="flex items-center space-x-2">
              <Switch
                id="needs-order-filter"
                checked={showOnlyNeedsOrder}
                onCheckedChange={setShowOnlyNeedsOrder}
              />
              <Label htmlFor="needs-order-filter">발주 필요 항목만</Label>
            </div>

            {/* 계산 버튼 */}
            <Button
              onClick={handleCalculate}
              disabled={step === 'calculating' || products.length === 0}
            >
              {step === 'calculating' ? '계산 중...' : 'MRP 계산'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 에러 표시 */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* 통계 카드 */}
      {results.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                총 제품
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                발주 필요
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {stats.needsOrderCount}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                권장 총수량
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalRecommendedQty.toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                이원화 제품
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.dualSourcingCount}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* MRP 결과 테이블 */}
      {results.length > 0 && (
        <MRPResultsTable data={results} showOnlyNeedsOrder={showOnlyNeedsOrder} />
      )}

      {/* 빈 상태 */}
      {step === 'idle' && results.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">
              MRP 계산을 실행하면 결과가 여기에 표시됩니다
            </p>
            <Button onClick={handleCalculate} disabled={products.length === 0}>
              MRP 계산 시작
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
