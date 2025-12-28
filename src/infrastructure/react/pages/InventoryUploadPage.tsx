/**
 * InventoryUploadPage
 * 입고/출고 데이터 Excel 업로드 페이지
 */

import { useState, useCallback, useMemo } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import { PageHeader } from '../components/PageHeader'
import { FileDropzone } from '../components/FileDropzone'
import { UploadPreview } from '../components/UploadPreview'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { useToast } from '../components/ui/toast'
import { ExcelParser } from '@infrastructure/excel/ExcelParser'
import { ValidateUploadDataUseCase, type UploadRow, type ValidationError } from '@application/usecases/ValidateUploadDataUseCase'
import { SupabasePartnerRepository, SupabaseProductRepository, SupabaseExchangeRateRepository, SupabaseInventoryRepository } from '@infrastructure/repositories'
import { InventoryTransaction } from '@domain/entities/InventoryTransaction'
import type { InventoryUploadRow, ParseError } from '@infrastructure/excel/types'

type UploadStep = 'upload' | 'preview' | 'complete'

export function InventoryUploadPage() {
  const { toast } = useToast()
  const [step, setStep] = useState<UploadStep>('upload')
  const [data, setData] = useState<InventoryUploadRow[]>([])
  const [parseErrors, setParseErrors] = useState<ParseError[]>([])
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Repositories
  const partnerRepo = useMemo(() => new SupabasePartnerRepository(), [])
  const productRepo = useMemo(() => new SupabaseProductRepository(), [])
  const exchangeRateRepo = useMemo(() => new SupabaseExchangeRateRepository(), [])
  const inventoryRepo = useMemo(() => new SupabaseInventoryRepository(), [])

  // 파일 처리
  const handleFileDrop = useCallback(
    async (file: File) => {
      setIsLoading(true)
      try {
        // 파일 파싱
        const buffer = await file.arrayBuffer()
        const parser = new ExcelParser()
        const sheetData = parser.parseFromBuffer(buffer)
        const result = parser.parseInventoryData(sheetData)

        setData(result.rows)
        setParseErrors(result.errors)

        if (result.rows.length === 0) {
          toast({
            title: '데이터 없음',
            description: '파일에 유효한 데이터가 없습니다.',
            variant: 'destructive',
          })
          return
        }

        // 검증
        await validateData(result.rows)
        setStep('preview')
      } catch (error) {
        toast({
          title: '파일 처리 실패',
          description: error instanceof Error ? error.message : '알 수 없는 오류',
          variant: 'destructive',
        })
      } finally {
        setIsLoading(false)
      }
    },
    [toast]
  )

  // 데이터 검증
  const validateData = useCallback(
    async (rows: InventoryUploadRow[]) => {
      const validateUseCase = new ValidateUploadDataUseCase({
        partnerExists: async (code) => {
          const partner = await partnerRepo.findByCode(code)
          return partner !== null
        },
        productExists: async (code) => {
          const product = await productRepo.findByCode(code)
          return product !== null
        },
        exchangeRateExists: async (currency, date) => {
          if (currency === 'KRW') return true
          const rate = await exchangeRateRepo.findByCurrencyAndDate(currency, date)
          return rate !== null
        },
      })

      const uploadRows: UploadRow[] = rows.map((row) => ({
        rowNumber: row.rowNumber,
        partnerCode: row.partnerCode,
        productCode: row.productCode,
        quantity: row.quantity,
        transactionDate: row.transactionDate,
        currency: row.currency,
      }))

      const result = await validateUseCase.execute(uploadRows)
      setValidationErrors(result.errors)
    },
    [partnerRepo, productRepo, exchangeRateRepo]
  )

  // 재검증
  const handleRevalidate = useCallback(async () => {
    setIsLoading(true)
    try {
      await validateData(data)
      toast({
        title: '재검증 완료',
        description: validationErrors.length === 0 ? '모든 데이터가 유효합니다.' : `${validationErrors.length}건의 오류가 있습니다.`,
      })
    } finally {
      setIsLoading(false)
    }
  }, [data, validateData, validationErrors.length, toast])

  // 저장
  const handleSave = useCallback(async () => {
    if (parseErrors.length > 0 || validationErrors.length > 0) {
      toast({
        title: '저장 불가',
        description: '오류가 있는 데이터는 저장할 수 없습니다.',
        variant: 'destructive',
      })
      return
    }

    setIsSaving(true)
    try {
      // 배치 ID 생성
      const batchId = `BATCH-${Date.now()}`

      // 거래처/제품 코드 → ID 매핑
      const partnerMap = new Map<string, string>()
      const productMap = new Map<string, string>()

      for (const row of data) {
        if (!partnerMap.has(row.partnerCode)) {
          const partner = await partnerRepo.findByCode(row.partnerCode)
          if (partner) partnerMap.set(row.partnerCode, partner.id)
        }
        if (!productMap.has(row.productCode)) {
          const product = await productRepo.findByCode(row.productCode)
          if (product) productMap.set(row.productCode, product.id)
        }
      }

      // 엔티티 생성
      const transactions = data.map((row) =>
        InventoryTransaction.create({
          id: crypto.randomUUID(),
          transactionDate: row.transactionDate,
          transactionType: row.transactionType,
          partnerId: partnerMap.get(row.partnerCode),
          productId: productMap.get(row.productCode),
          quantity: row.quantity,
          uploadBatchId: batchId,
        })
      )

      // 저장
      await inventoryRepo.saveMany(transactions)

      toast({
        title: '저장 완료',
        description: `${transactions.length}건의 데이터가 저장되었습니다.`,
      })

      setStep('complete')
    } catch (error) {
      toast({
        title: '저장 실패',
        description: error instanceof Error ? error.message : '알 수 없는 오류',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }, [data, parseErrors, validationErrors, partnerRepo, productRepo, inventoryRepo, toast])

  // 취소
  const handleCancel = useCallback(() => {
    setStep('upload')
    setData([])
    setParseErrors([])
    setValidationErrors([])
  }, [])

  // 새 업로드
  const handleNewUpload = useCallback(() => {
    setStep('upload')
    setData([])
    setParseErrors([])
    setValidationErrors([])
  }, [])

  // 에러 표시
  const handleError = useCallback(
    (message: string) => {
      toast({
        title: '오류',
        description: message,
        variant: 'destructive',
      })
    },
    [toast]
  )

  // 테이블 컬럼
  const columns: ColumnDef<InventoryUploadRow>[] = useMemo(
    () => [
      {
        accessorKey: 'rowNumber',
        header: '행',
        size: 60,
      },
      {
        accessorKey: 'transactionType',
        header: '구분',
        size: 80,
        cell: ({ getValue }) => (getValue() === 'IN' ? '입고' : '출고'),
      },
      {
        accessorKey: 'partnerCode',
        header: '거래처코드',
      },
      {
        accessorKey: 'productCode',
        header: '품번',
      },
      {
        accessorKey: 'quantity',
        header: '수량',
        cell: ({ getValue }) => (getValue() as number).toLocaleString(),
      },
      {
        accessorKey: 'transactionDate',
        header: '거래일자',
        cell: ({ getValue }) => (getValue() as Date).toLocaleDateString('ko-KR'),
      },
      {
        accessorKey: 'currency',
        header: '통화',
        size: 80,
      },
      {
        accessorKey: 'unitPrice',
        header: '단가',
        cell: ({ getValue }) => {
          const value = getValue() as number | undefined
          return value ? value.toLocaleString() : '-'
        },
      },
    ],
    []
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="입출고 데이터 업로드"
        description="MES Excel 데이터를 업로드하여 입고/출고 이력을 등록합니다."
      />

      {step === 'upload' && (
        <Card>
          <CardHeader>
            <CardTitle>Excel 파일 업로드</CardTitle>
            <CardDescription>
              입출고 데이터가 포함된 Excel 파일(.xlsx, .xls)을 업로드하세요.
              <br />
              필수 컬럼: 거래처코드, 품번, 수량, 거래일자, 입출고구분
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FileDropzone
              onFileDrop={handleFileDrop}
              onError={handleError}
              loading={isLoading}
            />
          </CardContent>
        </Card>
      )}

      {step === 'preview' && (
        <Card>
          <CardHeader>
            <CardTitle>데이터 프리뷰</CardTitle>
            <CardDescription>
              업로드된 데이터를 확인하세요. 오류가 있는 셀은 빨간색으로 표시됩니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UploadPreview
              data={data}
              parseErrors={parseErrors}
              validationErrors={validationErrors}
              columns={columns}
              onRevalidate={handleRevalidate}
              onSave={handleSave}
              onCancel={handleCancel}
              isSaving={isSaving}
            />
          </CardContent>
        </Card>
      )}

      {step === 'complete' && (
        <Card>
          <CardHeader>
            <CardTitle>업로드 완료</CardTitle>
            <CardDescription>
              {data.length}건의 데이터가 성공적으로 저장되었습니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center gap-4">
            <Button onClick={handleNewUpload}>새 파일 업로드</Button>
            <Button variant="outline" onClick={() => window.history.back()}>
              돌아가기
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
