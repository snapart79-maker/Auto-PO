/**
 * useInitialInventory Hook
 * 초기 재고 관리 훅
 *
 * PRD 5.3 초기 재고 등록
 */

import { useState, useCallback, useEffect } from 'react'
import { supabase } from '@infrastructure/supabase/client'

export interface InitialInventoryItem {
  id: string
  productId: string
  productCode: string
  productName: string
  baseDate: Date
  quantity: number
  remarks: string | null
  createdAt: Date
}

export interface InitialInventoryInput {
  productId: string
  baseDate: Date
  quantity: number
  remarks?: string
}

interface UseInitialInventoryReturn {
  items: InitialInventoryItem[]
  loading: boolean
  error: string | null
  search: (filter: { baseDate?: Date; productId?: string }) => Promise<void>
  refresh: () => Promise<void>
  create: (input: InitialInventoryInput) => Promise<void>
  update: (id: string, input: Partial<InitialInventoryInput>) => Promise<void>
  remove: (id: string) => Promise<void>
}

interface InitialInventoryRow {
  id: string
  product_id: string
  base_date: string
  quantity: number
  remarks: string | null
  created_at: string
  products: { product_code: string; product_name: string } | null
}

export function useInitialInventory(): UseInitialInventoryReturn {
  const [items, setItems] = useState<InitialInventoryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentFilter, setCurrentFilter] = useState<{ baseDate?: Date; productId?: string }>({})

  const fetchData = useCallback(async (filter: { baseDate?: Date; productId?: string }) => {
    setLoading(true)
    setError(null)

    try {
      let query = supabase
        .from('initial_inventory')
        .select(`
          id,
          product_id,
          base_date,
          quantity,
          remarks,
          created_at,
          products (product_code, product_name)
        `)
        .order('base_date', { ascending: false })

      if (filter.baseDate) {
        const dateStr = filter.baseDate.toISOString().split('T')[0]!
        query = query.eq('base_date', dateStr)
      }
      if (filter.productId) {
        query = query.eq('product_id', filter.productId)
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw new Error(`초기 재고 조회 실패: ${fetchError.message}`)

      const rows = (data as unknown as InitialInventoryRow[]) ?? []
      const mapped: InitialInventoryItem[] = rows.map((row) => ({
        id: row.id,
        productId: row.product_id,
        productCode: row.products?.product_code ?? '-',
        productName: row.products?.product_name ?? '-',
        baseDate: new Date(row.base_date),
        quantity: row.quantity,
        remarks: row.remarks,
        createdAt: new Date(row.created_at),
      }))

      setItems(mapped)
      setCurrentFilter(filter)
    } catch (err) {
      const message = err instanceof Error ? err.message : '초기 재고 조회 실패'
      setError(message)
      console.error('초기 재고 조회 실패:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const search = useCallback(
    async (filter: { baseDate?: Date; productId?: string }) => {
      await fetchData(filter)
    },
    [fetchData]
  )

  const refresh = useCallback(async () => {
    await fetchData(currentFilter)
  }, [fetchData, currentFilter])

  const create = useCallback(
    async (input: InitialInventoryInput) => {
      setLoading(true)
      setError(null)

      try {
        const row = {
          id: crypto.randomUUID(),
          product_id: input.productId,
          base_date: input.baseDate.toISOString().split('T')[0]!,
          quantity: input.quantity,
          remarks: input.remarks ?? null,
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: insertError } = await (supabase.from('initial_inventory') as any)
          .upsert(row, { onConflict: 'product_id,base_date' })

        if (insertError) throw new Error(`초기 재고 등록 실패: ${insertError.message}`)

        await refresh()
      } catch (err) {
        const message = err instanceof Error ? err.message : '초기 재고 등록 실패'
        setError(message)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [refresh]
  )

  const update = useCallback(
    async (id: string, input: Partial<InitialInventoryInput>) => {
      setLoading(true)
      setError(null)

      try {
        const updateData: Record<string, unknown> = {}
        if (input.productId) updateData.product_id = input.productId
        if (input.baseDate) updateData.base_date = input.baseDate.toISOString().split('T')[0]!
        if (input.quantity !== undefined) updateData.quantity = input.quantity
        if (input.remarks !== undefined) updateData.remarks = input.remarks

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: updateError } = await (supabase.from('initial_inventory') as any)
          .update(updateData)
          .eq('id', id)

        if (updateError) throw new Error(`초기 재고 수정 실패: ${updateError.message}`)

        await refresh()
      } catch (err) {
        const message = err instanceof Error ? err.message : '초기 재고 수정 실패'
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
          .from('initial_inventory')
          .delete()
          .eq('id', id)

        if (deleteError) throw new Error(`초기 재고 삭제 실패: ${deleteError.message}`)

        await refresh()
      } catch (err) {
        const message = err instanceof Error ? err.message : '초기 재고 삭제 실패'
        setError(message)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [refresh]
  )

  // 초기 로드
  useEffect(() => {
    fetchData({})
  }, [fetchData])

  return {
    items,
    loading,
    error,
    search,
    refresh,
    create,
    update,
    remove,
  }
}
