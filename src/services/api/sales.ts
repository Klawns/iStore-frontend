import { api } from './client'
import type {
  PaymentStatus,
  SaleInstallmentResponse,
  SaleInstallmentStatus,
  SaleListParams,
  SaleListResponse,
  SaleRequest,
  SaleResponse,
} from './types'

function cleanParams(params: SaleListParams) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== ''),
  )
}

export async function listSales(params: SaleListParams = {}) {
  const { data } = await api.get<SaleListResponse>('/sales', { params: cleanParams(params) })
  return data
}

export async function getSale(id: number) {
  const { data } = await api.get<SaleResponse>(`/sales/${id}`)
  return data
}

export async function createSale(payload: SaleRequest) {
  const { data } = await api.post<SaleResponse>('/sales', payload)
  return data
}

export async function updateSaleStatus(id: number, status: PaymentStatus) {
  await api.patch(`/sales/${id}/status`, { status })
}

export async function deleteSale(id: number) {
  await api.delete(`/sales/${id}`)
}

export async function listSalesByPeriod(start: string, end: string) {
  const { data } = await api.get<SaleResponse[]>('/sales/period', { params: { start, end } })
  return data
}

export async function listInstallmentAlerts() {
  const { data } = await api.get<SaleInstallmentResponse[]>('/sales/installments/alerts')
  return data
}

export async function listSaleInstallments(saleId: number) {
  const { data } = await api.get<SaleInstallmentResponse[]>(`/sales/${saleId}/installments`)
  return data
}

export async function updateInstallmentStatus(
  id: number,
  status: Exclude<SaleInstallmentStatus, 'PENDING'>,
  notes?: string,
) {
  const { data } = await api.patch<SaleInstallmentResponse>(`/sales/installments/${id}/status`, {
    status,
    notes,
  })
  return data
}
