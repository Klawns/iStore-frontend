export type CustomerRow = {
  id: number
  name: string
  phone: string
  salesCount: number
  revenueInCents: number
  profitInCents: number
}

export type CustomerMetricData = {
  label: string
  value: string
  icon: string
  tone: 'blue' | 'green' | 'violet'
}

export type CustomerFormDraft = {
  id?: number
  name: string
  phone: string
}
