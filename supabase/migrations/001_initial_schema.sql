-- =============================================================================
-- Auto PO System - Initial Database Schema
-- 자동발주 시스템 데이터베이스 스키마
-- =============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- 1. company_configs (회사 정보)
-- 발주서 발급 주체 정보
-- =============================================================================
CREATE TABLE company_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name_kr VARCHAR(100) NOT NULL,     -- 경림테크(주)
    company_name_en VARCHAR(100),              -- Kyungrim Tech Co., Ltd.
    ceo_name VARCHAR(50) NOT NULL,             -- 대표이사명
    business_number VARCHAR(20) NOT NULL,      -- 사업자등록번호
    address_kr VARCHAR(200) NOT NULL,          -- 국문 주소
    address_en VARCHAR(200),                   -- 영문 주소
    phone VARCHAR(20),
    fax VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Default company data
INSERT INTO company_configs (
    company_name_kr, company_name_en, ceo_name, business_number,
    address_kr, address_en, phone, fax
) VALUES (
    '경림테크(주)', 'Kyungrim Tech Co., Ltd.', '홍길동', '000-00-00000',
    '경기도 화성시 동탄순환대로 123', '123 Dongtan Sunhwan-daero, Hwaseong-si, Gyeonggi-do, Korea',
    '031-000-0000', '031-000-0001'
);

-- =============================================================================
-- 2. vehicle_models (차종 마스터)
-- =============================================================================
CREATE TABLE vehicle_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_code VARCHAR(20) UNIQUE NOT NULL,
    vehicle_name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for search
CREATE INDEX idx_vehicle_models_code ON vehicle_models(vehicle_code);
CREATE INDEX idx_vehicle_models_name ON vehicle_models(vehicle_name);

-- =============================================================================
-- 3. partners (거래처 마스터)
-- 거래처 유형: SUPPLIER (협력사), CUSTOMER (고객사), VIETNAM (베트남 공장)
-- =============================================================================
CREATE TYPE partner_type AS ENUM ('SUPPLIER', 'CUSTOMER', 'VIETNAM');

CREATE TABLE partners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_code VARCHAR(20) UNIQUE NOT NULL,  -- 사용자 지정 코드
    partner_name VARCHAR(200) NOT NULL,
    partner_type partner_type NOT NULL,
    business_number VARCHAR(20),
    address TEXT,
    contact_person VARCHAR(100),
    contact_phone VARCHAR(20),
    contact_email VARCHAR(100),
    currency VARCHAR(3) DEFAULT 'KRW',         -- 기본 결제 통화
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for search and filtering
CREATE INDEX idx_partners_code ON partners(partner_code);
CREATE INDEX idx_partners_name ON partners(partner_name);
CREATE INDEX idx_partners_type ON partners(partner_type);

-- =============================================================================
-- 4. exchange_rates (환율 마스터)
-- 고정 환율 방식 - 관리자가 수동 업데이트
-- =============================================================================
CREATE TABLE exchange_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    currency_code VARCHAR(3) NOT NULL,         -- USD, EUR, VND
    rate DECIMAL(15, 4) NOT NULL,              -- KRW 기준 환율
    effective_date DATE NOT NULL,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(currency_code, effective_date)
);

-- Default exchange rates
INSERT INTO exchange_rates (currency_code, rate, effective_date) VALUES
    ('USD', 1400.00, CURRENT_DATE),
    ('EUR', 1500.00, CURRENT_DATE),
    ('VND', 0.055, CURRENT_DATE);

-- Index for currency lookup
CREATE INDEX idx_exchange_rates_currency ON exchange_rates(currency_code);
CREATE INDEX idx_exchange_rates_date ON exchange_rates(effective_date DESC);

