/**
 * SupabaseInventoryRepository
 * IInventoryRepository의 Supabase 구현체
 */

import { supabase } from '../supabase/client'
import type { IInventoryRepository, InventoryFilter, StockSummary, DailyAverage } from '@domain/repositories/IInventoryRepository'
import { InventoryTransaction, type InventoryTransactionProps, type TransactionType } from '@domain/entities/InventoryTransaction'
import { Money } from '@domain/valueObjects/Money'
import type { DateRange } from '@domain/valueObjects/DateRange'
import type { Database } from '../supabase/database.types'

type InventoryRow = Database['public']['Tables']['inventory_transactions']['Row']
type InventoryInsert = Database['public']['Tables']['inventory_transactions']['Insert']

export class SupabaseInventoryRepository implements IInventoryRepository {
  private toEntity(row: InventoryRow): InventoryTransaction {
    const props: InventoryTransactionProps = {
      id: row.id,
      transactionDate: new Date(row.transaction_date),
      transactionType: row.transaction_type as TransactionType,
      partnerId: row.partner_id ?? undefined,
      productId: row.product_id ?? undefined,
      quantity: row.quantity,
      unitPrice: row.unit_price ? Money.create(row.unit_price, row.currency as 'KRW' | 'USD') : undefined,
      supplyAmount: row.supply_amount ? Money.create(row.supply_amount, row.currency as 'KRW' | 'USD') : undefined,
      exchangeRate: row.exchange_rate ?? undefined,
      totalAmount: row.total_amount ? Money.create(row.total_amount, 'KRW') : undefined,
      itemType: row.item_type ?? undefined,
      uploadBatchId: row.upload_batch_id ?? undefined,
      createdAt: new Date(row.created_at),
    }
    return InventoryTransaction.create(props)
  }

  private toRow(transaction: InventoryTransaction): InventoryInsert {
    return {
      id: transaction.id,
      transaction_date: transaction.transactionDate.toISOString().split('T')[0]!,
      transaction_type: transaction.transactionType,
      partner_id: transaction.partnerId ?? null,
      product_id: transaction.productId ?? null,
      quantity: transaction.quantity,
      unit_price: transaction.unitPrice?.amount ?? null,
      supply_amount: transaction.supplyAmount?.amount ?? null,
      currency: transaction.unitPrice?.currency ?? 'KRW',
      exchange_rate: transaction.exchangeRate ?? null,
      total_amount: transaction.totalAmount?.amount ?? null,
      item_type: transaction.itemType ?? null,
      upload_batch_id: transaction.uploadBatchId ?? null,
    }
  }

