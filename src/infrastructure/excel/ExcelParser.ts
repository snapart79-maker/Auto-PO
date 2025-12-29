/**
 * ExcelParser
 * xlsx 라이브러리를 활용한 Excel 파일 파싱
 */

import * as XLSX from 'xlsx'
import type {
  InventoryUploadRow,
  ShipmentPlanRow,
  InitialInventoryRow,
  InventoryAdjustmentRow,
  ParseResult,
  ParseError,
  ColumnMapping,
  ExcelParserOptions,
} from './types'
import { DEFAULT_COLUMN_MAPPING } from './types'

/**
 * Excel 파서 클래스
 */
export class ExcelParser {
  private columnMapping: ColumnMapping

  constructor(columnMapping: ColumnMapping = DEFAULT_COLUMN_MAPPING) {
    this.columnMapping = columnMapping
  }

  /**
   * ArrayBuffer에서 워크시트 데이터 추출
   */
  parseFromBuffer(
    buffer: ArrayBuffer,
    options: ExcelParserOptions = {}
  ): unknown[][] {
    const workbook = XLSX.read(buffer, { type: 'array', cellDates: true })
    const sheetName =
      typeof options.sheet === 'string'
        ? options.sheet
        : workbook.SheetNames[options.sheet ?? 0]
    const worksheet = workbook.Sheets[sheetName ?? workbook.SheetNames[0]!]
    if (!worksheet) {
      return []
    }

    const data = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
      header: 1,
      raw: false,
      dateNF: 'yyyy-mm-dd',
    })

    return data as unknown[][]
  }

  /**
   * 입출고 데이터 파싱
   */
  parseInventoryData(data: unknown[][]): ParseResult<InventoryUploadRow> {
    if (data.length === 0) {
      return { success: true, rows: [], errors: [], totalRows: 0 }
    }

    const headers = data[0] as string[]
    const columnIndices = this.getColumnIndices(headers)

    // 필수 컬럼 검증
    const requiredColumns = ['partnerCode', 'productCode', 'quantity', 'transactionDate']
    const missingColumns = requiredColumns.filter(
      (col) => columnIndices[col as keyof typeof columnIndices] === undefined
    )

    if (missingColumns.length > 0) {
      return {
        success: false,
        rows: [],
        errors: [
          {
            row: 1,
            column: 'header',
            message: `필수 컬럼 누락: ${missingColumns.map((c) => this.getKoreanColumnName(c)).join(', ')}`,
          },
        ],
        totalRows: data.length - 1,
      }
    }

    const rows: InventoryUploadRow[] = []
    const errors: ParseError[] = []

    for (let i = 1; i < data.length; i++) {
      const row = data[i] as unknown[]
      const rowNumber = i + 1 // 1-indexed (헤더 포함)

      try {
        const parsedRow = this.parseInventoryRow(row, columnIndices, rowNumber)
        if (parsedRow) {
          rows.push(parsedRow)
        }
      } catch (error) {
        if (error instanceof RowParseError) {
          errors.push(...error.errors)
        }
      }
    }

    return {
      success: errors.length === 0,
      rows,
      errors,
      totalRows: data.length - 1,
    }
  }

  /**
   * 출고 계획 데이터 파싱
   */
  parseShipmentPlanData(
    data: unknown[][]
  ): ParseResult<ShipmentPlanRow & { plannedQuantity: number }> {
    if (data.length === 0) {
      return { success: true, rows: [], errors: [], totalRows: 0 }
    }

    const headers = data[0] as string[]
    const columnIndices = this.getColumnIndices(headers)

    // 필수 컬럼 검증
    const requiredColumns = ['partnerCode', 'productCode', 'quantity', 'transactionDate']
    const missingColumns = requiredColumns.filter(
      (col) => columnIndices[col as keyof typeof columnIndices] === undefined
    )

    if (missingColumns.length > 0) {
      return {
        success: false,
        rows: [],
        errors: [
          {
            row: 1,
            column: 'header',
            message: `필수 컬럼 누락: ${missingColumns.map((c) => this.getKoreanColumnName(c)).join(', ')}`,
          },
        ],
        totalRows: data.length - 1,
      }
    }

    const rows: (ShipmentPlanRow & { plannedQuantity: number })[] = []
    const errors: ParseError[] = []

    for (let i = 1; i < data.length; i++) {
      const row = data[i] as unknown[]
      const rowNumber = i + 1

      try {
        const parsedRow = this.parseShipmentRow(row, columnIndices, rowNumber)
        if (parsedRow) {
          rows.push(parsedRow)
        }
      } catch (error) {
        if (error instanceof RowParseError) {
          errors.push(...error.errors)
        }
      }
    }

    return {
      success: errors.length === 0,
      rows,
      errors,
      totalRows: data.length - 1,
    }
  }

  /**
   * 초기 재고 데이터 파싱
   */
  parseInitialInventoryData(data: unknown[][]): { success: boolean; rows: InitialInventoryRow[]; errors: ParseError[]; totalRows: number } {
    if (data.length === 0) {
      return { success: true, rows: [], errors: [], totalRows: 0 }
    }

    const headers = data[0] as string[]
    const columnIndices = this.getInitialInventoryColumnIndices(headers)

    // 필수 컬럼 검증
    const requiredColumns = ['productCode', 'quantity', 'baseDate']
    const missingColumns = requiredColumns.filter(
      (col) => columnIndices[col as keyof typeof columnIndices] === undefined
    )

    if (missingColumns.length > 0) {
      return {
        success: false,
        rows: [],
        errors: [
          {
            row: 1,
            column: 'header',
            message: `필수 컬럼 누락: ${missingColumns.map((c) => this.getInitialInventoryColumnName(c)).join(', ')}`,
          },
        ],
        totalRows: data.length - 1,
      }
    }

    const rows: InitialInventoryRow[] = []
    const errors: ParseError[] = []

    for (let i = 1; i < data.length; i++) {
      const row = data[i] as unknown[]
      const rowNumber = i + 1

      try {
        const parsedRow = this.parseInitialInventoryRow(row, columnIndices, rowNumber)
        if (parsedRow) {
          rows.push(parsedRow)
        }
      } catch (error) {
        if (error instanceof RowParseError) {
          errors.push(...error.errors)
        }
      }
    }

    return {
      success: errors.length === 0,
      rows,
      errors,
      totalRows: data.length - 1,
    }
  }

  /**
   * 초기 재고 행 파싱
   */
  private parseInitialInventoryRow(
    row: unknown[],
    columnIndices: Record<string, number | undefined>,
    rowNumber: number
  ): InitialInventoryRow | null {
    const errors: ParseError[] = []

    const productCode = this.getString(row[columnIndices.productCode ?? -1])
    const quantityRaw = row[columnIndices.quantity ?? -1]
    const baseDateRaw = row[columnIndices.baseDate ?? -1]
    const remarks = this.getString(row[columnIndices.remarks ?? -1])

    if (!productCode) {
      errors.push({
        row: rowNumber,
        column: '품번',
        message: '품번은 필수입니다',
        value: productCode,
      })
    }

    const quantity = this.parseNumber(quantityRaw)
    if (quantity === null || quantity < 0) {
      errors.push({
        row: rowNumber,
        column: '수량',
        message: '수량은 0 이상이어야 합니다',
        value: quantityRaw,
      })
    }

    const baseDate = this.parseDate(baseDateRaw)
    if (!baseDate) {
      errors.push({
        row: rowNumber,
        column: '기준일',
        message: '올바른 날짜 형식이 아닙니다',
        value: baseDateRaw,
      })
    }

    if (errors.length > 0) {
      throw new RowParseError(errors)
    }

    return {
      rowNumber,
      productCode: productCode!,
      quantity: quantity!,
      baseDate: baseDate!,
      remarks: remarks ?? undefined,
    }
  }

  /**
   * 초기 재고 컬럼 인덱스 매핑
   */
  private getInitialInventoryColumnIndices(
    headers: string[]
  ): Record<string, number | undefined> {
    const columnNames: Record<string, string[]> = {
      productCode: ['품번', 'product_code', 'productcode', 'code'],
      quantity: ['수량', 'quantity', 'qty'],
      baseDate: ['기준일', 'base_date', 'basedate', 'date'],
      remarks: ['비고', 'remarks', 'memo', '메모'],
    }

    const indices: Record<string, number | undefined> = {}

    for (const [key, names] of Object.entries(columnNames)) {
      for (const name of names) {
        const index = headers.findIndex(
          (h) => h?.toLowerCase().trim() === name.toLowerCase().trim()
        )
        if (index !== -1) {
          indices[key] = index
          break
        }
      }
    }

    return indices
  }

  /**
   * 초기 재고 컬럼 이름
   */
  private getInitialInventoryColumnName(key: string): string {
    const mapping: Record<string, string> = {
      productCode: '품번',
      quantity: '수량',
      baseDate: '기준일',
      remarks: '비고',
    }
    return mapping[key] ?? key
  }

  /**
   * 재고 조정 데이터 파싱
   */
  parseInventoryAdjustmentData(data: unknown[][]): { success: boolean; rows: InventoryAdjustmentRow[]; errors: ParseError[]; totalRows: number } {
    if (data.length === 0) {
      return { success: true, rows: [], errors: [], totalRows: 0 }
    }

    const headers = data[0] as string[]
    const columnIndices = this.getInventoryAdjustmentColumnIndices(headers)

    // 필수 컬럼 검증
    const requiredColumns = ['productCode', 'adjustmentDate', 'adjustmentType', 'quantity', 'reason']
    const missingColumns = requiredColumns.filter(
      (col) => columnIndices[col as keyof typeof columnIndices] === undefined
    )

    if (missingColumns.length > 0) {
      return {
        success: false,
        rows: [],
        errors: [
          {
            row: 1,
            column: 'header',
            message: `필수 컬럼 누락: ${missingColumns.map((c) => this.getInventoryAdjustmentColumnName(c)).join(', ')}`,
          },
        ],
        totalRows: data.length - 1,
      }
    }

    const rows: InventoryAdjustmentRow[] = []
    const errors: ParseError[] = []

    for (let i = 1; i < data.length; i++) {
      const row = data[i] as unknown[]
      const rowNumber = i + 1

      try {
        const parsedRow = this.parseInventoryAdjustmentRow(row, columnIndices, rowNumber)
        if (parsedRow) {
          rows.push(parsedRow)
        }
      } catch (error) {
        if (error instanceof RowParseError) {
          errors.push(...error.errors)
        }
      }
    }

    return {
      success: errors.length === 0,
      rows,
      errors,
      totalRows: data.length - 1,
    }
  }

  /**
   * 재고 조정 행 파싱
   */
  private parseInventoryAdjustmentRow(
    row: unknown[],
    columnIndices: Record<string, number | undefined>,
    rowNumber: number
  ): InventoryAdjustmentRow | null {
    const errors: ParseError[] = []

    const productCode = this.getString(row[columnIndices.productCode ?? -1])
    const adjustmentDateRaw = row[columnIndices.adjustmentDate ?? -1]
    const adjustmentTypeRaw = row[columnIndices.adjustmentType ?? -1]
    const quantityRaw = row[columnIndices.quantity ?? -1]
    const reasonRaw = row[columnIndices.reason ?? -1]
    const remarks = this.getString(row[columnIndices.remarks ?? -1])

    if (!productCode) {
      errors.push({
        row: rowNumber,
        column: '품번',
        message: '품번은 필수입니다',
        value: productCode,
      })
    }

    const adjustmentDate = this.parseDate(adjustmentDateRaw)
    if (!adjustmentDate) {
      errors.push({
        row: rowNumber,
        column: '조정일',
        message: '올바른 날짜 형식이 아닙니다',
        value: adjustmentDateRaw,
      })
    }

    const adjustmentType = this.parseAdjustmentType(adjustmentTypeRaw)
    if (!adjustmentType) {
      errors.push({
        row: rowNumber,
        column: '조정유형',
        message: '조정유형은 증가/INCREASE 또는 감소/DECREASE 중 하나입니다',
        value: adjustmentTypeRaw,
      })
    }

    const quantity = this.parseNumber(quantityRaw)
    if (quantity === null || quantity <= 0) {
      errors.push({
        row: rowNumber,
        column: '수량',
        message: '수량은 1 이상이어야 합니다',
        value: quantityRaw,
      })
    }

    const reason = this.parseAdjustmentReason(reasonRaw)
    if (!reason) {
      errors.push({
        row: rowNumber,
        column: '사유',
        message: '사유는 실사/분실/파손/기타 중 하나입니다',
        value: reasonRaw,
      })
    }

    if (errors.length > 0) {
      throw new RowParseError(errors)
    }

    return {
      rowNumber,
      productCode: productCode!,
      adjustmentDate: adjustmentDate!,
      adjustmentType: adjustmentType!,
      quantity: quantity!,
      reason: reason!,
      remarks: remarks ?? undefined,
    }
  }

  /**
   * 재고 조정 컬럼 인덱스 매핑
   */
  private getInventoryAdjustmentColumnIndices(
    headers: string[]
  ): Record<string, number | undefined> {
    const columnNames: Record<string, string[]> = {
      productCode: ['품번', 'product_code', 'productcode', 'code'],
      adjustmentDate: ['조정일', 'adjustment_date', 'adjustmentdate', 'date'],
      adjustmentType: ['조정유형', '유형', 'adjustment_type', 'adjustmenttype', 'type'],
      quantity: ['수량', 'quantity', 'qty'],
      reason: ['사유', '조정사유', 'reason'],
      remarks: ['비고', 'remarks', 'memo', '메모'],
    }

    const indices: Record<string, number | undefined> = {}

    for (const [key, names] of Object.entries(columnNames)) {
      for (const name of names) {
        const index = headers.findIndex(
          (h) => h?.toLowerCase().trim() === name.toLowerCase().trim()
        )
        if (index !== -1) {
          indices[key] = index
          break
        }
      }
    }

    return indices
  }

  /**
   * 재고 조정 컬럼 이름
   */
  private getInventoryAdjustmentColumnName(key: string): string {
    const mapping: Record<string, string> = {
      productCode: '품번',
      adjustmentDate: '조정일',
      adjustmentType: '조정유형',
      quantity: '수량',
      reason: '사유',
      remarks: '비고',
    }
    return mapping[key] ?? key
  }

  /**
   * 조정 유형 파싱
   */
  private parseAdjustmentType(value: unknown): 'INCREASE' | 'DECREASE' | null {
    if (value === null || value === undefined) return null
    const str = String(value).toUpperCase().trim()
    if (str === 'INCREASE' || str === '증가' || str === '+' || str === '입고') return 'INCREASE'
    if (str === 'DECREASE' || str === '감소' || str === '-' || str === '출고') return 'DECREASE'
    return null
  }

  /**
   * 조정 사유 파싱
   */
  private parseAdjustmentReason(value: unknown): 'PHYSICAL_COUNT' | 'LOSS' | 'DAMAGE' | 'OTHER' | null {
    if (value === null || value === undefined) return null
    const str = String(value).toUpperCase().trim()
    if (str === 'PHYSICAL_COUNT' || str === '실사' || str === '재고실사') return 'PHYSICAL_COUNT'
    if (str === 'LOSS' || str === '분실' || str === '도난') return 'LOSS'
    if (str === 'DAMAGE' || str === '파손' || str === '손상') return 'DAMAGE'
    if (str === 'OTHER' || str === '기타') return 'OTHER'
    return null
  }

  /**
   * 컬럼 인덱스 매핑
   */
  private getColumnIndices(
    headers: string[]
  ): Record<string, number | undefined> {
    const indices: Record<string, number | undefined> = {}

    for (const [key, headerName] of Object.entries(this.columnMapping)) {
      const index = headers.findIndex(
        (h) => h?.toLowerCase().trim() === headerName?.toLowerCase().trim()
      )
      if (index !== -1) {
        indices[key] = index
      }
    }

    return indices
  }

  /**
   * 입출고 행 파싱
   */
  private parseInventoryRow(
    row: unknown[],
    columnIndices: Record<string, number | undefined>,
    rowNumber: number
  ): InventoryUploadRow | null {
    const errors: ParseError[] = []

    // 필수 필드 추출
    const partnerCode = this.getString(row[columnIndices.partnerCode ?? -1])
    const productCode = this.getString(row[columnIndices.productCode ?? -1])
    const quantityRaw = row[columnIndices.quantity ?? -1]
    const dateRaw = row[columnIndices.transactionDate ?? -1]
    const transactionTypeRaw = row[columnIndices.transactionType ?? -1]
    const currencyRaw = row[columnIndices.currency ?? -1]
    const unitPriceRaw = row[columnIndices.unitPrice ?? -1]

    // 필수값 검증
    if (!partnerCode) {
      errors.push({
        row: rowNumber,
        column: this.columnMapping.partnerCode,
        message: '거래처코드는 필수입니다',
        value: partnerCode,
      })
    }

    if (!productCode) {
      errors.push({
        row: rowNumber,
        column: this.columnMapping.productCode,
        message: '품번은 필수입니다',
        value: productCode,
      })
    }

    // 수량 파싱
    const quantity = this.parseNumber(quantityRaw)
    if (quantity === null || quantity <= 0) {
      errors.push({
        row: rowNumber,
        column: this.columnMapping.quantity,
        message: '수량은 0보다 커야 합니다',
        value: quantityRaw,
      })
    }

    // 날짜 파싱
    const transactionDate = this.parseDate(dateRaw)
    if (!transactionDate) {
      errors.push({
        row: rowNumber,
        column: this.columnMapping.transactionDate,
        message: '올바른 날짜 형식이 아닙니다',
        value: dateRaw,
      })
    }

    // 통화 검증
    const currency = this.parseCurrency(currencyRaw)
    if (currencyRaw && !currency) {
      errors.push({
        row: rowNumber,
        column: this.columnMapping.currency ?? '통화',
        message: '통화는 KRW 또는 USD만 가능합니다',
        value: currencyRaw,
      })
    }

    // 입출고구분
    const transactionType = this.parseTransactionType(transactionTypeRaw)

    if (errors.length > 0) {
      throw new RowParseError(errors)
    }

    return {
      rowNumber,
      partnerCode: partnerCode!,
      productCode: productCode!,
      quantity: quantity!,
      transactionDate: transactionDate!,
      transactionType: transactionType,
      currency: currency ?? 'KRW',
      unitPrice: this.parseNumber(unitPriceRaw) ?? undefined,
    }
  }

  /**
   * 출고 계획 행 파싱
   */
  private parseShipmentRow(
    row: unknown[],
    columnIndices: Record<string, number | undefined>,
    rowNumber: number
  ): (ShipmentPlanRow & { plannedQuantity: number }) | null {
    const errors: ParseError[] = []

    const partnerCode = this.getString(row[columnIndices.partnerCode ?? -1])
    const productCode = this.getString(row[columnIndices.productCode ?? -1])
    const quantityRaw = row[columnIndices.quantity ?? -1]
    const dateRaw = row[columnIndices.transactionDate ?? -1]
    const planTypeRaw = row[columnIndices.planType ?? -1]
    const vehicleModelCode = this.getString(row[columnIndices.vehicleModelCode ?? -1])

    if (!partnerCode) {
      errors.push({
        row: rowNumber,
        column: this.columnMapping.partnerCode,
        message: '거래처코드는 필수입니다',
        value: partnerCode,
      })
    }

    if (!productCode) {
      errors.push({
        row: rowNumber,
        column: this.columnMapping.productCode,
        message: '품번은 필수입니다',
        value: productCode,
      })
    }

    const quantity = this.parseNumber(quantityRaw)
    if (quantity === null || quantity < 0) {
      errors.push({
        row: rowNumber,
        column: this.columnMapping.quantity,
        message: '수량은 0 이상이어야 합니다',
        value: quantityRaw,
      })
    }

    const transactionDate = this.parseDate(dateRaw)
    if (!transactionDate) {
      errors.push({
        row: rowNumber,
        column: this.columnMapping.transactionDate,
        message: '올바른 날짜 형식이 아닙니다',
        value: dateRaw,
      })
    }

    if (errors.length > 0) {
      throw new RowParseError(errors)
    }

    const planType = this.parsePlanType(planTypeRaw)

    return {
      rowNumber,
      partnerCode: partnerCode!,
      productCode: productCode!,
      quantity: quantity!,
      plannedQuantity: quantity!,
      transactionDate: transactionDate!,
      planType,
      vehicleModelCode: vehicleModelCode ?? undefined,
    }
  }

  /**
   * 문자열 추출
   */
  private getString(value: unknown): string | null {
    if (value === null || value === undefined) return null
    const str = String(value).trim()
    return str === '' ? null : str
  }

  /**
   * 숫자 파싱
   */
  private parseNumber(value: unknown): number | null {
    if (value === null || value === undefined) return null
    if (typeof value === 'number') return value

    const str = String(value).replace(/[,\s]/g, '')
    const num = Number(str)
    return isNaN(num) ? null : num
  }

  /**
   * 날짜 파싱
   */
  private parseDate(value: unknown): Date | null {
    if (value === null || value === undefined) return null

    // Date 객체
    if (value instanceof Date) {
      return isNaN(value.getTime()) ? null : value
    }

    // 숫자 (Excel 시리얼 넘버)
    if (typeof value === 'number') {
      return this.excelSerialToDate(value)
    }

    // 문자열
    if (typeof value === 'string') {
      // YYYY-MM-DD
      const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})/)
      if (isoMatch) {
        const [, year, month, day] = isoMatch
        return new Date(Number(year), Number(month) - 1, Number(day))
      }

      // 한국어 형식: YYYY년 MM월 DD일
      const koreanMatch = value.match(/(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일/)
      if (koreanMatch) {
        const [, year, month, day] = koreanMatch
        return new Date(Number(year), Number(month) - 1, Number(day))
      }

      // 일반 Date 파싱
      const date = new Date(value)
      return isNaN(date.getTime()) ? null : date
    }

    return null
  }

  /**
   * Excel 시리얼 넘버를 Date로 변환
   */
  private excelSerialToDate(serial: number): Date {
    // Excel 날짜는 1900-01-01부터의 일수 (1900 버그 포함)
    const excelEpoch = new Date(1899, 11, 30) // 1899-12-30
    const msPerDay = 24 * 60 * 60 * 1000
    return new Date(excelEpoch.getTime() + serial * msPerDay)
  }

  /**
   * 통화 파싱
   */
  private parseCurrency(value: unknown): 'KRW' | 'USD' | null {
    if (value === null || value === undefined) return null
    const str = String(value).toUpperCase().trim()
    if (str === 'KRW' || str === 'WON' || str === '원') return 'KRW'
    if (str === 'USD' || str === 'DOLLAR' || str === '달러' || str === '$')
      return 'USD'
    return null
  }

  /**
   * 입출고구분 파싱
   */
  private parseTransactionType(value: unknown): 'IN' | 'OUT' {
    if (value === null || value === undefined) return 'IN' // 기본값
    const str = String(value).toUpperCase().trim()
    if (str === 'OUT' || str === '출고' || str === '출') return 'OUT'
    return 'IN'
  }

  /**
   * 계획유형 파싱
   */
  private parsePlanType(value: unknown): 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' {
    if (value === null || value === undefined) return 'DAILY'
    const str = String(value).toUpperCase().trim()
    if (str === 'WEEKLY' || str === '주간' || str === '주') return 'WEEKLY'
    if (str === 'MONTHLY' || str === '월간' || str === '월') return 'MONTHLY'
    if (str === 'YEARLY' || str === '연간' || str === '년') return 'YEARLY'
    return 'DAILY'
  }

  /**
   * 컬럼 키를 한글 이름으로 변환
   */
  private getKoreanColumnName(key: string): string {
    const mapping: Record<string, string> = {
      partnerCode: '거래처코드',
      productCode: '품번',
      quantity: '수량',
      transactionDate: '거래일자',
      currency: '통화',
      unitPrice: '단가',
      transactionType: '입출고구분',
      planType: '계획유형',
      vehicleModelCode: '차종코드',
    }
    return mapping[key] ?? key
  }
}

/**
 * 행 파싱 에러
 */
class RowParseError extends Error {
  constructor(public errors: ParseError[]) {
    super('Row parse error')
  }
}
