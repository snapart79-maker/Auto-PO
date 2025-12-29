// Generated from Supabase schema
// This will be regenerated using `supabase gen types typescript` when connected

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type PartnerType = 'SUPPLIER' | 'CUSTOMER' | 'VIETNAM'
export type SupplierType = 'DOMESTIC' | 'VIETNAM' | 'BOTH'
export type TransactionType = 'IN' | 'OUT'
export type PlanType = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'
export type OrderStatus = 'DRAFT' | 'CONFIRMED' | 'SENT' | 'PARTIALLY_RECEIVED' | 'COMPLETED' | 'CANCELLED'
export type OrderType = 'DOMESTIC' | 'VIETNAM'
export type AdjustmentType = 'INCREASE' | 'DECREASE'
export type AdjustmentReason = 'PHYSICAL_COUNT' | 'LOSS' | 'DAMAGE' | 'OTHER'

export interface Database {
  public: {
    Tables: {
      company_configs: {
        Row: {
          id: string
          company_name_kr: string
          company_name_en: string | null
          ceo_name: string
          business_number: string
          address_kr: string
          address_en: string | null
          phone: string | null
          fax: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_name_kr: string
          company_name_en?: string | null
          ceo_name: string
          business_number: string
          address_kr: string
          address_en?: string | null
          phone?: string | null
          fax?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_name_kr?: string
          company_name_en?: string | null
          ceo_name?: string
          business_number?: string
          address_kr?: string
          address_en?: string | null
          phone?: string | null
          fax?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      vehicle_models: {
        Row: {
          id: string
          vehicle_code: string
          vehicle_name: string
          description: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          vehicle_code: string
          vehicle_name: string
          description?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          vehicle_code?: string
          vehicle_name?: string
          description?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      partners: {
        Row: {
          id: string
          partner_code: string
          partner_name: string
          partner_type: PartnerType
          business_number: string | null
          address: string | null
          contact_person: string | null
          contact_phone: string | null
          contact_email: string | null
          currency: string
          is_active: boolean
          created_at: string
          updated_at: string
          // Extended fields (거래처 관리 Excel)
          note: string | null
          partner_group: string | null
          ceo_name: string | null
          foundation_date: string | null
          postal_code: string | null
          business_type: string | null
          industry_type: string | null
          country_code: string | null
          incoterms: string | null
          phone2: string | null
          website: string | null
          partner_contact_phone: string | null
          manager: string | null
          effective_start_date: string | null
          effective_end_date: string | null
        }
        Insert: {
          id?: string
          partner_code: string
          partner_name: string
          partner_type: PartnerType
          business_number?: string | null
          address?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          contact_email?: string | null
          currency?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
          // Extended fields
          note?: string | null
          partner_group?: string | null
          ceo_name?: string | null
          foundation_date?: string | null
          postal_code?: string | null
          business_type?: string | null
          industry_type?: string | null
          country_code?: string | null
          incoterms?: string | null
          phone2?: string | null
          website?: string | null
          partner_contact_phone?: string | null
          manager?: string | null
          effective_start_date?: string | null
          effective_end_date?: string | null
        }
        Update: {
          id?: string
          partner_code?: string
          partner_name?: string
          partner_type?: PartnerType
          business_number?: string | null
          address?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          contact_email?: string | null
          currency?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
          // Extended fields
          note?: string | null
          partner_group?: string | null
          ceo_name?: string | null
          foundation_date?: string | null
          postal_code?: string | null
          business_type?: string | null
          industry_type?: string | null
          country_code?: string | null
          incoterms?: string | null
          phone2?: string | null
          website?: string | null
          partner_contact_phone?: string | null
          manager?: string | null
          effective_start_date?: string | null
          effective_end_date?: string | null
        }
      }
      exchange_rates: {
        Row: {
          id: string
          currency_code: string
          rate: number
          effective_date: string
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          currency_code: string
          rate: number
          effective_date: string
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          currency_code?: string
          rate?: number
          effective_date?: string
          created_by?: string | null
          created_at?: string
        }
      }
      products: {
        Row: {
          id: string
          product_code: string
          product_name: string
          vehicle_model_id: string | null
          domestic_lead_time: number
          overseas_lead_time: number
          primary_supplier: SupplierType
          main_partner_id: string | null
          sub_partner_id: string | null
          domestic_ratio: number
          unit_price: number | null
          currency: string
          is_active: boolean
          created_at: string
          updated_at: string
          // Extended fields (품목마스터 관리 Excel)
          project_code: string | null
          spec1: string | null
          spec2: string | null
          spec3: string | null
          moq: number | null
          product_type: string | null
          unit: string | null
          effective_start_date: string | null
          effective_end_date: string | null
        }
        Insert: {
          id?: string
          product_code: string
          product_name: string
          vehicle_model_id?: string | null
          domestic_lead_time?: number
          overseas_lead_time?: number
          primary_supplier?: SupplierType
          main_partner_id?: string | null
          sub_partner_id?: string | null
          domestic_ratio?: number
          unit_price?: number | null
          currency?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
          // Extended fields
          project_code?: string | null
          spec1?: string | null
          spec2?: string | null
          spec3?: string | null
          moq?: number | null
          product_type?: string | null
          unit?: string | null
          effective_start_date?: string | null
          effective_end_date?: string | null
        }
        Update: {
          id?: string
          product_code?: string
          product_name?: string
          vehicle_model_id?: string | null
          domestic_lead_time?: number
          overseas_lead_time?: number
          primary_supplier?: SupplierType
          main_partner_id?: string | null
          sub_partner_id?: string | null
          domestic_ratio?: number
          unit_price?: number | null
          currency?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
          // Extended fields
          project_code?: string | null
          spec1?: string | null
          spec2?: string | null
          spec3?: string | null
          moq?: number | null
          product_type?: string | null
          unit?: string | null
          effective_start_date?: string | null
          effective_end_date?: string | null
        }
      }
      inventory_transactions: {
        Row: {
          id: string
          transaction_date: string
          transaction_type: TransactionType
          partner_id: string | null
          product_id: string | null
          quantity: number
          unit_price: number | null
          supply_amount: number | null
          currency: string
          exchange_rate: number | null
          total_amount: number | null
          item_type: string | null
          upload_batch_id: string | null
          created_at: string
          // Extended fields (입고/출고 마감관리 Excel)
          partner_code: string | null
          vat_rate: number | null
          krw_amount: number | null
          tax_amount: number | null
          warehouse_code: string | null
          warehouse_name: string | null
          closing_key: string | null
          registered_at: string | null
          registered_by: string | null
          modified_at: string | null
          modified_by: string | null
          return_number: string | null
          transaction_detail: string | null
          lot_number: string | null
          transaction_category: string | null
          shipment_type: string | null
          customer_product_code: string | null
          contract_price: number | null
          contract_currency: string | null
          applied_price: number | null
        }
        Insert: {
          id?: string
          transaction_date: string
          transaction_type: TransactionType
          partner_id?: string | null
          product_id?: string | null
          quantity: number
          unit_price?: number | null
          supply_amount?: number | null
          currency?: string
          exchange_rate?: number | null
          total_amount?: number | null
          item_type?: string | null
          upload_batch_id?: string | null
          created_at?: string
          // Extended fields
          partner_code?: string | null
          vat_rate?: number | null
          krw_amount?: number | null
          tax_amount?: number | null
          warehouse_code?: string | null
          warehouse_name?: string | null
          closing_key?: string | null
          registered_at?: string | null
          registered_by?: string | null
          modified_at?: string | null
          modified_by?: string | null
          return_number?: string | null
          transaction_detail?: string | null
          lot_number?: string | null
          transaction_category?: string | null
          shipment_type?: string | null
          customer_product_code?: string | null
          contract_price?: number | null
          contract_currency?: string | null
          applied_price?: number | null
        }
        Update: {
          id?: string
          transaction_date?: string
          transaction_type?: TransactionType
          partner_id?: string | null
          product_id?: string | null
          quantity?: number
          unit_price?: number | null
          supply_amount?: number | null
          currency?: string
          exchange_rate?: number | null
          total_amount?: number | null
          item_type?: string | null
          upload_batch_id?: string | null
          created_at?: string
          // Extended fields
          partner_code?: string | null
          vat_rate?: number | null
          krw_amount?: number | null
          tax_amount?: number | null
          warehouse_code?: string | null
          warehouse_name?: string | null
          closing_key?: string | null
          registered_at?: string | null
          registered_by?: string | null
          modified_at?: string | null
          modified_by?: string | null
          return_number?: string | null
          transaction_detail?: string | null
          lot_number?: string | null
          transaction_category?: string | null
          shipment_type?: string | null
          customer_product_code?: string | null
          contract_price?: number | null
          contract_currency?: string | null
          applied_price?: number | null
        }
      }
      shipment_plans: {
        Row: {
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
          updated_at: string
        }
        Insert: {
          id?: string
          plan_date: string
          plan_type: PlanType
          partner_id?: string | null
          product_id?: string | null
          vehicle_model_id?: string | null
          planned_quantity: number
          unit_price?: number | null
          currency?: string
          planned_amount?: number | null
          source?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          plan_date?: string
          plan_type?: PlanType
          partner_id?: string | null
          product_id?: string | null
          vehicle_model_id?: string | null
          planned_quantity?: number
          unit_price?: number | null
          currency?: string
          planned_amount?: number | null
          source?: string
          created_at?: string
          updated_at?: string
        }
      }
      purchase_orders: {
        Row: {
          id: string
          order_number: string
          order_date: string
          due_date: string
          shipment_date: string | null
          partner_id: string | null
          company_id: string | null
          order_type: OrderType
          status: OrderStatus
          total_quantity: number | null
          total_amount: number | null
          currency: string
          exchange_rate: number | null
          notes: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_number: string
          order_date: string
          due_date: string
          shipment_date?: string | null
          partner_id?: string | null
          company_id?: string | null
          order_type: OrderType
          status?: OrderStatus
          total_quantity?: number | null
          total_amount?: number | null
          currency?: string
          exchange_rate?: number | null
          notes?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_number?: string
          order_date?: string
          due_date?: string
          shipment_date?: string | null
          partner_id?: string | null
          company_id?: string | null
          order_type?: OrderType
          status?: OrderStatus
          total_quantity?: number | null
          total_amount?: number | null
          currency?: string
          exchange_rate?: number | null
          notes?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      purchase_order_items: {
        Row: {
          id: string
          order_id: string | null
          product_id: string | null
          quantity: number
          unit_price: number | null
          amount: number | null
          currency: string
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          order_id?: string | null
          product_id?: string | null
          quantity: number
          unit_price?: number | null
          amount?: number | null
          currency?: string
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string | null
          product_id?: string | null
          quantity?: number
          unit_price?: number | null
          amount?: number | null
          currency?: string
          notes?: string | null
          created_at?: string
        }
      }
      purchase_order_logs: {
        Row: {
          id: string
          order_id: string | null
          prev_status: string | null
          new_status: string | null
          changed_by: string | null
          changed_at: string
          remarks: string | null
        }
        Insert: {
          id?: string
          order_id?: string | null
          prev_status?: string | null
          new_status?: string | null
          changed_by?: string | null
          changed_at?: string
          remarks?: string | null
        }
        Update: {
          id?: string
          order_id?: string | null
          prev_status?: string | null
          new_status?: string | null
          changed_by?: string | null
          changed_at?: string
          remarks?: string | null
        }
      }
      initial_inventory: {
        Row: {
          id: string
          product_id: string
          base_date: string
          quantity: number
          remarks: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          base_date: string
          quantity: number
          remarks?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          base_date?: string
          quantity?: number
          remarks?: string | null
          created_by?: string | null
          created_at?: string
        }
      }
      inventory_adjustments: {
        Row: {
          id: string
          adjustment_date: string
          product_id: string
          adjustment_type: AdjustmentType
          quantity: number
          reason: AdjustmentReason
          remarks: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          adjustment_date: string
          product_id: string
          adjustment_type: AdjustmentType
          quantity: number
          reason: AdjustmentReason
          remarks?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          adjustment_date?: string
          product_id?: string
          adjustment_type?: AdjustmentType
          quantity?: number
          reason?: AdjustmentReason
          remarks?: string | null
          created_by?: string | null
          created_at?: string
        }
      }
      system_settings: {
        Row: {
          id: string
          setting_key: string
          setting_value: string
          description: string | null
          updated_by: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          setting_key: string
          setting_value: string
          description?: string | null
          updated_by?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          setting_key?: string
          setting_value?: string
          description?: string | null
          updated_by?: string | null
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      partner_type: PartnerType
      supplier_type: SupplierType
      transaction_type: TransactionType
      plan_type: PlanType
      order_status: OrderStatus
      order_type: OrderType
      adjustment_type: AdjustmentType
      adjustment_reason: AdjustmentReason
    }
  }
}
