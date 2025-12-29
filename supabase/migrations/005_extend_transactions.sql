-- 005_extend_transactions.sql
-- Inventory Transactions 테이블 확장 (입고/출고 마감관리 Excel 양식 기준)

-- 새 컬럼 추가
ALTER TABLE inventory_transactions
ADD COLUMN IF NOT EXISTS partner_code VARCHAR(20),
ADD COLUMN IF NOT EXISTS vat_rate DECIMAL(5,2) DEFAULT 10,
ADD COLUMN IF NOT EXISTS krw_amount DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS warehouse_code VARCHAR(20) DEFAULT 'M250',
ADD COLUMN IF NOT EXISTS warehouse_name VARCHAR(50) DEFAULT '본사창고',
ADD COLUMN IF NOT EXISTS closing_key VARCHAR(50),
ADD COLUMN IF NOT EXISTS registered_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS registered_by VARCHAR(50),
ADD COLUMN IF NOT EXISTS modified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS modified_by VARCHAR(50),
ADD COLUMN IF NOT EXISTS return_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS transaction_detail VARCHAR(50) DEFAULT '일반입고',
ADD COLUMN IF NOT EXISTS lot_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS transaction_category VARCHAR(50),
ADD COLUMN IF NOT EXISTS shipment_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS customer_product_code VARCHAR(50),
ADD COLUMN IF NOT EXISTS contract_price DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS contract_currency VARCHAR(10) DEFAULT 'KRW',
ADD COLUMN IF NOT EXISTS applied_price DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS exchange_rate DECIMAL(10,4) DEFAULT 1;

-- 코멘트 추가
COMMENT ON COLUMN inventory_transactions.partner_code IS '거래처코드';
COMMENT ON COLUMN inventory_transactions.vat_rate IS '부가가치세율 (%)';
COMMENT ON COLUMN inventory_transactions.krw_amount IS '금액(원화)';
COMMENT ON COLUMN inventory_transactions.tax_amount IS '세금';
COMMENT ON COLUMN inventory_transactions.warehouse_code IS '창고코드';
COMMENT ON COLUMN inventory_transactions.warehouse_name IS '창고명';
COMMENT ON COLUMN inventory_transactions.closing_key IS '수불마감KEY';
COMMENT ON COLUMN inventory_transactions.registered_at IS '등록일시';
COMMENT ON COLUMN inventory_transactions.registered_by IS '등록자';
COMMENT ON COLUMN inventory_transactions.modified_at IS '수정일시';
COMMENT ON COLUMN inventory_transactions.modified_by IS '수정자';
COMMENT ON COLUMN inventory_transactions.return_number IS '반품번호';
COMMENT ON COLUMN inventory_transactions.transaction_detail IS '입출상세 (일반입고, 출하 등)';
COMMENT ON COLUMN inventory_transactions.lot_number IS 'LOT번호';
COMMENT ON COLUMN inventory_transactions.transaction_category IS '수불구분 (출고(매출) 등)';
COMMENT ON COLUMN inventory_transactions.shipment_type IS '출하유형 (출하(판매) 등)';
COMMENT ON COLUMN inventory_transactions.customer_product_code IS '고객품번';
COMMENT ON COLUMN inventory_transactions.contract_price IS '계약단가';
COMMENT ON COLUMN inventory_transactions.contract_currency IS '계약화폐단위';
COMMENT ON COLUMN inventory_transactions.applied_price IS '적용단가';
COMMENT ON COLUMN inventory_transactions.exchange_rate IS '환율';

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_transactions_partner_code ON inventory_transactions(partner_code);
CREATE INDEX IF NOT EXISTS idx_transactions_warehouse_code ON inventory_transactions(warehouse_code);
CREATE INDEX IF NOT EXISTS idx_transactions_closing_key ON inventory_transactions(closing_key);
