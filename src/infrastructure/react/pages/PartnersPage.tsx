/**
 * PartnersPage - 거래처 마스터 관리 페이지 (ERP 스타일)
 */

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import * as XLSX from 'xlsx'
import { ERPTable } from '../components/ERPTable'
import {
  ERPGroupBox,
  ERPFormField,
  ERPInput,
  ERPSelect,
  ERPButton,
} from '../components/ERPGroupBox'
import { ERPFunctionPanel } from '../components/ERPSummaryPanel'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Switch } from '../components/ui/switch'
import { useToast } from '../components/ui/toast'
import { SupabasePartnerRepository } from '@infrastructure/repositories'
import { Partner } from '@domain/entities/Partner'
import { PartnerType } from '@domain/valueObjects/PartnerType'
import { Plus, Pencil, Trash2, Upload, RefreshCw, Search, FileDown } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'

const partnerRepository = new SupabasePartnerRepository()

interface PartnerRow {
  id: string
  partnerCode: string           // 1. 거래처코드
  partnerName: string           // 2. 거래처명(전명)
  partnerType: string           // 거래처유형 (SUPPLIER/CUSTOMER/VIETNAM)
  currency: string              // 15. 화폐단위코드
  isActive: boolean             // 5. 사용여부(Y/N)
  // 선택 필드 (확장 필드)
  note?: string                 // 3. 비고
  partnerGroup?: string         // 4. 거래처그룹
  businessNumber?: string       // 6. 사업자등록번호
  ceoName?: string              // 7. 대표자명
  foundationDate?: string       // 8. 창립기념일
  postalCode?: string           // 9. 우편번호
  address?: string              // 10. 주소
  businessType?: string         // 11. 업태
  industryType?: string         // 12. 업종
  countryCode?: string          // 13. 국가코드
  incoterms?: string            // 14. 인도조건
  contactPhone?: string         // 16. 전화번호1
  phone2?: string               // 17. 전화번호2
  contactEmail?: string         // 18. 대표 이메일
  website?: string              // 19. 홈페이지 주소
  contactPerson?: string        // 20. 협력사담당자명
  partnerContactPhone?: string  // 21. 협력사담당자 연락처
  manager?: string              // 22. 담당사원
  effectiveStartDate?: string   // 23. 적용시작일
  effectiveEndDate?: string     // 24. 적용완료일
}

const PARTNER_TYPE_LABELS: Record<string, string> = {
  SUPPLIER: '협력사',
  CUSTOMER: '고객사',
  VIETNAM: '베트남',
}

/**
 * Excel 시리얼 넘버를 Date로 변환
 */
function excelSerialToDate(serial: number): Date {
  // Excel 날짜는 1900-01-01부터의 일수 (1900 버그 포함)
  const excelEpoch = new Date(1899, 11, 30) // 1899-12-30
  const msPerDay = 24 * 60 * 60 * 1000
  return new Date(excelEpoch.getTime() + serial * msPerDay)
}

/**
 * Date를 YYYY-MM-DD 문자열로 변환
 */
function formatDateToString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * 다양한 형식의 날짜 값을 YYYY-MM-DD 문자열로 변환
 */
function parseExcelDate(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null

  // Date 객체인 경우 (cellDates: true 옵션 사용 시)
  if (value instanceof Date) {
    if (isNaN(value.getTime())) return null
    return formatDateToString(value)
  }

  // 숫자인 경우 (Excel 시리얼 넘버)
  if (typeof value === 'number') {
    const date = excelSerialToDate(value)
    return formatDateToString(date)
  }

  // 문자열인 경우
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return null

    // 이미 YYYY-MM-DD 형식인지 확인
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return trimmed
    }

    // 숫자 문자열인 경우 (시리얼 넘버)
    const num = parseFloat(trimmed)
    if (!isNaN(num) && num > 10000 && num < 100000) {
      const date = excelSerialToDate(num)
      return formatDateToString(date)
    }

    // 기타 날짜 문자열 파싱 시도
    const parsed = new Date(trimmed)
    if (!isNaN(parsed.getTime())) {
      return formatDateToString(parsed)
    }
  }

  return null
}

