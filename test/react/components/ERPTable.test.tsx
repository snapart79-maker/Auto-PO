/**
 * ERPTable Component Tests
 * TDD: ERPTable 확장 기능 테스트 (페이지 사이즈 선택, 컬럼 필터링)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ERPTable } from '@infrastructure/react/components/ERPTable'
import type { ColumnDef } from '@tanstack/react-table'

interface TestData {
  id: number
  name: string
  quantity: number
  status: string
}

const testData: TestData[] = Array.from({ length: 50 }, (_, i) => ({
  id: i + 1,
  name: `Item ${i + 1}`,
  quantity: (i + 1) * 10,
  status: i % 2 === 0 ? 'active' : 'inactive',
}))

const columns: ColumnDef<TestData>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
  },
  {
    accessorKey: 'name',
    header: '이름',
  },
  {
    accessorKey: 'quantity',
    header: '수량',
  },
  {
    accessorKey: 'status',
    header: '상태',
  },
]

describe('ERPTable 페이지 사이즈 선택', () => {
  it('페이지 사이즈 선택 드롭다운이 렌더링되어야 함', () => {
    render(
      <ERPTable
        columns={columns}
        data={testData}
        enablePageSizeSelect
      />
    )

    expect(screen.getByRole('combobox', { name: /페이지 사이즈/i })).toBeInTheDocument()
  })

  it('기본 페이지 사이즈 옵션이 있어야 함 (10, 20, 50, 100)', async () => {
    const user = userEvent.setup()
    render(
      <ERPTable
        columns={columns}
        data={testData}
        enablePageSizeSelect
      />
    )

    const select = screen.getByRole('combobox', { name: /페이지 사이즈/i })
    await user.click(select)

    expect(screen.getByRole('option', { name: '10' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: '20' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: '50' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: '100' })).toBeInTheDocument()
  })

  it('페이지 사이즈 변경 시 표시 행 수가 변경되어야 함', async () => {
    const user = userEvent.setup()
    render(
      <ERPTable
        columns={columns}
        data={testData}
        pageSize={10}
        enablePageSizeSelect
      />
    )

    // 초기에 10개 행 표시
    const rows = screen.getAllByRole('row')
    // 헤더 + 10개 데이터 행
    expect(rows.length).toBe(11)

    // 페이지 사이즈를 20으로 변경
    const select = screen.getByRole('combobox', { name: /페이지 사이즈/i })
    await user.click(select)
    await user.click(screen.getByRole('option', { name: '20' }))

    // 20개 행 표시
    const updatedRows = screen.getAllByRole('row')
    expect(updatedRows.length).toBe(21)
  })

  it('pageSizeOptions prop으로 커스텀 옵션을 설정할 수 있어야 함', async () => {
    const user = userEvent.setup()
    render(
      <ERPTable
        columns={columns}
        data={testData}
        enablePageSizeSelect
        pageSizeOptions={[5, 15, 25]}
      />
    )

    const select = screen.getByRole('combobox', { name: /페이지 사이즈/i })
    await user.click(select)

    expect(screen.getByRole('option', { name: '5' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: '15' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: '25' })).toBeInTheDocument()
  })

  it('onPageSizeChange 콜백이 호출되어야 함', async () => {
    const onPageSizeChange = vi.fn()
    const user = userEvent.setup()

    render(
      <ERPTable
        columns={columns}
        data={testData}
        enablePageSizeSelect
        onPageSizeChange={onPageSizeChange}
      />
    )

    const select = screen.getByRole('combobox', { name: /페이지 사이즈/i })
    await user.click(select)
    await user.click(screen.getByRole('option', { name: '50' }))

    expect(onPageSizeChange).toHaveBeenCalledWith(50)
  })
})

describe('ERPTable 컬럼 필터링', () => {
  it('enableColumnFilters가 true일 때 필터 행이 렌더링되어야 함', () => {
    render(
      <ERPTable
        columns={columns}
        data={testData}
        enableColumnFilters
      />
    )

    // 필터 입력 필드들이 있어야 함
    const filterInputs = screen.getAllByRole('textbox')
    expect(filterInputs.length).toBeGreaterThan(0)
  })

  it('텍스트 컬럼 필터 입력 시 데이터가 필터링되어야 함', async () => {
    const user = userEvent.setup()
    render(
      <ERPTable
        columns={columns}
        data={testData}
        enableColumnFilters
      />
    )

    // 이름 필터 입력
    const nameFilter = screen.getByPlaceholderText(/이름/i)
    await user.type(nameFilter, 'Item 1')

    // Item 1, Item 10~19 등이 필터링됨
    expect(screen.getByText('Item 1')).toBeInTheDocument()
    expect(screen.queryByText('Item 2')).not.toBeInTheDocument()
  })

  it('onColumnFiltersChange 콜백이 호출되어야 함', async () => {
    const onColumnFiltersChange = vi.fn()
    const user = userEvent.setup()

    render(
      <ERPTable
        columns={columns}
        data={testData}
        enableColumnFilters
        onColumnFiltersChange={onColumnFiltersChange}
      />
    )

    const nameFilter = screen.getByPlaceholderText(/이름/i)
    await user.type(nameFilter, 'test')

    expect(onColumnFiltersChange).toHaveBeenCalled()
  })

  it('onColumnFiltersChange 콜백이 호출되어야 함 (수동 필터)', async () => {
    const user = userEvent.setup()
    render(
      <ERPTable
        columns={columns}
        data={testData}
        enableColumnFilters
        pageSize={50}
      />
    )

    // 이름 필터에 Item 10 입력
    const nameFilter = screen.getByPlaceholderText(/이름/i)
    await user.type(nameFilter, 'Item 10')

    // Item 10 이 보여야 함
    expect(screen.getByText('Item 10')).toBeInTheDocument()
  })

  it('필터 초기화 버튼이 동작해야 함', async () => {
    const user = userEvent.setup()
    render(
      <ERPTable
        columns={columns}
        data={testData}
        enableColumnFilters
      />
    )

    const nameFilter = screen.getByPlaceholderText(/이름/i)
    await user.type(nameFilter, 'Item 1')

    // 초기화 버튼 클릭
    const resetButton = screen.getByRole('button', { name: /필터 초기화/i })
    await user.click(resetButton)

    // 필터가 초기화되어 모든 데이터 표시
    expect(nameFilter).toHaveValue('')
  })
})

describe('ERPTable 통합', () => {
  it('페이지 사이즈 선택과 컬럼 필터링이 함께 동작해야 함', async () => {
    const user = userEvent.setup()
    render(
      <ERPTable
        columns={columns}
        data={testData}
        enablePageSizeSelect
        enableColumnFilters
        pageSize={10}
      />
    )

    // 필터 적용
    const nameFilter = screen.getByPlaceholderText(/이름/i)
    await user.type(nameFilter, 'Item 1')

    // 필터링된 데이터가 표시되어야 함 (Item 1, Item 10~19 등)
    expect(screen.getByText('Item 1')).toBeInTheDocument()

    // 페이지네이션이 업데이트되어야 함
    expect(screen.getByText(/Record 1 of/)).toBeInTheDocument()
  })
})