-- =============================================================================
-- 5. products (제품 마스터)
-- 이원화 공급 설정 포함
-- =============================================================================
CREATE TYPE supplier_type AS ENUM ('DOMESTIC', 'VIETNAM', 'BOTH');

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_code VARCHAR(50) UNIQUE NOT NULL,
    product_name VARCHAR(200) NOT NULL,
    vehicle_model_id UUID REFERENCES vehicle_models(id) ON DELETE SET NULL,

    -- 리드타임 (일 단위)
    domestic_lead_time INTEGER DEFAULT 3,
    overseas_lead_time INTEGER DEFAULT 21,

    -- 이원화 공급 설정
    primary_supplier supplier_type DEFAULT 'DOMESTIC',
    main_partner_id UUID REFERENCES partners(id) ON DELETE SET NULL,  -- 국내 거래처
    sub_partner_id UUID REFERENCES partners(id) ON DELETE SET NULL,   -- 베트남 거래처
    domestic_ratio INTEGER DEFAULT 100 CHECK (domestic_ratio >= 0 AND domestic_ratio <= 100),

    unit_price DECIMAL(15, 4),
    currency VARCHAR(3) DEFAULT 'KRW',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_products_code ON products(product_code);
CREATE INDEX idx_products_name ON products(product_name);
CREATE INDEX idx_products_vehicle ON products(vehicle_model_id);
CREATE INDEX idx_products_supplier ON products(primary_supplier);

-- =============================================================================
-- 6. inventory_transactions (입출고 이력)
-- MES Excel 업로드 데이터 저장
-- =============================================================================
CREATE TYPE transaction_type AS ENUM ('IN', 'OUT');

CREATE TABLE inventory_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_date DATE NOT NULL,
    transaction_type transaction_type NOT NULL,
    partner_id UUID REFERENCES partners(id) ON DELETE SET NULL,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(15, 4),
    supply_amount DECIMAL(15, 2),
    currency VARCHAR(3) DEFAULT 'KRW',
    exchange_rate DECIMAL(15, 4),
    total_amount DECIMAL(15, 2),
    item_type VARCHAR(20),                     -- 원재료, 반제품, 완제품
    upload_batch_id UUID,                      -- 업로드 배치 추적
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for reporting
CREATE INDEX idx_inventory_date ON inventory_transactions(transaction_date);
CREATE INDEX idx_inventory_type ON inventory_transactions(transaction_type);
CREATE INDEX idx_inventory_partner ON inventory_transactions(partner_id);
CREATE INDEX idx_inventory_product ON inventory_transactions(product_id);
CREATE INDEX idx_inventory_batch ON inventory_transactions(upload_batch_id);

-- =============================================================================
-- 7. shipment_plans (출고 계획)
-- 일간/주간/월간/연간 출고 계획
-- =============================================================================
CREATE TYPE plan_type AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY');

CREATE TABLE shipment_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_date DATE NOT NULL,
    plan_type plan_type NOT NULL,
    partner_id UUID REFERENCES partners(id) ON DELETE SET NULL,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    vehicle_model_id UUID REFERENCES vehicle_models(id) ON DELETE SET NULL,
    planned_quantity INTEGER NOT NULL CHECK (planned_quantity >= 0),
    unit_price DECIMAL(15, 4),
    currency VARCHAR(3) DEFAULT 'KRW',
    planned_amount DECIMAL(15, 2),
    source VARCHAR(20) DEFAULT 'MANUAL',       -- MANUAL, UPLOAD, AUTO
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_shipment_date ON shipment_plans(plan_date);
CREATE INDEX idx_shipment_type ON shipment_plans(plan_type);
CREATE INDEX idx_shipment_partner ON shipment_plans(partner_id);
CREATE INDEX idx_shipment_product ON shipment_plans(product_id);

-- =============================================================================
-- 8. purchase_orders (발주서)
-- =============================================================================
CREATE TYPE order_status AS ENUM (
    'DRAFT',          -- 초안
    'CONFIRMED',      -- 확정
    'SENT',           -- 발송
    'PARTIALLY_RECEIVED',  -- 부분입고
    'COMPLETED',      -- 완료
    'CANCELLED'       -- 취소
);

CREATE TYPE order_type AS ENUM ('DOMESTIC', 'VIETNAM');

