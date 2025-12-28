/**
 * SupabaseShipmentPlanRepository
 * 출고 계획 Supabase 구현체
 */

import { supabase } from '../supabase/client'
import { ShipmentPlan, type ShipmentPlanProps, type PlanType } from '@domain/entities/ShipmentPlan'
import { Money } from '@domain/valueObjects/Money'
import type { Database } from '../supabase/database.types'

type ShipmentPlanRow = Database['public']['Tables']['shipment_plans']['Row']
type ShipmentPlanInsert = Database['public']['Tables']['shipment_plans']['Insert']

export interface IShipmentPlanRepository {
  findById(id: string): Promise<ShipmentPlan | null>
  findByDateRange(startDate: Date, endDate: Date): Promise<ShipmentPlan[]>
  findByProduct(productId: string): Promise<ShipmentPlan[]>
  findByPartner(partnerId: string): Promise<ShipmentPlan[]>
  save(plan: ShipmentPlan): Promise<ShipmentPlan>
  saveMany(plans: ShipmentPlan[]): Promise<ShipmentPlan[]>
  deleteByBatch(source: string): Promise<void>
}

export class SupabaseShipmentPlanRepository implements IShipmentPlanRepository {
  private toEntity(row: ShipmentPlanRow): ShipmentPlan {
    const props: ShipmentPlanProps = {
      id: row.id,
      planDate: new Date(row.plan_date),
      planType: row.plan_type as PlanType,
      partnerId: row.partner_id ?? undefined,
      productId: row.product_id ?? undefined,
      vehicleModelId: row.vehicle_model_id ?? undefined,
      plannedQuantity: row.planned_quantity,
      unitPrice: row.unit_price ? Money.create(row.unit_price, row.currency as 'KRW' | 'USD') : undefined,
      plannedAmount: row.planned_amount ? Money.create(row.planned_amount, row.currency as 'KRW' | 'USD') : undefined,
      source: row.source as 'MANUAL' | 'UPLOAD' | 'AUTO',
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }
    return ShipmentPlan.create(props)
  }

  private toRow(plan: ShipmentPlan): ShipmentPlanInsert {
    return {
      id: plan.id,
      plan_date: plan.planDate.toISOString().split('T')[0]!,
      plan_type: plan.planType,
      partner_id: plan.partnerId ?? null,
      product_id: plan.productId ?? null,
      vehicle_model_id: plan.vehicleModelId ?? null,
      planned_quantity: plan.plannedQuantity,
      unit_price: plan.unitPrice?.amount ?? null,
      currency: plan.unitPrice?.currency ?? 'KRW',
      planned_amount: plan.plannedAmount?.amount ?? null,
      source: plan.source,
    }
  }

  async findById(id: string): Promise<ShipmentPlan | null> {
    const { data, error } = await supabase
      .from('shipment_plans')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) return null
    return this.toEntity(data)
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<ShipmentPlan[]> {
    const startStr = startDate.toISOString().split('T')[0]!
    const endStr = endDate.toISOString().split('T')[0]!

    const { data, error } = await supabase
      .from('shipment_plans')
      .select('*')
      .gte('plan_date', startStr)
      .lte('plan_date', endStr)
      .order('plan_date')

    if (error || !data) return []
    return data.map((row) => this.toEntity(row))
  }

  async findByProduct(productId: string): Promise<ShipmentPlan[]> {
    const { data, error } = await supabase
      .from('shipment_plans')
      .select('*')
      .eq('product_id', productId)
      .order('plan_date', { ascending: false })

    if (error || !data) return []
    return data.map((row) => this.toEntity(row))
  }

  async findByPartner(partnerId: string): Promise<ShipmentPlan[]> {
    const { data, error } = await supabase
      .from('shipment_plans')
      .select('*')
      .eq('partner_id', partnerId)
      .order('plan_date', { ascending: false })

    if (error || !data) return []
    return data.map((row) => this.toEntity(row))
  }

  async save(plan: ShipmentPlan): Promise<ShipmentPlan> {
    const row = this.toRow(plan)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('shipment_plans') as any)
      .upsert(row)
      .select()
      .single()

    if (error) throw new Error(`출고 계획 저장 실패: ${error.message}`)
    if (!data) throw new Error('출고 계획 저장 실패: 데이터 없음')
    return this.toEntity(data as ShipmentPlanRow)
  }

  async saveMany(plans: ShipmentPlan[]): Promise<ShipmentPlan[]> {
    const rows = plans.map((p) => this.toRow(p))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('shipment_plans') as any)
      .upsert(rows)
      .select()

    if (error) throw new Error(`출고 계획 일괄 저장 실패: ${error.message}`)
    if (!data) throw new Error('출고 계획 일괄 저장 실패: 데이터 없음')
    return (data as ShipmentPlanRow[]).map((row) => this.toEntity(row))
  }

  async deleteByBatch(source: string): Promise<void> {
    const { error } = await supabase
      .from('shipment_plans')
      .delete()
      .eq('source', source)

    if (error) throw new Error(`배치 삭제 실패: ${error.message}`)
  }
}
