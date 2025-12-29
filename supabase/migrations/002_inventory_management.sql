-- =============================================================================
-- Auto PO System - Inventory Management Schema Extension
-- 자동발주 시스템 재고관리 스키마 확장
-- Migration: 002
-- =============================================================================

-- =============================================================================
-- 1. ENUM Types for Inventory Adjustments
-- =============================================================================
CREATE TYPE adjustment_type AS ENUM ('INCREASE', 'DECREASE');
CREATE TYPE adjustment_reason AS ENUM ('PHYSICAL_COUNT', 'LOSS', 'DAMAGE', 'OTHER');

-- =============================================================================
-- 2. initial_inventory (초기 재고)
-- 품목별 기준일 초기 재고 설정
-- =============================================================================
CREATE TABLE initial_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    base_date DATE NOT NULL,                    -- 기준일
    quantity INTEGER NOT NULL CHECK (quantity >= 0),  -- 초기 수량 (0 허용)
    remarks TEXT,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 품목당 기준일별 1건만 허용
CREATE UNIQUE INDEX idx_initial_inventory_unique
ON initial_inventory(product_id, base_date);

-- 조회 성능 인덱스
CREATE INDEX idx_initial_inventory_product ON initial_inventory(product_id);
CREATE INDEX idx_initial_inventory_date ON initial_inventory(base_date DESC);

COMMENT ON TABLE initial_inventory IS '초기 재고 - 품목별 기준일 재고 설정';
COMMENT ON COLUMN initial_inventory.base_date IS '기준일 - 이 날짜 기준 초기 재고';
COMMENT ON COLUMN initial_inventory.quantity IS '초기 수량 (0 이상)';

-- =============================================================================
-- 3. inventory_adjustments (재고 조정)
-- 실사, 분실, 파손 등에 의한 재고 조정
-- =============================================================================
CREATE TABLE inventory_adjustments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    adjustment_date DATE NOT NULL,              -- 조정일
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    adjustment_type adjustment_type NOT NULL,   -- 증가/감소
    quantity INTEGER NOT NULL CHECK (quantity > 0),  -- 조정 수량 (양수만)
    reason adjustment_reason NOT NULL,          -- 조정 사유
    remarks TEXT,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 조회 성능 인덱스
CREATE INDEX idx_inventory_adjustments_product ON inventory_adjustments(product_id);
CREATE INDEX idx_inventory_adjustments_date ON inventory_adjustments(adjustment_date DESC);
CREATE INDEX idx_inventory_adjustments_type ON inventory_adjustments(adjustment_type);

COMMENT ON TABLE inventory_adjustments IS '재고 조정 - 실사/분실/파손에 의한 재고 증감';
COMMENT ON COLUMN inventory_adjustments.adjustment_type IS 'INCREASE: 증가, DECREASE: 감소';
COMMENT ON COLUMN inventory_adjustments.quantity IS '조정 수량 (항상 양수, 부호는 type으로 결정)';
COMMENT ON COLUMN inventory_adjustments.reason IS 'PHYSICAL_COUNT: 실사, LOSS: 분실, DAMAGE: 파손, OTHER: 기타';

-- =============================================================================
-- 4. system_settings (시스템 설정)
-- 평균 납품량 기준일수, 안전재고 계수 등 시스템 설정
-- =============================================================================
CREATE TABLE system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    description TEXT,
    updated_by UUID,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 조회 성능 인덱스
CREATE INDEX idx_system_settings_key ON system_settings(setting_key);

-- 기본 설정값 삽입
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
    ('avg_shipment_days', '365', '평균 납품량 계산 기준 일수 (기본: 1년)'),
    ('domestic_safety_factor', '1.2', '국내 안전재고 계수'),
    ('vietnam_safety_factor', '1.5', '베트남 안전재고 계수'),
    ('default_domestic_lead_time', '3', '기본 국내 리드타임 (일)'),
    ('default_overseas_lead_time', '21', '기본 해외 리드타임 (일)');

-- updated_at 트리거
CREATE TRIGGER update_system_settings_updated_at
    BEFORE UPDATE ON system_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE system_settings IS '시스템 설정 - MRP 계산 파라미터 등';
COMMENT ON COLUMN system_settings.setting_key IS '설정 키 (고유)';
COMMENT ON COLUMN system_settings.setting_value IS '설정 값 (TEXT로 저장, 사용 시 변환)';

