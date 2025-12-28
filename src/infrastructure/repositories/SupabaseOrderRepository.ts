/**
 * SupabaseOrderRepository
 * IOrderRepository의 Supabase 구현체
 */

import { supabase } from '../supabase/client'
import type {
  IOrderRepository,
  OrderFilter,
  PendingOrderSummary,
} from '@domain/repositories/IOrderRepository'
import { PurchaseOrder, type PurchaseOrderProps, type OrderType } from '@domain/entities/PurchaseOrder'
import { PurchaseOrderLog, type PurchaseOrderLogProps } from '@domain/entities/PurchaseOrderLog'
import { OrderStatus } from '@domain/valueObjects/OrderStatus'
import { Money } from '@domain/valueObjects/Money'
import type { Database } from '../supabase/database.types'

type OrderRow = Database['public']['Tables']['purchase_orders']['Row']
type OrderInsert = Database['public']['Tables']['purchase_orders']['Insert']
type OrderLogRow = Database['public']['Tables']['purchase_order_logs']['Row']
type OrderLogInsert = Database['public']['Tables']['purchase_order_logs']['Insert']

export class SupabaseOrderRepository implements IOrderRepository {
  private toEntity(row: OrderRow): PurchaseOrder {
    const props: PurchaseOrderProps = {
      id: row.id,
      orderNumber: row.order_number,
      orderDate: new Date(row.order_date),
      dueDate: new Date(row.due_date),
      shipmentDate: row.shipment_date ? new Date(row.shipment_date) : undefined,
      partnerId: row.partner_id ?? '',
      companyId: row.company_id ?? '',
      orderType: row.order_type as OrderType,
      status: OrderStatus.fromString(row.status),
      totalQuantity: row.total_quantity ?? undefined,
      totalAmount: row.total_amount
        ? Money.create(row.total_amount, row.currency as 'KRW' | 'USD')
        : undefined,
      exchangeRate: row.exchange_rate ?? undefined,
      notes: row.notes ?? undefined,
      createdBy: row.created_by ?? undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }
    return PurchaseOrder.create(props)
  }

  private toRow(order: PurchaseOrder): OrderInsert {
    return {
      id: order.id,
      order_number: order.orderNumber,
      order_date: order.orderDate.toISOString().split('T')[0]!,
      due_date: order.dueDate.toISOString().split('T')[0]!,
      shipment_date: order.shipmentDate
        ? order.shipmentDate.toISOString().split('T')[0]!
        : null,
      partner_id: order.partnerId || null,
      company_id: order.companyId || null,
      order_type: order.orderType,
      status: order.status.value,
      total_quantity: order.totalQuantity ?? null,
      total_amount: order.totalAmount?.amount ?? null,
      currency: order.totalAmount?.currency ?? 'KRW',
      exchange_rate: order.exchangeRate ?? null,
      notes: order.notes ?? null,
      created_by: null,
    }
  }

  private toLogEntity(row: OrderLogRow): PurchaseOrderLog {
    const props: PurchaseOrderLogProps = {
      id: row.id,
      orderId: row.order_id ?? '',
      prevStatus: row.prev_status ?? undefined,
      newStatus: row.new_status ?? undefined,
      changedBy: row.changed_by ?? undefined,
      changedAt: new Date(row.changed_at),
      remarks: row.remarks ?? undefined,
    }
    return PurchaseOrderLog.create(props)
  }

  private toLogRow(log: PurchaseOrderLog): OrderLogInsert {
    return {
      id: log.id,
      order_id: log.orderId || null,
      prev_status: log.prevStatus ?? null,
      new_status: log.newStatus ?? null,
      changed_by: log.changedBy ?? null,
      remarks: log.remarks ?? null,
    }
  }

