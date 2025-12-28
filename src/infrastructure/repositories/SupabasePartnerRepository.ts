/**
 * SupabasePartnerRepository
 * IPartnerRepository의 Supabase 구현체
 */

import { supabase } from '../supabase/client'
import type { IPartnerRepository, PartnerFilter } from '@domain/repositories/IPartnerRepository'
import { Partner, type PartnerProps } from '@domain/entities/Partner'
import { PartnerType } from '@domain/valueObjects/PartnerType'
import type { Database } from '../supabase/database.types'

type PartnerRow = Database['public']['Tables']['partners']['Row']
type PartnerInsert = Database['public']['Tables']['partners']['Insert']
type PartnerUpdate = Database['public']['Tables']['partners']['Update']

export class SupabasePartnerRepository implements IPartnerRepository {
  private toEntity(row: PartnerRow): Partner {
    const props: PartnerProps = {
      id: row.id,
      partnerCode: row.partner_code,
      partnerName: row.partner_name,
      partnerType: PartnerType.fromString(row.partner_type),
      businessNumber: row.business_number ?? undefined,
      address: row.address ?? undefined,
      contactPerson: row.contact_person ?? undefined,
      contactPhone: row.contact_phone ?? undefined,
      contactEmail: row.contact_email ?? undefined,
      currency: row.currency,
      isActive: row.is_active,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }
    return Partner.create(props)
  }

  private toRow(partner: Partner): PartnerInsert {
    return {
      id: partner.id,
      partner_code: partner.partnerCode,
      partner_name: partner.partnerName,
      partner_type: partner.partnerType.value as 'SUPPLIER' | 'CUSTOMER' | 'VIETNAM',
      business_number: partner.businessNumber ?? null,
      address: partner.address ?? null,
      contact_person: partner.contactPerson ?? null,
      contact_phone: partner.contactPhone ?? null,
      contact_email: partner.contactEmail ?? null,
      currency: partner.currency,
      is_active: partner.isActive,
    }
  }

  async findById(id: string): Promise<Partner | null> {
    const { data, error } = await supabase.from('partners').select('*').eq('id', id).single()

    if (error || !data) return null
    return this.toEntity(data)
  }

  async findByCode(partnerCode: string): Promise<Partner | null> {
    const { data, error } = await supabase
      .from('partners')
      .select('*')
      .eq('partner_code', partnerCode)
      .single()

    if (error || !data) return null
    return this.toEntity(data)
  }

  async findAll(filter?: PartnerFilter): Promise<Partner[]> {
    let query = supabase.from('partners').select('*')

    if (filter?.partnerType) {
      query = query.eq('partner_type', filter.partnerType.value)
    }
    if (filter?.isActive !== undefined) {
      query = query.eq('is_active', filter.isActive)
    }
    if (filter?.searchText) {
      query = query.or(
        `partner_code.ilike.%${filter.searchText}%,partner_name.ilike.%${filter.searchText}%`
      )
    }

    const { data, error } = await query.order('partner_code')

    if (error || !data) return []
    return data.map((row) => this.toEntity(row))
  }

  async findByType(partnerType: PartnerType): Promise<Partner[]> {
    const { data, error } = await supabase
      .from('partners')
      .select('*')
      .eq('partner_type', partnerType.value)
      .eq('is_active', true)
      .order('partner_code')

    if (error || !data) return []
    return data.map((row) => this.toEntity(row))
  }

  async save(partner: Partner): Promise<Partner> {
    const row = this.toRow(partner)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('partners') as any)
      .upsert(row)
      .select()
      .single()

    if (error) throw new Error(`거래처 저장 실패: ${error.message}`)
    if (!data) throw new Error('거래처 저장 실패: 데이터 없음')
    return this.toEntity(data as PartnerRow)
  }

  async saveMany(partners: Partner[]): Promise<Partner[]> {
    const rows = partners.map((p) => this.toRow(p))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('partners') as any)
      .upsert(rows)
      .select()

    if (error) throw new Error(`거래처 일괄 저장 실패: ${error.message}`)
    if (!data) throw new Error('거래처 일괄 저장 실패: 데이터 없음')
    return (data as PartnerRow[]).map((row) => this.toEntity(row))
  }

  async delete(id: string): Promise<void> {
    const updateData: PartnerUpdate = { is_active: false }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('partners') as any).update(updateData).eq('id', id)

    if (error) throw new Error(`거래처 삭제 실패: ${error.message}`)
  }

  async existsByCode(partnerCode: string): Promise<boolean> {
    const { data } = await supabase
      .from('partners')
      .select('id')
      .eq('partner_code', partnerCode)
      .single()

    return !!data
  }
}
