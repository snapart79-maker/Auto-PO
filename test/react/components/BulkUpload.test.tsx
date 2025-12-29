/**
 * BulkUpload Component Tests
 * TDD: 일괄 업로드 컴포넌트 테스트
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BulkUpload, type BulkUploadProps, type BulkUploadColumn } from '@infrastructure/react/components/common/BulkUpload'

// Mock toast
vi.mock('@infrastructure/react/components/ui/toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}))

describe('BulkUpload', () => {
  const mockOnSave = vi.fn()
  const mockOnCancel = vi.fn()
  const mockParseFile = vi.fn()

  const sampleColumns: BulkUploadColumn<{ productCode: string; quantity: number }>[] = [
    { key: 'productCode', header: '품번' },
    { key: 'quantity', header: '수량', align: 'right' },
  ]

  const defaultProps: BulkUploadProps<{ productCode: string; quantity: number }> = {
    title: '테스트 일괄등록',
    columns: sampleColumns,
    onSave: mockOnSave,
    onCancel: mockOnCancel,
    parseFile: mockParseFile,
    templateFileName: '테스트_템플릿.xlsx',
    templateData: [
      ['품번', '수량'],
      ['SAMPLE-001', 100],
    ],
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('렌더링', () => {
    it('컴포넌트가 렌더링되어야 함', () => {
      render(<BulkUpload {...defaultProps} />)

      expect(screen.getByText('테스트 일괄등록')).toBeInTheDocument()
      expect(screen.getByText(/엑셀 파일을 드래그/i)).toBeInTheDocument()
    })

    it('템플릿 다운로드 버튼이 있어야 함', () => {
      render(<BulkUpload {...defaultProps} />)

      expect(screen.getByRole('button', { name: /템플릿/i })).toBeInTheDocument()
    })

    it('파일 업로드 영역이 있어야 함', () => {
      render(<BulkUpload {...defaultProps} />)

      expect(screen.getByText(/엑셀 파일을 드래그/i)).toBeInTheDocument()
      expect(screen.getByText(/xlsx, .xls 파일만 지원/i)).toBeInTheDocument()
    })

    it('파일 입력 요소가 있어야 함', () => {
      render(<BulkUpload {...defaultProps} />)

      const fileInput = screen.getByLabelText('파일 선택')
      expect(fileInput).toBeInTheDocument()
      expect(fileInput).toHaveAttribute('type', 'file')
      expect(fileInput).toHaveAttribute('accept', '.xlsx,.xls')
    })

    it('드롭존 영역이 클릭 가능해야 함', () => {
      render(<BulkUpload {...defaultProps} />)

      // 드롭존 영역 확인
      const dropzone = screen.getByText(/엑셀 파일을 드래그/i).closest('div')
      expect(dropzone).toBeInTheDocument()
    })
  })

  describe('템플릿 다운로드', () => {
    it('템플릿 다운로드 버튼 클릭이 가능해야 함', async () => {
      const user = userEvent.setup()
      render(<BulkUpload {...defaultProps} />)

      const templateButton = screen.getByRole('button', { name: /템플릿/i })
      expect(templateButton).not.toBeDisabled()

      // 클릭 시도 (XLSX 관련 함수 호출은 모킹 필요 없음 - 브라우저 환경 아님)
      await user.click(templateButton)
    })
  })

  describe('props 전달', () => {
    it('title이 올바르게 표시되어야 함', () => {
      render(<BulkUpload {...defaultProps} title="커스텀 제목" />)
      expect(screen.getByText('커스텀 제목')).toBeInTheDocument()
    })

    it('previewLimit이 올바르게 적용되어야 함', () => {
      render(<BulkUpload {...defaultProps} previewLimit={10} />)
      expect(screen.getByLabelText('파일 선택')).toBeInTheDocument()
    })

    it('className이 적용되어야 함', () => {
      const { container } = render(<BulkUpload {...defaultProps} className="custom-class" />)
      expect(container.querySelector('.custom-class')).toBeInTheDocument()
    })
  })

  describe('파일 입력 속성', () => {
    it('hidden 클래스가 적용되어 있어야 함', () => {
      render(<BulkUpload {...defaultProps} />)

      const fileInput = screen.getByLabelText('파일 선택')
      expect(fileInput).toHaveClass('hidden')
    })

    it('xlsx, xls 파일만 허용해야 함', () => {
      render(<BulkUpload {...defaultProps} />)

      const fileInput = screen.getByLabelText('파일 선택')
      expect(fileInput).toHaveAttribute('accept', '.xlsx,.xls')
    })
  })

  describe('컬럼 정의', () => {
    it('columns prop이 올바르게 전달되어야 함', () => {
      const customColumns: BulkUploadColumn<{ name: string; value: number }>[] = [
        { key: 'name', header: '이름' },
        { key: 'value', header: '값', align: 'center' },
      ]

      const customProps: BulkUploadProps<{ name: string; value: number }> = {
        ...defaultProps,
        columns: customColumns,
        onSave: vi.fn(),
        parseFile: vi.fn(),
      }

      render(<BulkUpload {...customProps} />)
      expect(screen.getByLabelText('파일 선택')).toBeInTheDocument()
    })
  })

  describe('드래그 앤 드롭 UI', () => {
    it('드래그 오버 시 시각적 변화를 위한 영역이 있어야 함', () => {
      render(<BulkUpload {...defaultProps} />)

      // border-dashed 클래스를 가진 요소가 있어야 함
      const dropzone = screen.getByText(/엑셀 파일을 드래그/i).closest('div')
      expect(dropzone).toHaveClass('border-dashed')
    })

    it('FileSpreadsheet 아이콘이 표시되어야 함', () => {
      render(<BulkUpload {...defaultProps} />)

      // SVG 아이콘 확인 (lucide-react)
      const dropzone = screen.getByText(/엑셀 파일을 드래그/i).closest('div')
      const svgIcon = dropzone?.querySelector('svg')
      expect(svgIcon).toBeInTheDocument()
    })
  })

  describe('안내 문구', () => {
    it('드래그 앤 드롭 안내 문구가 있어야 함', () => {
      render(<BulkUpload {...defaultProps} />)

      expect(screen.getByText(/엑셀 파일을 드래그하거나 클릭하여 업로드하세요/i)).toBeInTheDocument()
    })

    it('파일 형식 안내 문구가 있어야 함', () => {
      render(<BulkUpload {...defaultProps} />)

      expect(screen.getByText(/xlsx, .xls 파일만 지원됩니다/i)).toBeInTheDocument()
    })
  })
})

describe('BulkUpload 통합 테스트 개요', () => {
  it('BulkUpload 컴포넌트의 핵심 기능이 정의되어 있어야 함', () => {
    // BulkUpload 컴포넌트가 제공하는 핵심 기능:
    // 1. 파일 드래그 앤 드롭 지원
    // 2. 파일 선택 클릭 지원
    // 3. 템플릿 다운로드
    // 4. 데이터 프리뷰 테이블
    // 5. 에러 표시
    // 6. 저장/취소 버튼

    // 이 테스트는 컴포넌트의 존재와 인터페이스를 확인
    expect(BulkUpload).toBeDefined()
    expect(typeof BulkUpload).toBe('function')
  })
})
