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

export const initialCustomers: CustomerRow[] = [
  {
    id: 1,
    name: 'Marina Alves',
    phone: '(11) 98231-4450',
    salesCount: 14,
    revenueInCents: 4289000,
    profitInCents: 1072000,
  },
  {
    id: 2,
    name: 'Rafael Costa',
    phone: '(21) 99770-1288',
    salesCount: 9,
    revenueInCents: 2874000,
    profitInCents: 682000,
  },
  {
    id: 3,
    name: 'Beatriz Lima',
    phone: '(31) 98841-7002',
    salesCount: 6,
    revenueInCents: 1649000,
    profitInCents: 431000,
  },
  {
    id: 4,
    name: 'Studio Orion',
    phone: '(41) 4002-2210',
    salesCount: 18,
    revenueInCents: 7986000,
    profitInCents: 1893000,
  },
  {
    id: 5,
    name: 'Helena Duarte',
    phone: '(51) 99120-5401',
    salesCount: 3,
    revenueInCents: 947000,
    profitInCents: 218000,
  },
]
