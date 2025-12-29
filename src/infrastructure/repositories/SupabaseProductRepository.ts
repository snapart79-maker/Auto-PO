/**
 * SupabaseProductRepository
 * IProductRepository의 Supabase 구현체
 */

import { supabase } from '../supabase/client'
import type { IProductRepository, ProductFilter } from '@domain/repositories/IProductRepository'
import { Product, type ProductProps } from '@domain/entities/Product'
import { SupplierType } from '@domain/valueObjects/SupplierType'
import { Money } from '@domain/valueObjects/Money'
import type { Database } from '../supabase/database.types'

type ProductRow = Database['public']['Tables']['products']['Row']
type ProductInsert = Database['public']['Tables']['products']['Insert']
type ProductUpdate = Database['public']['Tables']['products']['Update']

export class SupabaseProductRepository implements IProductRepository {
  private toEntity(row: ProductRow): Product {
    const props: ProductProps = {
      id: row.id,
      productCode: row.product_code,
      productName: row.product_name,
      vehicleModelId: row.vehicle_model_id ?? undefined,
      domesticLeadTime: row.domestic_lead_time,
      overseasLeadTime: row.overseas_lead_time,
      primarySupplier: SupplierType.fromString(row.primary_supplier),
      mainPartnerId: row.main_partner_id ?? undefined,
      subPartnerId: row.sub_partner_id ?? undefined,
      domesticRatio: row.domestic_ratio,
      unitPrice: row.unit_price ? Money.create(row.unit_price, row.currency as 'KRW' | 'USD') : undefined,
      isActive: row.is_active,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      // 확장 필드 매핑
      projectCode: row.project_code ?? undefined,
      spec1: row.spec1 ?? undefined,
      spec2: row.spec2 ?? undefined,
      spec3: row.spec3 ?? undefined,
      moq: row.moq ?? undefined,
      productType: row.product_type ?? undefined,
      unit: row.unit ?? undefined,
      effectiveStartDate: row.effective_start_date ? new Date(row.effective_start_date) : undefined,
      effectiveEndDate: row.effective_end_date ? new Date(row.effective_end_date) : undefined,
    }
    return Product.create(props)
  }

  private toRow(product: Product): ProductInsert {
    return {
      id: product.id,
      product_code: product.productCode,
      product_name: product.productName,
      vehicle_model_id: product.vehicleModelId ?? null,
      domestic_lead_time: product.domesticLeadTime,
      overseas_lead_time: product.overseasLeadTime,
      primary_supplier: product.primarySupplier.value as 'DOMESTIC' | 'VIETNAM' | 'BOTH',
      main_partner_id: product.mainPartnerId ?? null,
      sub_partner_id: product.subPartnerId ?? null,
      domestic_ratio: product.domesticRatio,
      unit_price: product.unitPrice?.amount ?? null,
      currency: product.unitPrice?.currency ?? 'KRW',
      is_active: product.isActive,
      // 확장 필드 매핑
      project_code: product.projectCode ?? null,
      spec1: product.spec1 ?? null,
      spec2: product.spec2 ?? null,
      spec3: product.spec3 ?? null,
      moq: product.moq ?? null,
      product_type: product.productType ?? null,
      unit: product.unit ?? null,
      effective_start_date: product.effectiveStartDate?.toISOString().split('T')[0] ?? null,
      effective_end_date: product.effectiveEndDate?.toISOString().split('T')[0] ?? null,
    }
  }

  async findById(id: string): Promise<Product | null> {
    const { data, error } = await supabase.from('products').select('*').eq('id', id).single()

    if (error || !data) return null
    return this.toEntity(data)
  }

  async findByCode(productCode: string): Promise<Product | null> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('product_code', productCode)
      .single()

    if (error || !data) return null
    return this.toEntity(data)
  }

  async findAll(filter?: ProductFilter): Promise<Product[]> {
    let query = supabase.from('products').select('*')

    if (filter?.vehicleModelId) {
      query = query.eq('vehicle_model_id', filter.vehicleModelId)
    }
    if (filter?.primarySupplier) {
      query = query.eq('primary_supplier', filter.primarySupplier.value)
    }
    if (filter?.mainPartnerId) {
      query = query.eq('main_partner_id', filter.mainPartnerId)
    }
    if (filter?.isActive !== undefined) {
      query = query.eq('is_active', filter.isActive)
    }
    if (filter?.searchText) {
      query = query.or(
        `product_code.ilike.%${filter.searchText}%,product_name.ilike.%${filter.searchText}%`
      )
    }

    const { data, error } = await query.order('product_code')

    if (error || !data) return []
    return data.map((row) => this.toEntity(row))
  }

  async findByIds(ids: string[]): Promise<Product[]> {
    if (ids.length === 0) return []

    const { data, error } = await supabase.from('products').select('*').in('id', ids)

    if (error || !data) return []
    return data.map((row) => this.toEntity(row))
  }

  async findByVehicleModel(vehicleModelId: string): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('vehicle_model_id', vehicleModelId)
      .eq('is_active', true)
      .order('product_code')

    if (error || !data) return []
    return data.map((row) => this.toEntity(row))
  }

  async findByPartner(partnerId: string): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .or(`main_partner_id.eq.${partnerId},sub_partner_id.eq.${partnerId}`)
      .eq('is_active', true)
      .order('product_code')

    if (error || !data) return []
    return data.map((row) => this.toEntity(row))
  }

  async findDualSourcingProducts(): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('primary_supplier', 'BOTH')
      .eq('is_active', true)
      .order('product_code')

    if (error || !data) return []
    return data.map((row) => this.toEntity(row))
  }

  async save(product: Product): Promise<Product> {
    const row = this.toRow(product)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('products') as any)
      .upsert(row)
      .select()
      .single()

    if (error) throw new Error(`제품 저장 실패: ${error.message}`)
    if (!data) throw new Error('제품 저장 실패: 데이터 없음')
    return this.toEntity(data as ProductRow)
  }

  async saveMany(products: Product[]): Promise<Product[]> {
    const rows = products.map((p) => this.toRow(p))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('products') as any)
      .upsert(rows)
      .select()

    if (error) throw new Error(`제품 일괄 저장 실패: ${error.message}`)
    if (!data) throw new Error('제품 일괄 저장 실패: 데이터 없음')
    return (data as ProductRow[]).map((row) => this.toEntity(row))
  }

  async delete(id: string): Promise<void> {
    const updateData: ProductUpdate = { is_active: false }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('products') as any).update(updateData).eq('id', id)

    if (error) throw new Error(`제품 삭제 실패: ${error.message}`)
  }

  async existsByCode(productCode: string): Promise<boolean> {
    const { data } = await supabase
      .from('products')
      .select('id')
      .eq('product_code', productCode)
      .single()

    return !!data
  }
}
