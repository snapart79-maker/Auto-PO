/**
 * ExcelExporter
 * 발주서를 Excel 파일로 내보내기
 */

import * as XLSX from 'xlsx'
import type { PurchaseOrder } from '@domain/entities/PurchaseOrder'

export interface OrderExportRow {
  orderNumber: string
  orderDate: string
  dueDate: string
  shipmentDate?: string
  partnerName: string
  orderType: string
  status: string
  totalQuantity: number
  totalAmount: string
  currency: string
  notes?: string
}

const ORDER_STATUS_LABELS: Record<string, string> = {
  DRAFT: '초안',
  CONFIRMED: '확정',
  SENT: '발송',
  PARTIALLY_RECEIVED: '부분입고',
  COMPLETED: '완료',
  CANCELLED: '취소',
}

const ORDER_TYPE_LABELS: Record<string, string> = {
  DOMESTIC: '국내',
  VIETNAM: '베트남',
}

/**
 * 날짜를 문자열로 변환
 */
function formatDate(date: Date): string {
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

/**
 * 발주 데이터를 Excel 행으로 변환
 */
export function orderToExportRow(
  order: PurchaseOrder,
  partnerName: string
): OrderExportRow {
  return {
    orderNumber: order.orderNumber,
    orderDate: formatDate(order.orderDate),
    dueDate: formatDate(order.dueDate),
    shipmentDate: order.shipmentDate ? formatDate(order.shipmentDate) : undefined,
    partnerName,
    orderType: ORDER_TYPE_LABELS[order.orderType] ?? order.orderType,
    status: ORDER_STATUS_LABELS[order.status.value] ?? order.status.value,
    totalQuantity: order.totalQuantity ?? 0,
    totalAmount: order.totalAmount?.format() ?? '-',
    currency: order.totalAmount?.currency ?? 'KRW',
    notes: order.notes,
  }
}

/**
 * 발주 목록을 Excel 워크북으로 변환
 */
export function ordersToWorkbook(
  orders: PurchaseOrder[],
  getPartnerName: (partnerId: string) => string
): XLSX.WorkBook {
  const headers = [
    '발주번호',
    '거래처',
    '발주유형',
    '발주일',
    '납기일',
    '선적일',
    '수량',
    '금액',
    '통화',
    '상태',
    '비고',
  ]

  const rows = orders.map((order) => {
    const row = orderToExportRow(order, getPartnerName(order.partnerId))
    return [
      row.orderNumber,
      row.partnerName,
      row.orderType,
      row.orderDate,
      row.dueDate,
      row.shipmentDate ?? '',
      row.totalQuantity,
      row.totalAmount,
      row.currency,
      row.status,
      row.notes ?? '',
    ]
  })

  const data = [headers, ...rows]
  const workbook = XLSX.utils.book_new()

  // aoa_to_sheet로 워크시트 생성
  const ws = XLSX.utils.aoa_to_sheet(data)

  // 열 너비 설정
  ws['!cols'] = [
    { wch: 18 }, // 발주번호
    { wch: 20 }, // 거래처
    { wch: 10 }, // 발주유형
    { wch: 12 }, // 발주일
    { wch: 12 }, // 납기일
    { wch: 12 }, // 선적일
    { wch: 10 }, // 수량
    { wch: 15 }, // 금액
    { wch: 8 },  // 통화
    { wch: 10 }, // 상태
    { wch: 30 }, // 비고
  ]

  XLSX.utils.book_append_sheet(workbook, ws, '발주목록')

  return workbook
}

/**
 * 단일 발주를 상세 Excel로 변환
 */
export function orderDetailToWorkbook(
  order: PurchaseOrder,
  partnerName: string
): XLSX.WorkBook {
  const workbook = XLSX.utils.book_new()

  // 기본 정보 시트
  const infoData = [
    ['발주서'],
    [],
    ['발주번호', order.orderNumber],
    ['거래처', partnerName],
    ['발주유형', ORDER_TYPE_LABELS[order.orderType] ?? order.orderType],
    ['발주일', formatDate(order.orderDate)],
    ['납기일', formatDate(order.dueDate)],
    ...(order.shipmentDate ? [['선적일', formatDate(order.shipmentDate)]] : []),
    [],
    ['수량', order.totalQuantity ?? 0],
    ['금액', order.totalAmount?.format() ?? '-'],
    ['환율', order.exchangeRate ?? '-'],
    [],
    ['상태', ORDER_STATUS_LABELS[order.status.value] ?? order.status.value],
    ['비고', order.notes ?? '-'],
  ]

  const infoSheet = XLSX.utils.aoa_to_sheet(infoData)
  infoSheet['!cols'] = [{ wch: 15 }, { wch: 30 }]
  XLSX.utils.book_append_sheet(workbook, infoSheet, '발주정보')

  return workbook
}

/**
 * Excel 워크북을 ArrayBuffer로 변환
 */
export function workbookToArrayBuffer(workbook: XLSX.WorkBook): ArrayBuffer {
  const output = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
  return output
}

/**
 * ArrayBuffer를 다운로드
 */
export function downloadExcel(buffer: ArrayBuffer, filename: string): void {
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * 발주 목록을 Excel 파일로 다운로드
 */
export function exportOrdersToExcel(
  orders: PurchaseOrder[],
  getPartnerName: (partnerId: string) => string,
  filename = '발주목록'
): void {
  const workbook = ordersToWorkbook(orders, getPartnerName)
  const buffer = workbookToArrayBuffer(workbook)
  downloadExcel(buffer, filename)
}

/**
 * 단일 발주를 Excel 파일로 다운로드
 */
export function exportOrderToExcel(
  order: PurchaseOrder,
  partnerName: string,
  filename?: string
): void {
  const workbook = orderDetailToWorkbook(order, partnerName)
  const buffer = workbookToArrayBuffer(workbook)
  const name = filename ?? `발주서_${order.orderNumber}`
  downloadExcel(buffer, name)
}