  async findById(id: string): Promise<PurchaseOrder | null> {
    const { data, error } = await supabase
      .from('purchase_orders')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) return null
    return this.toEntity(data)
  }

  async findByOrderNumber(orderNumber: string): Promise<PurchaseOrder | null> {
    const { data, error } = await supabase
      .from('purchase_orders')
      .select('*')
      .eq('order_number', orderNumber)
      .single()

    if (error || !data) return null
    return this.toEntity(data)
  }

  async findAll(filter?: OrderFilter): Promise<PurchaseOrder[]> {
    let query = supabase.from('purchase_orders').select('*')

    if (filter?.partnerId) {
      query = query.eq('partner_id', filter.partnerId)
    }
    if (filter?.orderType) {
      query = query.eq('order_type', filter.orderType)
    }
    if (filter?.status) {
      query = query.eq('status', filter.status.value)
    }
    if (filter?.dateRange) {
      const startStr = filter.dateRange.startDate.toISOString().split('T')[0]!
      const endStr = filter.dateRange.endDate.toISOString().split('T')[0]!
      query = query.gte('order_date', startStr).lte('order_date', endStr)
    }

    const { data, error } = await query.order('order_date', { ascending: false })

    if (error || !data) return []
    return data.map((row) => this.toEntity(row))
  }

  async findByPartner(partnerId: string): Promise<PurchaseOrder[]> {
    const { data, error } = await supabase
      .from('purchase_orders')
      .select('*')
      .eq('partner_id', partnerId)
      .order('order_date', { ascending: false })

    if (error || !data) return []
    return data.map((row) => this.toEntity(row))
  }

  async findPending(): Promise<PurchaseOrder[]> {
    const pendingStatuses = ['DRAFT', 'CONFIRMED', 'SENT', 'PARTIALLY_RECEIVED']

    const { data, error } = await supabase
      .from('purchase_orders')
      .select('*')
      .in('status', pendingStatuses)
      .order('order_date', { ascending: false })

    if (error || !data) return []
    return data.map((row) => this.toEntity(row))
  }

  async getPendingQuantity(productId: string): Promise<number> {
    const pendingStatuses = ['DRAFT', 'CONFIRMED', 'SENT', 'PARTIALLY_RECEIVED']

    // 먼저 pending 상태의 발주 ID 조회
    const { data: orders } = await supabase
      .from('purchase_orders')
      .select('id')
      .in('status', pendingStatuses)

    if (!orders || orders.length === 0) return 0

    const orderIds = (orders as { id: string }[]).map((o) => o.id)

    // 해당 발주의 품목 수량 합계
    const { data: items } = await supabase
      .from('purchase_order_items')
      .select('quantity')
      .eq('product_id', productId)
      .in('order_id', orderIds)

    if (!items || items.length === 0) return 0

    return items.reduce((sum, item) => sum + (item as { quantity: number }).quantity, 0)
  }

  async getPendingQuantities(productIds: string[]): Promise<PendingOrderSummary[]> {
    if (productIds.length === 0) return []

    const summaries: PendingOrderSummary[] = []

    for (const productId of productIds) {
      const pendingQuantity = await this.getPendingQuantity(productId)
      summaries.push({ productId, pendingQuantity })
    }

    return summaries
  }

  async getNextSequence(date: Date): Promise<number> {
    const dateStr = date.toISOString().split('T')[0]!
    const prefix = `PO-${dateStr.replace(/-/g, '')}`

    const { data } = await supabase
      .from('purchase_orders')
      .select('order_number')
      .like('order_number', `${prefix}%`)
      .order('order_number', { ascending: false })
      .limit(1)
      .single()

    if (!data) return 1

    // PO-YYYYMMDD-NNN에서 NNN 추출
    const match = (data as { order_number: string }).order_number.match(/-(\d{3})$/)
    if (!match || !match[1]) return 1

    return parseInt(match[1], 10) + 1
  }

  async save(order: PurchaseOrder): Promise<PurchaseOrder> {
    const row = this.toRow(order)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('purchase_orders') as any)
      .upsert(row)
      .select()
      .single()

    if (error) throw new Error(`발주 저장 실패: ${error.message}`)
    if (!data) throw new Error('발주 저장 실패: 데이터 없음')
    return this.toEntity(data as OrderRow)
  }

  async delete(id: string): Promise<void> {
    // DRAFT 상태인지 확인
    const order = await this.findById(id)
    if (!order) throw new Error('발주를 찾을 수 없습니다')
    if (!order.status.isDraft()) {
      throw new Error('초안 상태의 발주만 삭제할 수 있습니다')
    }

    // 품목 먼저 삭제
    await supabase.from('purchase_order_items').delete().eq('order_id', id)

    // 발주 삭제
    const { error } = await supabase.from('purchase_orders').delete().eq('id', id)

    if (error) throw new Error(`발주 삭제 실패: ${error.message}`)
  }

  // ========== 발주 이력 관련 ==========

  async saveLog(log: PurchaseOrderLog): Promise<PurchaseOrderLog> {
    const row = this.toLogRow(log)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('purchase_order_logs') as any)
      .insert(row)
      .select()
      .single()

    if (error) throw new Error(`발주 이력 저장 실패: ${error.message}`)
    if (!data) throw new Error('발주 이력 저장 실패: 데이터 없음')
    return this.toLogEntity(data as OrderLogRow)
  }

  async findLogsByOrderId(orderId: string): Promise<PurchaseOrderLog[]> {
    const { data, error } = await supabase
      .from('purchase_order_logs')
      .select('*')
      .eq('order_id', orderId)
      .order('changed_at', { ascending: false })

    if (error || !data) return []
    return data.map((row) => this.toLogEntity(row))
  }
}
