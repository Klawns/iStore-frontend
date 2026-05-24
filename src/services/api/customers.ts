import { api } from './client'
import type { CustomerListParams, CustomerListResponse, CustomerRequest, CustomerResponse } from './types'

function cleanParams(params: CustomerListParams) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== ''),
  )
}

export async function listCustomers(params: CustomerListParams = {}) {
  const { data } = await api.get<CustomerListResponse>('/customers', {
    params: cleanParams(params),
  })
  return data
}

export async function createCustomer(payload: CustomerRequest) {
  const { data } = await api.post<CustomerResponse>('/customers', payload)
  return data
}

export async function getCustomer(id: number) {
  const { data } = await api.get<CustomerResponse>(`/customers/${id}`)
  return data
}

export async function updateCustomer(id: number, payload: CustomerRequest) {
  const { data } = await api.put<CustomerResponse>(`/customers/${id}`, payload)
  return data
}

export async function deleteCustomer(id: number) {
  await api.delete(`/customers/${id}`)
}
