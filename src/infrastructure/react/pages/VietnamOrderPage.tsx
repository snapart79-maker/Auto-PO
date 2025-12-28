/**
 * VietnamOrderPage - 베트남 주간 통합 발주 페이지
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { PageHeader } from '../components/PageHeader'
import { VietnamOrderSummary } from '../components/VietnamOrderSummary'
import { MRPResultsTable } from '../components/MRPResultsTable'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Badge } from '../components/ui/badge'
import { useMRP } from '../hooks/useMRP'
import {
  useVietnamOrder,
  getCurrentWeekRange,
  getNextFriday,
} from '../hooks/useVietnamOrder'
import { DateRange } from '@domain/valueObjects/DateRange'
import { useToast } from '../components/ui/toast'
import { SupabaseProductRepository } from '../../repositories/SupabaseProductRepository'
import { SupabaseInventoryRepository } from '../../repositories/SupabaseInventoryRepository'
import { SupabaseOrderRepository } from '../../repositories/SupabaseOrderRepository'
import { SupabasePartnerRepository } from '../../repositories/SupabasePartnerRepository'
import type { Partner } from '@domain/entities/Partner'

// Repository 인스턴스
const productRepository = new SupabaseProductRepository()
const inventoryRepository = new SupabaseInventoryRepository()
const orderRepository = new SupabaseOrderRepository()
const partnerRepository = new SupabasePartnerRepository()

export function VietnamOrderPage() {
  const { toast } = useToast()

  // MRP 훅
  const {
    results: mrpResults,
    products,
    loadProducts,
    calculateWithSplit,
    step: mrpStep,
  } = useMRP({
    productRepository,
    inventoryRepository,
    orderRepository,
  })

  // Vietnam 발주 훅
  const {
    step,
    consolidatedOrder,
    recommendations,
    error,
    setWeekRange,
    setShipmentDate,
    extractVietnamRecommendations,
    generatePreview,
    reset,
  } = useVietnamOrder()

  // 베트남 거래처 목록
  const [vietnamPartners, setVietnamPartners] = useState<Partner[]>([])
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>('')

  // 날짜 입력
  const [startDateInput, setStartDateInput] = useState('')
  const [endDateInput, setEndDateInput] = useState('')
  const [shipmentDateInput, setShipmentDateInput] = useState('')

  // 초기화
  useEffect(() => {
    // 주간 범위 초기화
    const defaultWeekRange = getCurrentWeekRange()
    setWeekRange(defaultWeekRange)
    setStartDateInput(formatDateForInput(defaultWeekRange.startDate))
    setEndDateInput(formatDateForInput(defaultWeekRange.endDate))

    // 선적일 초기화
    const defaultShipmentDate = getNextFriday()
    setShipmentDate(defaultShipmentDate)
    setShipmentDateInput(formatDateForInput(defaultShipmentDate))

    // 제품 로드
    loadProducts({ isActive: true })

    // 베트남 거래처 로드
    const loadVietnamPartners = async () => {
      try {
        const allPartners = await partnerRepository.findAll({ isActive: true })
        const vietnamOnly = allPartners.filter((p) => p.partnerType.isVietnam())
        setVietnamPartners(vietnamOnly)
        if (vietnamOnly.length > 0) {
          setSelectedPartnerId(vietnamOnly[0]!.id)
        }
      } catch (err) {
        console.error('베트남 거래처 로드 실패:', err)
      }
    }
    loadVietnamPartners()
  }, [loadProducts, setWeekRange, setShipmentDate])

  // MRP 계산
  const handleCalculateMRP = useCallback(async () => {
    if (products.length === 0) return

    // 지난 30일 기준 일평균 계산
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 30)
    const dateRange = DateRange.create(startDate, endDate)

    const productIds = products.map((p) => p.id)
    await calculateWithSplit(productIds, dateRange)
  }, [calculateWithSplit, products])

  // 베트남 발주 권고 추출
  useEffect(() => {
    if (mrpResults.length > 0 && selectedPartnerId) {
      extractVietnamRecommendations(mrpResults, products, selectedPartnerId)
    }
  }, [mrpResults, products, selectedPartnerId, extractVietnamRecommendations])

  // 날짜 변경 핸들러
  const handleDateRangeChange = useCallback(() => {
    try {
      const start = new Date(startDateInput)
      const end = new Date(endDateInput)
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        setWeekRange(DateRange.create(start, end))
      }
    } catch (err) {
      console.error('날짜 범위 오류:', err)
    }
  }, [startDateInput, endDateInput, setWeekRange])

  const handleShipmentDateChange = useCallback(() => {
    try {
      const date = new Date(shipmentDateInput)
      if (!isNaN(date.getTime())) {
        setShipmentDate(date)
      }
    } catch (err) {
      console.error('선적일 오류:', err)
    }
  }, [shipmentDateInput, setShipmentDate])

  // 미리보기 생성
  const handleGeneratePreview = useCallback(() => {
    handleDateRangeChange()
    handleShipmentDateChange()
    generatePreview()
  }, [handleDateRangeChange, handleShipmentDateChange, generatePreview])

  // 발주 생성 (실제 저장은 Phase 7에서 구현)
  const handleCreateOrder = useCallback(() => {
    toast({
      title: '발주 생성',
      description: '발주 생성 기능은 Phase 7에서 구현됩니다.',
    })
  }, [toast])

  // 베트남 발주 권고 필터링
  const vietnamRecommendations = useMemo(() => {
    return mrpResults.filter((r) => {
      const product = products.find((p) => p.id === r.productId)
      if (!product) return false
      if (!r.needsOrder || r.recommendedQuantity <= 0) return false
      return product.isVietnamOnly() || product.isDualSourcing()
    })
  }, [mrpResults, products])

  return (
    <div className="space-y-6">
      <PageHeader
        title="베트남 주간 통합 발주"
        description="월~목 발주 권고를 금요일에 통합하여 단일 발주로 생성합니다"
      />

      {/* 설정 패널 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">발주 설정</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            {/* 주간 시작일 */}
            <div className="space-y-2">
              <Label>주간 시작일</Label>
              <Input
                type="date"
                value={startDateInput}
                onChange={(e) => setStartDateInput(e.target.value)}
              />
            </div>

            {/* 주간 종료일 */}
            <div className="space-y-2">
              <Label>주간 종료일</Label>
              <Input
                type="date"
                value={endDateInput}
                onChange={(e) => setEndDateInput(e.target.value)}
              />
            </div>

            {/* 선적일 */}
            <div className="space-y-2">
              <Label>선적일</Label>
              <Input
                type="date"
                value={shipmentDateInput}
                onChange={(e) => setShipmentDateInput(e.target.value)}
              />
            </div>

            {/* 거래처 선택 */}
            <div className="space-y-2">
              <Label>베트남 거래처</Label>
              <select
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
                value={selectedPartnerId}
                onChange={(e) => setSelectedPartnerId(e.target.value)}
              >
                {vietnamPartners.map((partner) => (
                  <option key={partner.id} value={partner.id}>
                    {partner.partnerName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button
              onClick={handleCalculateMRP}
              disabled={mrpStep === 'calculating' || products.length === 0}
            >
              {mrpStep === 'calculating' ? '계산 중...' : 'MRP 계산'}
            </Button>
            <Button
              variant="secondary"
              onClick={handleGeneratePreview}
              disabled={recommendations.length === 0}
            >
              통합 발주 미리보기
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

      {/* 베트남 발주 권고 테이블 */}
      {vietnamRecommendations.length > 0 && !consolidatedOrder && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>베트남 발주 권고</span>
              <Badge>{vietnamRecommendations.length}개 제품</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MRPResultsTable data={vietnamRecommendations} showOnlyNeedsOrder />
          </CardContent>
        </Card>
      )}

      {/* 통합 발주 미리보기 */}
      {consolidatedOrder && (
        <>
          <VietnamOrderSummary order={consolidatedOrder} />

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={reset}>
              취소
            </Button>
            <Button onClick={handleCreateOrder}>발주 생성</Button>
          </div>
        </>
      )}

      {/* 빈 상태 */}
      {mrpResults.length === 0 && step === 'idle' && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">
              MRP 계산을 실행하면 베트남 발주 권고가 표시됩니다
            </p>
            <Button
              onClick={handleCalculateMRP}
              disabled={products.length === 0}
            >
              MRP 계산 시작
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// 날짜를 input[type="date"]용 문자열로 포맷
function formatDateForInput(date: Date): string {
  return date.toISOString().split('T')[0]!
}
