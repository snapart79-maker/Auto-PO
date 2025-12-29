/**
 * useInventoryStatus Hook
 * 재고 현황 조회 훅
 *
 * PRD 5.2 재고 현황 화면 데이터 페칭
 */

import { useState, useCallback, useEffect } from 'react'
import { supabase } from '@infrastructure/supabase/client'
import { CurrentInventory, StockStatus } from '@domain/entities/CurrentInventory'

export interface InventoryStatusFilter {
  productCodes?: string[]
  productName?: string
  vehicleCodes?: string[]
  stockStatus?: StockStatus | 'ALL'
}

export interface InventoryStatusItem {
  productId: string
  productCode: string
  productName: string
  vehicleName: string | null
  currentQty: number
  safetyStock: number
  stockStatus: StockStatus
  stockRatio: number
  inboundPending: number // 입고 예정
  availableStock: number // 가용 재고
}

interface UseInventoryStatusReturn {
  items: InventoryStatusItem[]
  loading: boolean
  error: string | null
  search: (filter: InventoryStatusFilter) => Promise<void>
  refresh: () => Promise<void>
  summary: {
    total: number
    normal: number
    caution: number
    warning: number
    critical: number
  }
}

// 제품+차종+입출고+조정 조인 쿼리 결과
interface ProductWithInventoryRow {
  id: string
  product_code: string
  product_name: string
  vehicle_models: { vehicle_name: string } | null
  safety_stock_min: number | null
}