  async findById(id: string): Promise<InventoryTransaction | null> {
    const { data, error } = await supabase
      .from('inventory_transactions')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) return null
    return this.toEntity(data)
  }

  async findAll(filter?: InventoryFilter): Promise<InventoryTransaction[]> {
    let query = supabase.from('inventory_transactions').select('*')

    if (filter?.productId) {
      query = query.eq('product_id', filter.productId)
    }
    if (filter?.partnerId) {
      query = query.eq('partner_id', filter.partnerId)
    }
    if (filter?.transactionType) {
      query = query.eq('transaction_type', filter.transactionType)
    }
    if (filter?.uploadBatchId) {
      query = query.eq('upload_batch_id', filter.uploadBatchId)
    }
    if (filter?.dateRange) {
      const startStr = filter.dateRange.startDate.toISOString().split('T')[0]!
      const endStr = filter.dateRange.endDate.toISOString().split('T')[0]!
      query = query.gte('transaction_date', startStr).lte('transaction_date', endStr)
    }

    const { data, error } = await query.order('transaction_date', { ascending: false })

    if (error || !data) return []
    return data.map((row) => this.toEntity(row))
  }

  async findByDateRange(dateRange: DateRange): Promise<InventoryTransaction[]> {
    const startStr = dateRange.startDate.toISOString().split('T')[0]!
    const endStr = dateRange.endDate.toISOString().split('T')[0]!

    const { data, error } = await supabase
      .from('inventory_transactions')
      .select('*')
      .gte('transaction_date', startStr)
      .lte('transaction_date', endStr)
      .order('transaction_date', { ascending: false })

    if (error || !data) return []
    return data.map((row) => this.toEntity(row))
  }

  async getCurrentStock(productId: string): Promise<number> {
    // 입고량
    const { data: inData } = await supabase
      .from('inventory_transactions')
      .select('quantity')
      .eq('product_id', productId)
      .eq('transaction_type', 'IN')

    const totalIn = (inData ?? []).reduce((sum, row) => sum + (row as { quantity: number }).quantity, 0)

    // 출고량
    const { data: outData } = await supabase
      .from('inventory_transactions')
      .select('quantity')
      .eq('product_id', productId)
      .eq('transaction_type', 'OUT')

    const totalOut = (outData ?? []).reduce((sum, row) => sum + (row as { quantity: number }).quantity, 0)

    return totalIn - totalOut
  }

  async getStockSummaries(productIds: string[]): Promise<StockSummary[]> {
    if (productIds.length === 0) return []

    const summaries: StockSummary[] = []

    for (const productId of productIds) {
      const currentStock = await this.getCurrentStock(productId)

      const { data: lastTx } = await supabase
        .from('inventory_transactions')
        .select('transaction_date')
        .eq('product_id', productId)
        .order('transaction_date', { ascending: false })
        .limit(1)
        .single()

      summaries.push({
        productId,
        currentStock,
        lastTransactionDate: lastTx ? new Date((lastTx as { transaction_date: string }).transaction_date) : undefined,
      })
    }

    return summaries
  }

  async getDailyAverageOutbound(productId: string, dateRange: DateRange): Promise<number> {
    const startStr = dateRange.startDate.toISOString().split('T')[0]!
    const endStr = dateRange.endDate.toISOString().split('T')[0]!

    const { data } = await supabase
      .from('inventory_transactions')
      .select('quantity')
      .eq('product_id', productId)
      .eq('transaction_type', 'OUT')
      .gte('transaction_date', startStr)
      .lte('transaction_date', endStr)

    if (!data || data.length === 0) return 0

    const totalQuantity = data.reduce((sum, row) => sum + (row as { quantity: number }).quantity, 0)
    const days = Math.ceil((dateRange.endDate.getTime() - dateRange.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1

    return totalQuantity / days
  }

  async getDailyAverages(productIds: string[], dateRange: DateRange): Promise<DailyAverage[]> {
    if (productIds.length === 0) return []

    const averages: DailyAverage[] = []
    const days = Math.ceil((dateRange.endDate.getTime() - dateRange.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1

    for (const productId of productIds) {
      const avgQuantity = await this.getDailyAverageOutbound(productId, dateRange)
      averages.push({
        productId,
        averageQuantity: avgQuantity,
        periodDays: days,
      })
    }

    return averages
  }

  async save(transaction: InventoryTransaction): Promise<InventoryTransaction> {
    const row = this.toRow(transaction)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('inventory_transactions') as any)
      .upsert(row)
      .select()
      .single()

    if (error) throw new Error(`입출고 저장 실패: ${error.message}`)
    if (!data) throw new Error('입출고 저장 실패: 데이터 없음')
    return this.toEntity(data as InventoryRow)
  }

  async saveMany(transactions: InventoryTransaction[]): Promise<InventoryTransaction[]> {
    const rows = transactions.map((t) => this.toRow(t))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('inventory_transactions') as any)
      .upsert(rows)
      .select()

    if (error) throw new Error(`입출고 일괄 저장 실패: ${error.message}`)
    if (!data) throw new Error('입출고 일괄 저장 실패: 데이터 없음')
    return (data as InventoryRow[]).map((row) => this.toEntity(row))
  }

  async deleteByBatch(uploadBatchId: string): Promise<void> {
    const { error } = await supabase
      .from('inventory_transactions')
      .delete()
      .eq('upload_batch_id', uploadBatchId)

    if (error) throw new Error(`배치 삭제 실패: ${error.message}`)
  }
}
