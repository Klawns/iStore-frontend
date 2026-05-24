import MetricCard from './_components/metric-card'
import OrderStatusCard from './_components/order-status-card'
import TopProductsTable from './_components/top-products-table'
import { useDashboard, useStatuses, useTopProducts } from '../../services/api/hooks'
import { metrics as fallbackMetrics, orderStatuses as fallbackStatuses, topProducts as fallbackProducts } from './mock'
import type { MetricCardData, OrderStatus, ProductRow } from './mock'

const statusLabels = {
  APPROVED: 'Concluidos',
  PENDING: 'Aguardando Pagamento',
  CANCELED: 'Cancelados',
} as const

const statusTones = {
  APPROVED: 'green',
  PENDING: 'amber',
  CANCELED: 'red',
} as const

function currency(valueInCents: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(valueInCents / 100)
}

function numberLabel(value: number) {
  return new Intl.NumberFormat('pt-BR').format(value)
}

export default function Dashboard() {
  const dashboard = useDashboard()
  const topProductsQuery = useTopProducts({ limit: 5 })
  const statusesQuery = useStatuses()

  const metrics: MetricCardData[] = dashboard.data
    ? [
        {
          label: 'Faturamento Total',
          value: currency(dashboard.data.revenue),
          trend: `${dashboard.data.profitMargin.toFixed(1).replace('.', ',')}%`,
          trendDirection: 'up',
          description: 'margem de lucro',
          icon: 'payments',
          tone: 'blue',
        },
        {
          label: 'Lucro Estimado',
          value: currency(dashboard.data.profit),
          icon: 'trending_up',
          tone: 'green',
        },
        {
          label: 'Vendas Aprovadas',
          value: numberLabel(dashboard.data.approvedSalesCount),
          icon: 'verified',
          tone: 'violet',
        },
        {
          label: 'Ticket Medio',
          value: currency(Math.round(dashboard.data.averageTicket)),
          icon: 'receipt_long',
          tone: 'amber',
        },
      ]
    : fallbackMetrics

  const topProducts: ProductRow[] =
    topProductsQuery.data?.map((product) => ({
      name: product.productName,
      sku: `${product.salesCount} vendas`,
      quantity: `${numberLabel(product.quantity)} un.`,
      revenue: currency(product.revenue),
      trend: currency(product.profit),
      icon: 'smartphone',
    })) ?? fallbackProducts

  const totalStatuses =
    statusesQuery.data?.reduce((sum, status) => sum + status.salesCount, 0) ?? 0
  const orderStatuses: OrderStatus[] =
    statusesQuery.data?.map((status) => ({
      label: statusLabels[status.status],
      count: numberLabel(status.salesCount),
      percent: totalStatuses > 0 ? Math.round((status.salesCount / totalStatuses) * 100) : 0,
      tone: statusTones[status.status],
    })) ?? fallbackStatuses
  const hasError = dashboard.isError || topProductsQuery.isError || statusesQuery.isError

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>

          <h1 className="mt-2 font-[Geist,Inter,sans-serif] text-[28px] font-semibold leading-[34px] text-[#141b2b] sm:text-4xl sm:leading-[44px]">
            Dashboard
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#424656] sm:text-base">
            Acompanhamento de faturamento, pedidos e produtos.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="flex h-10 items-center gap-2 rounded-lg border border-[#dfe4f5] bg-white px-3 text-sm font-medium text-[#424656] hover:bg-[#f9f9ff]"
          >
            <span className="material-symbols-rounded text-[19px]" aria-hidden="true">
              calendar_month
            </span>
            Este mes
          </button>
          <button
            type="button"
            className="flex h-10 items-center gap-2 rounded-lg bg-[#0050cb] px-3 text-sm font-medium text-white shadow-sm hover:bg-[#003fa4]"
          >
            <span className="material-symbols-rounded text-[19px]" aria-hidden="true">
              download
            </span>
            Exportar
          </button>
        </div>
      </section>

      {hasError ? (
        <div className="rounded-lg border border-[#fde1e1] bg-[#fff7f7] px-4 py-3 text-sm font-medium text-[#8f1111]">
          Nao foi possivel atualizar os dados.
        </div>
      ) : null}

      {dashboard.isLoading || topProductsQuery.isLoading || statusesQuery.isLoading ? (
        <div className="rounded-lg border border-[#dfe4f5] bg-white px-4 py-3 text-sm font-medium text-[#424656]">
          Carregando dados...
        </div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} metric={metric} />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <TopProductsTable products={topProducts} />
        <OrderStatusCard statuses={orderStatuses} />
      </section>
    </div>
  )
}
