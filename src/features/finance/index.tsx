import { useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  useDashboard,
  useInstallmentAlerts,
  usePayments,
  useProfit,
  useRevenue,
  useTopCustomers,
  useTopProducts,
  useUpdateInstallmentStatus,
} from '../../services/api/hooks'
import type {
  CustomerMetricResponse,
  DashboardMetricsResponse,
  PaymentStatus,
  PaymentType,
  ProductMetricResponse,
  SaleInstallmentResponse,
  SaleInstallmentStatus,
} from '../../services/api/types'

type FinanceMetricData = {
  label: string
  value: string
  icon: string
  tone: 'blue' | 'green' | 'violet' | 'amber' | 'red'
}

type FinanceMonthlyPoint = {
  month: string
  revenue: number
  profit: number
}

type PaymentMethodShare = {
  method: string
  salesCount: number
  totalValue: number
  color: string
}

type AlertGroup = {
  title: string
  description: string
  installments: SaleInstallmentResponse[]
  tone: 'red' | 'amber' | 'blue' | 'violet'
}

type FinanceFilterState = {
  start: string
  end: string
  status: '' | PaymentStatus
  paymentType: '' | PaymentType
}

const emptyFilters: FinanceFilterState = {
  start: '',
  end: '',
  status: '',
  paymentType: '',
}

const statusOptions = [
  { value: 'APPROVED', label: 'Aprovada' },
  { value: 'PENDING', label: 'Pendente' },
  { value: 'CANCELED', label: 'Cancelada' },
] satisfies { value: PaymentStatus; label: string }[]

const paymentOptions = [
  { value: 'PIX', label: 'PIX' },
  { value: 'MONEY', label: 'Dinheiro' },
  { value: 'CREDIT_CARD', label: 'Credito' },
  { value: 'DEBIT_CARD', label: 'Debito' },
] satisfies { value: PaymentType; label: string }[]

const metricToneClasses: Record<FinanceMetricData['tone'], string> = {
  blue: 'bg-[#eaf1ff] text-[#0050cb]',
  green: 'bg-[#eaf8ef] text-[#0b7a3b]',
  violet: 'bg-[#eeeeff] text-[#4648d4]',
  amber: 'bg-[#fff3df] text-[#9a5200]',
  red: 'bg-[#fff0f0] text-[#b42318]',
}

const alertToneClasses: Record<AlertGroup['tone'], string> = {
  red: 'border-[#ffd2d2] bg-[#fff7f7] text-[#b42318]',
  amber: 'border-[#ffe1b3] bg-[#fffbf4] text-[#9a5200]',
  blue: 'border-[#d4e2ff] bg-[#f7faff] text-[#0050cb]',
  violet: 'border-[#ddddff] bg-[#f8f8ff] text-[#4648d4]',
}

function currency(valueInCents: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valueInCents / 100)
}

function percentLabel(value: number) {
  return `${value.toFixed(1).replace('.', ',')}%`
}

function numberLabel(value: number) {
  return new Intl.NumberFormat('pt-BR').format(value)
}

function compactCurrency(valueInCents: number) {
  return new Intl.NumberFormat('pt-BR', {
    maximumFractionDigits: 0,
    notation: 'compact',
  }).format(valueInCents / 100)
}

function monthLabel(period: string) {
  const date = new Date(`${period.length === 7 ? `${period}-01` : period}T12:00:00`)

  if (Number.isNaN(date.getTime())) {
    return period
  }

  return new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(date)
}

