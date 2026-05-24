import { api } from './client'
import type {
  AnalyticsParams,
  CustomerMetricResponse,
  DashboardMetricsResponse,
  FinancialMetricResponse,
  PaymentMetricResponse,
  ProductMetricResponse,
  StatusMetricResponse,
} from './types'

export async function getDashboard(params?: AnalyticsParams) {
  const { data } = await api.get<DashboardMetricsResponse>('/analytics/dashboard', { params })
  return data
}

export async function getRevenue(params?: AnalyticsParams) {
  const { data } = await api.get<FinancialMetricResponse[]>('/analytics/revenue', { params })
  return data
}

export async function getProfit(params?: AnalyticsParams) {
  const { data } = await api.get<FinancialMetricResponse[]>('/analytics/profit', { params })
  return data
}

export async function getTopProducts(params?: AnalyticsParams) {
  const { data } = await api.get<ProductMetricResponse[]>('/analytics/products/top', { params })
  return data
}

export async function getPayments(params?: AnalyticsParams) {
  const { data } = await api.get<PaymentMetricResponse[]>('/analytics/payments', { params })
  return data
}

export async function getTopCustomers(params?: AnalyticsParams) {
  const { data } = await api.get<CustomerMetricResponse[]>('/analytics/customers/top', { params })
  return data
}

export async function getStatuses(params?: AnalyticsParams) {
  const { data } = await api.get<StatusMetricResponse[]>('/analytics/statuses', { params })
  return data
}

