/**
 * OrderDetailDialog - 발주 상세 다이얼로그
 */

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Textarea } from './ui/textarea'
import { Label } from './ui/label'
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_VARIANTS,
  ORDER_TYPE_LABELS,
} from '../hooks/usePurchaseOrder'
import type { PurchaseOrder } from '@domain/entities/PurchaseOrder'
import type { PurchaseOrderLog } from '@domain/entities/PurchaseOrderLog'
import { Check, Send, Package, XCircle, Clock, FileText, Download, Printer } from 'lucide-react'
import { exportOrderToExcel } from '../../external/excel/ExcelExporter'
import { printOrder } from '../../external/pdf/PdfExporter'

interface OrderDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  order: PurchaseOrder | null
  logs: PurchaseOrderLog[]
  partnerName: string
  onStatusChange: (action: 'confirm' | 'send' | 'complete' | 'cancel', remarks?: string) => Promise<void>
  onClose: () => void
}

export function OrderDetailDialog({
  open,
  onOpenChange,
  order,
  logs,
  partnerName,
  onStatusChange,
  onClose,
}: OrderDetailDialogProps) {
  const [remarks, setRemarks] = useState('')
  const [isChangingStatus, setIsChangingStatus] = useState(false)
  const [activeAction, setActiveAction] = useState<string | null>(null)

  if (!order) return null

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatDateTime = (date: Date) => {
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const handleStatusChange = async (action: 'confirm' | 'send' | 'complete' | 'cancel') => {
    setIsChangingStatus(true)
    setActiveAction(action)
    try {
      await onStatusChange(action, remarks || undefined)
      setRemarks('')
    } finally {
      setIsChangingStatus(false)
      setActiveAction(null)
    }
  }

  // 가능한 상태 전이
  const canConfirm = order.status.value === 'DRAFT'
  const canSend = order.status.value === 'CONFIRMED'
  const canComplete =
    order.status.value === 'SENT' || order.status.value === 'PARTIALLY_RECEIVED'
  const canCancel = !order.status.isFinal()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <FileText className="h-5 w-5" />
            {order.orderNumber}
            <Badge variant={ORDER_STATUS_VARIANTS[order.status.value]}>
              {ORDER_STATUS_LABELS[order.status.value]}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="info" className="mt-4">
          <TabsList>
            <TabsTrigger value="info">발주 정보</TabsTrigger>
            <TabsTrigger value="history">변경 이력 ({logs.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4">
            {/* 기본 정보 */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">기본 정보</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">거래처</p>
                    <p className="font-medium">{partnerName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">발주 유형</p>
                    <Badge variant={order.orderType === 'VIETNAM' ? 'secondary' : 'default'}>
                      {ORDER_TYPE_LABELS[order.orderType]}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">발주일</p>
                    <p className="font-medium">{formatDate(order.orderDate)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">납기일</p>
                    <p className="font-medium">{formatDate(order.dueDate)}</p>
                  </div>
                  {order.shipmentDate && (
                    <div>
                      <p className="text-sm text-muted-foreground">선적일</p>
                      <p className="font-medium">{formatDate(order.shipmentDate)}</p>
                    </div>
                  )}
                  {order.exchangeRate && (
                    <div>
                      <p className="text-sm text-muted-foreground">환율</p>
                      <p className="font-medium">{order.exchangeRate.toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 수량 및 금액 */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">수량 및 금액</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">총 수량</p>
                    <p className="text-2xl font-bold">
                      {order.totalQuantity?.toLocaleString() ?? '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">총 금액</p>
                    <p className="text-2xl font-bold">
                      {order.totalAmount?.format() ?? '-'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 비고 */}
            {order.notes && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">비고</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>{order.notes}</p>
                </CardContent>
              </Card>
            )}

            {/* 상태 변경 */}
            {!order.status.isFinal() && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">상태 변경</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="remarks">변경 사유 (선택)</Label>
                    <Textarea
                      id="remarks"
                      placeholder="상태 변경 사유를 입력하세요..."
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {canConfirm && (
                      <Button
                        onClick={() => handleStatusChange('confirm')}
                        disabled={isChangingStatus}
                      >
                        <Check className="h-4 w-4 mr-2" />
                        {activeAction === 'confirm' ? '처리 중...' : '확정'}
                      </Button>
                    )}
                    {canSend && (
                      <Button
                        onClick={() => handleStatusChange('send')}
                        disabled={isChangingStatus}
                      >
                        <Send className="h-4 w-4 mr-2" />
                        {activeAction === 'send' ? '처리 중...' : '발송'}
                      </Button>
                    )}
                    {canComplete && (
                      <Button
                        onClick={() => handleStatusChange('complete')}
                        disabled={isChangingStatus}
                      >
                        <Package className="h-4 w-4 mr-2" />
                        {activeAction === 'complete' ? '처리 중...' : '완료'}
                      </Button>
                    )}
                    {canCancel && (
                      <Button
                        variant="destructive"
                        onClick={() => handleStatusChange('cancel')}
                        disabled={isChangingStatus}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        {activeAction === 'cancel' ? '처리 중...' : '취소'}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-2">
            {logs.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center justify-center py-8">
                    <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">변경 이력이 없습니다</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {logs.map((log) => (
                  <Card key={log.id}>
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            {log.prevStatus && (
                              <>
                                <Badge variant="outline">
                                  {ORDER_STATUS_LABELS[log.prevStatus] ?? log.prevStatus}
                                </Badge>
                                <span className="text-muted-foreground">→</span>
                              </>
                            )}
                            <Badge variant={ORDER_STATUS_VARIANTS[log.newStatus ?? ''] ?? 'default'}>
                              {ORDER_STATUS_LABELS[log.newStatus ?? ''] ?? log.newStatus}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {formatDateTime(log.changedAt)}
                        </p>
                      </div>
                      {log.remarks && (
                        <p className="mt-2 text-sm text-muted-foreground">
                          {log.remarks}
                        </p>
                      )}
                      {log.changedBy && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          변경자: {log.changedBy}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex justify-between mt-4">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => exportOrderToExcel(order, partnerName)}
            >
              <Download className="h-4 w-4 mr-2" />
              Excel
            </Button>
            <Button
              variant="outline"
              onClick={() => printOrder(order, partnerName)}
            >
              <Printer className="h-4 w-4 mr-2" />
              인쇄/PDF
            </Button>
          </div>
          <Button variant="outline" onClick={onClose}>
            닫기
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
