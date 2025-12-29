// Application Use Cases

export { CalculateMRPUseCase } from './CalculateMRPUseCase'
export type { MRPResult, CalculateMRPDependencies } from './CalculateMRPUseCase'

export { ConsolidateVietnamOrdersUseCase } from './ConsolidateVietnamOrdersUseCase'
export type {
  OrderRecommendation,
  ConsolidatedItem,
  ConsolidatedOrder,
} from './ConsolidateVietnamOrdersUseCase'

export { GeneratePurchaseOrderUseCase } from './GeneratePurchaseOrderUseCase'
export type {
  GeneratePurchaseOrderDependencies,
  GenerateOrderInput,
  OrderItem,
} from './GeneratePurchaseOrderUseCase'

export { SplitOrderByRatioUseCase } from './SplitOrderByRatioUseCase'
export type { SplitResult } from './SplitOrderByRatioUseCase'

export { ValidateUploadDataUseCase } from './ValidateUploadDataUseCase'
export type {
  UploadRow,
  ValidationError,
  ValidationResult,
  ValidationErrorType,
} from './ValidateUploadDataUseCase'

// 새 재고 관리 Use Cases
export { CalculateCurrentStockUseCase } from './CalculateCurrentStockUseCase'
export type { CalculateCurrentStockDependencies } from './CalculateCurrentStockUseCase'

export { RegisterInitialInventoryUseCase } from './RegisterInitialInventoryUseCase'
export type {
  RegisterInitialInventoryInput,
  RegisterInitialInventoryDependencies,
} from './RegisterInitialInventoryUseCase'

export { AdjustInventoryUseCase } from './AdjustInventoryUseCase'
export type {
  AdjustInventoryInput,
  AdjustInventoryDependencies,
} from './AdjustInventoryUseCase'

// 입고/출고 현황 조회 Use Cases
export { GetTransactionsWithDetailsUseCase } from './GetTransactionsWithDetailsUseCase'
export { GetPartnerSummaryUseCase } from './GetPartnerSummaryUseCase'

// DTOs
export type {
  TransactionWithDetails,
  TransactionQueryFilter,
  PartnerSummary,
  PartnerSummaryResult,
} from '../dtos/TransactionWithDetails'
