/**
 * SupabaseCompanyRepository
 * ICompanyRepository의 Supabase 구현체
 */

import { supabase } from '../supabase/client'
import type { ICompanyRepository } from '@domain/repositories/ICompanyRepository'
import { Company, type CompanyProps } from '@domain/entities/Company'
import type { Database } from '../supabase/database.types'

type CompanyRow = Database['public']['Tables']['company_configs']['Row']
type CompanyInsert = Database['public']['Tables']['company_configs']['Insert']
type CompanyUpdate = Database['public']['Tables']['company_configs']['Update']

export class SupabaseCompanyRepository implements ICompanyRepository {
  private toEntity(row: CompanyRow): Company {
    const props: CompanyProps = {
      id: row.id,
      companyNameKr: row.company_name_kr,
      companyNameEn: row.company_name_en ?? undefined,
      ceoName: row.ceo_name,
      businessNumber: row.business_number,
      addressKr: row.address_kr,
      addressEn: row.address_en ?? undefined,
      phone: row.phone ?? undefined,
      fax: row.fax ?? undefined,
      isActive: row.is_active,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }
    return Company.create(props)
  }

  private toRow(company: Company): CompanyInsert {
    return {
      id: company.id,
      company_name_kr: company.companyNameKr,
      company_name_en: company.companyNameEn ?? null,
      ceo_name: company.ceoName,
      business_number: company.businessNumber,
      address_kr: company.addressKr,
      address_en: company.addressEn ?? null,
      phone: company.phone ?? null,
      fax: company.fax ?? null,
      is_active: company.isActive,
    }
  }

  async findById(id: string): Promise<Company | null> {
    const { data, error } = await supabase
      .from('company_configs')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) return null
    return this.toEntity(data)
  }

  async findActive(): Promise<Company | null> {
    const { data, error } = await supabase
      .from('company_configs')
      .select('*')
      .eq('is_active', true)
      .single()

    if (error || !data) return null
    return this.toEntity(data)
  }

  async findAll(): Promise<Company[]> {
    const { data, error } = await supabase
      .from('company_configs')
      .select('*')
      .order('created_at', { ascending: false })

    if (error || !data) return []
    return data.map((row) => this.toEntity(row))
  }

  async save(company: Company): Promise<Company> {
    const row = this.toRow(company)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('company_configs') as any)
      .upsert(row)
      .select()
      .single()

    if (error) throw new Error(`회사 정보 저장 실패: ${error.message}`)
    if (!data) throw new Error('회사 정보 저장 실패: 데이터 없음')
    return this.toEntity(data as CompanyRow)
  }

  async delete(id: string): Promise<void> {
    const updateData: CompanyUpdate = { is_active: false }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('company_configs') as any)
      .update(updateData)
      .eq('id', id)

    if (error) throw new Error(`회사 정보 삭제 실패: ${error.message}`)
  }
}
