export type MetricCardData = {
  label: string
  value: string
  trend?: string
  trendDirection?: 'up' | 'down'
  description?: string
  icon: string
  tone: 'blue' | 'green' | 'violet' | 'amber'
}

export type ProductRow = {
  name: string
  sku: string
  quantity: string
  revenue: string
  trend: string
  icon: string
}

export type OrderStatus = {
  label: string
  count: string
  percent: number
  tone: 'green' | 'blue' | 'amber' | 'red'
}

export const metrics: MetricCardData[] = [
  {
    label: 'Faturamento Total',
    value: 'R$ 284.750',
    trend: '+18,2%',
    trendDirection: 'up',
    description: 'vs. mes anterior',
    icon: 'payments',
    tone: 'blue',
  },
  {
    label: 'Lucro Estimado',
    value: 'R$ 73.420',
    trend: '+12,8%',
    trendDirection: 'up',
    description: 'margem de 25,8%',
    icon: 'trending_up',
    tone: 'green',
  },
  {
    label: 'Vendas Aprovadas',
    value: '1.248',
    trend: '+9,4%',
    trendDirection: 'up',
    description: 'pedidos confirmados',
    icon: 'verified',
    tone: 'violet',
  },
  {
    label: 'Ticket Medio',
    value: 'R$ 2.281',
    trend: '-2,1%',
    trendDirection: 'down',
    description: 'media por pedido',
    icon: 'receipt_long',
    tone: 'amber',
  },
]

export const topProducts: ProductRow[] = [
  {
    name: 'iPhone 15 Pro Max 256GB',
    sku: 'APL-IP15PM-256',
    quantity: '142 un.',
    revenue: 'R$ 1.135.858',
    trend: '+22%',
    icon: 'smartphone',
  },
  {
    name: 'MacBook Pro M3 14"',
    sku: 'APL-MBP-M3-14',
    quantity: '38 un.',
    revenue: 'R$ 531.962',
    trend: '+16%',
    icon: 'laptop_mac',
  },
  {
    name: 'Apple Watch Series 9',
    sku: 'APL-WATCH-S9',
    quantity: '96 un.',
    revenue: 'R$ 287.904',
    trend: '+11%',
    icon: 'watch',
  },
  {
    name: 'AirPods Pro 2a Geracao',
    sku: 'APL-APP2-USB',
    quantity: '184 un.',
    revenue: 'R$ 275.816',
    trend: '+8%',
    icon: 'headphones',
  },
]

export const orderStatuses: OrderStatus[] = [
  { label: 'Concluidos', count: '824', percent: 66, tone: 'green' },
  { label: 'Aguardando Pagamento', count: '151', percent: 12, tone: 'amber' },
  { label: 'Cancelados', count: '57', percent: 5, tone: 'red' },
]
