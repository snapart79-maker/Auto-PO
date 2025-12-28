/**
 * E2E 테스트 데이터 픽스처
 */

export const testData = {
  // 제품 테스트 데이터
  product: {
    code: 'TEST-PROD-001',
    name: '테스트 제품',
    category: '전장 하네스',
    unit: 'EA',
    safetyStock: 100,
  },

  // 파트너 테스트 데이터
  partner: {
    code: 'TEST-PARTNER-001',
    name: '테스트 거래처',
    type: 'SUPPLIER',
    country: 'KR',
  },

  // 발주 테스트 데이터
  order: {
    partnerCode: 'TEST-PARTNER-001',
    status: 'DRAFT',
    items: [
      {
        productCode: 'TEST-PROD-001',
        quantity: 100,
        unitPrice: 1000,
      },
    ],
  },

  // 차종 테스트 데이터
  vehicleModel: {
    code: 'TEST-VM-001',
    name: '테스트 차종',
    manufacturer: '현대자동차',
  },

  // 환율 테스트 데이터
  exchangeRate: {
    currency: 'USD',
    rate: 1350.00,
    effectiveDate: new Date().toISOString().split('T')[0],
  },
}

export const routes = {
  dashboard: '/',
  company: '/company',
  vehicleModels: '/vehicle-models',
  partners: '/partners',
  products: '/products',
  exchangeRates: '/exchange-rates',
  uploadInventory: '/upload/inventory',
  uploadShipment: '/upload/shipment',
  mrp: '/mrp',
  vietnamOrder: '/mrp/vietnam',
  orders: '/orders',
}

export const labels = {
  navigation: {
    dashboard: '대시보드',
    company: '회사정보',
    vehicleModels: '차종관리',
    partners: '거래처관리',
    products: '제품관리',
    exchangeRates: '환율관리',
    uploadInventory: '입출고 업로드',
    uploadShipment: '출고계획 업로드',
    mrp: 'MRP 계산',
    vietnamOrder: '베트남 발주',
    orders: '발주관리',
  },
  sections: {
    dataUpload: '데이터 업로드',
    mrpManagement: 'MRP 관리',
    orderManagement: '발주 관리',
  },
}