CREATE TABLE purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(50) UNIQUE NOT NULL,  -- PO-YYYYMMDD-NNN
    order_date DATE NOT NULL,
    due_date DATE NOT NULL,
    shipment_date DATE,                        -- 선적 예정일 (베트남용)
    partner_id UUID REFERENCES partners(id) ON DELETE SET NULL,
    company_id UUID REFERENCES company_configs(id) ON DELETE SET NULL,
    order_type order_type NOT NULL,
    status order_status DEFAULT 'DRAFT',
    total_quantity INTEGER,
    total_amount DECIMAL(15, 2),
    currency VARCHAR(3) DEFAULT 'KRW',
    exchange_rate DECIMAL(15, 4),
    notes TEXT,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_orders_number ON purchase_orders(order_number);
CREATE INDEX idx_orders_date ON purchase_orders(order_date);
CREATE INDEX idx_orders_partner ON purchase_orders(partner_id);
CREATE INDEX idx_orders_status ON purchase_orders(status);
CREATE INDEX idx_orders_type ON purchase_orders(order_type);

-- =============================================================================
-- 9. purchase_order_items (발주서 품목)
-- 발주서당 여러 품목 포함
-- =============================================================================
CREATE TABLE purchase_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES purchase_orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(15, 4),
    amount DECIMAL(15, 2),
    currency VARCHAR(3) DEFAULT 'KRW',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_order_items_order ON purchase_order_items(order_id);
CREATE INDEX idx_order_items_product ON purchase_order_items(product_id);

-- =============================================================================
-- 10. purchase_order_logs (발주 이력 - 감사 로그)
-- =============================================================================
CREATE TABLE purchase_order_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES purchase_orders(id) ON DELETE CASCADE,
    prev_status VARCHAR(20),
    new_status VARCHAR(20),
    changed_by VARCHAR(100),
    changed_at TIMESTAMPTZ DEFAULT NOW(),
    remarks TEXT
);

-- Index
CREATE INDEX idx_order_logs_order ON purchase_order_logs(order_id);
CREATE INDEX idx_order_logs_date ON purchase_order_logs(changed_at DESC);

-- =============================================================================
-- Triggers for updated_at
-- =============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_company_configs_updated_at
    BEFORE UPDATE ON company_configs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicle_models_updated_at
    BEFORE UPDATE ON vehicle_models
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_partners_updated_at
    BEFORE UPDATE ON partners
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shipment_plans_updated_at
    BEFORE UPDATE ON shipment_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_purchase_orders_updated_at
    BEFORE UPDATE ON purchase_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Trigger for automatic audit logging on purchase_orders status change
-- =============================================================================
CREATE OR REPLACE FUNCTION log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO purchase_order_logs (order_id, prev_status, new_status, changed_by, remarks)
        VALUES (NEW.id, OLD.status::VARCHAR, NEW.status::VARCHAR, 'system', 'Status auto-logged');
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_order_status_log
    AFTER UPDATE ON purchase_orders
    FOR EACH ROW EXECUTE FUNCTION log_order_status_change();

-- =============================================================================
-- Comments for documentation
-- =============================================================================
COMMENT ON TABLE company_configs IS '회사 정보 - 발주서 발급 주체';
COMMENT ON TABLE vehicle_models IS '차종 마스터';
COMMENT ON TABLE partners IS '거래처 마스터 (협력사, 고객사, 베트남)';
COMMENT ON TABLE exchange_rates IS '환율 마스터 (고정 환율 방식)';
COMMENT ON TABLE products IS '제품 마스터 (이원화 공급 설정 포함)';
COMMENT ON TABLE inventory_transactions IS '입출고 이력 (MES 데이터)';
COMMENT ON TABLE shipment_plans IS '출고 계획 (일간/주간/월간/연간)';
COMMENT ON TABLE purchase_orders IS '발주서';
COMMENT ON TABLE purchase_order_items IS '발주서 품목';
COMMENT ON TABLE purchase_order_logs IS '발주 이력 (감사 로그)';

COMMENT ON COLUMN products.primary_supplier IS 'DOMESTIC: 국내만, VIETNAM: 베트남만, BOTH: 이원화';
COMMENT ON COLUMN products.domestic_ratio IS '국내 발주 비율 (0-100%), BOTH일 때만 사용';
COMMENT ON COLUMN purchase_orders.shipment_date IS '선적 예정일 - 베트남 발주용';
