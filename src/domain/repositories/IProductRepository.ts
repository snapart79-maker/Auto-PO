/**
 * Product Repository Interface
 * 제품 저장소 인터페이스
 * 구현체는 @interface/gateways에서 제공
 */

import type { Product } from '../entities/Product'
import type { SupplierType } from '../valueObjects/SupplierType'

export interface ProductFilter {
  vehicleModelId?: string
  primarySupplier?: SupplierType
  mainPartnerId?: string
  isActive?: boolean
  searchText?: string
}

export interface IProductRepository {
  /**
   * ID로 조회
   */
  findById(id: string): Promise<Product | null>

  /**
   * 품번으로 조회
   */
  findByCode(productCode: string): Promise<Product | null>

  /**
   * 조건에 맞는 제품 목록 조회
   */
  findAll(filter?: ProductFilter): Promise<Product[]>

  /**
   * ID 목록으로 제품 조회
   */
  findByIds(ids: string[]): Promise<Product[]>

  /**
   * 차종별 제품 목록 조회
   */
  findByVehicleModel(vehicleModelId: string): Promise<Product[]>

  /**
   * 거래처별 제품 목록 조회 (해당 거래처가 공급하는 제품)
   */
  findByPartner(partnerId: string): Promise<Product[]>

  /**
   * 이원화 대상 제품 목록 조회
   */
  findDualSourcingProducts(): Promise<Product[]>

  /**
   * 저장 (생성/수정)
   */
  save(product: Product): Promise<Product>

  /**
   * 일괄 저장
   */
  saveMany(products: Product[]): Promise<Product[]>

  /**
   * 삭제 (soft delete)
   */
  delete(id: string): Promise<void>

  /**
   * 품번 존재 여부 확인
   */
  existsByCode(productCode: string): Promise<boolean>
}
