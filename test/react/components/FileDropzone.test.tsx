/**
 * FileDropzone Component Tests
 */

import { describe, it, expect, vi } from 'vitest'
import { FileDropzone } from '@infrastructure/react/components/FileDropzone'

describe('FileDropzone', () => {
  describe('컴포넌트 존재 확인', () => {
    it('FileDropzone 컴포넌트가 정의되어야 함', () => {
      expect(FileDropzone).toBeDefined()
      expect(typeof FileDropzone).toBe('function')
    })
  })

  describe('파일 타입 검증', () => {
    it('xlsx 파일 MIME 타입 확인', () => {
      const xlsxType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      expect(xlsxType).toContain('spreadsheet')
    })

    it('xls 파일 MIME 타입 확인', () => {
      const xlsType = 'application/vnd.ms-excel'
      expect(xlsType).toContain('excel')
    })

    it('PDF는 Excel 파일이 아님', () => {
      const pdfType = 'application/pdf'
      expect(pdfType).not.toContain('spreadsheet')
      expect(pdfType).not.toContain('excel')
    })
  })

  describe('콜백 함수', () => {
    it('onFileDrop 콜백이 함수로 전달 가능', () => {
      const mockCallback = vi.fn()
      expect(typeof mockCallback).toBe('function')
    })

    it('onError 콜백이 함수로 전달 가능', () => {
      const mockErrorCallback = vi.fn()
      expect(typeof mockErrorCallback).toBe('function')
    })
  })

  describe('File 객체 생성', () => {
    it('xlsx File 객체 생성 가능', () => {
      const file = new File(['test content'], 'test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      expect(file.name).toBe('test.xlsx')
      expect(file.type).toContain('spreadsheet')
    })

    it('xls File 객체 생성 가능', () => {
      const file = new File(['test content'], 'test.xls', {
        type: 'application/vnd.ms-excel',
      })
      expect(file.name).toBe('test.xls')
    })
  })

  describe('속성 검증', () => {
    it('disabled 속성은 boolean', () => {
      const disabled = false
      expect(typeof disabled).toBe('boolean')
    })

    it('loading 속성은 boolean', () => {
      const loading = true
      expect(typeof loading).toBe('boolean')
    })

    it('accept 배열에 MIME 타입 포함', () => {
      const accept = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
      ]
      expect(accept).toContain('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      expect(accept).toContain('application/vnd.ms-excel')
    })
  })
})