function dateLabel(date: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${date}T12:00:00`))
}

function paymentMethodLabel(method: string) {
  const labels: Record<string, string> = {
    PIX: 'PIX',
    MONEY: 'Dinheiro',
    CREDIT_CARD: 'Cartao credito',
    DEBIT_CARD: 'Cartao debito',
  }

  return labels[method] ?? method
}

function buildFinanceMetrics(data: DashboardMetricsResponse): FinanceMetricData[] {
  const totalSales = data.approvedSalesCount + data.pendingSalesCount + data.canceledSalesCount
  const pendingRate = totalSales > 0 ? (data.pendingSalesCount / totalSales) * 100 : 0
  const canceledRate = totalSales > 0 ? (data.canceledSalesCount / totalSales) * 100 : 0

  return [
    {
      label: 'Faturamento',
      value: currency(data.revenue),
      icon: 'trending_up',
      tone: 'green',
    },
    {
      label: 'Lucro Estimado',
      value: currency(data.profit),
      icon: 'account_balance_wallet',
      tone: 'blue',
    },
    {
      label: 'Custo dos Itens',
      value: currency(Math.max(data.revenue - data.profit, 0)),
      icon: 'inventory_2',
      tone: 'amber',
    },
    {
      label: 'Ticket Medio',
      value: currency(Math.round(data.averageTicket)),
      icon: 'receipt_long',
      tone: 'violet',
    },
    {
      label: 'Margem de Lucro',
      value: percentLabel(data.profitMargin),
      icon: 'percent',
      tone: data.profitMargin < 20 && totalSales > 0 ? 'red' : 'green',
    },
    {
      label: 'Itens Vendidos',
      value: numberLabel(data.itemsSold),
      icon: 'inventory',
      tone: 'blue',
    },
    {
      label: 'Taxa de Pendencia',
      value: percentLabel(pendingRate),
      icon: 'pending_actions',
      tone: pendingRate >= 20 ? 'amber' : 'violet',
    },
    {
      label: 'Taxa de Cancelamento',
      value: percentLabel(canceledRate),
      icon: 'cancel',
      tone: canceledRate > 0 ? 'red' : 'green',
    },
  ]
}

function sameLocalDate(date: Date, other: Date) {
  return (
    date.getFullYear() === other.getFullYear() &&
    date.getMonth() === other.getMonth() &&
    date.getDate() === other.getDate()
  )
}

function installmentDueDate(installment: SaleInstallmentResponse) {
  return new Date(`${installment.dueDate.slice(0, 10)}T12:00:00`)
}

function groupInstallments(installments: SaleInstallmentResponse[]): AlertGroup[] {
  const today = new Date()
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const overdue: SaleInstallmentResponse[] = []
  const dueToday: SaleInstallmentResponse[] = []
  const upcoming: SaleInstallmentResponse[] = []
  const unpaid: SaleInstallmentResponse[] = []

  installments.forEach((installment) => {
    if (installment.status === 'UNPAID') {
      unpaid.push(installment)
      return
    }

    const dueDate = installmentDueDate(installment)

    if (Number.isNaN(dueDate.getTime())) {
      upcoming.push(installment)
      return
    }

    if (dueDate < startOfToday) {
      overdue.push(installment)
      return
    }

    if (sameLocalDate(dueDate, today)) {
      dueToday.push(installment)
      return
    }

    upcoming.push(installment)
  })

  return [
    {
      title: 'Vencem hoje',
      description: 'Precisam de validacao',
      installments: dueToday,
      tone: 'amber',
    },
    {
      title: 'Vencidas',
      description: 'Pendentes em atraso',
      installments: overdue,
      tone: 'red',
    },
    {
      title: 'Proximos',
      description: 'Proximos 7 dias',
      installments: upcoming,
      tone: 'blue',
    },
    {
      title: 'Nao pagas',
      description: 'Marcadas como inadimplentes',
      installments: unpaid,
      tone: 'violet',
    },
  ]
}

function SectionState({
  isLoading,
  isError,
  empty,
  emptyMessage,
  children,
}: {
  isLoading: boolean
  isError: boolean
  empty: boolean
  emptyMessage: string
  children: React.ReactNode
}) {
  if (isLoading) {
    return <div className="px-5 py-8 text-center text-sm text-[#727687]">Carregando...</div>
  }

  if (isError) {
    return (
      <div className="px-5 py-8 text-center text-sm font-medium text-[#8f1111]">
        Nao foi possivel carregar esta secao.
      </div>
    )
  }

  if (empty) {
    return <div className="px-5 py-8 text-center text-sm text-[#727687]">{emptyMessage}</div>
  }

  return children
}

function FinanceMetricCard({ metric }: { metric: FinanceMetricData }) {
  return (
    <article className="rounded-xl border border-[#dfe4f5] bg-white p-5 shadow-[0_1px_3px_rgba(20,27,43,0.05)]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.05em] text-[#727687]">
            {metric.label}
          </p>
          <p className="mt-3 font-[Geist,Inter,sans-serif] text-2xl font-semibold leading-8 text-[#141b2b]">
            {metric.value}
          </p>
        </div>
        <div
          className={`grid size-11 shrink-0 place-items-center rounded-lg ${metricToneClasses[metric.tone]}`}
        >
          <span className="material-symbols-rounded text-[24px]" aria-hidden="true">
            {metric.icon}
          </span>
        </div>
      </div>
    </article>
  )
}

function MonthlyChart({
  data,
  isLoading,
  isError,
}: {
  data: FinanceMonthlyPoint[]
  isLoading: boolean
  isError: boolean
}) {
  return (
    <section className="rounded-xl border border-[#dfe4f5] bg-white shadow-[0_1px_3px_rgba(20,27,43,0.05)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#edf0fa] px-5 py-4">
        <div>
          <h2 className="font-[Geist,Inter,sans-serif] text-lg font-semibold text-[#141b2b]">
            Faturamento x Lucro
          </h2>
          <p className="mt-1 text-sm text-[#727687]">Resumo mensal</p>
        </div>
        <div className="flex gap-3 text-xs font-semibold text-[#727687]">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-[#0050cb]" />
            Faturamento
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-[#0b7a3b]" />
            Lucro
          </span>
        </div>
      </div>

      <div className="h-[320px] px-2 py-5 sm:px-5">
        <SectionState
          empty={data.length === 0}
          emptyMessage="Nenhuma serie mensal encontrada."
          isError={isError}
          isLoading={isLoading}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
              <CartesianGrid stroke="#edf0fa" vertical={false} />
              <XAxis
                axisLine={false}
                dataKey="month"
                tick={{ fill: '#727687', fontSize: 12 }}
                tickLine={false}
              />
              <YAxis
                axisLine={false}
                tick={{ fill: '#727687', fontSize: 12 }}
                tickFormatter={compactCurrency}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: '#f4f6fb' }}
                formatter={(value) => currency(Number(value))}
                labelStyle={{ color: '#141b2b', fontWeight: 600 }}
                contentStyle={{
                  border: '1px solid #dfe4f5',
                  borderRadius: 8,
                  boxShadow: '0 8px 20px rgba(20,27,43,0.08)',
                }}
              />
              <Bar dataKey="revenue" fill="#0050cb" name="Faturamento" radius={[6, 6, 0, 0]} />
              <Bar dataKey="profit" fill="#0b7a3b" name="Lucro" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </SectionState>
      </div>
    </section>
  )
}

function PaymentMethodsCard({
  methods,
  isLoading,
  isError,
}: {
  methods: PaymentMethodShare[]
  isLoading: boolean
  isError: boolean
}) {
  const totalAmount = methods.reduce((sum, item) => sum + item.totalValue, 0)

  return (
    <section className="rounded-xl border border-[#dfe4f5] bg-white shadow-[0_1px_3px_rgba(20,27,43,0.05)]">
      <div className="border-b border-[#edf0fa] px-5 py-4">
        <h2 className="font-[Geist,Inter,sans-serif] text-lg font-semibold text-[#141b2b]">
          Meios de Pagamento
        </h2>
        <p className="mt-1 text-sm text-[#727687]">Distribuicao por valor aprovado</p>
      </div>

      <div className="px-5 py-5">
        <SectionState
          empty={methods.length === 0}
          emptyMessage="Nenhum meio de pagamento encontrado."
          isError={isError}
          isLoading={isLoading}
        >
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  cx="50%"
                  cy="50%"
                  data={methods}
                  dataKey="totalValue"
                  innerRadius={58}
                  outerRadius={86}
                  paddingAngle={3}
                  stroke="none"
                >
                  {methods.map((item) => (
                    <Cell key={item.method} fill={item.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => currency(Number(value))}
                  contentStyle={{
                    border: '1px solid #dfe4f5',
                    borderRadius: 8,
                    boxShadow: '0 8px 20px rgba(20,27,43,0.08)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-3">
            {methods.map((item) => {
              const percent = totalAmount > 0 ? Math.round((item.totalValue / totalAmount) * 100) : 0

              return (
                <div key={item.method} className="flex items-center justify-between gap-3 text-sm">
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ background: item.color }}
                    />
                    <span className="truncate font-medium text-[#424656]">{item.method}</span>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="font-[Geist,Inter,sans-serif] font-semibold text-[#141b2b]">
                      {percent}%
                    </span>
                    <span className="ml-2 text-[#727687]">{currency(item.totalValue)}</span>
                    <span className="ml-2 text-[#727687]">
                      {numberLabel(item.salesCount)} vendas
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </SectionState>
      </div>
    </section>
  )
}

function FinancialSupportLists({
  products,
  customers,
  productsLoading,
  productsError,
  customersLoading,
  customersError,
}: {
  products: ProductMetricResponse[]
  customers: CustomerMetricResponse[]
  productsLoading: boolean
  productsError: boolean
  customersLoading: boolean
  customersError: boolean
}) {
  return (
    <section className="grid gap-6 xl:grid-cols-2">
      <FinanceListCard
        title="Produtos mais rentaveis"
        description="Receita, lucro e concentracao por produto"
        isLoading={productsLoading}
        isError={productsError}
        empty={products.length === 0}
        emptyMessage="Nenhum produto encontrado."
      >
        <div className="divide-y divide-[#edf0fa]">
          {products.map((product) => (
            <div
              key={`${product.productName}-${product.salesCount}`}
              className="grid gap-3 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_auto]"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-[#141b2b]">{product.productName}</p>
                <p className="mt-1 text-sm text-[#727687]">
                  {numberLabel(product.quantity)} un. em {numberLabel(product.salesCount)} vendas
                </p>
              </div>
              <div className="text-left sm:text-right">
                <p className="font-[Geist,Inter,sans-serif] font-semibold text-[#141b2b]">
                  {currency(product.revenue)}
                </p>
                <p className="mt-1 text-sm text-[#0b7a3b]">{currency(product.profit)} lucro</p>
              </div>
            </div>
          ))}
        </div>
      </FinanceListCard>

      <FinanceListCard
        title="Clientes com maior faturamento"
        description="Receita e lucro concentrados por cliente"
        isLoading={customersLoading}
        isError={customersError}
        empty={customers.length === 0}
        emptyMessage="Nenhum cliente encontrado."
      >
        <div className="divide-y divide-[#edf0fa]">
          {customers.map((customer) => (
            <div
              key={`${customer.customerName}-${customer.salesCount}`}
              className="grid gap-3 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_auto]"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-[#141b2b]">{customer.customerName}</p>
                <p className="mt-1 text-sm text-[#727687]">
                  {numberLabel(customer.salesCount)} vendas
                </p>
              </div>
              <div className="text-left sm:text-right">
                <p className="font-[Geist,Inter,sans-serif] font-semibold text-[#141b2b]">
                  {currency(customer.revenue)}
                </p>
                <p className="mt-1 text-sm text-[#0b7a3b]">{currency(customer.profit)} lucro</p>
              </div>
            </div>
          ))}
        </div>
      </FinanceListCard>
    </section>
  )
}

function FinanceListCard({
  title,
  description,
  isLoading,
  isError,
  empty,
  emptyMessage,
  children,
}: {
  title: string
  description: string
  isLoading: boolean
  isError: boolean
  empty: boolean
  emptyMessage: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-xl border border-[#dfe4f5] bg-white shadow-[0_1px_3px_rgba(20,27,43,0.05)]">
      <div className="border-b border-[#edf0fa] px-5 py-4">
        <h2 className="font-[Geist,Inter,sans-serif] text-lg font-semibold text-[#141b2b]">
          {title}
        </h2>
        <p className="mt-1 text-sm text-[#727687]">{description}</p>
      </div>
      <SectionState
        empty={empty}
        emptyMessage={emptyMessage}
        isError={isError}
        isLoading={isLoading}
      >
        {children}
      </SectionState>
    </section>
  )
}

function InstallmentsControlPanel({
  groups,
  isLoading,
  isError,
  onUpdateStatus,
  updatingId,
}: {
  groups: AlertGroup[]
  isLoading: boolean
  isError: boolean
  onUpdateStatus: (
    installment: SaleInstallmentResponse,
    status: Exclude<SaleInstallmentStatus, 'PENDING'>,
  ) => void
  updatingId?: number
}) {
  const totalInstallments = groups.reduce((sum, group) => sum + group.installments.length, 0)

  return (
    <section className="rounded-xl border border-[#dfe4f5] bg-white shadow-[0_1px_3px_rgba(20,27,43,0.05)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#edf0fa] px-5 py-4">
        <div>
          <h2 className="font-[Geist,Inter,sans-serif] text-lg font-semibold text-[#141b2b]">
            Controle de Parcelas
          </h2>
          <p className="mt-1 text-sm text-[#727687]">Vencimentos e inadimplencia do credito</p>
        </div>
      </div>

      <div className="p-5">
        <SectionState
          empty={totalInstallments === 0}
          emptyMessage="Nenhuma parcela exige acompanhamento."
          isError={isError}
          isLoading={isLoading}
        >
          <div className="grid gap-4 xl:grid-cols-2">
            {groups.map((group) => (
              <div key={group.title} className="rounded-lg border border-[#edf0fa]">
                <div className={`border-b px-4 py-3 ${alertToneClasses[group.tone]}`}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="font-[Geist,Inter,sans-serif] text-sm font-semibold">
                        {group.title}
                      </h3>
                      <p className="mt-1 text-xs opacity-80">{group.description}</p>
                    </div>
                    <span className="rounded-full bg-white/70 px-2.5 py-1 text-xs font-semibold">
                      {numberLabel(group.installments.length)}
                    </span>
                  </div>
                </div>
                <div className="divide-y divide-[#edf0fa]">
                  {group.installments.length > 0 ? (
                    group.installments.map((installment) => (
                      <div
                        key={installment.id}
                        className="px-4 py-3"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <p className="font-medium text-[#141b2b]">
                              Venda #{installment.saleId}
                              {installment.customerName ? ` - ${installment.customerName}` : ''}
                            </p>
                            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-[#727687]">
                              <span>
                                Parcela {installment.installmentNumber}/
                                {installment.totalInstallments}
                              </span>
                              <span>{dateLabel(installment.dueDate.slice(0, 10))}</span>
                              <span>{currency(installment.amount)}</span>
                              <span>{installment.status}</span>
                            </div>
                            <p className="mt-2 text-xs font-medium text-[#424656]">
                              {installment.paidInstallments}/{installment.totalInstallments} pagas
                              {' - '}
                              {installment.remainingInstallments} restantes
                            </p>
                          </div>
                          <div className="flex shrink-0 flex-wrap gap-2">
                            <button
                              className="rounded-lg bg-[#0b7a3b] px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                              disabled={updatingId === installment.id}
                              onClick={() => onUpdateStatus(installment, 'PAID')}
                              type="button"
                            >
                              Pago
                            </button>
                            {installment.status === 'PENDING' ? (
                              <button
                                className="rounded-lg border border-[#ffd2d2] bg-white px-3 py-2 text-xs font-semibold text-[#b42318] disabled:cursor-not-allowed disabled:opacity-60"
                                disabled={updatingId === installment.id}
                                onClick={() => onUpdateStatus(installment, 'UNPAID')}
                                type="button"
                              >
                                Nao pago
                              </button>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-5 text-sm text-[#727687]">
                      Nenhuma parcela nesta faixa.
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </SectionState>
      </div>
    </section>
  )
}

function FinanceFiltersPanel({
  draft,
  onApply,
  onClear,
  onUpdate,
}: {
  draft: FinanceFilterState
  onApply: () => void
  onClear: () => void
  onUpdate: (draft: FinanceFilterState) => void
}) {
  return (
    <section className="rounded-xl border border-[#dfe4f5] bg-white p-4 shadow-[0_1px_3px_rgba(20,27,43,0.05)]">
      <div className="grid gap-3 md:grid-cols-4">
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.05em] text-[#727687]">
            Inicio
          </span>
          <input
            type="date"
            className="mt-2 h-10 w-full rounded-lg border border-[#dfe4f5] bg-white px-3 text-sm text-[#141b2b] outline-none focus:border-[#0050cb]"
            value={draft.start}
            onChange={(event) => onUpdate({ ...draft, start: event.target.value })}
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.05em] text-[#727687]">
            Fim
          </span>
          <input
            type="date"
            className="mt-2 h-10 w-full rounded-lg border border-[#dfe4f5] bg-white px-3 text-sm text-[#141b2b] outline-none focus:border-[#0050cb]"
            value={draft.end}
            onChange={(event) => onUpdate({ ...draft, end: event.target.value })}
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.05em] text-[#727687]">
            Status
          </span>
          <select
            className="mt-2 h-10 w-full rounded-lg border border-[#dfe4f5] bg-white px-3 text-sm text-[#141b2b] outline-none focus:border-[#0050cb]"
            value={draft.status}
            onChange={(event) =>
              onUpdate({ ...draft, status: event.target.value as FinanceFilterState['status'] })
            }
          >
            <option value="">Aprovadas</option>
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.05em] text-[#727687]">
            Pagamento
          </span>
          <select
            className="mt-2 h-10 w-full rounded-lg border border-[#dfe4f5] bg-white px-3 text-sm text-[#141b2b] outline-none focus:border-[#0050cb]"
            value={draft.paymentType}
            onChange={(event) =>
              onUpdate({
                ...draft,
                paymentType: event.target.value as FinanceFilterState['paymentType'],
              })
            }
          >
            <option value="">Todos</option>
            {paymentOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          className="h-10 rounded-lg border border-[#dfe4f5] bg-white px-3 text-sm font-medium text-[#424656] hover:bg-[#f9f9ff]"
          onClick={onClear}
        >
          Limpar
        </button>
        <button
          type="button"
          className="h-10 rounded-lg bg-[#0050cb] px-3 text-sm font-medium text-white shadow-sm hover:bg-[#003fa4]"
          onClick={onApply}
        >
          Aplicar
        </button>
      </div>
    </section>
  )
}

export default function Finance() {
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [filterDraft, setFilterDraft] = useState<FinanceFilterState>(emptyFilters)
  const [appliedFilters, setAppliedFilters] = useState<FinanceFilterState>(emptyFilters)
  const analyticsParams = useMemo(
    () => ({
      start: appliedFilters.start || undefined,
      end: appliedFilters.end || undefined,
      status: appliedFilters.status || undefined,
      paymentType: appliedFilters.paymentType || undefined,
    }),
    [appliedFilters],
  )
  const dashboard = useDashboard(analyticsParams)
  const revenue = useRevenue({ ...analyticsParams, groupBy: 'monthly' })
  const profit = useProfit({ ...analyticsParams, groupBy: 'monthly' })
  const payments = usePayments(analyticsParams)
  const installmentAlerts = useInstallmentAlerts()
  const updateInstallmentStatus = useUpdateInstallmentStatus()
  const topProducts = useTopProducts({ ...analyticsParams, limit: 5 })
  const topCustomers = useTopCustomers({ ...analyticsParams, limit: 5 })

  const colors = ['#0050cb', '#4648d4', '#0b7a3b', '#9a5200']
  const hasError = dashboard.isError
  const isLoading = dashboard.isLoading

  const financeMetrics: FinanceMetricData[] = dashboard.data
    ? buildFinanceMetrics(dashboard.data)
    : []

  const profitByPeriod = new Map(profit.data?.map((item) => [item.period, item.profit ?? 0]) ?? [])
  const revenueByPeriod = new Map(
    revenue.data?.map((item) => [item.period, item.revenue ?? 0]) ?? [],
  )
  const monthlyFinance: FinanceMonthlyPoint[] = Array.from(
    new Set([...revenueByPeriod.keys(), ...profitByPeriod.keys()]),
  )
    .sort()
    .map((period) => ({
      month: monthLabel(period),
      revenue: revenueByPeriod.get(period) ?? 0,
      profit: profitByPeriod.get(period) ?? 0,
    }))

  const paymentMethodShares: PaymentMethodShare[] =
    payments.data
      ?.map((payment, index) => ({
        method: paymentMethodLabel(payment.paymentType),
        salesCount: payment.salesCount,
        totalValue: payment.totalValue,
        color: colors[index % colors.length],
      }))
      .sort((a, b) => b.totalValue - a.totalValue) ?? []

  const installmentGroups = groupInstallments(installmentAlerts.data ?? [])

  function applyFilters() {
    setAppliedFilters(filterDraft)
  }

  function clearFilters() {
    setFilterDraft(emptyFilters)
    setAppliedFilters(emptyFilters)
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="mt-2 font-[Geist,Inter,sans-serif] text-[28px] font-semibold leading-[34px] text-[#141b2b] sm:text-4xl sm:leading-[44px]">
            Dashboard Financeiro
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#424656] sm:text-base">
            Visao consolidada de faturamento, lucro, meios de pagamento e controle de parcelas.
          </p>
        </div>
        <button
          type="button"
          className={`flex h-10 items-center gap-2 rounded-lg border px-3 text-sm font-medium ${
            filtersOpen
              ? 'border-[#0050cb] bg-[#eaf1ff] text-[#0050cb]'
              : 'border-[#dfe4f5] bg-white text-[#424656] hover:bg-[#f9f9ff]'
          }`}
          onClick={() => setFiltersOpen((current) => !current)}
          aria-expanded={filtersOpen}
        >
          <span className="material-symbols-rounded text-[19px]" aria-hidden="true">
            filter_list
          </span>
          Filtros
        </button>
      </section>

      {hasError ? (
        <div className="rounded-lg border border-[#fde1e1] bg-[#fff7f7] px-4 py-3 text-sm font-medium text-[#8f1111]">
          Nao foi possivel carregar o financeiro.
        </div>
      ) : null}

      {isLoading ? (
        <div className="rounded-lg border border-[#dfe4f5] bg-white px-4 py-3 text-sm font-medium text-[#424656]">
          Carregando financeiro...
        </div>
      ) : null}

      {filtersOpen ? (
        <FinanceFiltersPanel
          draft={filterDraft}
          onApply={applyFilters}
          onClear={clearFilters}
          onUpdate={setFilterDraft}
        />
      ) : null}

      {!hasError && !isLoading ? (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {financeMetrics.map((metric) => (
              <FinanceMetricCard key={metric.label} metric={metric} />
            ))}
          </section>

          <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
            <MonthlyChart
              data={monthlyFinance}
              isError={revenue.isError || profit.isError}
              isLoading={revenue.isLoading || profit.isLoading}
            />
            <PaymentMethodsCard
              isError={payments.isError}
              isLoading={payments.isLoading}
              methods={paymentMethodShares}
            />
          </section>

          <FinancialSupportLists
            customers={topCustomers.data ?? []}
            customersError={topCustomers.isError}
            customersLoading={topCustomers.isLoading}
            products={topProducts.data ?? []}
            productsError={topProducts.isError}
            productsLoading={topProducts.isLoading}
          />

          <InstallmentsControlPanel
            groups={installmentGroups}
            isError={installmentAlerts.isError}
            isLoading={installmentAlerts.isLoading}
            onUpdateStatus={(installment, status) =>
              updateInstallmentStatus.mutate({ id: installment.id, status })
            }
            updatingId={
              updateInstallmentStatus.isPending
                ? updateInstallmentStatus.variables?.id
                : undefined
            }
          />
        </>
      ) : null}
    </div>
  )
}
