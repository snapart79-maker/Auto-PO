/**
 * useUpload Hook
 * Excel 업로드 플로우 상태 관리
 */

import { useState, useCallback } from 'react'
import { ExcelParser } from '@infrastructure/excel/ExcelParser'
import type {
  InventoryUploadRow,
  ShipmentPlanRow,
  ParseResult,
  ParseError,
} from '@infrastructure/excel/types'
import type {
  UploadRow,
  ValidationResult,
  ValidationError,
  ValidationContext,
} from '@application/usecases/ValidateUploadDataUseCase'
import { ValidateUploadDataUseCase } from '@application/usecases/ValidateUploadDataUseCase'

export type UploadStep = 'idle' | 'parsing' | 'validating' | 'preview' | 'saving' | 'complete' | 'error'

export interface UseUploadOptions<T> {
  /** 데이터 타입 */
  type: 'inventory' | 'shipment'
  /** 검증 컨텍스트 */
  validationContext: ValidationContext
  /** 저장 함수 */
  onSave: (data: T[]) => Promise<void>
  /** 완료 콜백 */
  onComplete?: () => void
  /** 에러 콜백 */
  onError?: (error: Error) => void
}

export interface UseUploadResult<T> {
  /** 현재 단계 */
  step: UploadStep
  /** 파싱된 데이터 */
  data: T[]
  /** 파싱 오류 */
  parseErrors: ParseError[]
  /** 검증 오류 */
  validationErrors: ValidationError[]
  /** 에러 메시지 */
  errorMessage: string | null
  /** 파일 처리 */
  handleFile: (file: File) => Promise<void>
  /** 셀 값 변경 */
  updateCell: (rowIndex: number, field: keyof T, value: unknown) => void
  /** 재검증 */
  revalidate: () => Promise<void>
  /** 저장 */
  save: () => Promise<void>
  /** 초기화 */
  reset: () => void
}

export function useUpload<T extends InventoryUploadRow | ShipmentPlanRow>(
  options: UseUploadOptions<T>
): UseUploadResult<T> {
  const { type, validationContext, onSave, onComplete, onError } = options

  const [step, setStep] = useState<UploadStep>('idle')
  const [data, setData] = useState<T[]>([])
  const [parseErrors, setParseErrors] = useState<ParseError[]>([])
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  /**
   * 파일 처리
   */
  const handleFile = useCallback(
    async (file: File) => {
      try {
        setStep('parsing')
        setErrorMessage(null)

        // 파일 읽기
        const buffer = await file.arrayBuffer()
        const parser = new ExcelParser()

        // 시트 데이터 추출
        const sheetData = parser.parseFromBuffer(buffer)

        // 파싱
        let result: ParseResult<T>
        if (type === 'inventory') {
          result = parser.parseInventoryData(sheetData) as ParseResult<T>
        } else {
          result = parser.parseShipmentPlanData(sheetData) as unknown as ParseResult<T>
        }

        setData(result.rows)
        setParseErrors(result.errors)

        if (result.rows.length === 0 && result.errors.length === 0) {
          setErrorMessage('파일에 데이터가 없습니다.')
          setStep('error')
          return
        }

        // 검증 단계
        setStep('validating')
        const validationResult = await validate(result.rows)
        setValidationErrors(validationResult.errors)

        setStep('preview')
      } catch (error) {
        const err = error instanceof Error ? error : new Error('알 수 없는 오류')
        setErrorMessage(err.message)
        setStep('error')
        onError?.(err)
      }
    },
    [type, onError]
  )

  /**
   * 검증 실행
   */
  const validate = useCallback(
    async (rows: T[]): Promise<ValidationResult> => {
      const validateUseCase = new ValidateUploadDataUseCase(validationContext)

      const uploadRows: UploadRow[] = rows.map((row) => ({
        rowNumber: row.rowNumber,
        partnerCode: row.partnerCode,
        productCode: row.productCode,
        quantity: row.quantity,
        transactionDate: row.transactionDate,
        currency: row.currency,
      }))

      return validateUseCase.execute(uploadRows)
    },
    [validationContext]
  )

  /**
   * 셀 값 업데이트
   */
  const updateCell = useCallback(
    (rowIndex: number, field: keyof T, value: unknown) => {
      setData((prev) => {
        const updated = [...prev]
        const row = updated[rowIndex]
        if (row) {
          updated[rowIndex] = { ...row, [field]: value }
        }
        return updated
      })
    },
    []
  )

  /**
   * 재검증
   */
  const revalidate = useCallback(async () => {
    setStep('validating')
    const result = await validate(data)
    setValidationErrors(result.errors)
    setStep('preview')
  }, [data, validate])

  /**
   * 저장
   */
  const save = useCallback(async () => {
    try {
      // 에러가 있으면 저장 불가
      if (parseErrors.length > 0 || validationErrors.length > 0) {
        setErrorMessage('오류가 있는 데이터는 저장할 수 없습니다.')
        return
      }

      setStep('saving')
      await onSave(data)
      setStep('complete')
      onComplete?.()
    } catch (error) {
      const err = error instanceof Error ? error : new Error('저장 실패')
      setErrorMessage(err.message)
      setStep('error')
      onError?.(err)
    }
  }, [data, parseErrors, validationErrors, onSave, onComplete, onError])

  /**
   * 초기화
   */
  const reset = useCallback(() => {
    setStep('idle')
    setData([])
    setParseErrors([])
    setValidationErrors([])
    setErrorMessage(null)
  }, [])

  return {
    step,
    data,
    parseErrors,
    validationErrors,
    errorMessage,
    handleFile,
    updateCell,
    revalidate,
    save,
    reset,
  }
}
