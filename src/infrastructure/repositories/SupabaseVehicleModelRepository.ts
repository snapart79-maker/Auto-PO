/**
 * SupabaseVehicleModelRepository
 * 차종 마스터 Supabase 구현체
 */

import { supabase } from '../supabase/client'
import { VehicleModel, type VehicleModelProps } from '@domain/entities/VehicleModel'
import type { Database } from '../supabase/database.types'

type VehicleModelRow = Database['public']['Tables']['vehicle_models']['Row']
type VehicleModelInsert = Database['public']['Tables']['vehicle_models']['Insert']
type VehicleModelUpdate = Database['public']['Tables']['vehicle_models']['Update']

export interface IVehicleModelRepository {
  findById(id: string): Promise<VehicleModel | null>
  findByCode(vehicleCode: string): Promise<VehicleModel | null>
  findAll(filter?: { isActive?: boolean; searchText?: string }): Promise<VehicleModel[]>
  save(vehicleModel: VehicleModel): Promise<VehicleModel>
  saveMany(vehicleModels: VehicleModel[]): Promise<VehicleModel[]>
  delete(id: string): Promise<void>
  existsByCode(vehicleCode: string): Promise<boolean>
}

export class SupabaseVehicleModelRepository implements IVehicleModelRepository {
  private toEntity(row: VehicleModelRow): VehicleModel {
    const props: VehicleModelProps = {
      id: row.id,
      vehicleCode: row.vehicle_code,
      vehicleName: row.vehicle_name,
      description: row.description ?? undefined,
      isActive: row.is_active,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }
    return VehicleModel.create(props)
  }

  private toRow(vehicleModel: VehicleModel): VehicleModelInsert {
    return {
      id: vehicleModel.id,
      vehicle_code: vehicleModel.vehicleCode,
      vehicle_name: vehicleModel.vehicleName,
      description: vehicleModel.description ?? null,
      is_active: vehicleModel.isActive,
    }
  }

  async findById(id: string): Promise<VehicleModel | null> {
    const { data, error } = await supabase
      .from('vehicle_models')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) return null
    return this.toEntity(data)
  }

  async findByCode(vehicleCode: string): Promise<VehicleModel | null> {
    const { data, error } = await supabase
      .from('vehicle_models')
      .select('*')
      .eq('vehicle_code', vehicleCode)
      .single()

    if (error || !data) return null
    return this.toEntity(data)
  }

  async findAll(filter?: { isActive?: boolean; searchText?: string }): Promise<VehicleModel[]> {
    let query = supabase.from('vehicle_models').select('*')

    if (filter?.isActive !== undefined) {
      query = query.eq('is_active', filter.isActive)
    }
    if (filter?.searchText) {
      query = query.or(
        `vehicle_code.ilike.%${filter.searchText}%,vehicle_name.ilike.%${filter.searchText}%`
      )
    }

    const { data, error } = await query.order('vehicle_code')

    if (error || !data) return []
    return data.map((row) => this.toEntity(row))
  }

  async save(vehicleModel: VehicleModel): Promise<VehicleModel> {
    const row = this.toRow(vehicleModel)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('vehicle_models') as any)
      .upsert(row)
      .select()
      .single()

    if (error) throw new Error(`차종 저장 실패: ${error.message}`)
    if (!data) throw new Error('차종 저장 실패: 데이터 없음')
    return this.toEntity(data as VehicleModelRow)
  }

  async saveMany(vehicleModels: VehicleModel[]): Promise<VehicleModel[]> {
    const rows = vehicleModels.map((v) => this.toRow(v))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('vehicle_models') as any)
      .upsert(rows)
      .select()

    if (error) throw new Error(`차종 일괄 저장 실패: ${error.message}`)
    if (!data) throw new Error('차종 일괄 저장 실패: 데이터 없음')
    return (data as VehicleModelRow[]).map((row) => this.toEntity(row))
  }

  async delete(id: string): Promise<void> {
    const updateData: VehicleModelUpdate = { is_active: false }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('vehicle_models') as any)
      .update(updateData)
      .eq('id', id)

    if (error) throw new Error(`차종 삭제 실패: ${error.message}`)
  }

  async existsByCode(vehicleCode: string): Promise<boolean> {
    const { data } = await supabase
      .from('vehicle_models')
      .select('id')
      .eq('vehicle_code', vehicleCode)
      .single()

    return !!data
  }
}