export function PartnersPage() {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [data, setData] = useState<PartnerRow[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [filterType, setFilterType] = useState('ALL')
  const [filterCode, setFilterCode] = useState('')
  const [filterName, setFilterName] = useState('')
  const [editingItem, setEditingItem] = useState<PartnerRow | null>(null)
  const [formData, setFormData] = useState({
    partnerCode: '',
    partnerName: '',
    partnerType: 'SUPPLIER',
    note: '',
    partnerGroup: '',
    businessNumber: '',
    ceoName: '',
    foundationDate: '',
    postalCode: '',
    address: '',
    businessType: '',
    industryType: '',
    countryCode: '대한민국',
    incoterms: '도착도',
    currency: 'KRW',
    contactPhone: '',
    phone2: '',
    contactEmail: '',
    website: '',
    contactPerson: '',
    partnerContactPhone: '',
    manager: '',
    effectiveStartDate: '',
    effectiveEndDate: '',
    isActive: true,
  })

  // 업로드 다이얼로그 상태
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [uploadData, setUploadData] = useState<PartnerRow[]>([])
  const [uploadErrors, setUploadErrors] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)

  const columns: ColumnDef<PartnerRow, unknown>[] = useMemo(
    () => [
      { accessorKey: 'partnerCode', header: '거래처코드', size: 100 },
      { accessorKey: 'partnerName', header: '거래처명', size: 150 },
      { accessorKey: 'partnerGroup', header: '거래처그룹', cell: ({ row }) => row.original.partnerGroup || '-', size: 100 },
      {
        accessorKey: 'isActive',
        header: '사용여부',
        cell: ({ row }) => (
          <span className={row.original.isActive ? 'text-green-600 font-medium' : 'text-gray-400'}>
            {row.original.isActive ? 'Y' : 'N'}
          </span>
        ),
        size: 70,
      },
      { accessorKey: 'businessNumber', header: '사업자등록번호', cell: ({ row }) => row.original.businessNumber || '-', size: 130 },
      { accessorKey: 'ceoName', header: '대표자명', cell: ({ row }) => row.original.ceoName || '-', size: 90 },
      { accessorKey: 'countryCode', header: '국가코드', cell: ({ row }) => row.original.countryCode || '-', size: 80 },
      { accessorKey: 'incoterms', header: '인도조건', cell: ({ row }) => row.original.incoterms || '-', size: 80 },
      { accessorKey: 'currency', header: '화폐단위', size: 70 },
      { accessorKey: 'contactPerson', header: '협력사담당자', cell: ({ row }) => row.original.contactPerson || '-', size: 100 },
      { accessorKey: 'effectiveStartDate', header: '적용시작일', cell: ({ row }) => row.original.effectiveStartDate || '-', size: 100 },
      {
        id: 'actions',
        header: '작업',
        cell: ({ row }) => (
          <div className="flex gap-1">
            <button onClick={() => handleEdit(row.original)} className="text-blue-600 hover:text-blue-800">
              <Pencil className="h-4 w-4" />
            </button>
            <button onClick={() => handleDelete(row.original.id)} className="text-red-600 hover:text-red-800">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ),
        size: 70,
      },
    ],
    []
  )

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const partners = await partnerRepository.findAll()
      setData(
        partners.map((p) => ({
          id: p.id,
          partnerCode: p.partnerCode,
          partnerName: p.partnerName,
          partnerType: p.partnerType.value,
          note: p.note ?? '',
          partnerGroup: p.partnerGroup ?? '',
          isActive: p.isActive,
          businessNumber: p.businessNumber ?? '',
          ceoName: p.ceoName ?? '',
          foundationDate: p.foundationDate ? p.foundationDate.toISOString().split('T')[0] : '',
          postalCode: p.postalCode ?? '',
          address: p.address ?? '',
          businessType: p.businessType ?? '',
          industryType: p.industryType ?? '',
          countryCode: p.countryCode ?? '',
          incoterms: p.incoterms ?? '',
          currency: p.currency,
          contactPhone: p.contactPhone ?? '',
          phone2: p.phone2 ?? '',
          contactEmail: p.contactEmail ?? '',
          website: p.website ?? '',
          contactPerson: p.contactPerson ?? '',
          partnerContactPhone: p.partnerContactPhone ?? '',
          manager: p.manager ?? '',
          effectiveStartDate: p.effectiveStartDate ? p.effectiveStartDate.toISOString().split('T')[0] : '',
          effectiveEndDate: p.effectiveEndDate ? p.effectiveEndDate.toISOString().split('T')[0] : '',
        }))
      )
    } catch (error) {
      console.error('데이터 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredData = useMemo(() => {
    let result = data
    if (filterType !== 'ALL') {
      result = result.filter((item) => item.partnerType === filterType)
    }
    if (filterCode.trim()) {
      result = result.filter((item) => item.partnerCode.toLowerCase().includes(filterCode.toLowerCase()))
    }
    if (filterName.trim()) {
      result = result.filter((item) => item.partnerName.toLowerCase().includes(filterName.toLowerCase()))
    }
    return result
  }, [data, filterType, filterCode, filterName])

  const handleSearch = () => {
    // filteredData가 자동으로 계산됨
  }

  const handleReset = () => {
    setFilterType('ALL')
    setFilterCode('')
    setFilterName('')
  }

  const handleAdd = () => {
    setEditingItem(null)
    setFormData({
      partnerCode: '',
      partnerName: '',
      partnerType: 'SUPPLIER',
      note: '',
      partnerGroup: '',
      businessNumber: '',
      ceoName: '',
      foundationDate: '',
      postalCode: '',
      address: '',
      businessType: '',
      industryType: '',
      countryCode: '대한민국',
      incoterms: '도착도',
      currency: 'KRW',
      contactPhone: '',
      phone2: '',
      contactEmail: '',
      website: '',
      contactPerson: '',
      partnerContactPhone: '',
      manager: '',
      effectiveStartDate: '',
      effectiveEndDate: '',
      isActive: true,
    })
    setDialogOpen(true)
  }

  const handleEdit = (item: PartnerRow) => {
    setEditingItem(item)
    setFormData({
      partnerCode: item.partnerCode,
      partnerName: item.partnerName,
      partnerType: item.partnerType,
      note: item.note ?? '',
      partnerGroup: item.partnerGroup ?? '',
      businessNumber: item.businessNumber ?? '',
      ceoName: item.ceoName ?? '',
      foundationDate: item.foundationDate ?? '',
      postalCode: item.postalCode ?? '',
      address: item.address ?? '',
      businessType: item.businessType ?? '',
      industryType: item.industryType ?? '',
      countryCode: item.countryCode || '대한민국',
      incoterms: item.incoterms || '도착도',
      currency: item.currency,
      contactPhone: item.contactPhone ?? '',
      phone2: item.phone2 ?? '',
      contactEmail: item.contactEmail ?? '',
      website: item.website ?? '',
      contactPerson: item.contactPerson ?? '',
      partnerContactPhone: item.partnerContactPhone ?? '',
      manager: item.manager ?? '',
      effectiveStartDate: item.effectiveStartDate ?? '',
      effectiveEndDate: item.effectiveEndDate ?? '',
      isActive: item.isActive,
    })
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('이 거래처를 삭제하시겠습니까?')) return
    try {
      await partnerRepository.delete(id)
      await loadData()
      toast({ title: '삭제 완료' })
    } catch (error) {
      console.error('삭제 실패:', error)
      toast({ title: '삭제 실패', variant: 'destructive' })
    }
  }

  const handleSubmit = async () => {
    try {
      const partner = Partner.create({
        id: editingItem?.id ?? crypto.randomUUID(),
        partnerCode: formData.partnerCode,
        partnerName: formData.partnerName,
        partnerType: PartnerType.fromString(formData.partnerType),
        businessNumber: formData.businessNumber || undefined,
        address: formData.address || undefined,
        contactPerson: formData.contactPerson || undefined,
        contactPhone: formData.contactPhone || undefined,
        contactEmail: formData.contactEmail || undefined,
        currency: formData.currency,
        isActive: formData.isActive,
        // 확장 필드
        note: formData.note || undefined,
        partnerGroup: formData.partnerGroup || undefined,
        ceoName: formData.ceoName || undefined,
        foundationDate: formData.foundationDate ? new Date(formData.foundationDate) : undefined,
        postalCode: formData.postalCode || undefined,
        businessType: formData.businessType || undefined,
        industryType: formData.industryType || undefined,
        countryCode: formData.countryCode || undefined,
        incoterms: formData.incoterms || undefined,
        phone2: formData.phone2 || undefined,
        website: formData.website || undefined,
        partnerContactPhone: formData.partnerContactPhone || undefined,
        manager: formData.manager || undefined,
        effectiveStartDate: formData.effectiveStartDate ? new Date(formData.effectiveStartDate) : undefined,
        effectiveEndDate: formData.effectiveEndDate ? new Date(formData.effectiveEndDate) : undefined,
      })

      await partnerRepository.save(partner)
      setDialogOpen(false)
      await loadData()
      toast({ title: editingItem ? '수정 완료' : '등록 완료' })
    } catch (error) {
      console.error('저장 실패:', error)
      toast({ title: '저장 실패', variant: 'destructive' })
    }
  }

  // 양식 다운로드
  const handleDownloadTemplate = useCallback(() => {
    const templateData = [
      [
        '거래처코드', '거래처명', '비고', '거래처그룹', '사용여부(Y/N)', '사업자등록번호',
        '대표자명', '창립기념일', '우편번호', '주소', '업태', '업종',
        '국가코드', '인도조건', '화폐단위코드', '전화번호1', '전화번호2', '대표이메일',
        '홈페이지주소', '협력사담당자명', '협력사담당자연락처', '담당사원', '적용시작일', '적용완료일'
      ],
      [
        'P001', '샘플협력사', '', 'SUPPLIER', 'Y', '123-45-67890',
        '김대표', '2020-01-01', '12345', '서울시 강남구 테헤란로 123', '제조업', '전자부품',
        '대한민국', '도착도', 'KRW', '02-1234-5678', '010-1234-5678', 'sample@company.com',
        'https://www.company.com', '홍길동', '010-9876-5432', '이담당', '2024-01-01', '2099-12-31'
      ],
    ]
    const ws = XLSX.utils.aoa_to_sheet(templateData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '거래처')
    ws['!cols'] = [
      { wch: 12 }, { wch: 20 }, { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 15 },
      { wch: 10 }, { wch: 12 }, { wch: 10 }, { wch: 30 }, { wch: 10 }, { wch: 10 },
      { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 25 },
      { wch: 25 }, { wch: 15 }, { wch: 18 }, { wch: 10 }, { wch: 12 }, { wch: 12 }
    ]
    XLSX.writeFile(wb, '거래처_양식.xlsx')
  }, [])

  // 엑셀 업로드 (24개 컬럼)
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const buffer = await file.arrayBuffer()
      const workbook = XLSX.read(buffer, { type: 'array', cellDates: true })
      const sheetName = workbook.SheetNames[0]
      if (!sheetName) throw new Error('시트를 찾을 수 없습니다')
      const sheet = workbook.Sheets[sheetName]
      if (!sheet) throw new Error('시트를 찾을 수 없습니다')
      const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: false, dateNF: 'yyyy-mm-dd' })

      const errors: string[] = []
      const parsedData: PartnerRow[] = []

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i]
        if (!row || row.length === 0) continue

        // 24개 컬럼 파싱
        const partnerCode = String(row[0] ?? '').trim()              // 1. 거래처코드
        const partnerName = String(row[1] ?? '').trim()              // 2. 거래처명
        const note = String(row[2] ?? '').trim()                     // 3. 비고
        const partnerGroup = String(row[3] ?? '').trim().toUpperCase() // 4. 거래처그룹
        const isActiveStr = String(row[4] ?? 'Y').trim().toUpperCase() // 5. 사용여부
        const businessNumber = String(row[5] ?? '').trim()           // 6. 사업자등록번호
        const ceoName = String(row[6] ?? '').trim()                  // 7. 대표자명
        // 날짜 필드는 parseExcelDate로 변환
        const foundationDate = parseExcelDate(row[7]) ?? ''          // 8. 창립기념일
        const postalCode = String(row[8] ?? '').trim()               // 9. 우편번호
        const address = String(row[9] ?? '').trim()                  // 10. 주소
        const businessType = String(row[10] ?? '').trim()            // 11. 업태
        const industryType = String(row[11] ?? '').trim()            // 12. 업종
        const countryCode = String(row[12] ?? '대한민국').trim()      // 13. 국가코드
        const incoterms = String(row[13] ?? '도착도').trim()         // 14. 인도조건
        const currency = String(row[14] ?? 'KRW').trim().toUpperCase() // 15. 화폐단위코드
        const contactPhone = String(row[15] ?? '').trim()            // 16. 전화번호1
        const phone2 = String(row[16] ?? '').trim()                  // 17. 전화번호2
        const contactEmail = String(row[17] ?? '').trim()            // 18. 대표이메일
        const website = String(row[18] ?? '').trim()                 // 19. 홈페이지주소
        const contactPerson = String(row[19] ?? '').trim()           // 20. 협력사담당자명
        const partnerContactPhone = String(row[20] ?? '').trim()     // 21. 협력사담당자연락처
        const manager = String(row[21] ?? '').trim()                 // 22. 담당사원
        // 날짜 필드는 parseExcelDate로 변환
        const effectiveStartDate = parseExcelDate(row[22]) ?? ''     // 23. 적용시작일
        const effectiveEndDate = parseExcelDate(row[23]) ?? ''       // 24. 적용완료일

        if (!partnerCode) {
          errors.push(`행 ${i + 1}: 거래처코드 필수`)
          continue
        }
        if (!partnerName) {
          errors.push(`행 ${i + 1}: 거래처명 필수`)
          continue
        }

        // partnerGroup을 partnerType으로도 사용 (SUPPLIER/CUSTOMER/VIETNAM)
        const validPartnerType = ['SUPPLIER', 'CUSTOMER', 'VIETNAM'].includes(partnerGroup) ? partnerGroup : 'SUPPLIER'

        parsedData.push({
          id: crypto.randomUUID(),
          partnerCode,
          partnerName,
          partnerType: validPartnerType,
          currency: ['KRW', 'USD'].includes(currency) ? currency : 'KRW',
          isActive: isActiveStr !== 'N',
          note,
          partnerGroup,
          businessNumber,
          ceoName,
          foundationDate,
          postalCode,
          address,
          businessType,
          industryType,
          countryCode: countryCode || '대한민국',
          incoterms: incoterms || '도착도',
          contactPhone,
          phone2,
          contactEmail,
          website,
          contactPerson,
          partnerContactPhone,
          manager,
          effectiveStartDate,
          effectiveEndDate,
        })
      }

      setUploadData(parsedData)
      setUploadErrors(errors)
      setUploadDialogOpen(true)
    } catch (err) {
      toast({ title: '파일 처리 실패', description: err instanceof Error ? err.message : '알 수 없는 오류', variant: 'destructive' })
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }, [toast])

  // 업로드 데이터 저장
  const handleUploadSave = useCallback(async () => {
    if (uploadErrors.length > 0) {
      toast({ title: '오류가 있어 저장할 수 없습니다', variant: 'destructive' })
      return
    }

    setUploading(true)
    try {
      let savedCount = 0
      for (const row of uploadData) {
        const partner = Partner.create({
          id: row.id,
          partnerCode: row.partnerCode,
          partnerName: row.partnerName,
          partnerType: PartnerType.fromString(row.partnerType),
          businessNumber: row.businessNumber || undefined,
          contactPerson: row.contactPerson || undefined,
          contactPhone: row.contactPhone || undefined,
          currency: row.currency,
          isActive: row.isActive,
          // 확장 필드
          note: row.note || undefined,
          partnerGroup: row.partnerGroup || undefined,
          ceoName: row.ceoName || undefined,
          foundationDate: row.foundationDate ? new Date(row.foundationDate) : undefined,
          postalCode: row.postalCode || undefined,
          address: row.address || undefined,
          businessType: row.businessType || undefined,
          industryType: row.industryType || undefined,
          countryCode: row.countryCode || undefined,
          incoterms: row.incoterms || undefined,
          phone2: row.phone2 || undefined,
          contactEmail: row.contactEmail || undefined,
          website: row.website || undefined,
          partnerContactPhone: row.partnerContactPhone || undefined,
          manager: row.manager || undefined,
          effectiveStartDate: row.effectiveStartDate ? new Date(row.effectiveStartDate) : undefined,
          effectiveEndDate: row.effectiveEndDate ? new Date(row.effectiveEndDate) : undefined,
        })
        await partnerRepository.save(partner)
        savedCount++
      }

      toast({ title: '저장 완료', description: `${savedCount}건 저장됨` })
      setUploadDialogOpen(false)
      setUploadData([])
      setUploadErrors([])
      await loadData()
    } catch (err) {
      toast({ title: '저장 실패', description: err instanceof Error ? err.message : '알 수 없는 오류', variant: 'destructive' })
    } finally {
      setUploading(false)
    }
  }, [uploadData, uploadErrors, toast])

  // 유형별 통계
  const typeSummary = useMemo(() => ({
    total: data.length,
    supplier: data.filter((d) => d.partnerType === 'SUPPLIER').length,
    customer: data.filter((d) => d.partnerType === 'CUSTOMER').length,
    vietnam: data.filter((d) => d.partnerType === 'VIETNAM').length,
  }), [data])

  return (
    <div className="h-full flex flex-col gap-2">
      {/* 상단 영역: 조회조건 + 기능 */}
      <div className="flex gap-2">
        <ERPGroupBox title="조회조건" className="flex-1">
          <div className="grid grid-cols-4 gap-x-4 gap-y-2">
            <ERPFormField label="유형">
              <ERPSelect value={filterType} onChange={(e) => setFilterType(e.target.value)} inputSize="md">
                <option value="ALL">전체 ({typeSummary.total})</option>
                <option value="SUPPLIER">협력사 ({typeSummary.supplier})</option>
                <option value="CUSTOMER">고객사 ({typeSummary.customer})</option>
                <option value="VIETNAM">베트남 ({typeSummary.vietnam})</option>
              </ERPSelect>
            </ERPFormField>
            <ERPFormField label="코드">
              <ERPInput value={filterCode} onChange={(e) => setFilterCode(e.target.value)} placeholder="거래처코드" inputSize="md" />
            </ERPFormField>
            <ERPFormField label="거래처명">
              <ERPInput value={filterName} onChange={(e) => setFilterName(e.target.value)} placeholder="거래처명" inputSize="lg" />
            </ERPFormField>
            <div className="flex items-end gap-2">
              <ERPButton variant="primary" onClick={handleSearch}>
                <Search className="h-3 w-3 mr-1" />
                조회
              </ERPButton>
              <ERPButton onClick={handleReset}>초기화</ERPButton>
            </div>
          </div>
        </ERPGroupBox>

        <ERPFunctionPanel
          title="기능"
          className="w-36"
          buttons={[
            { label: '개별등록', icon: <Plus className="h-3 w-3" />, onClick: handleAdd },
            { label: '일괄등록', icon: <Upload className="h-3 w-3" />, onClick: () => fileInputRef.current?.click() },
            { label: '양식다운로드', icon: <FileDown className="h-3 w-3" />, onClick: handleDownloadTemplate },
            { label: '새로고침', icon: <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />, onClick: loadData },
          ]}
        />
        <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={handleFileUpload} className="hidden" />
      </div>

      {/* 메인 테이블 */}
      <div className="flex-1 min-h-0">
        <ERPTable columns={columns} data={filteredData} title="거래처 목록" pageSize={20} enableSelection />
      </div>

      {/* 개별 등록/수정 다이얼로그 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? '거래처 수정' : '거래처 추가'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-4 gap-4 py-4">
            {/* 기본 정보 */}
            <div className="space-y-2">
              <Label>거래처코드 *</Label>
              <Input value={formData.partnerCode} onChange={(e) => setFormData({ ...formData, partnerCode: e.target.value })} disabled={!!editingItem} />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>거래처명 *</Label>
              <Input value={formData.partnerName} onChange={(e) => setFormData({ ...formData, partnerName: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>거래처그룹</Label>
              <Select value={formData.partnerType} onValueChange={(v) => setFormData({ ...formData, partnerType: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="SUPPLIER">협력사</SelectItem>
                  <SelectItem value="CUSTOMER">고객사</SelectItem>
                  <SelectItem value="VIETNAM">베트남</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 col-span-3">
              <Label>비고</Label>
              <Input value={formData.note} onChange={(e) => setFormData({ ...formData, note: e.target.value })} />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <Switch checked={formData.isActive} onCheckedChange={(c) => setFormData({ ...formData, isActive: c })} />
              <Label>사용여부</Label>
            </div>

            {/* 사업자 정보 */}
            <div className="space-y-2">
              <Label>사업자등록번호</Label>
              <Input value={formData.businessNumber} onChange={(e) => setFormData({ ...formData, businessNumber: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>대표자명</Label>
              <Input value={formData.ceoName} onChange={(e) => setFormData({ ...formData, ceoName: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>창립기념일</Label>
              <Input type="date" value={formData.foundationDate} onChange={(e) => setFormData({ ...formData, foundationDate: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>우편번호</Label>
              <Input value={formData.postalCode} onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })} />
            </div>
            <div className="space-y-2 col-span-4">
              <Label>주소</Label>
              <Input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>업태</Label>
              <Input value={formData.businessType} onChange={(e) => setFormData({ ...formData, businessType: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>업종</Label>
              <Input value={formData.industryType} onChange={(e) => setFormData({ ...formData, industryType: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>국가코드</Label>
              <Input value={formData.countryCode} onChange={(e) => setFormData({ ...formData, countryCode: e.target.value })} placeholder="대한민국" />
            </div>
            <div className="space-y-2">
              <Label>인도조건</Label>
              <Input value={formData.incoterms} onChange={(e) => setFormData({ ...formData, incoterms: e.target.value })} placeholder="도착도" />
            </div>

            {/* 연락처 정보 */}
            <div className="space-y-2">
              <Label>화폐단위</Label>
              <Select value={formData.currency} onValueChange={(v) => setFormData({ ...formData, currency: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="KRW">KRW</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>전화번호1</Label>
              <Input value={formData.contactPhone} onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>전화번호2</Label>
              <Input value={formData.phone2} onChange={(e) => setFormData({ ...formData, phone2: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>대표이메일</Label>
              <Input type="email" value={formData.contactEmail} onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })} />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>홈페이지 주소</Label>
              <Input value={formData.website} onChange={(e) => setFormData({ ...formData, website: e.target.value })} placeholder="https://" />
            </div>
            <div className="space-y-2">
              <Label>협력사담당자명</Label>
              <Input value={formData.contactPerson} onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>협력사담당자 연락처</Label>
              <Input value={formData.partnerContactPhone} onChange={(e) => setFormData({ ...formData, partnerContactPhone: e.target.value })} />
            </div>

            {/* 관리 정보 */}
            <div className="space-y-2">
              <Label>담당사원</Label>
              <Input value={formData.manager} onChange={(e) => setFormData({ ...formData, manager: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>적용시작일</Label>
              <Input type="date" value={formData.effectiveStartDate} onChange={(e) => setFormData({ ...formData, effectiveStartDate: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>적용완료일</Label>
              <Input type="date" value={formData.effectiveEndDate} onChange={(e) => setFormData({ ...formData, effectiveEndDate: e.target.value })} />
            </div>
            <div />
          </div>
          <DialogFooter>
            <ERPButton onClick={() => setDialogOpen(false)}>취소</ERPButton>
            <ERPButton variant="primary" onClick={handleSubmit}>저장</ERPButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 일괄 업로드 확인 다이얼로그 */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>일괄등록 데이터 확인</DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-auto">
            {uploadErrors.length > 0 && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm">
                <p className="font-medium text-red-700 mb-2">오류 목록:</p>
                <ul className="list-disc list-inside text-red-600">
                  {uploadErrors.map((err, i) => <li key={i}>{err}</li>)}
                </ul>
              </div>
            )}
            <p className="text-sm mb-2">{uploadData.length}건의 데이터가 파싱되었습니다.</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse min-w-[1200px]">
                <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    <th className="p-2 border whitespace-nowrap">거래처코드</th>
                    <th className="p-2 border whitespace-nowrap">거래처명</th>
                    <th className="p-2 border whitespace-nowrap">거래처그룹</th>
                    <th className="p-2 border whitespace-nowrap">사용여부</th>
                    <th className="p-2 border whitespace-nowrap">사업자번호</th>
                    <th className="p-2 border whitespace-nowrap">대표자명</th>
                    <th className="p-2 border whitespace-nowrap">국가코드</th>
                    <th className="p-2 border whitespace-nowrap">인도조건</th>
                    <th className="p-2 border whitespace-nowrap">화폐</th>
                    <th className="p-2 border whitespace-nowrap">협력사담당자</th>
                    <th className="p-2 border whitespace-nowrap">적용시작일</th>
                  </tr>
                </thead>
                <tbody>
                  {uploadData.slice(0, 20).map((row, i) => (
                    <tr key={i}>
                      <td className="p-2 border">{row.partnerCode}</td>
                      <td className="p-2 border">{row.partnerName}</td>
                      <td className="p-2 border">{row.partnerGroup || PARTNER_TYPE_LABELS[row.partnerType] || '-'}</td>
                      <td className="p-2 border">{row.isActive ? 'Y' : 'N'}</td>
                      <td className="p-2 border">{row.businessNumber || '-'}</td>
                      <td className="p-2 border">{row.ceoName || '-'}</td>
                      <td className="p-2 border">{row.countryCode || '-'}</td>
                      <td className="p-2 border">{row.incoterms || '-'}</td>
                      <td className="p-2 border">{row.currency}</td>
                      <td className="p-2 border">{row.contactPerson || '-'}</td>
                      <td className="p-2 border">{row.effectiveStartDate || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {uploadData.length > 20 && (
              <p className="text-sm text-gray-500 mt-2">... 외 {uploadData.length - 20}건</p>
            )}
          </div>
          <DialogFooter>
            <ERPButton onClick={() => { setUploadDialogOpen(false); setUploadData([]); setUploadErrors([]) }}>취소</ERPButton>
            <ERPButton variant="primary" onClick={handleUploadSave} disabled={uploading || uploadErrors.length > 0}>
              {uploading ? '저장 중...' : '저장'}
            </ERPButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
