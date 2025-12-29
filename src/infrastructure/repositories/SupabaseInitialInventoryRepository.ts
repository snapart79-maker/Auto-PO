/**
 * SupabaseInitialInventoryRepository
 * IInitialInventoryRepository의 Supabase 구현체
 */

import { supabase } from '../supabase/client'
import type {
  IInitialInventoryRepository,
  InitialInventoryFilter,
} from '@domain/repositories/IInventoryRepository'
import { InitialInventory } from '@domain/entities/InitialInventory'
import type { Database } from '../supabase/database.types'

type InitialInventoryRow = Database['public']['Tables']['initial_inventory']['Row']
type InitialInventoryInsert = Database['public']['Tables']['initial_inventory']['Insert']

export class SupabaseInitialInventoryRepository implements IInitialInventoryRepository {
  private toEntity(row: InitialInventoryRow): InitialInventory {
    return InitialInventory.create({
      id: row.id,
      productId: row.product_id,
      baseDate: new Date(row.base_date),
      quantity: row.quantity,
      remarks: row.remarks ?? undefined,
      createdBy: row.created_by ?? undefined,
      createdAt: new Date(row.created_at),
    })
  }

  private toRow(entity: InitialInventory): InitialInventoryInsert {
    return {
      id: entity.id,
      product_id: entity.productId,
      base_date: entity.baseDate.toISOString().split('T')[0]!,
      quantity: entity.quantity,
      remarks: entity.remarks ?? null,
      created_by: entity.createdBy ?? null,
    }
  }

  async findById(id: string): Promise<InitialInventory | null> {
    const { data, error } = await supabase
      .from('initial_inventory')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) return null
    return this.toEntity(data)
  }

  async findByProductAndDate(productId: string, baseDate: Date): Promise<InitialInventory | null> {
    const dateStr = baseDate.toISOString().split('T')[0]!

    const { data, error } = await supabase
      .from('initial_inventory')
      .select('*')
      .eq('product_id', productId)
      .eq('base_date', dateStr)
      .single()

    if (error || !data) return null
    return this.toEntity(data)
  }

  async findLatestByProduct(productId: string): Promise<InitialInventory | null> {
    const { data, error } = await supabase
      .from('initial_inventory')
      .select('*')
      .eq('product_id', productId)
      .order('base_date', { ascending: false })
      .limit(1)
      .single()

    if (error || !data) return null
    return this.toEntity(data)
  }

  async findAll(filter?: InitialInventoryFilter): Promise<InitialInventory[]> {
    let query = supabase.from('initial_inventory').select('*')

    if (filter?.productId) {
      query = query.eq('product_id', filter.productId)
    }
    if (filter?.baseDate) {
      const dateStr = filter.baseDate.toISOString().split('T')[0]!
      query = query.eq('base_date', dateStr)
    }
    if (filter?.baseDateRange) {
      const startStr = filter.baseDateRange.startDate.toISOString().split('T')[0]!
      const endStr = filter.baseDateRange.endDate.toISOString().split('T')[0]!
      query = query.gte('base_date', startStr).lte('base_date', endStr)
    }

    const { data, error } = await query.order('base_date', { ascending: false })

    if (error || !data) return []
    return data.map((row) => this.toEntity(row))
  }

  async save(initialInventory: InitialInventory): Promise<InitialInventory> {
    const row = this.toRow(initialInventory)

    // Upsert: product_id + base_date unique constraint
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('initial_inventory') as any)
      .upsert(row, { onConflict: 'product_id,base_date' })
      .select()
      .single()

    if (error) throw new Error(`초기 재고 저장 실패: ${error.message}`)
    if (!data) throw new Error('초기 재고 저장 실패: 데이터 없음')
    return this.toEntity(data as InitialInventoryRow)
  }

  async saveMany(initialInventories: InitialInventory[]): Promise<InitialInventory[]> {
    const rows = initialInventories.map((item) => this.toRow(item))

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('initial_inventory') as any)
      .upsert(rows, { onConflict: 'product_id,base_date' })
      .select()

    if (error) throw new Error(`초기 재고 일괄 저장 실패: ${error.message}`)
    if (!data) throw new Error('초기 재고 일괄 저장 실패: 데이터 없음')
    return (data as InitialInventoryRow[]).map((row) => this.toEntity(row))
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('initial_inventory').delete().eq('id', id)

    if (error) throw new Error(`초기 재고 삭제 실패: ${error.message}`)
  }
}
