// Domain Entities
// 순수 TypeScript - 외부 의존성 ZERO

export { Company } from './Company'
export type { CompanyProps, OrderHeader } from './Company'

export { Partner } from './Partner'
export type { PartnerProps, ContactInfo } from './Partner'

export { Product } from './Product'
export type { ProductProps, SplitQuantity } from './Product'

export { VehicleModel } from './VehicleModel'
export type { VehicleModelProps } from './VehicleModel'

export { ExchangeRate } from './ExchangeRate'
export type { ExchangeRateProps } from './ExchangeRate'

export { InventoryTransaction } from './InventoryTransaction'
export type { InventoryTransactionProps, TransactionType } from './InventoryTransaction'

export { ShipmentPlan } from './ShipmentPlan'
export type { ShipmentPlanProps, PlanType } from './ShipmentPlan'

export { PurchaseOrder } from './PurchaseOrder'
export type { PurchaseOrderProps, OrderType } from './PurchaseOrder'

export { PurchaseOrderLog } from './PurchaseOrderLog'
export type { PurchaseOrderLogProps } from './PurchaseOrderLog'
