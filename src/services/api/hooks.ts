import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as analytics from './analytics'
import * as auth from './auth'
import * as customers from './customers'
import * as sales from './sales'
import type {
  AnalyticsParams,
  CustomerListParams,
  AuthRequest,
  CreateUserRequest,
  CustomerRequest,
  DeleteOwnAccountRequest,
  PaymentStatus,
  SaleInstallmentStatus,
  SaleListParams,
  SaleRequest,
} from './types'

export const queryKeys = {
  me: ['me'] as const,
  customers: ['customers'] as const,
  sales: ['sales'] as const,
  installmentAlerts: ['sales', 'installments', 'alerts'] as const,
  analytics: (name: string, params?: AnalyticsParams) => ['analytics', name, params ?? {}] as const,
}

export function useSignIn() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: AuthRequest) => auth.signIn(payload),
    onSuccess: (user) => {
      queryClient.setQueryData(queryKeys.me, user)
    },
  })
}

export function useSignOut() {
  return useMutation({ mutationFn: auth.signOut })
}

export function useDeleteOwnAccount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: DeleteOwnAccountRequest) => auth.deleteOwnAccount(payload),
    onSettled: () => queryClient.clear(),
  })
}

export function useCreateUser() {
  return useMutation({ mutationFn: (payload: CreateUserRequest) => auth.createUser(payload) })
}

export function useMe() {
  return useQuery({ queryKey: queryKeys.me, queryFn: auth.getMe, retry: false })
}

export function useDashboard(params?: AnalyticsParams) {
  return useQuery({
    queryKey: queryKeys.analytics('dashboard', params),
    queryFn: () => analytics.getDashboard(params),
  })
}

export function useRevenue(params?: AnalyticsParams) {
  return useQuery({
    queryKey: queryKeys.analytics('revenue', params),
    queryFn: () => analytics.getRevenue(params),
  })
}

export function useProfit(params?: AnalyticsParams) {
  return useQuery({
    queryKey: queryKeys.analytics('profit', params),
    queryFn: () => analytics.getProfit(params),
  })
}

export function useTopProducts(params?: AnalyticsParams) {
  return useQuery({
    queryKey: queryKeys.analytics('products-top', params),
    queryFn: () => analytics.getTopProducts(params),
  })
}

export function usePayments(params?: AnalyticsParams) {
  return useQuery({
    queryKey: queryKeys.analytics('payments', params),
    queryFn: () => analytics.getPayments(params),
  })
}

export function useTopCustomers(params?: AnalyticsParams) {
  return useQuery({
    queryKey: queryKeys.analytics('customers-top', params),
    queryFn: () => analytics.getTopCustomers(params),
  })
}

export function useStatuses(params?: AnalyticsParams) {
  return useQuery({
    queryKey: queryKeys.analytics('statuses', params),
    queryFn: () => analytics.getStatuses(params),
  })
}

export function useCustomers(params: CustomerListParams = {}) {
  return useQuery({
    queryKey: [...queryKeys.customers, params],
    queryFn: () => customers.listCustomers(params),
  })
}

export function useCreateCustomer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CustomerRequest) => customers.createCustomer(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customers })
      queryClient.invalidateQueries({ queryKey: ['analytics'] })
    },
  })
}

export function useCustomer(id: number) {
  return useQuery({
    queryKey: [...queryKeys.customers, id],
    queryFn: () => customers.getCustomer(id),
    enabled: Number.isFinite(id),
  })
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: CustomerRequest }) =>
      customers.updateCustomer(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customers })
      queryClient.invalidateQueries({ queryKey: ['analytics'] })
    },
  })
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => customers.deleteCustomer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customers })
      queryClient.invalidateQueries({ queryKey: ['analytics'] })
    },
  })
}

export function useDeleteCustomers() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (ids: number[]) => customers.deleteCustomers(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customers })
      queryClient.invalidateQueries({ queryKey: ['analytics'] })
    },
  })
}

export function useSales(params: SaleListParams = {}) {
  return useQuery({ queryKey: [...queryKeys.sales, params], queryFn: () => sales.listSales(params) })
}

export function useSale(id: number) {
  return useQuery({
    queryKey: [...queryKeys.sales, id],
    queryFn: () => sales.getSale(id),
    enabled: Number.isFinite(id),
  })
}

export function useCreateSale() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: SaleRequest) => sales.createSale(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sales })
      queryClient.invalidateQueries({ queryKey: queryKeys.installmentAlerts })
      queryClient.invalidateQueries({ queryKey: ['analytics'] })
    },
  })
}

export function useUpdateSaleStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: PaymentStatus }) =>
      sales.updateSaleStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sales })
      queryClient.invalidateQueries({ queryKey: queryKeys.installmentAlerts })
      queryClient.invalidateQueries({ queryKey: ['analytics'] })
    },
  })
}

export function useDeleteSale() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => sales.deleteSale(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sales })
      queryClient.invalidateQueries({ queryKey: queryKeys.installmentAlerts })
      queryClient.invalidateQueries({ queryKey: ['analytics'] })
    },
  })
}

export function useSalesByPeriod(start: string, end: string) {
  return useQuery({
    queryKey: [...queryKeys.sales, 'period', start, end],
    queryFn: () => sales.listSalesByPeriod(start, end),
    enabled: Boolean(start && end),
  })
}

export function useInstallmentAlerts() {
  return useQuery({ queryKey: queryKeys.installmentAlerts, queryFn: sales.listInstallmentAlerts })
}

export function useUpdateInstallmentStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      status,
      notes,
    }: {
      id: number
      status: Exclude<SaleInstallmentStatus, 'PENDING'>
      notes?: string
    }) => sales.updateInstallmentStatus(id, status, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.installmentAlerts })
      queryClient.invalidateQueries({ queryKey: queryKeys.sales })
      queryClient.invalidateQueries({ queryKey: ['analytics'] })
    },
  })
}
