export type PaymentType = 'PIX' | 'MONEY' | 'CREDIT_CARD' | 'DEBIT_CARD'

export type PaymentStatus = 'PENDING' | 'APPROVED' | 'CANCELED'

export type SaleInstallmentStatus = 'PENDING' | 'PAID' | 'UNPAID'

export type UserResponse = {
  id: number
  email: string
  privacyPolicyVersion: string
  privacyAcceptedAt?: string
  termsVersion: string
  termsAcceptedAt?: string
}

export type AuthRequest = {
  email: string
  password: string
}

export type DeleteOwnAccountRequest = {
  password: string
}

export type CreateUserRequest = AuthRequest & {
  acceptPrivacyPolicy: boolean
  acceptTerms: boolean
  privacyPolicyVersion: string
  termsVersion: string
}

export type CustomerResponse = {
  id: number
  name: string
  phone: string
}

export type CustomerRequest = Omit<CustomerResponse, 'id'>

export type DeleteCustomersResponse = {
  deleted: number
}

export type CustomerListItemResponse = CustomerResponse & {
  salesCount: number
  revenue: number
  profit: number
  averageTicket: number
}

export type CustomerListSummaryResponse = {
  totalCustomers: number
  salesCount: number
  revenue: number
  profit: number
  averageTicket: number
  repeatRate: number
}

export type CustomerListResponse = {
  items: CustomerListItemResponse[]
  page: number
  limit: number
  totalItems: number
  totalPages: number
  summary: CustomerListSummaryResponse
}

export type CustomerListParams = {
  page?: number
  limit?: number
  start?: string
  end?: string
  status?: PaymentStatus
  paymentType?: PaymentType
  search?: string
}

export type SaleItemResponse = {
  id: number
  saleId: number
  productName: string
  specs: string
  quantity: number
  costPrice: number
  salePrice: number
}

export type SaleResponse = {
  id: number
  customerId: number
  customerName: string
  totalValue: number
  paymentStatus: PaymentStatus
  paymentType: PaymentType
  saleDate: string
  installments?: number
  billingDay?: number
  items: SaleItemResponse[]
}

export type SaleListSummaryResponse = {
  revenue: number
  profit: number
  averageTicket: number
}

export type SaleListResponse = {
  items: SaleResponse[]
  page: number
  limit: number
  totalItems: number
  totalPages: number
  summary: SaleListSummaryResponse
}

export type SaleListParams = {
  page?: number
  limit?: number
  start?: string
  end?: string
  status?: PaymentStatus
  paymentType?: PaymentType
  customerId?: number
  search?: string
}

export type SaleItemRequest = {
  productName: string
  specs: string
  quantity: number
  costPrice: number
  salePrice: number
}

export type SaleRequest = {
  customerId: number
  paymentType: PaymentType
  paymentStatus: PaymentStatus
  saleDate?: string
  installments?: number
  billingDay?: number
  items: SaleItemRequest[]
}

export type SaleInstallmentResponse = {
  id: number
  saleId: number
  customerName: string
  dueDate: string
  amount: number
  installmentNumber: number
  totalInstallments: number
  status: SaleInstallmentStatus
  paidAt?: string
  validatedAt?: string
  notes?: string
  paidInstallments: number
  remainingInstallments: number
  createdAt: string
  updatedAt: string
}

export type DashboardMetricsResponse = {
  revenue: number
  profit: number
  profitMargin: number
  approvedSalesCount: number
  averageTicket: number
  itemsSold: number
  pendingSalesCount: number
  canceledSalesCount: number
}

export type FinancialMetricResponse = {
  period: string
  revenue?: number
  profit?: number
}

export type ProductMetricResponse = {
  productName: string
  quantity: number
  revenue: number
  profit: number
  salesCount: number
}

export type PaymentMetricResponse = {
  paymentType: PaymentType
  salesCount: number
  totalValue: number
}

export type CustomerMetricResponse = {
  customerId: number
  customerName: string
  salesCount: number
  revenue: number
  profit: number
}

export type StatusMetricResponse = {
  status: PaymentStatus
  salesCount: number
  totalValue: number
}

export type AnalyticsParams = {
  start?: string
  end?: string
  limit?: number
  status?: PaymentStatus
  paymentType?: PaymentType
  groupBy?: 'daily' | 'monthly'
}
