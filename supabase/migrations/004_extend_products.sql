-- 004_extend_products.sql
-- Products 테이블 확장 (품목마스터 관리 Excel 양식 기준)

-- 새 컬럼 추가
ALTER TABLE products
ADD COLUMN IF NOT EXISTS project_code VARCHAR(50),
ADD COLUMN IF NOT EXISTS spec1 VARCHAR(100),
ADD COLUMN IF NOT EXISTS spec2 VARCHAR(100),
ADD COLUMN IF NOT EXISTS spec3 VARCHAR(100),
ADD COLUMN IF NOT EXISTS moq INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS product_type VARCHAR(50) DEFAULT '완제품',
ADD COLUMN IF NOT EXISTS unit VARCHAR(10) DEFAULT 'EA',
ADD COLUMN IF NOT EXISTS effective_start_date DATE,
ADD COLUMN IF NOT EXISTS effective_end_date DATE;

-- 코멘트 추가
COMMENT ON COLUMN products.project_code IS '프로젝트코드 (차종 대체)';
COMMENT ON COLUMN products.spec1 IS '사양1';
COMMENT ON COLUMN products.spec2 IS '사양2';
COMMENT ON COLUMN products.spec3 IS '사양3';
COMMENT ON COLUMN products.moq IS 'MOQ (최소주문수량)';
COMMENT ON COLUMN products.product_type IS '품목유형 (완제품, 반제품 등)';
COMMENT ON COLUMN products.unit IS '단위 (EA, SET 등)';
COMMENT ON COLUMN products.effective_start_date IS '적용시작일';
COMMENT ON COLUMN products.effective_end_date IS '적용완료일';