-- =============================================================================
-- 5. v_current_inventory (현재 재고 뷰)
-- 현재고 = 초기재고 + 입고 - 출고 +/- 조정
-- =============================================================================
CREATE VIEW v_current_inventory AS
SELECT
    p.id AS product_id,
    p.product_code,
    p.product_name,
    vm.vehicle_name,

    -- 초기 재고 (가장 최근 기준일)
    COALESCE(
        (SELECT quantity FROM initial_inventory
         WHERE product_id = p.id
         ORDER BY base_date DESC LIMIT 1),
        0
    ) AS initial_qty,

    -- 입고 합계
    COALESCE(
        (SELECT SUM(quantity) FROM inventory_transactions
         WHERE product_id = p.id AND transaction_type = 'IN'),
        0
    ) AS inbound_qty,

    -- 출고 합계
    COALESCE(
        (SELECT SUM(quantity) FROM inventory_transactions
         WHERE product_id = p.id AND transaction_type = 'OUT'),
        0
    ) AS outbound_qty,

    -- 재고 조정 합계 (증가 - 감소)
    COALESCE(
        (SELECT SUM(
            CASE
                WHEN adjustment_type = 'INCREASE' THEN quantity
                ELSE -quantity
            END
        ) FROM inventory_adjustments WHERE product_id = p.id),
        0
    ) AS adjustment_qty,

    -- 현재고 계산
    (
        COALESCE(
            (SELECT quantity FROM initial_inventory
             WHERE product_id = p.id
             ORDER BY base_date DESC LIMIT 1),
            0
        )
        + COALESCE(
            (SELECT SUM(quantity) FROM inventory_transactions
             WHERE product_id = p.id AND transaction_type = 'IN'),
            0
        )
        - COALESCE(
            (SELECT SUM(quantity) FROM inventory_transactions
             WHERE product_id = p.id AND transaction_type = 'OUT'),
            0
        )
        + COALESCE(
            (SELECT SUM(
                CASE
                    WHEN adjustment_type = 'INCREASE' THEN quantity
                    ELSE -quantity
                END
            ) FROM inventory_adjustments WHERE product_id = p.id),
            0
        )
    ) AS current_qty,

    -- 안전재고 (products 테이블에 컬럼이 없으면 0)
    -- 참고: products 테이블에 safety_stock_min 컬럼 추가 필요 시 별도 마이그레이션
    0 AS safety_stock,

    p.primary_supplier,
    p.domestic_lead_time,
    p.overseas_lead_time,
    p.is_active

FROM products p
LEFT JOIN vehicle_models vm ON p.vehicle_model_id = vm.id
WHERE p.is_active = true;

COMMENT ON VIEW v_current_inventory IS '현재 재고 뷰 - 품목별 현재고 실시간 계산';

-- =============================================================================
-- 6. Helper Functions
-- =============================================================================

-- 특정 품목의 현재고 조회 함수
CREATE OR REPLACE FUNCTION get_current_stock(p_product_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_stock INTEGER;
BEGIN
    SELECT current_qty INTO v_stock
    FROM v_current_inventory
    WHERE product_id = p_product_id;

    RETURN COALESCE(v_stock, 0);
END;
$$ LANGUAGE plpgsql;

-- 시스템 설정 값 조회 함수
CREATE OR REPLACE FUNCTION get_system_setting(p_key VARCHAR)
RETURNS TEXT AS $$
DECLARE
    v_value TEXT;
BEGIN
    SELECT setting_value INTO v_value
    FROM system_settings
    WHERE setting_key = p_key;

    RETURN v_value;
END;
$$ LANGUAGE plpgsql;

-- 일평균 출하량 계산 함수
CREATE OR REPLACE FUNCTION get_daily_avg_outbound(
    p_product_id UUID,
    p_days INTEGER DEFAULT NULL
)
RETURNS NUMERIC AS $$
DECLARE
    v_days INTEGER;
    v_total_outbound INTEGER;
    v_avg NUMERIC;
BEGIN
    -- 기준 일수 조회 (파라미터 없으면 시스템 설정 사용)
    IF p_days IS NULL THEN
        v_days := COALESCE(get_system_setting('avg_shipment_days')::INTEGER, 365);
    ELSE
        v_days := p_days;
    END IF;

    -- 기간 내 출고 합계
    SELECT COALESCE(SUM(quantity), 0) INTO v_total_outbound
    FROM inventory_transactions
    WHERE product_id = p_product_id
      AND transaction_type = 'OUT'
      AND transaction_date >= CURRENT_DATE - v_days;

    -- 일평균 계산
    IF v_days > 0 THEN
        v_avg := v_total_outbound::NUMERIC / v_days;
    ELSE
        v_avg := 0;
    END IF;

    RETURN ROUND(v_avg, 2);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_current_stock(UUID) IS '품목별 현재고 조회';
COMMENT ON FUNCTION get_system_setting(VARCHAR) IS '시스템 설정 값 조회';
COMMENT ON FUNCTION get_daily_avg_outbound(UUID, INTEGER) IS '품목별 일평균 출하량 계산';

-- =============================================================================
-- End of Migration 002
-- =============================================================================
