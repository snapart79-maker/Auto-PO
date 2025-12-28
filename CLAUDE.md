# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**자동발주 시스템 (Automated Purchase Order Management System)** - A Wire Harness manufacturing MRP (Material Requirements Planning) system for 경림테크(주) that handles:
- Dual sourcing (Korea domestic + Vietnam factory) with automatic split orders
- MES Excel data upload with advanced validation
- MRP calculations for optimal inventory and ordering
- Purchase order generation (Excel/PDF)

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React + TypeScript, shadcn/ui, TanStack Table |
| Backend | Supabase (PostgreSQL, Auth, Edge Functions, Realtime) |
| PDF | pypdf, reportlab (Python) |
| Architecture | Clean Architecture |

## Clean Architecture Structure

```
src/
├── domain/           # Core business logic (no framework dependencies)
│   ├── entities/     # Product, Partner, Order, Inventory, Company
│   └── repositories/ # Interface definitions only
├── application/      # Use cases (depends only on domain)
│   ├── usecases/     # CalculateOrderQuantity, SplitOrderByRatio, ValidateUploadData
│   └── services/     # MRPCalculationService
├── interface/        # Adapters (depends on application)
│   ├── controllers/
│   ├── presenters/
│   └── gateways/     # Supabase repository implementations
└── infrastructure/   # Frameworks (outermost layer)
    ├── supabase/
    ├── react/
    └── external/     # ExcelParser, PdfGenerator
```

**Key Principle**: Dependencies flow inward. `domain/` has zero external dependencies.

## MRP Core Formulas

```
Net Requirements = Total Requirements - Current Stock - Pending Orders + Safety Stock
Safety Stock (Domestic) = Daily Avg Shipment × Lead Time × 1.2
Safety Stock (Vietnam)  = Daily Avg Shipment × Lead Time × 1.5
Reorder Point = Safety Stock + (Daily Consumption × Lead Time)
```

## Dual Sourcing Split

For products with `primary_supplier = 'BOTH'`:
```
Domestic Order = Round(Total × domestic_ratio / 100)
Vietnam Order  = Total - Domestic Order
```

## Key Business Rules

- **Vietnam orders**: Weekly consolidated orders (Mon-Thu accumulate, Fri generate)
- **Exchange rates**: Fixed rates managed by admin (not real-time API)
- **Partner codes**: User-defined, not auto-generated
- **Partner types**: SUPPLIER (domestic), CUSTOMER (sales), VIETNAM (overseas)

## MCP Servers Available

- **context7**: Library documentation (React, TypeScript, TanStack)
- **supabase**: DB schema, Auth, RLS, Edge Functions
- **postgres**: SQL optimization, indexes, complex aggregations
- **magic**: Dashboard UI, charts, high-quality components
- **playwright**: E2E testing
- **sequential-thinking**: Complex MRP algorithm design

## Database Tables

Core tables: `company_configs`, `partners`, `products`, `vehicle_models`, `exchange_rates`, `inventory_transactions`, `shipment_plans`, `purchase_orders`, `purchase_order_logs`

Key relationships:
- Products link to vehicle_models, main_partner (domestic), sub_partner (Vietnam)
- Inventory transactions reference partners and products
- Purchase orders have audit logs in purchase_order_logs
