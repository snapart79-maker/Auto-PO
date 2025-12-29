/**
 * MRPPage - MRP 계산 / 발주 권고 페이지
 * PRD 6.3 MRP 계산 / 발주 권고
 * PRD 3.2 레이아웃 패턴 적용
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calculator, RefreshCw, ShoppingCart, CheckSquare, Download, AlertTriangle } from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Badge } from '../components/ui/badge'
import { Checkbox } from '../components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table'
import { useMRP } from '../hooks/useMRP'
import { useSystemSettings } from '../hooks/useSystemSettings'
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

function formatNumber(value: number): string {
  return new Intl.NumberFormat('ko-KR').format(value)
}

export function MRPPage() {
  const navigate = useNavigate()

  const {
    step,
    results,
    products,
    error,
    loadProducts,
    calculateWithSplit,
  } = useMRP({
    productRepository,
    inventoryRepository,
    orderRepository,
  })

  // 시스템 설정 (평균 납품량 기준 일수)
  const { avgShipmentDays, loading: settingsLoading } = useSystemSettings()

  // 필터 상태
  const [vehicleModels, setVehicleModels] = useState<VehicleModel[]>([])
  const [selectedVehicleModelId, setSelectedVehicleModelId] = useState<string>('all')
  const [productCodeFilter, setProductCodeFilter] = useState<string>('')
  const [showOnlyNeedsOrder, setShowOnlyNeedsOrder] = useState(false)
  const [dateRangeDays, setDateRangeDays] = useState<number>(365)

  // 체크박스 선택 상태
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // 자동 계산 여부 추적
  const [hasAutoCalculated, setHasAutoCalculated] = useState(false)

  // 시스템 설정이 로드되면 dateRangeDays 업데이트
  useEffect(() => {
    if (!settingsLoading && avgShipmentDays > 0) {
      setDateRangeDays(avgShipmentDays)
    }
  }, [avgShipmentDays, settingsLoading])

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
    setSelectedIds(new Set()) // 계산 후 선택 초기화
  }, [calculateWithSplit, products, dateRange])

  // 화면 진입 시 자동 MRP 계산
  useEffect(() => {
    if (products.length > 0 && !hasAutoCalculated && step === 'idle') {
      handleCalculate()
      setHasAutoCalculated(true)
    }
  }, [products, hasAutoCalculated, step, handleCalculate])

  // 필터링된 결과
  const filteredResults = useMemo(() => {
    let filtered = results

    // 발주 필요 필터
    if (showOnlyNeedsOrder) {
      filtered = filtered.filter((r) => r.needsOrder && r.recommendedQuantity > 0)
    }

    // 품번 필터
    if (productCodeFilter.trim()) {
      const codes = productCodeFilter.split(',').map((c) => c.trim().toLowerCase())
      filtered = filtered.filter((r) =>
        codes.some((code) => r.productCode.toLowerCase().includes(code))
      )
    }

    return filtered
  }, [results, showOnlyNeedsOrder, productCodeFilter])

  // 전체 선택/해제
  const handleSelectAll = useCallback(() => {
    if (selectedIds.size === filteredResults.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredResults.map((r) => r.productId)))
    }
  }, [filteredResults, selectedIds.size])

  // 개별 선택
  const handleSelectItem = useCallback((productId: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev)
      if (checked) {
        newSet.add(productId)
      } else {
        newSet.delete(productId)
      }
      return newSet
    })
  }, [])

  // 선택 발주
  const handleSelectedOrder = useCallback(() => {
    if (selectedIds.size === 0) return
    // TODO: 선택된 품목으로 발주서 생성 후 PurchaseOrdersPage로 이동
    console.log('선택 발주:', Array.from(selectedIds))
    navigate('/orders')
  }, [selectedIds, navigate])

  // 전체 발주 (발주권고량 > 0 품목)
  const handleAllOrder = useCallback(() => {
    const orderableItems = filteredResults.filter((r) => r.recommendedQuantity > 0)
    if (orderableItems.length === 0) return
    // TODO: 발주권고량 > 0 품목으로 발주서 생성 후 PurchaseOrdersPage로 이동
    console.log('전체 발주:', orderableItems.map((r) => r.productId))
    navigate('/orders')
  }, [filteredResults, navigate])

  // 통계 계산
  const stats = useMemo(() => {
    const total = filteredResults.length
    const needsOrderCount = filteredResults.filter((r) => r.needsOrder && r.recommendedQuantity > 0).length
    const totalRecommendedQty = filteredResults
      .filter((r) => r.recommendedQuantity > 0)
      .reduce((sum, r) => sum + r.recommendedQuantity, 0)
    const dualSourcingCount = filteredResults.filter((r) => r.supplierType === 'BOTH').length
    const domesticCount = filteredResults.filter((r) => r.supplierType === 'DOMESTIC').length
    const vietnamCount = filteredResults.filter((r) => r.supplierType === 'VIETNAM').length

    return { total, needsOrderCount, totalRecommendedQty, dualSourcingCount, domesticCount, vietnamCount }
  }, [filteredResults])

  // 발주처별 상태 표시
  const getSupplierBadge = (supplierType: string) => {
    switch (supplierType) {
      case 'DOMESTIC':
        return <Badge variant="default">국내</Badge>
      case 'VIETNAM':
        return <Badge variant="secondary">베트남</Badge>
      case 'BOTH':
        return <Badge className="bg-purple-500 text-white">이원화</Badge>
      default:
        return <Badge variant="outline">-</Badge>
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* 헤더 */}
      <PageHeader
        title="MRP 계산 / 발주 권고"
        description="품목별 안전재고, 발주점, 순소요량을 계산하고 발주 권고를 생성합니다."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCalculate} disabled={step === 'calculating' || products.length === 0}>
              <RefreshCw className={`h-4 w-4 mr-2 ${step === 'calculating' ? 'animate-spin' : ''}`} />
              MRP 재계산
            </Button>
          </div>
        }
      />

      <div className="flex-1 p-6 space-y-6 overflow-auto">
        {/* 조회조건 + 기능 버튼 */}
        <div className="flex gap-4">
          <Card className="flex-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">조회조건</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-4">
                <div className="space-y-2">
                  <Label>차종</Label>
                  <Select
                    value={selectedVehicleModelId}
                    onValueChange={setSelectedVehicleModelId}
                  >
                    <SelectTrigger>
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
                <div className="space-y-2">
                  <Label>품번</Label>
                  <Input
                    placeholder="콤마(,)로 구분"
                    value={productCodeFilter}
                    onChange={(e) => setProductCodeFilter(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>일평균 기간</Label>
                  <Select
                    value={String(dateRangeDays)}
                    onValueChange={(v) => setDateRangeDays(parseInt(v, 10))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">최근 30일</SelectItem>
                      <SelectItem value="60">최근 60일</SelectItem>
                      <SelectItem value="90">최근 90일</SelectItem>
                      <SelectItem value="180">최근 180일</SelectItem>
                      <SelectItem value="365">최근 365일 (1년)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>필터</Label>
                  <Select
                    value={showOnlyNeedsOrder ? 'needs' : 'all'}
                    onValueChange={(v) => setShowOnlyNeedsOrder(v === 'needs')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체</SelectItem>
                      <SelectItem value="needs">발주 필요만</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end gap-2">
                  <Button onClick={handleCalculate} disabled={step === 'calculating' || products.length === 0}>
                    {step === 'calculating' ? '계산 중...' : '조회'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="w-56 shrink-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">발주 생성</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                className="w-full justify-start"
                onClick={handleSelectedOrder}
                disabled={selectedIds.size === 0}
              >
                <CheckSquare className="h-4 w-4 mr-2" />
                선택 발주 ({selectedIds.size}건)
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleAllOrder}
                disabled={stats.needsOrderCount === 0}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                전체 발주 ({stats.needsOrderCount}건)
              </Button>
              <Button variant="outline" className="w-full justify-start" disabled>
                <Download className="h-4 w-4 mr-2" />
                엑셀 다운로드
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* 에러 표시 */}
        {error && (
          <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {/* 메인 테이블 + 사이드 요약 */}
        <div className="flex gap-6">
          {/* 메인 테이블 (70%) */}
          <Card className="flex-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                MRP 계산 결과
                <Badge variant="secondary" className="ml-2">
                  {filteredResults.length}건
                </Badge>
                {selectedIds.size > 0 && (
                  <Badge variant="default" className="ml-1">
                    {selectedIds.size}건 선택
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {step === 'calculating' ? (
                <div className="flex items-center justify-center py-12">
                  <p className="text-muted-foreground">MRP 계산 중...</p>
                </div>
              ) : filteredResults.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Calculator className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    {results.length === 0 ? 'MRP 계산 결과가 없습니다' : '조건에 맞는 결과가 없습니다'}
                  </p>
                </div>
              ) : (
                <div className="border rounded-lg max-h-[600px] overflow-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background z-10">
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={selectedIds.size === filteredResults.length && filteredResults.length > 0}
                            onCheckedChange={handleSelectAll}
                          />
                        </TableHead>
                        <TableHead>품번</TableHead>
                        <TableHead>품명</TableHead>
                        <TableHead className="text-right">현재고</TableHead>
                        <TableHead className="text-right">안전재고</TableHead>
                        <TableHead className="text-right">순소요량</TableHead>
                        <TableHead className="text-right">입고예정</TableHead>
                        <TableHead className="text-right">발주권고량</TableHead>
                        <TableHead>발주처</TableHead>
                        <TableHead>상태</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredResults.map((result) => (
                        <TableRow key={result.productId} className={result.needsOrder ? 'bg-orange-50/50' : ''}>
                          <TableCell>
                            <Checkbox
                              checked={selectedIds.has(result.productId)}
                              onCheckedChange={(checked: boolean) => handleSelectItem(result.productId, checked)}
                            />
                          </TableCell>
                          <TableCell className="font-mono text-sm">{result.productCode}</TableCell>
                          <TableCell>{result.productName}</TableCell>
                          <TableCell className="text-right">{formatNumber(result.currentStock)}</TableCell>
                          <TableCell className="text-right">{formatNumber(result.safetyStock)}</TableCell>
                          <TableCell className="text-right">{formatNumber(result.netRequirement)}</TableCell>
                          <TableCell className="text-right">{formatNumber(result.pendingOrders)}</TableCell>
                          <TableCell className="text-right font-bold">
                            {result.recommendedQuantity > 0 ? (
                              <span className="text-destructive">{formatNumber(result.recommendedQuantity)}</span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>{getSupplierBadge(result.supplierType)}</TableCell>
                          <TableCell>
                            {result.needsOrder ? (
                              <Badge variant="destructive">발주 필요</Badge>
                            ) : (
                              <Badge variant="outline">충분</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 사이드 요약 (30%) */}
          <div className="w-80 shrink-0 space-y-4">
            {/* MRP 요약 */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">MRP 요약</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center p-2 bg-muted/50 rounded-md">
                  <span className="text-sm">전체 품목</span>
                  <span className="font-bold">{stats.total}건</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-orange-50 rounded-md">
                  <span className="text-sm text-orange-700">발주 필요</span>
                  <span className="font-bold text-orange-700">{stats.needsOrderCount}건</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-muted/50 rounded-md">
                  <span className="text-sm">권장 총수량</span>
                  <span className="font-bold">{formatNumber(stats.totalRecommendedQty)}</span>
                </div>
              </CardContent>
            </Card>

            {/* 발주처별 현황 */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">발주처별 현황</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center p-2 bg-blue-50 rounded-md">
                  <span className="text-sm">국내</span>
                  <span className="font-bold text-blue-700">{stats.domesticCount}건</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-green-50 rounded-md">
                  <span className="text-sm">베트남</span>
                  <span className="font-bold text-green-700">{stats.vietnamCount}건</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-purple-50 rounded-md">
                  <span className="text-sm">이원화</span>
                  <span className="font-bold text-purple-700">{stats.dualSourcingCount}건</span>
                </div>
              </CardContent>
            </Card>

            {/* 발주 알림 */}
            {stats.needsOrderCount > 0 && (
              <Card className="border-orange-200 bg-orange-50/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-orange-700 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    발주 권고 알림
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-orange-600">
                    {stats.needsOrderCount}개 품목의 재고가 부족합니다.
                    발주 검토가 필요합니다.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* 설정 정보 */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">계산 설정</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-1">
                <p>평균 납품량 기준: <span className="font-medium text-foreground">{dateRangeDays}일</span></p>
                <p>기준일: <span className="font-medium text-foreground">{new Date().toLocaleDateString('ko-KR')}</span></p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MRPPage
