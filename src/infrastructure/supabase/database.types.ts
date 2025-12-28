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
    }
  }
}