export function useInventoryStatus(): UseInventoryStatusReturn {
  const [items, setItems] = useState<InventoryStatusItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentFilter, setCurrentFilter] = useState<InventoryStatusFilter>({})

  const calculateInventory = useCallback(async (filter: InventoryStatusFilter) => {
    setLoading(true)
    setError(null)

    try {
      // 1. 제품 목록 조회 (차종 조인)
      let productQuery = supabase
        .from('products')
        .select(`
          id,
          product_code,
          product_name,
          safety_stock_min,
          vehicle_models (vehicle_name)
        `)
        .eq('is_active', true)

      // 품명 필터
      if (filter.productName) {
        productQuery = productQuery.ilike('product_name', `%${filter.productName}%`)
      }

      const { data: productsData, error: productsError } = await productQuery.order('product_code')

      if (productsError) throw new Error(`제품 조회 실패: ${productsError.message}`)
      if (!productsData || productsData.length === 0) {
        setItems([])
        return
      }

      const products = productsData as unknown as ProductWithInventoryRow[]
      const productIds = products.map((p) => p.id)

      // 품번 필터 (코드로 필터링)
      let filteredProducts = products
      if (filter.productCodes && filter.productCodes.length > 0) {
        const codes = filter.productCodes.map((c) => c.trim().toLowerCase())
        filteredProducts = products.filter((p) =>
          codes.some((code) => p.product_code.toLowerCase().includes(code))
        )
      }

      // 2. 초기 재고 조회
      const { data: initialData } = await supabase
        .from('initial_inventory')
        .select('product_id, quantity, base_date')
        .in('product_id', productIds)
        .order('base_date', { ascending: false })

      // 제품별 최신 초기 재고만 사용
      const initialInventoryMap = new Map<string, number>()
      for (const row of (initialData as { product_id: string; quantity: number }[]) ?? []) {
        if (!initialInventoryMap.has(row.product_id)) {
          initialInventoryMap.set(row.product_id, row.quantity)
        }
      }

      // 3. 입출고 이력 조회
      const { data: transactionsData } = await supabase
        .from('inventory_transactions')
        .select('product_id, transaction_type, quantity')
        .in('product_id', productIds)

      // 제품별 입출고 합계
      const inboundMap = new Map<string, number>()
      const outboundMap = new Map<string, number>()
      for (const tx of (transactionsData as { product_id: string; transaction_type: string; quantity: number }[]) ?? []) {
        if (tx.transaction_type === 'IN') {
          inboundMap.set(tx.product_id, (inboundMap.get(tx.product_id) ?? 0) + tx.quantity)
        } else if (tx.transaction_type === 'OUT') {
          outboundMap.set(tx.product_id, (outboundMap.get(tx.product_id) ?? 0) + tx.quantity)
        }
      }

      // 4. 재고 조정 조회
      const { data: adjustmentsData } = await supabase
        .from('inventory_adjustments')
        .select('product_id, adjustment_type, quantity')
        .in('product_id', productIds)

      // 제품별 조정 합계
      const adjustmentMap = new Map<string, number>()
      for (const adj of (adjustmentsData as { product_id: string; adjustment_type: string; quantity: number }[]) ?? []) {
        const current = adjustmentMap.get(adj.product_id) ?? 0
        if (adj.adjustment_type === 'INCREASE') {
          adjustmentMap.set(adj.product_id, current + adj.quantity)
        } else {
          adjustmentMap.set(adj.product_id, current - adj.quantity)
        }
      }

      // 5. 입고 예정 조회 (발주 후 미입고 = purchase_orders CONFIRMED/SENT 상태)
      // TODO: 실제 입고 예정 로직 구현 필요
      const pendingInboundMap = new Map<string, number>()

      // 6. CurrentInventory 엔티티 생성 및 필터링
      const result: InventoryStatusItem[] = []

      for (const product of filteredProducts) {
        const initialQty = initialInventoryMap.get(product.id) ?? 0
        const inboundQty = inboundMap.get(product.id) ?? 0
        const outboundQty = outboundMap.get(product.id) ?? 0
        const adjustmentQty = adjustmentMap.get(product.id) ?? 0
        const safetyStock = product.safety_stock_min ?? 0

        const currentInventory = CurrentInventory.create({
          productId: product.id,
          productCode: product.product_code,
          productName: product.product_name,
          vehicleName: product.vehicle_models?.vehicle_name,
          initialQty,
          inboundQty,
          outboundQty,
          adjustmentQty,
          safetyStock,
        })

        const stockStatus = currentInventory.getStockStatus()

        // 재고 상태 필터
        if (filter.stockStatus && filter.stockStatus !== 'ALL') {
          if (stockStatus !== filter.stockStatus) continue
        }

        const inboundPending = pendingInboundMap.get(product.id) ?? 0

        result.push({
          productId: product.id,
          productCode: product.product_code,
          productName: product.product_name,
          vehicleName: product.vehicle_models?.vehicle_name ?? null,
          currentQty: currentInventory.currentQty,
          safetyStock,
          stockStatus,
          stockRatio: currentInventory.getStockRatio(),
          inboundPending,
          availableStock: currentInventory.currentQty + inboundPending,
        })
      }

      setItems(result)
      setCurrentFilter(filter)
    } catch (err) {
      const message = err instanceof Error ? err.message : '재고 조회 실패'
      setError(message)
      console.error('재고 조회 실패:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const search = useCallback(
    async (filter: InventoryStatusFilter) => {
      await calculateInventory(filter)
    },
    [calculateInventory]
  )

  const refresh = useCallback(async () => {
    await calculateInventory(currentFilter)
  }, [calculateInventory, currentFilter])

  // 초기 로드
  useEffect(() => {
    calculateInventory({})
  }, [calculateInventory])

  // 요약 계산
  const summary = {
    total: items.length,
    normal: items.filter((i) => i.stockStatus === StockStatus.NORMAL).length,
    caution: items.filter((i) => i.stockStatus === StockStatus.CAUTION).length,
    warning: items.filter((i) => i.stockStatus === StockStatus.WARNING).length,
    critical: items.filter((i) => i.stockStatus === StockStatus.CRITICAL).length,
  }

  return {
    items,
    loading,
    error,
    search,
    refresh,
    summary,
  }
}
