/**
 * PdfExporter
 * 발주서를 PDF 파일로 내보내기 (브라우저 기반)
 */

import type { PurchaseOrder } from '@domain/entities/PurchaseOrder'

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
    month: 'long',
    day: 'numeric',
  })
}

/**
 * 발주서 HTML 템플릿 생성
 */
export function generateOrderHtml(
  order: PurchaseOrder,
  partnerName: string,
  companyName = '경림테크(주)'
): string {
  const html = `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>발주서 - ${order.orderNumber}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif;
      font-size: 12px;
      line-height: 1.5;
      padding: 20mm;
      background: white;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      border-bottom: 2px solid #333;
      padding-bottom: 20px;
    }
    .header h1 {
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 10px;
    }
    .header .order-number {
      font-size: 14px;
      color: #666;
    }
    .company-info {
      display: flex;
      justify-content: space-between;
      margin-bottom: 30px;
    }
    .company-info .section {
      width: 48%;
    }
    .company-info h3 {
      font-size: 14px;
      font-weight: bold;
      margin-bottom: 10px;
      padding-bottom: 5px;
      border-bottom: 1px solid #ddd;
    }
    .info-row {
      display: flex;
      margin-bottom: 5px;
    }
    .info-label {
      width: 80px;
      font-weight: bold;
      color: #666;
    }
    .info-value {
      flex: 1;
    }
    .order-details {
      margin-bottom: 30px;
    }
    .order-details h3 {
      font-size: 14px;
      font-weight: bold;
      margin-bottom: 10px;
      padding-bottom: 5px;
      border-bottom: 1px solid #ddd;
    }
    .summary-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    .summary-table th,
    .summary-table td {
      padding: 10px;
      border: 1px solid #ddd;
      text-align: left;
    }
    .summary-table th {
      background-color: #f5f5f5;
      font-weight: bold;
    }
    .summary-table .amount {
      text-align: right;
    }
    .total-row {
      background-color: #f9f9f9;
      font-weight: bold;
    }
    .notes {
      margin-top: 30px;
      padding: 15px;
      background-color: #f9f9f9;
      border: 1px solid #ddd;
    }
    .notes h3 {
      font-size: 12px;
      font-weight: bold;
      margin-bottom: 10px;
    }
    .footer {
      margin-top: 50px;
      text-align: center;
      color: #999;
      font-size: 10px;
    }
    .status-badge {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: bold;
    }
    .status-draft { background: #e0e0e0; color: #666; }
    .status-confirmed { background: #bbdefb; color: #1565c0; }
    .status-sent { background: #c8e6c9; color: #2e7d32; }
    .status-completed { background: #a5d6a7; color: #1b5e20; }
    .status-cancelled { background: #ffcdd2; color: #c62828; }
    @media print {
      body {
        padding: 0;
      }
      .no-print {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>발 주 서</h1>
    <div class="order-number">${order.orderNumber}</div>
  </div>

  <div class="company-info">
    <div class="section">
      <h3>발주처</h3>
      <div class="info-row">
        <span class="info-label">회사명</span>
        <span class="info-value">${companyName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">발주일</span>
        <span class="info-value">${formatDate(order.orderDate)}</span>
      </div>
      <div class="info-row">
        <span class="info-label">납기일</span>
        <span class="info-value">${formatDate(order.dueDate)}</span>
      </div>
      ${order.shipmentDate ? `
      <div class="info-row">
        <span class="info-label">선적일</span>
        <span class="info-value">${formatDate(order.shipmentDate)}</span>
      </div>
      ` : ''}
    </div>
    <div class="section">
      <h3>공급처</h3>
      <div class="info-row">
        <span class="info-label">거래처</span>
        <span class="info-value">${partnerName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">발주유형</span>
        <span class="info-value">${ORDER_TYPE_LABELS[order.orderType] ?? order.orderType}</span>
      </div>
      <div class="info-row">
        <span class="info-label">상태</span>
        <span class="info-value">
          <span class="status-badge status-${order.status.value.toLowerCase()}">${ORDER_STATUS_LABELS[order.status.value] ?? order.status.value}</span>
        </span>
      </div>
    </div>
  </div>

  <div class="order-details">
    <h3>발주 요약</h3>
    <table class="summary-table">
      <thead>
        <tr>
          <th>항목</th>
          <th class="amount">내용</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>총 수량</td>
          <td class="amount">${order.totalQuantity?.toLocaleString() ?? '-'} 개</td>
        </tr>
        <tr>
          <td>총 금액</td>
          <td class="amount">${order.totalAmount?.format() ?? '-'}</td>
        </tr>
        ${order.exchangeRate ? `
        <tr>
          <td>적용 환율</td>
          <td class="amount">${order.exchangeRate.toLocaleString()} 원</td>
        </tr>
        ` : ''}
      </tbody>
    </table>
  </div>

  ${order.notes ? `
  <div class="notes">
    <h3>비고</h3>
    <p>${order.notes}</p>
  </div>
  ` : ''}

  <div class="footer">
    <p>본 발주서는 ${companyName}에서 발행되었습니다.</p>
    <p>발행일시: ${new Date().toLocaleString('ko-KR')}</p>
  </div>
</body>
</html>
`
  return html
}

/**
 * HTML을 새 창에서 열고 인쇄
 */
export function printOrderHtml(html: string): void {
  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    alert('팝업이 차단되었습니다. 팝업 차단을 해제해 주세요.')
    return
  }

  printWindow.document.write(html)
  printWindow.document.close()

  // 인쇄 다이얼로그
  printWindow.onload = () => {
    printWindow.focus()
    printWindow.print()
  }
}

/**
 * HTML을 Blob으로 변환하여 다운로드 (HTML 파일)
 */
export function downloadOrderHtml(html: string, filename: string): void {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename.endsWith('.html') ? filename : `${filename}.html`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * 발주서를 인쇄 (PDF로 저장 가능)
 */
export function printOrder(
  order: PurchaseOrder,
  partnerName: string,
  companyName?: string
): void {
  const html = generateOrderHtml(order, partnerName, companyName)
  printOrderHtml(html)
}

/**
 * 발주서를 HTML 파일로 다운로드
 */
export function downloadOrder(
  order: PurchaseOrder,
  partnerName: string,
  companyName?: string,
  filename?: string
): void {
  const html = generateOrderHtml(order, partnerName, companyName)
  const name = filename ?? `발주서_${order.orderNumber}`
  downloadOrderHtml(html, name)
}
