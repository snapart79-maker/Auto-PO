// Repository Interfaces
// 인터페이스만 정의, 구현체는 @interface/gateways에서 제공

export type { ICompanyRepository } from './ICompanyRepository'
export type { IPartnerRepository, PartnerFilter } from './IPartnerRepository'
export type { IProductRepository, ProductFilter } from './IProductRepository'
export type {
  IInventoryRepository,
  InventoryFilter,
  StockSummary,
  DailyAverage,
  IInitialInventoryRepository,
  InitialInventoryFilter,
  IInventoryAdjustmentRepository,
  AdjustmentFilter,
  AdjustmentSummary,
} from './IInventoryRepository'

export type { ISystemSettingRepository } from './ISystemSettingRepository'
export type {
  IOrderRepository,
  OrderFilter,
  PendingOrderSummary,
} from './IOrderRepository'
