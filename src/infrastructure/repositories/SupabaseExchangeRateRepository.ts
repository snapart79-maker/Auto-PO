/**
 * SupabaseExchangeRateRepository
 * 환율 관리 Supabase 구현체
 */

import { supabase } from '../supabase/client'
import { ExchangeRate, type ExchangeRateProps } from '@domain/entities/ExchangeRate'
import type { Currency } from '@domain/valueObjects/Money'
import type { Database } from '../supabase/database.types'

type ExchangeRateRow = Database['public']['Tables']['exchange_rates']['Row']
type ExchangeRateInsert = Database['public']['Tables']['exchange_rates']['Insert']

export interface IExchangeRateRepository {
  findById(id: string): Promise<ExchangeRate | null>
  findByCurrencyAndDate(currencyCode: string, date: Date): Promise<ExchangeRate | null>
  findLatestByCurrency(currencyCode: string): Promise<ExchangeRate | null>
  findAll(filter?: { currencyCode?: string; startDate?: Date; endDate?: Date }): Promise<ExchangeRate[]>
  save(exchangeRate: ExchangeRate): Promise<ExchangeRate>
  saveMany(exchangeRates: ExchangeRate[]): Promise<ExchangeRate[]>
  delete(id: string): Promise<void>
}

export class SupabaseExchangeRateRepository implements IExchangeRateRepository {
  private toEntity(row: ExchangeRateRow): ExchangeRate {
    const props: ExchangeRateProps = {
      id: row.id,
      currencyCode: row.currency_code as Currency,
      rate: row.rate,
      effectiveDate: new Date(row.effective_date),
      createdBy: row.created_by ?? undefined,
      createdAt: new Date(row.created_at),
    }
    return ExchangeRate.create(props)
  }

  private toRow(exchangeRate: ExchangeRate): ExchangeRateInsert {
    return {
      id: exchangeRate.id,
      currency_code: exchangeRate.currencyCode,
      rate: exchangeRate.rate,
      effective_date: exchangeRate.effectiveDate.toISOString().split('T')[0] ?? '',
      created_by: exchangeRate.createdBy ?? null,
    }
  }

  async findById(id: string): Promise<ExchangeRate | null> {
    const { data, error } = await supabase
      .from('exchange_rates')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) return null
    return this.toEntity(data)
  }

  async findByCurrencyAndDate(currencyCode: string, date: Date): Promise<ExchangeRate | null> {
    const dateStr = date.toISOString().split('T')[0] ?? ''
    const { data, error } = await supabase
      .from('exchange_rates')
      .select('*')
      .eq('currency_code', currencyCode)
      .eq('effective_date', dateStr)
      .single()

    if (error || !data) return null
    return this.toEntity(data)
  }

  async findLatestByCurrency(currencyCode: string): Promise<ExchangeRate | null> {
    const { data, error } = await supabase
      .from('exchange_rates')
      .select('*')
      .eq('currency_code', currencyCode)
      .order('effective_date', { ascending: false })
      .limit(1)
      .single()

    if (error || !data) return null
    return this.toEntity(data)
  }

  async findAll(filter?: { currencyCode?: string; startDate?: Date; endDate?: Date }): Promise<ExchangeRate[]> {
    let query = supabase.from('exchange_rates').select('*')

    if (filter?.currencyCode) {
      query = query.eq('currency_code', filter.currencyCode)
    }
    if (filter?.startDate) {
      const startStr = filter.startDate.toISOString().split('T')[0] ?? ''
      query = query.gte('effective_date', startStr)
    }
    if (filter?.endDate) {
      const endStr = filter.endDate.toISOString().split('T')[0] ?? ''
      query = query.lte('effective_date', endStr)
    }

    const { data, error } = await query.order('effective_date', { ascending: false })

    if (error || !data) return []
    return data.map((row) => this.toEntity(row))
  }

  async save(exchangeRate: ExchangeRate): Promise<ExchangeRate> {
    const row = this.toRow(exchangeRate)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('exchange_rates') as any)
      .upsert(row)
      .select()
      .single()

    if (error) throw new Error(`환율 저장 실패: ${error.message}`)
    if (!data) throw new Error('환율 저장 실패: 데이터 없음')
    return this.toEntity(data as ExchangeRateRow)
  }

  async saveMany(exchangeRates: ExchangeRate[]): Promise<ExchangeRate[]> {
    const rows = exchangeRates.map((e) => this.toRow(e))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('exchange_rates') as any)
      .upsert(rows)
      .select()

    if (error) throw new Error(`환율 일괄 저장 실패: ${error.message}`)
    if (!data) throw new Error('환율 일괄 저장 실패: 데이터 없음')
    return (data as ExchangeRateRow[]).map((row) => this.toEntity(row))
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('exchange_rates').delete().eq('id', id)

    if (error) throw new Error(`환율 삭제 실패: ${error.message}`)
  }
}
