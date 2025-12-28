import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ValidateUploadDataUseCase } from '@application/usecases/ValidateUploadDataUseCase'

/**
 * UploadRow - MES 엑셀 업로드 행 데이터
 */
interface UploadRow {
  rowNumber: number
  partnerCode: string
  productCode: string
  quantity: number
  transactionDate: Date
  currency?: 'KRW' | 'USD'
}

/**
 * ValidationError - 검증 오류 정보
 */
interface ValidationError {
  row: number
  field: string
  value: string | number | null
  errorType: 'REQUIRED' | 'INVALID_REFERENCE' | 'DUPLICATE' | 'MISSING_EXCHANGE_RATE' | 'INVALID_VALUE'
  message: string
}

/**
 * ValidationResult - 검증 결과
 */
interface ValidationResult {
  isValid: boolean
  validRows: number
  errors: ValidationError[]
}

/**
 * ValidationContext - 검증에 필요한 외부 의존성 (Repository 추상화)
 */
interface ValidationContext {
  partnerExists(code: string): Promise<boolean>
  productExists(code: string): Promise<boolean>
  exchangeRateExists(currency: string, date: Date): Promise<boolean>
}

describe('ValidateUploadDataUseCase', () => {
  let useCase: ValidateUploadDataUseCase
  let mockContext: ValidationContext

  beforeEach(() => {
    // Mock context with vi.fn()
    mockContext = {
      partnerExists: vi.fn(),
      productExists: vi.fn(),
      exchangeRateExists: vi.fn(),
    }

    // 구현체는 생성자에서 context를 받음
    useCase = new ValidateUploadDataUseCase(mockContext)
  })

  // Helper: 유효한 기본 행 생성
  const createValidRow = (overrides: Partial<UploadRow> = {}): UploadRow => ({
    rowNumber: 1,
    partnerCode: 'SUP001',
    productCode: 'PRD001',
    quantity: 100,
    transactionDate: new Date('2025-12-27'),
    currency: 'KRW',
    ...overrides,
  })

  // Helper: 모든 존재 확인을 true로 설정
  const setupAllExist = () => {
    vi.mocked(mockContext.partnerExists).mockResolvedValue(true)
    vi.mocked(mockContext.productExists).mockResolvedValue(true)
    vi.mocked(mockContext.exchangeRateExists).mockResolvedValue(true)
  }

  describe('필수값 검증', () => {
    it('필수값 누락 검출: partnerCode 비어있음 -> REQUIRED 에러', async () => {
      setupAllExist()
      const rows: UploadRow[] = [createValidRow({ partnerCode: '' })]

      const result: ValidationResult = await useCase.execute(rows)

      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]).toMatchObject({
        row: 1,
        field: 'partnerCode',
        value: '',
        errorType: 'REQUIRED',
      })
      expect(result.errors[0]?.message).toContain('거래처코드')
    })

    it('필수값 누락 검출: productCode 비어있음 -> REQUIRED 에러', async () => {
      setupAllExist()
      const rows: UploadRow[] = [createValidRow({ productCode: '' })]

      const result: ValidationResult = await useCase.execute(rows)

      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]).toMatchObject({
        row: 1,
        field: 'productCode',
        value: '',
        errorType: 'REQUIRED',
      })
      expect(result.errors[0]?.message).toContain('품번')
    })

    it('필수값 누락 검출: quantity 0 -> REQUIRED 에러', async () => {
      setupAllExist()
      const rows: UploadRow[] = [createValidRow({ quantity: 0 })]

      const result: ValidationResult = await useCase.execute(rows)

      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]).toMatchObject({
        row: 1,
        field: 'quantity',
        value: 0,
        errorType: 'REQUIRED',
      })
      expect(result.errors[0]?.message).toContain('수량')
    })

    it('필수값 누락 검출: quantity 음수 -> REQUIRED 에러', async () => {
      setupAllExist()
      const rows: UploadRow[] = [createValidRow({ quantity: -10 })]

      const result: ValidationResult = await useCase.execute(rows)

      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]).toMatchObject({
        row: 1,
        field: 'quantity',
        value: -10,
        errorType: 'REQUIRED',
      })
    })
  })

  describe('참조 무결성 검증', () => {
    it('존재하지 않는 거래처코드 -> INVALID_REFERENCE 에러', async () => {
      vi.mocked(mockContext.partnerExists).mockResolvedValue(false)
      vi.mocked(mockContext.productExists).mockResolvedValue(true)
      vi.mocked(mockContext.exchangeRateExists).mockResolvedValue(true)

      const rows: UploadRow[] = [createValidRow({ partnerCode: 'INVALID_PARTNER' })]

      const result: ValidationResult = await useCase.execute(rows)

      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]).toMatchObject({
        row: 1,
        field: 'partnerCode',
        value: 'INVALID_PARTNER',
        errorType: 'INVALID_REFERENCE',
      })
      expect(result.errors[0]?.message).toContain('존재하지 않는')
    })

    it('존재하지 않는 품번 -> INVALID_REFERENCE 에러', async () => {
      vi.mocked(mockContext.partnerExists).mockResolvedValue(true)
      vi.mocked(mockContext.productExists).mockResolvedValue(false)
      vi.mocked(mockContext.exchangeRateExists).mockResolvedValue(true)

      const rows: UploadRow[] = [createValidRow({ productCode: 'INVALID_PRODUCT' })]

      const result: ValidationResult = await useCase.execute(rows)

      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]).toMatchObject({
        row: 1,
        field: 'productCode',
        value: 'INVALID_PRODUCT',
        errorType: 'INVALID_REFERENCE',
      })
      expect(result.errors[0]?.message).toContain('존재하지 않는')
    })
  })

  describe('환율 검증', () => {
    it('USD 거래 시 환율 미등록 -> MISSING_EXCHANGE_RATE 에러', async () => {
      vi.mocked(mockContext.partnerExists).mockResolvedValue(true)
      vi.mocked(mockContext.productExists).mockResolvedValue(true)
      vi.mocked(mockContext.exchangeRateExists).mockResolvedValue(false)

      const transactionDate = new Date('2025-12-27')
      const rows: UploadRow[] = [
        createValidRow({
          currency: 'USD',
          transactionDate,
        }),
      ]

      const result: ValidationResult = await useCase.execute(rows)

      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]).toMatchObject({
        row: 1,
        field: 'currency',
        value: 'USD',
        errorType: 'MISSING_EXCHANGE_RATE',
      })
      expect(result.errors[0]?.message).toContain('환율')

      // 환율 조회가 올바른 인자로 호출되었는지 확인
      expect(mockContext.exchangeRateExists).toHaveBeenCalledWith('USD', transactionDate)
    })

    it('KRW 거래 시 환율 검증 건너뜀', async () => {
      setupAllExist()
      const rows: UploadRow[] = [createValidRow({ currency: 'KRW' })]

      const result: ValidationResult = await useCase.execute(rows)

      expect(result.isValid).toBe(true)
      // KRW는 환율 조회 불필요
      expect(mockContext.exchangeRateExists).not.toHaveBeenCalled()
    })
  })

  describe('중복 검증', () => {
    it('중복 행 검출 (같은 날짜 + 거래처 + 제품) -> DUPLICATE 에러', async () => {
      setupAllExist()
      const transactionDate = new Date('2025-12-27')
      const rows: UploadRow[] = [
        createValidRow({
          rowNumber: 1,
          partnerCode: 'SUP001',
          productCode: 'PRD001',
          transactionDate,
          quantity: 100,
        }),
        createValidRow({
          rowNumber: 2,
          partnerCode: 'SUP001',
          productCode: 'PRD001',
          transactionDate,
          quantity: 200,
        }),
      ]

      const result: ValidationResult = await useCase.execute(rows)

      expect(result.isValid).toBe(false)
      expect(result.errors.some((e) => e.errorType === 'DUPLICATE')).toBe(true)

      const duplicateError = result.errors.find((e) => e.errorType === 'DUPLICATE')
      expect(duplicateError?.row).toBe(2) // 두 번째 행이 중복으로 표시
      expect(duplicateError?.message).toContain('중복')
    })

    it('다른 날짜면 중복 아님', async () => {
      setupAllExist()
      const rows: UploadRow[] = [
        createValidRow({
          rowNumber: 1,
          partnerCode: 'SUP001',
          productCode: 'PRD001',
          transactionDate: new Date('2025-12-27'),
        }),
        createValidRow({
          rowNumber: 2,
          partnerCode: 'SUP001',
          productCode: 'PRD001',
          transactionDate: new Date('2025-12-28'),
        }),
      ]

      const result: ValidationResult = await useCase.execute(rows)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('다른 거래처면 중복 아님', async () => {
      setupAllExist()
      const transactionDate = new Date('2025-12-27')
      const rows: UploadRow[] = [
        createValidRow({
          rowNumber: 1,
          partnerCode: 'SUP001',
          productCode: 'PRD001',
          transactionDate,
        }),
        createValidRow({
          rowNumber: 2,
          partnerCode: 'SUP002',
          productCode: 'PRD001',
          transactionDate,
        }),
      ]

      const result: ValidationResult = await useCase.execute(rows)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })

  describe('성공 케이스', () => {
    it('모든 검증 통과 -> isValid: true, errors: []', async () => {
      setupAllExist()
      const rows: UploadRow[] = [
        createValidRow({ rowNumber: 1 }),
        createValidRow({ rowNumber: 2, partnerCode: 'SUP002', productCode: 'PRD002' }),
        createValidRow({ rowNumber: 3, partnerCode: 'SUP003', productCode: 'PRD003' }),
      ]

      const result: ValidationResult = await useCase.execute(rows)

      expect(result.isValid).toBe(true)
      expect(result.validRows).toBe(3)
      expect(result.errors).toHaveLength(0)
    })

    it('빈 배열 입력 -> isValid: true (검증할 행 없음)', async () => {
      const rows: UploadRow[] = []

      const result: ValidationResult = await useCase.execute(rows)

      expect(result.isValid).toBe(true)
      expect(result.validRows).toBe(0)
      expect(result.errors).toHaveLength(0)
    })
  })

  describe('복합 에러 케이스', () => {
    it('여러 에러 동시 검출', async () => {
      vi.mocked(mockContext.partnerExists).mockImplementation(async (code: string) => {
        return code === 'SUP001' // SUP001만 존재
      })
      vi.mocked(mockContext.productExists).mockImplementation(async (code: string) => {
        return code === 'PRD001' // PRD001만 존재
      })
      vi.mocked(mockContext.exchangeRateExists).mockResolvedValue(false)

      const rows: UploadRow[] = [
        // 행 1: partnerCode 비어있음 (REQUIRED)
        createValidRow({
          rowNumber: 1,
          partnerCode: '',
        }),
        // 행 2: 존재하지 않는 거래처 (INVALID_REFERENCE)
        createValidRow({
          rowNumber: 2,
          partnerCode: 'INVALID',
        }),
        // 행 3: 존재하지 않는 품번 (INVALID_REFERENCE)
        createValidRow({
          rowNumber: 3,
          productCode: 'INVALID_PRODUCT',
        }),
        // 행 4: USD인데 환율 없음 (MISSING_EXCHANGE_RATE)
        createValidRow({
          rowNumber: 4,
          currency: 'USD',
        }),
      ]

      const result: ValidationResult = await useCase.execute(rows)

      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThanOrEqual(4)

      // 각 에러 타입 확인
      const errorTypes = result.errors.map((e) => e.errorType)
      expect(errorTypes).toContain('REQUIRED')
      expect(errorTypes).toContain('INVALID_REFERENCE')
      expect(errorTypes).toContain('MISSING_EXCHANGE_RATE')
    })

    it('동일 행에서 여러 에러 검출', async () => {
      vi.mocked(mockContext.partnerExists).mockResolvedValue(false)
      vi.mocked(mockContext.productExists).mockResolvedValue(false)
      vi.mocked(mockContext.exchangeRateExists).mockResolvedValue(false)

      const rows: UploadRow[] = [
        createValidRow({
          rowNumber: 1,
          partnerCode: '', // REQUIRED
          productCode: '', // REQUIRED
          quantity: -5, // REQUIRED (음수)
        }),
      ]

      const result: ValidationResult = await useCase.execute(rows)

      expect(result.isValid).toBe(false)
      // 최소 3개의 에러 (partnerCode, productCode, quantity)
      expect(result.errors.length).toBeGreaterThanOrEqual(3)

      const row1Errors = result.errors.filter((e) => e.row === 1)
      expect(row1Errors.length).toBeGreaterThanOrEqual(3)
    })
  })

  describe('validRows 카운트', () => {
    it('일부 행만 유효한 경우 validRows 정확히 카운트', async () => {
      setupAllExist()
      const rows: UploadRow[] = [
        createValidRow({ rowNumber: 1, partnerCode: 'SUP001', productCode: 'PRD001' }), // 유효
        createValidRow({ rowNumber: 2, partnerCode: '' }), // 무효 (필수값 누락)
        createValidRow({ rowNumber: 3, partnerCode: 'SUP002', productCode: 'PRD002' }), // 유효 (중복 아님)
        createValidRow({ rowNumber: 4, quantity: 0 }), // 무효 (수량 0)
        createValidRow({ rowNumber: 5, partnerCode: 'SUP003', productCode: 'PRD003' }), // 유효 (중복 아님)
      ]

      const result: ValidationResult = await useCase.execute(rows)

      expect(result.isValid).toBe(false)
      expect(result.validRows).toBe(3) // 행 1, 3, 5만 유효
      expect(result.errors).toHaveLength(2) // 행 2, 4 에러
    })
  })
})
