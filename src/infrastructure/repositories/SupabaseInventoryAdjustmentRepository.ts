/**
 * SupabaseInventoryAdjustmentRepository
 * IInventoryAdjustmentRepository의 Supabase 구현체
 */

import { supabase } from '../supabase/client'
import type {
  IInventoryAdjustmentRepository,
  AdjustmentFilter,
  AdjustmentSummary,
} from '@domain/repositories/IInventoryRepository'
import {
  InventoryAdjustment,
  type AdjustmentType,
  type AdjustmentReason,
} from '@domain/entities/InventoryAdjustment'
import type { DateRange } from '@domain/valueObjects/DateRange'
import type { Database } from '../supabase/database.types'

type AdjustmentRow = Database['public']['Tables']['inventory_adjustments']['Row']
type AdjustmentInsert = Database['public']['Tables']['inventory_adjustments']['Insert']

export class SupabaseInventoryAdjustmentRepository implements IInventoryAdjustmentRepository {
  private toEntity(row: AdjustmentRow): InventoryAdjustment {
    return InventoryAdjustment.create({
      id: row.id,
      adjustmentDate: new Date(row.adjustment_date),
      productId: row.product_id,
      adjustmentType: row.adjustment_type as AdjustmentType,
      quantity: row.quantity,
      reason: row.reason as AdjustmentReason,
      remarks: row.remarks ?? undefined,
      createdBy: row.created_by ?? undefined,
      createdAt: new Date(row.created_at),
    })
  }

  private toRow(entity: InventoryAdjustment): AdjustmentInsert {
    return {
      id: entity.id,
      adjustment_date: entity.adjustmentDate.toISOString().split('T')[0]!,
      product_id: entity.productId,
      adjustment_type: entity.adjustmentType,
      quantity: entity.quantity,
      reason: entity.reason,
      remarks: entity.remarks ?? null,
      created_by: entity.createdBy ?? null,
    }
  }

  async findById(id: string): Promise<InventoryAdjustment | null> {
    const { data, error } = await supabase
      .from('inventory_adjustments')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) return null
    return this.toEntity(data)
  }

  async findAll(filter?: AdjustmentFilter): Promise<InventoryAdjustment[]> {
    let query = supabase.from('inventory_adjustments').select('*')

    if (filter?.productId) {
      query = query.eq('product_id', filter.productId)
    }
    if (filter?.adjustmentType) {
      query = query.eq('adjustment_type', filter.adjustmentType)
    }
    if (filter?.reason) {
      query = query.eq('reason', filter.reason)
    }
    if (filter?.dateRange) {
      const startStr = filter.dateRange.startDate.toISOString().split('T')[0]!
      const endStr = filter.dateRange.endDate.toISOString().split('T')[0]!
      query = query.gte('adjustment_date', startStr).lte('adjustment_date', endStr)
    }

    const { data, error } = await query.order('adjustment_date', { ascending: false })

    if (error || !data) return []
    return data.map((row) => this.toEntity(row))
  }

  async findByProduct(productId: string): Promise<InventoryAdjustment[]> {
    const { data, error } = await supabase
      .from('inventory_adjustments')
      .select('*')
      .eq('product_id', productId)
      .order('adjustment_date', { ascending: false })

    if (error || !data) return []
    return data.map((row) => this.toEntity(row))
  }

  async findByDateRange(dateRange: DateRange): Promise<InventoryAdjustment[]> {
    const startStr = dateRange.startDate.toISOString().split('T')[0]!
    const endStr = dateRange.endDate.toISOString().split('T')[0]!

    const { data, error } = await supabase
      .from('inventory_adjustments')
      .select('*')
      .gte('adjustment_date', startStr)
      .lte('adjustment_date', endStr)
      .order('adjustment_date', { ascending: false })

    if (error || !data) return []
    return data.map((row) => this.toEntity(row))
  }

  async getAdjustmentSummary(productId: string): Promise<AdjustmentSummary> {
    const { data, error } = await supabase
      .from('inventory_adjustments')
      .select('adjustment_type, quantity')
      .eq('product_id', productId)

    if (error || !data) {
      return {
        productId,
        totalIncrease: 0,
        totalDecrease: 0,
        netAdjustment: 0,
      }
    }

    let totalIncrease = 0
    let totalDecrease = 0

    const rows = data as unknown as Array<{ adjustment_type: string; quantity: number }>
    for (const row of rows) {
      if (row.adjustment_type === 'INCREASE') {
        totalIncrease += row.quantity
      } else {
        totalDecrease += row.quantity
      }
    }

    return {
      productId,
      totalIncrease,
      totalDecrease,
      netAdjustment: totalIncrease - totalDecrease,
    }
  }

  async getAdjustmentSummaries(productIds: string[]): Promise<AdjustmentSummary[]> {
    if (productIds.length === 0) return []

    const summaries: AdjustmentSummary[] = []

    for (const productId of productIds) {
      const summary = await this.getAdjustmentSummary(productId)
      summaries.push(summary)
    }

    return summaries
  }

  async save(adjustment: InventoryAdjustment): Promise<InventoryAdjustment> {
    const row = this.toRow(adjustment)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('inventory_adjustments') as any)
      .upsert(row)
      .select()
      .single()

    if (error) throw new Error(`재고 조정 저장 실패: ${error.message}`)
    if (!data) throw new Error('재고 조정 저장 실패: 데이터 없음')
    return this.toEntity(data as AdjustmentRow)
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('inventory_adjustments').delete().eq('id', id)

    if (error) throw new Error(`재고 조정 삭제 실패: ${error.message}`)
  }
}
