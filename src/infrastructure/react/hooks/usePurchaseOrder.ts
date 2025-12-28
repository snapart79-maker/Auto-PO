/**
 * usePurchaseOrder Hook
 * 발주서 관리 - CRUD, 상태 관리, 이력 조회
 */

import { useState, useCallback } from 'react'
import type { PurchaseOrder, OrderType } from '@domain/entities/PurchaseOrder'
import type { PurchaseOrderLog } from '@domain/entities/PurchaseOrderLog'
import type { IOrderRepository, OrderFilter } from '@domain/repositories/IOrderRepository'
import type { IPartnerRepository } from '@domain/repositories/IPartnerRepository'
import { PurchaseOrderLog as LogEntity } from '@domain/entities/PurchaseOrderLog'
import {
  GeneratePurchaseOrderUseCase,
  type GenerateOrderInput,
  type OrderItem,
} from '@application/usecases/GeneratePurchaseOrderUseCase'
import { Money, type Currency } from '@domain/valueObjects/Money'

export type PurchaseOrderStep = 'idle' | 'loading' | 'saving' | 'complete' | 'error'

export interface UsePurchaseOrderOptions {
  orderRepository: IOrderRepository
  partnerRepository: IPartnerRepository
}

export interface CreateOrderInput {
  partnerId: string
  companyId: string
  orderType: OrderType
  dueDate: Date
  shipmentDate?: Date
  notes?: string
  items: Array<{
    productId: string
    productCode: string
    productName: string
    quantity: number
    unitPrice: number
    currency: Currency
  }>
}

export interface UsePurchaseOrderReturn {
  /** 현재 단계 */
  step: PurchaseOrderStep
  /** 발주 목록 */
  orders: PurchaseOrder[]
  /** 선택된 발주 */
  selectedOrder: PurchaseOrder | null
  /** 발주 이력 */
  logs: PurchaseOrderLog[]
  /** 에러 메시지 */
  error: string | null
  /** 발주 목록 로드 */
  loadOrders: (filter?: OrderFilter) => Promise<void>
  /** 발주 상세 조회 */
  loadOrder: (id: string) => Promise<void>
  /** 발주 이력 로드 */
  loadLogs: (orderId: string) => Promise<void>
  /** 발주 생성 */
  createOrder: (input: CreateOrderInput) => Promise<PurchaseOrder>
  /** 발주 저장 */
  saveOrder: (order: PurchaseOrder) => Promise<PurchaseOrder>
  /** 발주 삭제 (DRAFT만) */
  deleteOrder: (id: string) => Promise<void>
  /** 상태 변경: 확정 */
  confirmOrder: (id: string, remarks?: string) => Promise<void>
  /** 상태 변경: 발송 */
  sendOrder: (id: string, remarks?: string) => Promise<void>
  /** 상태 변경: 부분입고 */
  receivePartiallyOrder: (id: string, remarks?: string) => Promise<void>
  /** 상태 변경: 완료 */
  completeOrder: (id: string, remarks?: string) => Promise<void>
  /** 상태 변경: 취소 */
  cancelOrder: (id: string, remarks?: string) => Promise<void>
  /** 선택된 발주 초기화 */
  clearSelectedOrder: () => void
  /** 리셋 */
  reset: () => void
}

