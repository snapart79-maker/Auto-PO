/**
 * ValidateUploadDataUseCase
 * 업로드 데이터 검증 UseCase
 *
 * MES Excel 데이터의 참조 무결성 및 필수값 검증
 * @domain만 import 가능
 */

/**
 * 업로드 행 데이터
 */
export interface UploadRow {
  rowNumber: number
  partnerCode: string
  productCode: string
  quantity: number
  transactionDate: Date
  currency?: 'KRW' | 'USD'
}

/**
 * 검증 에러 유형
 */
export type ValidationErrorType =
  | 'REQUIRED'
  | 'INVALID_REFERENCE'
  | 'DUPLICATE'
  | 'MISSING_EXCHANGE_RATE'
  | 'INVALID_VALUE'

/**
 * 검증 에러
 */
export interface ValidationError {
  row: number
  field: string
  value: string | number | null
  errorType: ValidationErrorType
  message: string
}

/**
 * 검증 결과
 */
export interface ValidationResult {
  isValid: boolean
  totalRows: number
  validRows: number
  errors: ValidationError[]
}

/**
 * 검증 컨텍스트 (Repository 주입)
 */
export interface ValidationContext {
  partnerExists: (code: string) => Promise<boolean>
  productExists: (code: string) => Promise<boolean>
  exchangeRateExists: (currency: string, date: Date) => Promise<boolean>
}

/**
 * 업로드 데이터 검증 UseCase
 */
export class ValidateUploadDataUseCase {
  constructor(private readonly context: ValidationContext) {}

  /**
   * 검증 실행
   *
   * @param rows 업로드 행 데이터
   * @returns 검증 결과
   */
  async execute(rows: UploadRow[]): Promise<ValidationResult> {
    const errors: ValidationError[] = []
    const seenRows = new Map<string, number>() // 중복 검사용

    for (const row of rows) {
      // 1. 필수값 검증
      const requiredErrors = this.validateRequired(row)
      errors.push(...requiredErrors)

      if (requiredErrors.length > 0) {
        // 필수값 누락 시 다른 검증 스킵
        continue
      }

      // 2. 참조 무결성 검증
      const referenceErrors = await this.validateReferences(row)
      errors.push(...referenceErrors)

      // 3. 환율 검증 (USD인 경우)
      if (row.currency === 'USD') {
        const exchangeError = await this.validateExchangeRate(row)
        if (exchangeError) {
          errors.push(exchangeError)
        }
      }

      // 4. 중복 검사
      const duplicateError = this.validateDuplicate(row, seenRows)
      if (duplicateError) {
        errors.push(duplicateError)
      }
    }

    const validRows = rows.length - new Set(errors.map((e) => e.row)).size

    return {
      isValid: errors.length === 0,
      totalRows: rows.length,
      validRows,
      errors,
    }
  }

  /**
   * 필수값 검증
   */
  private validateRequired(row: UploadRow): ValidationError[] {
    const errors: ValidationError[] = []

    if (!row.partnerCode || row.partnerCode.trim() === '') {
      errors.push({
        row: row.rowNumber,
        field: 'partnerCode',
        value: row.partnerCode ?? null,
        errorType: 'REQUIRED',
        message: '거래처코드는 필수입니다',
      })
    }

    if (!row.productCode || row.productCode.trim() === '') {
      errors.push({
        row: row.rowNumber,
        field: 'productCode',
        value: row.productCode ?? null,
        errorType: 'REQUIRED',
        message: '품번은 필수입니다',
      })
    }

    if (row.quantity === undefined || row.quantity === null || row.quantity <= 0) {
      errors.push({
        row: row.rowNumber,
        field: 'quantity',
        value: row.quantity ?? null,
        errorType: 'REQUIRED',
        message: '수량은 1 이상이어야 합니다',
      })
    }

    if (!row.transactionDate) {
      errors.push({
        row: row.rowNumber,
        field: 'transactionDate',
        value: null,
        errorType: 'REQUIRED',
        message: '거래일자는 필수입니다',
      })
    }

    return errors
  }

  /**
   * 참조 무결성 검증
   */
  private async validateReferences(row: UploadRow): Promise<ValidationError[]> {
    const errors: ValidationError[] = []

    // 거래처 존재 확인
    const partnerExists = await this.context.partnerExists(row.partnerCode)
    if (!partnerExists) {
      errors.push({
        row: row.rowNumber,
        field: 'partnerCode',
        value: row.partnerCode,
        errorType: 'INVALID_REFERENCE',
        message: `존재하지 않는 거래처코드: ${row.partnerCode}`,
      })
    }

    // 제품 존재 확인
    const productExists = await this.context.productExists(row.productCode)
    if (!productExists) {
      errors.push({
        row: row.rowNumber,
        field: 'productCode',
        value: row.productCode,
        errorType: 'INVALID_REFERENCE',
        message: `존재하지 않는 품번: ${row.productCode}`,
      })
    }

    return errors
  }

  /**
   * 환율 존재 검증
   */
  private async validateExchangeRate(row: UploadRow): Promise<ValidationError | null> {
    const exists = await this.context.exchangeRateExists(row.currency!, row.transactionDate)

    if (!exists) {
      return {
        row: row.rowNumber,
        field: 'currency',
        value: row.currency!,
        errorType: 'MISSING_EXCHANGE_RATE',
        message: `해당 일자의 ${row.currency} 환율이 등록되어 있지 않습니다`,
      }
    }

    return null
  }

  /**
   * 중복 행 검사
   */
  private validateDuplicate(
    row: UploadRow,
    seenRows: Map<string, number>
  ): ValidationError | null {
    const key = `${this.formatDate(row.transactionDate)}-${row.partnerCode}-${row.productCode}`

    if (seenRows.has(key)) {
      return {
        row: row.rowNumber,
        field: 'duplicate',
        value: key,
        errorType: 'DUPLICATE',
        message: `중복된 행: ${seenRows.get(key)}번 행과 동일`,
      }
    }

    seenRows.set(key, row.rowNumber)
    return null
  }

  /**
   * 날짜 포맷
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
}
