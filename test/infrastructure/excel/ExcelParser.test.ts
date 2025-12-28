/**
 * ExcelParser Unit Tests
 * TDD Red Phase: 테스트 먼저 작성
 */

import { describe, it, expect } from 'vitest'
import { ExcelParser } from '@infrastructure/excel/ExcelParser'
import type { ColumnMapping } from '@infrastructure/excel/types'

describe('ExcelParser', () => {
  describe('parseInventoryData', () => {
    it('입고(IN) 데이터를 올바르게 파싱해야 함', () => {
      // Arrange
      const mockData = [
        ['거래처코드', '품번', '수량', '거래일자', '통화', '단가', '입출고구분'],
        ['P001', 'PROD-001', 100, new Date('2025-01-15'), 'KRW', 1000, 'IN'],
        ['P002', 'PROD-002', 200, new Date('2025-01-16'), 'USD', 50, 'IN'],
      ]
      const parser = new ExcelParser()

      // Act
      const result = parser.parseInventoryData(mockData)

      // Assert
      expect(result.success).toBe(true)
      expect(result.rows).toHaveLength(2)
      expect(result.rows[0]).toMatchObject({
        rowNumber: 2,
        partnerCode: 'P001',
        productCode: 'PROD-001',
        quantity: 100,
        transactionType: 'IN',
        currency: 'KRW',
        unitPrice: 1000,
      })
      expect(result.rows[1]).toMatchObject({
        rowNumber: 3,
        partnerCode: 'P002',
        productCode: 'PROD-002',
        quantity: 200,
        transactionType: 'IN',
        currency: 'USD',
        unitPrice: 50,
      })
    })

    it('출고(OUT) 데이터를 올바르게 파싱해야 함', () => {
      // Arrange
      const mockData = [
        ['거래처코드', '품번', '수량', '거래일자', '입출고구분'],
        ['C001', 'PROD-001', 50, new Date('2025-01-20'), 'OUT'],
      ]
      const parser = new ExcelParser()

      // Act
      const result = parser.parseInventoryData(mockData)

      // Assert
      expect(result.success).toBe(true)
      expect(result.rows).toHaveLength(1)
      expect(result.rows[0]?.transactionType).toBe('OUT')
    })

    it('빈 데이터 배열 처리', () => {
      // Arrange
      const mockData: unknown[][] = []
      const parser = new ExcelParser()

      // Act
      const result = parser.parseInventoryData(mockData)

      // Assert
      expect(result.success).toBe(true)
      expect(result.rows).toHaveLength(0)
      expect(result.totalRows).toBe(0)
    })

    it('헤더만 있는 경우 빈 결과 반환', () => {
      // Arrange
      const mockData = [['거래처코드', '품번', '수량', '거래일자', '입출고구분']]
      const parser = new ExcelParser()

      // Act
      const result = parser.parseInventoryData(mockData)

      // Assert
      expect(result.success).toBe(true)
      expect(result.rows).toHaveLength(0)
    })

    it('필수 컬럼 누락 시 에러 반환', () => {
      // Arrange (품번 컬럼 누락)
      const mockData = [
        ['거래처코드', '수량', '거래일자'],
        ['P001', 100, new Date('2025-01-15')],
      ]
      const parser = new ExcelParser()

      // Act
      const result = parser.parseInventoryData(mockData)

      // Assert
      expect(result.success).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors[0]?.message).toContain('필수 컬럼')
    })

    it('잘못된 수량 값 에러 처리', () => {
      // Arrange
      const mockData = [
        ['거래처코드', '품번', '수량', '거래일자', '입출고구분'],
        ['P001', 'PROD-001', 'invalid', new Date('2025-01-15'), 'IN'],
      ]
      const parser = new ExcelParser()

      // Act
      const result = parser.parseInventoryData(mockData)

      // Assert
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors.some((e) => e.column === '수량')).toBe(true)
    })

    it('잘못된 날짜 형식 에러 처리', () => {
      // Arrange
      const mockData = [
        ['거래처코드', '품번', '수량', '거래일자', '입출고구분'],
        ['P001', 'PROD-001', 100, 'not-a-date', 'IN'],
      ]
      const parser = new ExcelParser()

      // Act
      const result = parser.parseInventoryData(mockData)

      // Assert
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors.some((e) => e.column === '거래일자')).toBe(true)
    })
  })

  describe('parseShipmentPlanData', () => {
    it('출고 계획 데이터를 올바르게 파싱해야 함', () => {
      // Arrange
      const mockData = [
        ['거래처코드', '품번', '수량', '거래일자', '계획유형', '차종코드'],
        ['C001', 'PROD-001', 500, new Date('2025-02-01'), 'WEEKLY', 'V001'],
        ['C002', 'PROD-002', 1000, new Date('2025-02-01'), 'MONTHLY', 'V002'],
      ]
      const parser = new ExcelParser()

      // Act
      const result = parser.parseShipmentPlanData(mockData)

      // Assert
      expect(result.success).toBe(true)
      expect(result.rows).toHaveLength(2)
      expect(result.rows[0]).toMatchObject({
        rowNumber: 2,
        partnerCode: 'C001',
        productCode: 'PROD-001',
        plannedQuantity: 500,
        planType: 'WEEKLY',
        vehicleModelCode: 'V001',
      })
    })

    it('기본 계획 유형은 DAILY', () => {
      // Arrange
      const mockData = [
        ['거래처코드', '품번', '수량', '거래일자'],
        ['C001', 'PROD-001', 500, new Date('2025-02-01')],
      ]
      const parser = new ExcelParser()

      // Act
      const result = parser.parseShipmentPlanData(mockData)

      // Assert
      expect(result.rows[0]?.planType).toBe('DAILY')
    })
  })

  describe('날짜 변환', () => {
    it('Date 객체를 올바르게 처리', () => {
      const mockData = [
        ['거래처코드', '품번', '수량', '거래일자', '입출고구분'],
        ['P001', 'PROD-001', 100, new Date('2025-01-15'), 'IN'],
      ]
      const parser = new ExcelParser()

      const result = parser.parseInventoryData(mockData)

      expect(result.rows[0]?.transactionDate).toBeInstanceOf(Date)
      expect(result.rows[0]?.transactionDate.getFullYear()).toBe(2025)
      expect(result.rows[0]?.transactionDate.getMonth()).toBe(0) // January
      expect(result.rows[0]?.transactionDate.getDate()).toBe(15)
    })

    it('문자열 날짜 (YYYY-MM-DD)를 올바르게 변환', () => {
      const mockData = [
        ['거래처코드', '품번', '수량', '거래일자', '입출고구분'],
        ['P001', 'PROD-001', 100, '2025-01-15', 'IN'],
      ]
      const parser = new ExcelParser()

      const result = parser.parseInventoryData(mockData)

      expect(result.rows[0]?.transactionDate).toBeInstanceOf(Date)
      expect(result.rows[0]?.transactionDate.getFullYear()).toBe(2025)
    })

    it('Excel 시리얼 넘버를 날짜로 변환', () => {
      // Excel serial number for 2025-01-15 is approximately 45671
      const mockData = [
        ['거래처코드', '품번', '수량', '거래일자', '입출고구분'],
        ['P001', 'PROD-001', 100, 45671, 'IN'],
      ]
      const parser = new ExcelParser()

      const result = parser.parseInventoryData(mockData)

      expect(result.rows[0]?.transactionDate).toBeInstanceOf(Date)
      expect(result.rows[0]?.transactionDate.getFullYear()).toBe(2025)
    })

    it('한국어 날짜 형식 (YYYY년 MM월 DD일) 변환', () => {
      const mockData = [
        ['거래처코드', '품번', '수량', '거래일자', '입출고구분'],
        ['P001', 'PROD-001', 100, '2025년 01월 15일', 'IN'],
      ]
      const parser = new ExcelParser()

      const result = parser.parseInventoryData(mockData)

      expect(result.rows[0]?.transactionDate).toBeInstanceOf(Date)
      expect(result.rows[0]?.transactionDate.getFullYear()).toBe(2025)
    })
  })

  describe('커스텀 컬럼 매핑', () => {
    it('영문 헤더 매핑 지원', () => {
      const mockData = [
        ['partner_code', 'product_code', 'quantity', 'transaction_date', 'transaction_type'],
        ['P001', 'PROD-001', 100, new Date('2025-01-15'), 'IN'],
      ]
      const customMapping: ColumnMapping = {
        partnerCode: 'partner_code',
        productCode: 'product_code',
        quantity: 'quantity',
        transactionDate: 'transaction_date',
        transactionType: 'transaction_type',
      }
      const parser = new ExcelParser(customMapping)

      const result = parser.parseInventoryData(mockData)

      expect(result.success).toBe(true)
      expect(result.rows[0]?.partnerCode).toBe('P001')
    })
  })

  describe('parseFromBuffer', () => {
    it('ExcelParser 인스턴스가 parseFromBuffer 메서드를 가져야 함', () => {
      const parser = new ExcelParser()

      // parseFromBuffer 메서드 존재 확인
      expect(parser.parseFromBuffer).toBeDefined()
      expect(typeof parser.parseFromBuffer).toBe('function')
    })
  })

  describe('에러 누적', () => {
    it('여러 행의 에러를 모두 수집', () => {
      const mockData = [
        ['거래처코드', '품번', '수량', '거래일자', '입출고구분'],
        ['', 'PROD-001', 100, new Date('2025-01-15'), 'IN'], // 거래처코드 누락
        ['P002', '', 200, new Date('2025-01-16'), 'IN'], // 품번 누락
        ['P003', 'PROD-003', -50, new Date('2025-01-17'), 'IN'], // 음수 수량
      ]
      const parser = new ExcelParser()

      const result = parser.parseInventoryData(mockData)

      expect(result.errors.length).toBe(3)
      expect(result.errors.map((e) => e.row)).toContain(2)
      expect(result.errors.map((e) => e.row)).toContain(3)
      expect(result.errors.map((e) => e.row)).toContain(4)
    })

    it('유효한 행은 결과에 포함, 오류 행은 제외', () => {
      const mockData = [
        ['거래처코드', '품번', '수량', '거래일자', '입출고구분'],
        ['P001', 'PROD-001', 100, new Date('2025-01-15'), 'IN'], // 유효
        ['', 'PROD-002', 200, new Date('2025-01-16'), 'IN'], // 무효 (거래처코드 누락)
        ['P003', 'PROD-003', 300, new Date('2025-01-17'), 'IN'], // 유효
      ]
      const parser = new ExcelParser()

      const result = parser.parseInventoryData(mockData)

      expect(result.rows).toHaveLength(2)
      expect(result.errors).toHaveLength(1)
      expect(result.rows.map((r) => r.partnerCode)).toEqual(['P001', 'P003'])
    })
  })

  describe('통화 처리', () => {
    it('KRW/USD 외 통화는 에러', () => {
      const mockData = [
        ['거래처코드', '품번', '수량', '거래일자', '통화', '입출고구분'],
        ['P001', 'PROD-001', 100, new Date('2025-01-15'), 'EUR', 'IN'],
      ]
      const parser = new ExcelParser()

      const result = parser.parseInventoryData(mockData)

      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors.some((e) => e.column === '통화')).toBe(true)
    })

    it('통화 미지정 시 기본값 KRW', () => {
      const mockData = [
        ['거래처코드', '품번', '수량', '거래일자', '입출고구분'],
        ['P001', 'PROD-001', 100, new Date('2025-01-15'), 'IN'],
      ]
      const parser = new ExcelParser()

      const result = parser.parseInventoryData(mockData)

      expect(result.rows[0]?.currency).toBe('KRW')
    })
  })
})