export function usePurchaseOrder(options: UsePurchaseOrderOptions): UsePurchaseOrderReturn {
  const { orderRepository, partnerRepository } = options

  const [step, setStep] = useState<PurchaseOrderStep>('idle')
  const [orders, setOrders] = useState<PurchaseOrder[]>([])
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null)
  const [logs, setLogs] = useState<PurchaseOrderLog[]>([])
  const [error, setError] = useState<string | null>(null)

  // 발주 목록 로드
  const loadOrders = useCallback(
    async (filter?: OrderFilter) => {
      try {
        setStep('loading')
        setError(null)

        const loadedOrders = await orderRepository.findAll(filter)
        setOrders(loadedOrders)
        setStep('complete')
      } catch (err) {
        setError(err instanceof Error ? err.message : '발주 목록 로드 실패')
        setStep('error')
      }
    },
    [orderRepository]
  )

  // 발주 상세 조회
  const loadOrder = useCallback(
    async (id: string) => {
      try {
        setStep('loading')
        setError(null)

        const order = await orderRepository.findById(id)
        if (!order) {
          throw new Error('발주를 찾을 수 없습니다')
        }
        setSelectedOrder(order)
        setStep('complete')
      } catch (err) {
        setError(err instanceof Error ? err.message : '발주 조회 실패')
        setStep('error')
      }
    },
    [orderRepository]
  )

  // 발주 이력 로드
  const loadLogs = useCallback(
    async (orderId: string) => {
      try {
        const orderLogs = await orderRepository.findLogsByOrderId(orderId)
        setLogs(orderLogs)
      } catch (err) {
        console.error('발주 이력 로드 실패:', err)
        setLogs([])
      }
    },
    [orderRepository]
  )

  // 발주 생성
  const createOrder = useCallback(
    async (input: CreateOrderInput): Promise<PurchaseOrder> => {
      try {
        setStep('saving')
        setError(null)

        // UseCase 생성
        const useCase = new GeneratePurchaseOrderUseCase({
          orderRepository,
          partnerRepository,
        })

        // 품목을 OrderItem 형식으로 변환
        const items: OrderItem[] = input.items.map((item) => ({
          productId: item.productId,
          productCode: item.productCode,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: Money.create(item.unitPrice, item.currency),
        }))

        // 발주 생성 입력
        const generateInput: GenerateOrderInput = {
          partnerId: input.partnerId,
          companyId: input.companyId,
          items,
          orderType: input.orderType,
          dueDate: input.dueDate,
          shipmentDate: input.shipmentDate,
        }

        // 발주 생성
        const order = await useCase.execute(generateInput)

        // notes 추가
        const orderWithNotes = input.notes
          ? order.updateNotes(input.notes)
          : order

        // 저장
        const savedOrder = await orderRepository.save(orderWithNotes)

        // 생성 이력 저장
        const log = LogEntity.createStatusChange(
          savedOrder.id,
          undefined,
          'DRAFT',
          undefined,
          '발주 생성'
        )
        await orderRepository.saveLog(log)

        // 목록 갱신
        setOrders((prev) => [savedOrder, ...prev])
        setSelectedOrder(savedOrder)
        setStep('complete')

        return savedOrder
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '발주 생성 실패'
        setError(errorMessage)
        setStep('error')
        throw new Error(errorMessage)
      }
    },
    [orderRepository, partnerRepository]
  )

  // 발주 저장
  const saveOrder = useCallback(
    async (order: PurchaseOrder): Promise<PurchaseOrder> => {
      try {
        setStep('saving')
        setError(null)

        const savedOrder = await orderRepository.save(order)

        // 목록 갱신
        setOrders((prev) => {
          const index = prev.findIndex((o) => o.id === savedOrder.id)
          if (index >= 0) {
            const updated = [...prev]
            updated[index] = savedOrder
            return updated
          }
          return [savedOrder, ...prev]
        })

        setSelectedOrder(savedOrder)
        setStep('complete')
        return savedOrder
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '발주 저장 실패'
        setError(errorMessage)
        setStep('error')
        throw new Error(errorMessage)
      }
    },
    [orderRepository]
  )

  // 발주 삭제
  const deleteOrder = useCallback(
    async (id: string) => {
      try {
        setStep('saving')
        setError(null)

        await orderRepository.delete(id)

        // 목록에서 제거
        setOrders((prev) => prev.filter((o) => o.id !== id))

        if (selectedOrder?.id === id) {
          setSelectedOrder(null)
        }

        setStep('complete')
      } catch (err) {
        setError(err instanceof Error ? err.message : '발주 삭제 실패')
        setStep('error')
        throw err
      }
    },
    [orderRepository, selectedOrder]
  )

  // 상태 변경 헬퍼
  const changeStatus = useCallback(
    async (
      id: string,
      action: 'confirm' | 'send' | 'receivePartially' | 'complete' | 'cancel',
      remarks?: string
    ) => {
      try {
        setStep('saving')
        setError(null)

        // 현재 발주 조회
        const order = await orderRepository.findById(id)
        if (!order) {
          throw new Error('발주를 찾을 수 없습니다')
        }

        const prevStatus = order.status.value

        // 상태 변경
        let updatedOrder: PurchaseOrder
        switch (action) {
          case 'confirm':
            updatedOrder = order.confirm()
            break
          case 'send':
            updatedOrder = order.send()
            break
          case 'receivePartially':
            updatedOrder = order.receivePartially()
            break
          case 'complete':
            updatedOrder = order.complete()
            break
          case 'cancel':
            updatedOrder = order.cancel()
            break
        }

        // 저장
        const savedOrder = await orderRepository.save(updatedOrder)

        // 이력 저장
        const log = LogEntity.createStatusChange(
          id,
          prevStatus,
          savedOrder.status.value,
          undefined,
          remarks
        )
        await orderRepository.saveLog(log)

        // 상태 갱신
        setOrders((prev) =>
          prev.map((o) => (o.id === savedOrder.id ? savedOrder : o))
        )
        setSelectedOrder(savedOrder)
        setStep('complete')
      } catch (err) {
        setError(err instanceof Error ? err.message : '상태 변경 실패')
        setStep('error')
        throw err
      }
    },
    [orderRepository]
  )

  // 상태 변경 메서드들
  const confirmOrder = useCallback(
    async (id: string, remarks?: string) => {
      await changeStatus(id, 'confirm', remarks)
    },
    [changeStatus]
  )

  const sendOrder = useCallback(
    async (id: string, remarks?: string) => {
      await changeStatus(id, 'send', remarks)
    },
    [changeStatus]
  )

  const receivePartiallyOrder = useCallback(
    async (id: string, remarks?: string) => {
      await changeStatus(id, 'receivePartially', remarks)
    },
    [changeStatus]
  )

  const completeOrder = useCallback(
    async (id: string, remarks?: string) => {
      await changeStatus(id, 'complete', remarks)
    },
    [changeStatus]
  )

  const cancelOrder = useCallback(
    async (id: string, remarks?: string) => {
      await changeStatus(id, 'cancel', remarks)
    },
    [changeStatus]
  )

  // 선택된 발주 초기화
  const clearSelectedOrder = useCallback(() => {
    setSelectedOrder(null)
    setLogs([])
  }, [])

  // 리셋
  const reset = useCallback(() => {
    setStep('idle')
    setOrders([])
    setSelectedOrder(null)
    setLogs([])
    setError(null)
  }, [])

  return {
    step,
    orders,
    selectedOrder,
    logs,
    error,
    loadOrders,
    loadOrder,
    loadLogs,
    createOrder,
    saveOrder,
    deleteOrder,
    confirmOrder,
    sendOrder,
    receivePartiallyOrder,
    completeOrder,
    cancelOrder,
    clearSelectedOrder,
    reset,
  }
}

/**
 * 상태별 한글 이름
 */
export const ORDER_STATUS_LABELS: Record<string, string> = {
  DRAFT: '초안',
  CONFIRMED: '확정',
  SENT: '발송',
  PARTIALLY_RECEIVED: '부분입고',
  COMPLETED: '완료',
  CANCELLED: '취소',
}

/**
 * 상태별 뱃지 variant
 */
export const ORDER_STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  DRAFT: 'secondary',
  CONFIRMED: 'default',
  SENT: 'default',
  PARTIALLY_RECEIVED: 'outline',
  COMPLETED: 'default',
  CANCELLED: 'destructive',
}

/**
 * 발주 유형별 한글 이름
 */
export const ORDER_TYPE_LABELS: Record<OrderType, string> = {
  DOMESTIC: '국내',
  VIETNAM: '베트남',
}
