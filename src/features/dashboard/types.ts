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
