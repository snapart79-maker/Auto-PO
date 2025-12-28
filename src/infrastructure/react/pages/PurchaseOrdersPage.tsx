/**
 * PurchaseOrdersPage - 발주 관리 페이지
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { PageHeader } from '../components/PageHeader'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Input } from '../components/ui/input'
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
import {
  usePurchaseOrder,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_VARIANTS,
  ORDER_TYPE_LABELS,
  type CreateOrderInput,
} from '../hooks/usePurchaseOrder'
import { SupabaseOrderRepository } from '../../repositories/SupabaseOrderRepository'
import { SupabasePartnerRepository } from '../../repositories/SupabasePartnerRepository'
import { SupabaseProductRepository } from '../../repositories/SupabaseProductRepository'
import type { PurchaseOrder } from '@domain/entities/PurchaseOrder'
import type { Partner } from '@domain/entities/Partner'
import type { Product } from '@domain/entities/Product'
import { Plus, Search, Eye, FileText, ChevronLeft, ChevronRight } from 'lucide-react'
import { OrderDetailDialog } from '../components/OrderDetailDialog'
import { OrderFormDialog, type OrderFormData } from '../components/OrderFormDialog'

// Repository 인스턴스
const orderRepository = new SupabaseOrderRepository()
const partnerRepository = new SupabasePartnerRepository()
const productRepository = new SupabaseProductRepository()

const PAGE_SIZE = 10

// 기본 회사 ID (실제로는 인증된 사용자의 회사 ID를 사용)
const DEFAULT_COMPANY_ID = 'default-company'

export function PurchaseOrdersPage() {
  const {
    step,
    orders,
    selectedOrder,
    logs,
    error,
    loadOrders,
    loadOrder,
    loadLogs,
    createOrder,
    confirmOrder,
    sendOrder,
    completeOrder,
    cancelOrder,
    clearSelectedOrder,
  } = usePurchaseOrder({ orderRepository, partnerRepository })

  // 필터 상태
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  // 거래처 목록 (이름 표시용)
  const [partners, setPartners] = useState<Partner[]>([])

  // 제품 목록 (발주 생성용)
  const [products, setProducts] = useState<Product[]>([])

  // 상세 다이얼로그 상태
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)

  // 생성/수정 다이얼로그 상태
  const [formDialogOpen, setFormDialogOpen] = useState(false)

  // 초기 로드
  useEffect(() => {
    loadOrders()
    loadPartners()
    loadProducts()
  }, [loadOrders])

  // 거래처 로드
  const loadPartners = async () => {
    try {
      const allPartners = await partnerRepository.findAll()
      setPartners(allPartners)
    } catch (err) {
      console.error('거래처 로드 실패:', err)
    }
  }

  // 제품 로드
  const loadProducts = async () => {
    try {
      const allProducts = await productRepository.findAll({ isActive: true })
      setProducts(allProducts)
    } catch (err) {
      console.error('제품 로드 실패:', err)
    }
  }

  // 거래처 이름 조회
  const getPartnerName = useCallback(
    (partnerId: string) => {
      const partner = partners.find((p) => p.id === partnerId)
      return partner?.partnerName ?? partnerId
    },
    [partners]
  )

  // 필터링된 발주 목록
  const filteredOrders = useMemo(() => {
    let result = orders

    // 상태 필터
    if (statusFilter !== 'all') {
      result = result.filter((o) => o.status.value === statusFilter)
    }

    // 유형 필터
    if (typeFilter !== 'all') {
      result = result.filter((o) => o.orderType === typeFilter)
    }

    // 검색 필터
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(query) ||
          getPartnerName(o.partnerId).toLowerCase().includes(query)
      )
    }

    return result
  }, [orders, statusFilter, typeFilter, searchQuery, getPartnerName])

  // 페이지네이션
  const totalPages = Math.ceil(filteredOrders.length / PAGE_SIZE)
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return filteredOrders.slice(start, start + PAGE_SIZE)
  }, [filteredOrders, currentPage])

  // 필터 변경 시 페이지 리셋
  useEffect(() => {
    setCurrentPage(1)
  }, [statusFilter, typeFilter, searchQuery])

  // 발주 상세 보기
  const handleViewOrder = useCallback(
    async (order: PurchaseOrder) => {
      await loadOrder(order.id)
      await loadLogs(order.id)
      setDetailDialogOpen(true)
    },
    [loadOrder, loadLogs]
  )

  // 상세 다이얼로그 닫기
  const handleCloseDetail = useCallback(() => {
    setDetailDialogOpen(false)
    clearSelectedOrder()
  }, [clearSelectedOrder])

  // 신규 발주 다이얼로그 열기
  const handleOpenNewOrder = useCallback(() => {
    setFormDialogOpen(true)
  }, [])

  // 발주 생성 폼 제출
  const handleFormSubmit = useCallback(
    async (formData: OrderFormData) => {
      const input: CreateOrderInput = {
        partnerId: formData.partnerId,
        companyId: DEFAULT_COMPANY_ID,
        orderType: formData.orderType,
        dueDate: new Date(formData.dueDate),
        shipmentDate: formData.shipmentDate ? new Date(formData.shipmentDate) : undefined,
        notes: formData.notes,
        items: formData.items.map((item) => ({
          productId: item.productId,
          productCode: item.productCode,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          currency: item.currency,
        })),
      }

      await createOrder(input)
      setFormDialogOpen(false)
    },
    [createOrder]
  )

  // 발주 폼 다이얼로그 취소
  const handleFormCancel = useCallback(() => {
    setFormDialogOpen(false)
  }, [])

  // 상태 변경 핸들러
  const handleStatusChange = useCallback(
    async (action: 'confirm' | 'send' | 'complete' | 'cancel', remarks?: string) => {
      if (!selectedOrder) return

      try {
        switch (action) {
          case 'confirm':
            await confirmOrder(selectedOrder.id, remarks)
            break
          case 'send':
            await sendOrder(selectedOrder.id, remarks)
            break
          case 'complete':
            await completeOrder(selectedOrder.id, remarks)
            break
          case 'cancel':
            await cancelOrder(selectedOrder.id, remarks)
            break
        }
        // 이력 다시 로드
        await loadLogs(selectedOrder.id)
      } catch (err) {
        console.error('상태 변경 실패:', err)
      }
    },
    [selectedOrder, confirmOrder, sendOrder, completeOrder, cancelOrder, loadLogs]
  )

  // 통계
  const stats = useMemo(() => {
    const total = orders.length
    const draft = orders.filter((o) => o.status.value === 'DRAFT').length
    const pending = orders.filter(
      (o) =>
        o.status.value === 'CONFIRMED' ||
        o.status.value === 'SENT' ||
        o.status.value === 'PARTIALLY_RECEIVED'
    ).length
    const completed = orders.filter((o) => o.status.value === 'COMPLETED').length

    return { total, draft, pending, completed }
  }, [orders])

  // 날짜 포맷
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  }

  // 금액 포맷
  const formatAmount = (order: PurchaseOrder) => {
    if (!order.totalAmount) return '-'
    return order.totalAmount.format()
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="발주 관리"
        description="발주서를 조회하고 관리합니다"
        actions={
          <Button onClick={handleOpenNewOrder}>
            <Plus className="h-4 w-4 mr-2" />
            신규 발주
          </Button>
        }
      />

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              전체 발주
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              초안
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">{stats.draft}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              진행중
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              완료
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          </CardContent>
        </Card>
      </div>

      {/* 필터 및 검색 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            {/* 검색 */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="발주번호 또는 거래처 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* 상태 필터 */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="상태" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 상태</SelectItem>
                <SelectItem value="DRAFT">초안</SelectItem>
                <SelectItem value="CONFIRMED">확정</SelectItem>
                <SelectItem value="SENT">발송</SelectItem>
                <SelectItem value="PARTIALLY_RECEIVED">부분입고</SelectItem>
                <SelectItem value="COMPLETED">완료</SelectItem>
                <SelectItem value="CANCELLED">취소</SelectItem>
              </SelectContent>
            </Select>

            {/* 유형 필터 */}
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="유형" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 유형</SelectItem>
                <SelectItem value="DOMESTIC">국내</SelectItem>
                <SelectItem value="VIETNAM">베트남</SelectItem>
              </SelectContent>
            </Select>
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

      {/* 발주 목록 테이블 */}
      <Card>
        <CardContent className="pt-6">
          {step === 'loading' ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">로딩 중...</p>
            </div>
          ) : paginatedOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {orders.length === 0
                  ? '등록된 발주가 없습니다'
                  : '검색 결과가 없습니다'}
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>발주번호</TableHead>
                    <TableHead>거래처</TableHead>
                    <TableHead>유형</TableHead>
                    <TableHead>발주일</TableHead>
                    <TableHead>납기일</TableHead>
                    <TableHead className="text-right">수량</TableHead>
                    <TableHead className="text-right">금액</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead className="text-center">상세</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">
                        {order.orderNumber}
                      </TableCell>
                      <TableCell>{getPartnerName(order.partnerId)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={order.orderType === 'VIETNAM' ? 'secondary' : 'default'}
                        >
                          {ORDER_TYPE_LABELS[order.orderType]}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(order.orderDate)}</TableCell>
                      <TableCell>{formatDate(order.dueDate)}</TableCell>
                      <TableCell className="text-right">
                        {order.totalQuantity?.toLocaleString() ?? '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatAmount(order)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={ORDER_STATUS_VARIANTS[order.status.value]}>
                          {ORDER_STATUS_LABELS[order.status.value]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewOrder(order)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* 페이지네이션 */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    {filteredOrders.length}개 중 {(currentPage - 1) * PAGE_SIZE + 1}-
                    {Math.min(currentPage * PAGE_SIZE, filteredOrders.length)}개 표시
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => p - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm">
                      {currentPage} / {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((p) => p + 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* 발주 상세 다이얼로그 */}
      <OrderDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        order={selectedOrder}
        logs={logs}
        partnerName={selectedOrder ? getPartnerName(selectedOrder.partnerId) : ''}
        onStatusChange={handleStatusChange}
        onClose={handleCloseDetail}
      />

      {/* 발주 생성/수정 다이얼로그 */}
      <OrderFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        partners={partners}
        products={products}
        onSubmit={handleFormSubmit}
        onCancel={handleFormCancel}
      />
    </div>
  )
}
