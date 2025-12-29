-- 003_extend_partners.sql
-- Partners 테이블 확장 (거래처 관리 Excel 양식 기준)

-- 새 컬럼 추가
ALTER TABLE partners
ADD COLUMN IF NOT EXISTS note TEXT,
ADD COLUMN IF NOT EXISTS partner_group VARCHAR(50) DEFAULT '매입매출처',
ADD COLUMN IF NOT EXISTS ceo_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS foundation_date DATE,
ADD COLUMN IF NOT EXISTS postal_code VARCHAR(10),
ADD COLUMN IF NOT EXISTS business_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS industry_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS country_code VARCHAR(20) DEFAULT '대한민국',
ADD COLUMN IF NOT EXISTS incoterms VARCHAR(20) DEFAULT '도착도',
ADD COLUMN IF NOT EXISTS phone2 VARCHAR(30),
ADD COLUMN IF NOT EXISTS website VARCHAR(200),
ADD COLUMN IF NOT EXISTS partner_contact_phone VARCHAR(30),
ADD COLUMN IF NOT EXISTS manager VARCHAR(50),
ADD COLUMN IF NOT EXISTS effective_start_date DATE,
ADD COLUMN IF NOT EXISTS effective_end_date DATE;

-- 코멘트 추가
COMMENT ON COLUMN partners.note IS '비고';
COMMENT ON COLUMN partners.partner_group IS '거래처그룹 (매입매출처 등)';
COMMENT ON COLUMN partners.ceo_name IS '대표자명';
COMMENT ON COLUMN partners.foundation_date IS '창립기념일';
COMMENT ON COLUMN partners.postal_code IS '우편번호';
COMMENT ON COLUMN partners.business_type IS '업태';
COMMENT ON COLUMN partners.industry_type IS '업종';
COMMENT ON COLUMN partners.country_code IS '국가코드';
COMMENT ON COLUMN partners.incoterms IS '인도조건 (도착도, FOB 등)';
COMMENT ON COLUMN partners.phone2 IS '전화번호2';
COMMENT ON COLUMN partners.website IS '홈페이지 주소';
COMMENT ON COLUMN partners.partner_contact_phone IS '협력사담당자 연락처';
COMMENT ON COLUMN partners.manager IS '담당사원';
COMMENT ON COLUMN partners.effective_start_date IS '적용시작일';
COMMENT ON COLUMN partners.effective_end_date IS '적용완료일';
