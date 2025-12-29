/**
 * useShipmentPlan Hook
 * 출고 계획 관리 훅
 *
 * PRD 6.2 출고 계획 등록
 */

import { useState, useCallback, useEffect } from 'react'
import { supabase } from '@infrastructure/supabase/client'
import type { PlanType } from '@domain/entities/ShipmentPlan'

export interface ShipmentPlanItem {
  id: string
  planDate: Date
  planType: PlanType
  partnerId: string | null
  partnerName: string
  productId: string | null
  productCode: string
  productName: string
  vehicleModelId: string | null
  vehicleName: string
  plannedQuantity: number
  unitPrice: number | null
  currency: string
  plannedAmount: number | null
  source: 'MANUAL' | 'UPLOAD' | 'AUTO'
  createdAt: Date
}

export interface ShipmentPlanInput {
  planDate: Date
  planType: PlanType
  partnerId: string
  productId: string
  plannedQuantity: number
  unitPrice?: number
  currency?: string
}

export interface ShipmentPlanFilter {
  startDate?: Date
  endDate?: Date
  partnerId?: string
  productId?: string
  planType?: PlanType
}

interface UseShipmentPlanReturn {
  items: ShipmentPlanItem[]
  loading: boolean
  error: string | null
  search: (filter: ShipmentPlanFilter) => Promise<void>
  refresh: () => Promise<void>
  create: (input: ShipmentPlanInput) => Promise<void>
  remove: (id: string) => Promise<void>
  summary: {
    totalPlans: number
    totalQuantity: number
    byPlanType: { planType: PlanType; count: number; quantity: number }[]
  }
}

interface PlanRow {
  id: string
  plan_date: string
  plan_type: PlanType
  partner_id: string | null
  product_id: string | null
  vehicle_model_id: string | null
  planned_quantity: number
  unit_price: number | null
  currency: string
  planned_amount: number | null
  source: string
  created_at: string
  partners: { partner_name: string } | null
  products: { product_code: string; product_name: string } | null
  vehicle_models: { vehicle_name: string } | null
}

export function useShipmentPlan(): UseShipmentPlanReturn {
  const [items, setItems] = useState<ShipmentPlanItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentFilter, setCurrentFilter] = useState<ShipmentPlanFilter>({})

  const fetchData = useCallback(async (filter: ShipmentPlanFilter) => {
    setLoading(true)
    setError(null)

    try {
      let query = supabase
        .from('shipment_plans')
        .select(`
          id,
          plan_date,
          plan_type,
          partner_id,
          product_id,
          vehicle_model_id,
          planned_quantity,
          unit_price,
          currency,
          planned_amount,
          source,
          created_at,
          partners (partner_name),
          products (product_code, product_name),
          vehicle_models (vehicle_name)
        `)
        .order('plan_date', { ascending: false })

      if (filter.startDate) {
        const startStr = filter.startDate.toISOString().split('T')[0]!
        query = query.gte('plan_date', startStr)
      }
      if (filter.endDate) {
        const endStr = filter.endDate.toISOString().split('T')[0]!
        query = query.lte('plan_date', endStr)
      }
      if (filter.partnerId) {
        query = query.eq('partner_id', filter.partnerId)
      }
      if (filter.productId) {
        query = query.eq('product_id', filter.productId)
      }
      if (filter.planType) {
        query = query.eq('plan_type', filter.planType)
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw new Error(`출고 계획 조회 실패: ${fetchError.message}`)

      const rows = (data as unknown as PlanRow[]) ?? []
      const mapped: ShipmentPlanItem[] = rows.map((row) => ({
        id: row.id,
        planDate: new Date(row.plan_date),
        planType: row.plan_type,
        partnerId: row.partner_id,
        partnerName: row.partners?.partner_name ?? '-',
        productId: row.product_id,
        productCode: row.products?.product_code ?? '-',
        productName: row.products?.product_name ?? '-',
        vehicleModelId: row.vehicle_model_id,
        vehicleName: row.vehicle_models?.vehicle_name ?? '-',
        plannedQuantity: row.planned_quantity,
        unitPrice: row.unit_price,
        currency: row.currency,
        plannedAmount: row.planned_amount,
        source: row.source as 'MANUAL' | 'UPLOAD' | 'AUTO',
        createdAt: new Date(row.created_at),
      }))

      setItems(mapped)
      setCurrentFilter(filter)
    } catch (err) {
      const message = err instanceof Error ? err.message : '출고 계획 조회 실패'
      setError(message)
      console.error('출고 계획 조회 실패:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const search = useCallback(
    async (filter: ShipmentPlanFilter) => {
      await fetchData(filter)
    },
    [fetchData]
  )

  const refresh = useCallback(async () => {
    await fetchData(currentFilter)
  }, [fetchData, currentFilter])

  const create = useCallback(
    async (input: ShipmentPlanInput) => {
      setLoading(true)
      setError(null)

      try {
        const plannedAmount = input.unitPrice
          ? input.unitPrice * input.plannedQuantity
          : null

        const row = {
          id: crypto.randomUUID(),
          plan_date: input.planDate.toISOString().split('T')[0]!,
          plan_type: input.planType,
          partner_id: input.partnerId,
          product_id: input.productId,
          planned_quantity: input.plannedQuantity,
          unit_price: input.unitPrice ?? null,
          currency: input.currency ?? 'KRW',
          planned_amount: plannedAmount,
          source: 'MANUAL',
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: insertError } = await (supabase.from('shipment_plans') as any).insert(row)

        if (insertError) throw new Error(`출고 계획 등록 실패: ${insertError.message}`)

        await refresh()
      } catch (err) {
        const message = err instanceof Error ? err.message : '출고 계획 등록 실패'
        setError(message)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [refresh]
  )

  const remove = useCallback(
    async (id: string) => {
      setLoading(true)
      setError(null)

      try {
        const { error: deleteError } = await supabase
          .from('shipment_plans')
          .delete()
          .eq('id', id)

        if (deleteError) throw new Error(`출고 계획 삭제 실패: ${deleteError.message}`)

        await refresh()
      } catch (err) {
        const message = err instanceof Error ? err.message : '출고 계획 삭제 실패'
        setError(message)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [refresh]
  )

  // 초기 로드 (최근 1개월)
  useEffect(() => {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - 1)
    fetchData({ startDate, endDate })
  }, [fetchData])

  // 요약 계산
  const summary = {
    totalPlans: items.length,
    totalQuantity: items.reduce((sum, i) => sum + i.plannedQuantity, 0),
    byPlanType: (['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'] as PlanType[]).map((pt) => {
      const filtered = items.filter((i) => i.planType === pt)
      return {
        planType: pt,
        count: filtered.length,
        quantity: filtered.reduce((sum, i) => sum + i.plannedQuantity, 0),
      }
    }).filter((s) => s.count > 0),
  }

  return {
    items,
    loading,
    error,
    search,
    refresh,
    create,
    remove,
    summary,
  }
}
