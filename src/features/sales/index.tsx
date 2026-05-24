import { useEffect, useMemo, useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { ApiError } from '../../services/api/client'
import {
  useCreateSale,
  useCustomers,
  useDeleteSale,
  useSales,
  useUpdateSaleStatus,
} from '../../services/api/hooks'
import type {
  CustomerResponse,
  PaymentStatus,
  PaymentType,
  SaleListSummaryResponse,
  SaleRequest,
  SaleResponse,
} from '../../services/api/types'

type CustomerOption = {
  id: string
  name: string
}

type SaleItem = {
  id: string
  product: string
  specs: string
  quantity: number
  costInCents: number
  salePriceInCents: number
}

type SaleRow = {
  id: string
  customerId: string
  customerName: string
  saleDate: string
  paymentType: PaymentType
  paymentStatus: PaymentStatus
  installments?: number
  billingDay?: number
  items: SaleItem[]
}

type SalesMetricData = {
  label: string
  value: string
  icon: string
  tone: 'blue' | 'green' | 'violet' | 'amber'
}

type SaleFormDraft = {
  customerId: string
  customerName: string
  saleDate: string
  paymentType: PaymentType
  paymentStatus: PaymentStatus
  installments?: number
  billingDay?: number
  items: SaleItem[]
}

type SalesFilterState = {
  start: string
  end: string
  status: '' | PaymentStatus
  paymentType: '' | PaymentType
  customerId: string
  search: string
}

const paymentOptions = [
  { value: 'PIX', label: 'PIX' },
  { value: 'MONEY', label: 'Dinheiro' },
  { value: 'CREDIT_CARD', label: 'Credito' },
  { value: 'DEBIT_CARD', label: 'Debito' },
] satisfies { value: PaymentType; label: string }[]

const paymentLabels = paymentOptions.reduce<Record<PaymentType, string>>(
  (labels, option) => ({
    ...labels,
    [option.value]: option.label,
  }),
  {
    PIX: '',
    MONEY: '',
    CREDIT_CARD: '',
    DEBIT_CARD: '',
  },
)

const statusLabels: Record<PaymentStatus, string> = {
  APPROVED: 'Aprovada',
  PENDING: 'Pendente',
  CANCELED: 'Cancelada',
}

const statusClasses: Record<PaymentStatus, string> = {
  APPROVED: 'bg-[#eaf8ef] text-[#0b7a3b]',
  PENDING: 'bg-[#fff3df] text-[#9a5200]',
  CANCELED: 'bg-[#fdecec] text-[#ba1a1a]',
}

const metricToneClasses: Record<SalesMetricData['tone'], string> = {
  blue: 'bg-[#eaf1ff] text-[#0050cb]',
  green: 'bg-[#eaf8ef] text-[#0b7a3b]',
  violet: 'bg-[#eeeeff] text-[#4648d4]',
  amber: 'bg-[#fff3df] text-[#9a5200]',
}

const emptyFilters: SalesFilterState = {
  start: '',
  end: '',
  status: '',
  paymentType: '',
  customerId: '',
  search: '',
}

const emptyItem = (): SaleItem => ({
  id: `item-${Date.now()}`,
  product: '',
  specs: '',
  quantity: 1,
  costInCents: 0,
  salePriceInCents: 0,
})

function currency(valueInCents: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valueInCents / 100)
}

function dateLabel(date: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${date}T12:00:00`))
}

function toReais(valueInCents: number) {
  return valueInCents === 0 ? '' : String(valueInCents / 100).replace('.', ',')
}

function fromReais(value: string) {
  const parsed = Number(value.replace(',', '.'))

  return Number.isFinite(parsed) ? Math.round(parsed * 100) : 0
}

function totals(items: SaleItem[]) {
  const subtotal = items.reduce((sum, item) => sum + item.salePriceInCents * item.quantity, 0)
  const cost = items.reduce((sum, item) => sum + item.costInCents * item.quantity, 0)
  const profit = subtotal - cost
  const margin = subtotal > 0 ? (profit / subtotal) * 100 : 0

  return { subtotal, cost, profit, margin }
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError || error instanceof Error) {
    return error.message
  }

  return fallback
}

function saleDateInputValue(date: string) {
  return date ? date.slice(0, 10) : new Date().toISOString().slice(0, 10)
}

function mapSaleResponse(sale: SaleResponse): SaleRow {
  return {
    id: String(sale.id),
    customerId: String(sale.customerId),
    customerName: sale.customerName || `Cliente ID ${sale.customerId}`,
    saleDate: saleDateInputValue(sale.saleDate),
    paymentType: sale.paymentType,
    paymentStatus: sale.paymentStatus,
    installments: sale.installments,
    billingDay: sale.billingDay,
    items: sale.items.map((item) => ({
      id: String(item.id),
      product: item.productName,
      specs: item.specs,
      quantity: item.quantity,
      costInCents: item.costPrice,
      salePriceInCents: item.salePrice,
    })),
  }
}

function customerOptionsFromResponse(customers: CustomerResponse[] | undefined): CustomerOption[] {
  return (customers ?? []).map((customer) => ({
    id: String(customer.id),
    name: customer.name,
  }))
}

function buildSalesMetrics(summary?: SaleListSummaryResponse): SalesMetricData[] {
  return [
    {
      label: 'Receita Total',
      value: currency(summary?.revenue ?? 0),
      icon: 'payments',
      tone: 'blue',
    },
    {
      label: 'Lucro Estimado',
      value: currency(summary?.profit ?? 0),
      icon: 'trending_up',
      tone: 'green',
    },
    {
      label: 'Ticket Medio',
      value: currency(summary?.averageTicket ?? 0),
      icon: 'receipt_long',
      tone: 'violet',
    },
  ]
}

function buildSaleRequest(draft: SaleFormDraft): SaleRequest {
  const paymentStatus = draft.paymentType === 'DEBIT_CARD' ? 'APPROVED' : draft.paymentStatus
  const request: SaleRequest = {
    customerId: Number(draft.customerId),
    paymentType: draft.paymentType,
    paymentStatus,
    saleDate: new Date(`${draft.saleDate}T12:00:00`).toISOString(),
    items: draft.items.map((item) => ({
      productName: item.product.trim(),
      specs: item.specs.trim(),
      quantity: item.quantity,
      costPrice: item.costInCents,
      salePrice: item.salePriceInCents,
    })),
  }

  if (draft.paymentType === 'CREDIT_CARD') {
    request.installments = draft.installments
    request.billingDay = draft.billingDay
  }

  return request
}

function SalesMetricCard({ metric }: { metric: SalesMetricData }) {
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

function EmptySalesState({
  canCreate,
  onCreate,
}: {
  canCreate: boolean
  onCreate: () => void
}) {
  return (
    <section className="rounded-xl border border-[#dfe4f5] bg-white px-5 py-10 text-center shadow-[0_1px_3px_rgba(20,27,43,0.05)]">
      <span
        className="material-symbols-rounded mx-auto grid size-12 place-items-center rounded-lg bg-[#eaf1ff] text-[28px] text-[#0050cb]"
        aria-hidden="true"
      >
        receipt_long
      </span>
      <h2 className="mt-4 font-[Geist,Inter,sans-serif] text-lg font-semibold text-[#141b2b]">
        Nenhuma venda encontrada
      </h2>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[#727687]">
        As novas vendas aparecem aqui.
      </p>
      {canCreate ? (
        <button
          type="button"
          className="mt-5 inline-flex h-10 items-center gap-2 rounded-lg bg-[#0050cb] px-3 text-sm font-medium text-white shadow-sm hover:bg-[#003fa4]"
          onClick={onCreate}
        >
          <span className="material-symbols-rounded text-[19px]" aria-hidden="true">
            add
          </span>
          Nova Venda
        </button>
      ) : null}
    </section>
  )
}

function SalesFilterPanel({
  customers,
  filters,
  onApply,
  onClear,
  onUpdate,
}: {
  customers: CustomerOption[]
  filters: SalesFilterState
  onApply: () => void
  onClear: () => void
  onUpdate: (filters: SalesFilterState) => void
}) {
  return (
    <section className="rounded-xl border border-[#dfe4f5] bg-white p-4 shadow-[0_1px_3px_rgba(20,27,43,0.05)]">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.05em] text-[#727687]">
            Inicio
          </span>
          <input
            className="mt-2 h-10 w-full rounded-lg border border-[#dfe4f5] bg-white px-3 text-sm text-[#141b2b] outline-none focus:border-[#0050cb]"
            type="date"
            value={filters.start}
            onChange={(event) => onUpdate({ ...filters, start: event.target.value })}
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.05em] text-[#727687]">
            Fim
          </span>
          <input
            className="mt-2 h-10 w-full rounded-lg border border-[#dfe4f5] bg-white px-3 text-sm text-[#141b2b] outline-none focus:border-[#0050cb]"
            type="date"
            value={filters.end}
            onChange={(event) => onUpdate({ ...filters, end: event.target.value })}
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.05em] text-[#727687]">
            Status
          </span>
          <select
            className="mt-2 h-10 w-full rounded-lg border border-[#dfe4f5] bg-white px-3 text-sm text-[#141b2b] outline-none focus:border-[#0050cb]"
            value={filters.status}
            onChange={(event) =>
              onUpdate({ ...filters, status: event.target.value as SalesFilterState['status'] })
            }
          >
            <option value="">Todos</option>
            {(['APPROVED', 'PENDING', 'CANCELED'] as PaymentStatus[]).map((status) => (
              <option key={status} value={status}>
                {statusLabels[status]}
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
            value={filters.paymentType}
            onChange={(event) =>
              onUpdate({
                ...filters,
                paymentType: event.target.value as SalesFilterState['paymentType'],
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
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.05em] text-[#727687]">
            Cliente
          </span>
          <select
            className="mt-2 h-10 w-full rounded-lg border border-[#dfe4f5] bg-white px-3 text-sm text-[#141b2b] outline-none focus:border-[#0050cb]"
            value={filters.customerId}
            onChange={(event) => onUpdate({ ...filters, customerId: event.target.value })}
          >
            <option value="">Todos</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.05em] text-[#727687]">
            Busca
          </span>
          <input
            className="mt-2 h-10 w-full rounded-lg border border-[#dfe4f5] bg-white px-3 text-sm text-[#141b2b] outline-none focus:border-[#0050cb]"
            value={filters.search}
            onChange={(event) => onUpdate({ ...filters, search: event.target.value })}
            placeholder="Cliente, produto ou specs"
          />
        </label>
      </div>
      <div className="mt-4 flex flex-wrap justify-end gap-2">
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

function SalesTable({
  isActionPending,
  onDelete,
  onStatusChange,
  sales,
}: {
  isActionPending: boolean
  onDelete: (sale: SaleRow) => void
  onStatusChange: (sale: SaleRow, status: PaymentStatus) => void
  sales: SaleRow[]
}) {
  return (
    <section className="rounded-xl border border-[#dfe4f5] bg-white shadow-[0_1px_3px_rgba(20,27,43,0.05)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#edf0fa] px-5 py-4">
        <div>
          <h2 className="font-[Geist,Inter,sans-serif] text-lg font-semibold text-[#141b2b]">
            Vendas Recentes
          </h2>
          <p className="mt-1 text-sm text-[#727687]">Ultimas vendas</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1080px] border-collapse text-left">
          <thead>
            <tr className="text-xs font-semibold uppercase tracking-[0.05em] text-[#727687]">
              <th className="px-5 py-3">Cliente</th>
              <th className="px-5 py-3">Data</th>
              <th className="px-5 py-3">Produtos</th>
              <th className="px-5 py-3">Status/Pagamento</th>
              <th className="px-5 py-3">Valor final</th>
              <th className="px-5 py-3">Lucro/Margem</th>
              <th className="px-5 py-3 text-right">Acoes</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((sale) => {
              const saleTotals = totals(sale.items)

              return (
                <tr key={sale.id} className="border-t border-[#edf0fa] hover:bg-[#f9f9ff]">
                  <td className="px-5 py-4">
                    <div className="font-medium text-[#141b2b]">{sale.customerName}</div>
                  </td>
                  <td className="px-5 py-4 text-sm font-medium text-[#424656]">
                    {dateLabel(sale.saleDate)}
                  </td>
                  <td className="px-5 py-4">
                    <div className="max-w-[280px] truncate font-medium text-[#141b2b]">
                      {sale.items.map((item) => item.product).join(', ')}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm font-medium text-[#424656]">
                    <span
                      className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${statusClasses[sale.paymentStatus]}`}
                    >
                      {paymentLabels[sale.paymentType]} - {statusLabels[sale.paymentStatus]}
                      {sale.paymentType === 'CREDIT_CARD' && sale.installments && sale.billingDay
                        ? ` - ${sale.installments}x, dia ${sale.billingDay}`
                        : null}
                    </span>
                  </td>
                  <td className="px-5 py-4 font-[Geist,Inter,sans-serif] text-sm font-semibold text-[#141b2b]">
                    {currency(saleTotals.subtotal)}
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 font-[Geist,Inter,sans-serif] text-sm font-semibold text-[#0b7a3b]">
                    {currency(saleTotals.profit)} - {saleTotals.margin.toFixed(1).replace('.', ',')}%
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <select
                        className="h-9 rounded-lg border border-[#dfe4f5] bg-white px-2 text-xs font-semibold text-[#424656] outline-none focus:border-[#0050cb] disabled:cursor-not-allowed disabled:bg-[#f4f6fb]"
                        value={sale.paymentStatus}
                        disabled={isActionPending}
                        onChange={(event) =>
                          onStatusChange(sale, event.target.value as PaymentStatus)
                        }
                        aria-label={`Alterar status da venda ${sale.id}`}
                        title="Alterar status"
                      >
                        {(['APPROVED', 'PENDING', 'CANCELED'] as PaymentStatus[]).map((status) => (
                          <option key={status} value={status}>
                            {statusLabels[status]}
                          </option>
                        ))}
                      </select>
                      <div className="grid grid-rows-2 gap-1">
                        <button
                          type="button"
                          className="grid size-8 cursor-not-allowed place-items-center rounded-lg border border-[#dfe4f5] bg-[#f4f6fb] text-[#9ca1b2]"
                          disabled
                          aria-label={`Editar venda de ${sale.customerName}`}
                          title="Edicao indisponivel"
                        >
                          <Pencil className="size-4" aria-hidden="true" strokeWidth={2.25} />
                        </button>
                        <button
                          type="button"
                          className="grid size-8 place-items-center rounded-lg border border-[#dfe4f5] bg-white text-[#424656] hover:bg-[#fff7f7] hover:text-[#ba1a1a] disabled:cursor-not-allowed disabled:bg-[#f4f6fb] disabled:text-[#9ca1b2]"
                          onClick={() => onDelete(sale)}
                          disabled={isActionPending}
                          aria-label={`Excluir venda de ${sale.customerName}`}
                          title="Excluir venda"
                        >
                          <Trash2 className="size-4" aria-hidden="true" strokeWidth={2.25} />
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function SalesPagination({
  isLoading,
  page,
  totalPages,
  totalItems,
  onPageChange,
}: {
  isLoading: boolean
  page: number
  totalPages: number
  totalItems: number
  onPageChange: (page: number) => void
}) {
  const safeTotalPages = Math.max(totalPages, 1)

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-[#dfe4f5] bg-white px-4 py-3 text-sm text-[#424656] shadow-[0_1px_3px_rgba(20,27,43,0.05)] sm:flex-row sm:items-center sm:justify-between">
      <span>
        Pagina {Math.min(page, safeTotalPages)} de {safeTotalPages} - {totalItems} vendas
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          className="h-9 rounded-lg border border-[#dfe4f5] bg-white px-3 font-medium hover:bg-[#f9f9ff] disabled:cursor-not-allowed disabled:bg-[#f4f6fb] disabled:text-[#9ca1b2]"
          disabled={page <= 1 || isLoading}
          onClick={() => onPageChange(page - 1)}
        >
          Anterior
        </button>
        <button
          type="button"
          className="h-9 rounded-lg border border-[#dfe4f5] bg-white px-3 font-medium hover:bg-[#f9f9ff] disabled:cursor-not-allowed disabled:bg-[#f4f6fb] disabled:text-[#9ca1b2]"
          disabled={page >= safeTotalPages || isLoading}
          onClick={() => onPageChange(page + 1)}
        >
          Proxima
        </button>
      </div>
    </div>
  )
}

function SaleDrawer({
  customerOptions,
  draft,
  isSaving,
  onClose,
  onSave,
  onUpdate,
  saveError,
  setStep,
  step,
}: {
  customerOptions: CustomerOption[]
  draft: SaleFormDraft
  isSaving: boolean
  onClose: () => void
  onSave: () => void
  onUpdate: (draft: SaleFormDraft) => void
  saveError?: string
  setStep: (step: 1 | 2) => void
  step: 1 | 2
}) {
  const draftTotals = useMemo(() => totals(draft.items), [draft.items])
  const [isVisible, setIsVisible] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const canSave =
    draft.customerId !== '' &&
    draft.saleDate !== '' &&
    draft.items.every(
      (item) =>
        item.product.trim().length > 0 &&
        item.specs.trim().length > 0 &&
        item.quantity > 0 &&
        item.salePriceInCents > 0,
    ) &&
    (draft.paymentType !== 'CREDIT_CARD' ||
      Boolean(
        draft.installments && draft.billingDay && draft.installments >= 1 && draft.billingDay >= 1,
      ))

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setIsVisible(true))

    return () => window.cancelAnimationFrame(frame)
  }, [])

  function closeWithAnimation() {
    if (isClosing || isSaving) {
      return
    }

    setIsClosing(true)
    setIsVisible(false)

    window.setTimeout(() => {
      onClose()
    }, 220)
  }

  function updateItem(itemId: string, nextItem: Partial<SaleItem>) {
    onUpdate({
      ...draft,
      items: draft.items.map((item) => (item.id === itemId ? { ...item, ...nextItem } : item)),
    })
  }

  function removeItem(itemId: string) {
    if (draft.items.length === 1) {
      return
    }

    onUpdate({ ...draft, items: draft.items.filter((item) => item.id !== itemId) })
  }

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      <button
        type="button"
        className={`fixed inset-0 bg-[#141b2b]/45 transition-opacity duration-200 ease-out ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={closeWithAnimation}
        aria-label="Fechar formulario"
      />
      <aside
        className={`fixed right-0 top-0 flex h-dvh w-screen min-w-0 flex-col bg-white shadow-[-8px_0_24px_rgba(20,27,43,0.14)] transition-transform duration-200 ease-out sm:w-[480px] sm:max-w-[480px] ${
          isVisible ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-[#edf0fa] px-5 py-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.05em] text-[#727687]">
              Nova venda
            </p>
            <h2 className="mt-1 font-[Geist,Inter,sans-serif] text-xl font-semibold text-[#141b2b]">
              {step === 1 ? 'Dados da venda' : 'Itens e margem'}
            </h2>
          </div>
          <button
            type="button"
            className="grid size-9 place-items-center rounded-lg border border-[#dfe4f5] bg-white text-[#424656] hover:bg-[#f9f9ff] disabled:cursor-not-allowed disabled:bg-[#f4f6fb]"
            onClick={closeWithAnimation}
            disabled={isSaving}
            aria-label="Fechar"
          >
            <span className="material-symbols-rounded text-[20px]" aria-hidden="true">
              close
            </span>
          </button>
        </div>

        <div className="grid shrink-0 grid-cols-2 gap-2 border-b border-[#edf0fa] px-5 py-3">
          {[1, 2].map((itemStep) => (
            <button
              key={itemStep}
              type="button"
              className={`h-9 min-w-0 rounded-lg px-2 text-sm font-semibold ${
                step === itemStep
                  ? 'bg-[#0050cb] text-white'
                  : 'border border-[#dfe4f5] bg-white text-[#424656] hover:bg-[#f9f9ff]'
              }`}
              onClick={() => setStep(itemStep as 1 | 2)}
              disabled={isSaving}
            >
              Etapa {itemStep}
            </button>
          ))}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          {saveError ? (
            <div className="mb-4 rounded-lg border border-[#fde1e1] bg-[#fff7f7] px-4 py-3 text-sm font-medium text-[#8f1111]">
              {saveError}
            </div>
          ) : null}

          {step === 1 ? (
            <div className="space-y-4">
              <label className="block">
                <span className="text-sm font-medium text-[#424656]">Cliente</span>
                <select
                  className="mt-2 h-11 w-full rounded-lg border border-[#dfe4f5] bg-white px-3 text-sm text-[#141b2b] outline-none focus:border-[#0050cb]"
                  value={draft.customerId}
                  onChange={(event) => {
                    const customer = customerOptions.find((item) => item.id === event.target.value)

                    onUpdate({
                      ...draft,
                      customerId: customer?.id ?? '',
                      customerName: customer?.name ?? '',
                    })
                  }}
                  disabled={isSaving}
                >
                  {customerOptions.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-medium text-[#424656]">Data da venda</span>
                <input
                  className="mt-2 h-11 w-full rounded-lg border border-[#dfe4f5] bg-white px-3 text-sm text-[#141b2b] outline-none focus:border-[#0050cb]"
                  type="date"
                  value={draft.saleDate}
                  onChange={(event) => onUpdate({ ...draft, saleDate: event.target.value })}
                  disabled={isSaving}
                />
              </label>

              <div>
                <span className="text-sm font-medium text-[#424656]">Tipo de pagamento</span>
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {paymentOptions.map(({ value: type, label }) => (
                    <button
                      key={type}
                      type="button"
                      className={`h-10 min-w-0 rounded-lg px-2 text-sm font-semibold ${
                        draft.paymentType === type
                          ? 'bg-[#eaf1ff] text-[#0050cb] shadow-[inset_0_0_0_1px_rgba(0,80,203,0.18)]'
                          : 'border border-[#dfe4f5] bg-white text-[#424656] hover:bg-[#f9f9ff]'
                      }`}
                      onClick={() =>
                        onUpdate({
                          ...draft,
                          paymentType: type,
                          paymentStatus:
                            type === 'DEBIT_CARD' ? 'APPROVED' : draft.paymentStatus,
                          installments:
                            type === 'CREDIT_CARD' ? (draft.installments ?? 1) : undefined,
                          billingDay:
                            type === 'CREDIT_CARD' ? (draft.billingDay ?? 1) : undefined,
                        })
                      }
                      disabled={isSaving}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {draft.paymentType === 'CREDIT_CARD' ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-medium text-[#424656]">Parcelas</span>
                    <input
                      className="mt-2 h-11 w-full rounded-lg border border-[#dfe4f5] bg-white px-3 text-sm text-[#141b2b] outline-none focus:border-[#0050cb]"
                      min="1"
                      max="24"
                      type="number"
                      value={draft.installments ?? 1}
                      onChange={(event) =>
                        onUpdate({
                          ...draft,
                          installments: Math.min(24, Math.max(1, Number(event.target.value) || 1)),
                        })
                      }
                      disabled={isSaving}
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-[#424656]">Dia de cobranca</span>
                    <input
                      className="mt-2 h-11 w-full rounded-lg border border-[#dfe4f5] bg-white px-3 text-sm text-[#141b2b] outline-none focus:border-[#0050cb]"
                      min="1"
                      max="31"
                      type="number"
                      value={draft.billingDay ?? 1}
                      onChange={(event) =>
                        onUpdate({
                          ...draft,
                          billingDay: Math.min(31, Math.max(1, Number(event.target.value) || 1)),
                        })
                      }
                      disabled={isSaving}
                    />
                  </label>
                </div>
              ) : null}

              <div>
                <span className="text-sm font-medium text-[#424656]">Status</span>
                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {(['APPROVED', 'PENDING', 'CANCELED'] as PaymentStatus[]).map((status) => (
                    <button
                      key={status}
                      type="button"
                      className={`h-10 min-w-0 rounded-lg px-2 text-sm font-semibold ${
                        draft.paymentStatus === status
                          ? 'bg-[#eaf1ff] text-[#0050cb] shadow-[inset_0_0_0_1px_rgba(0,80,203,0.18)]'
                          : 'border border-[#dfe4f5] bg-white text-[#424656] hover:bg-[#f9f9ff]'
                      }`}
                      onClick={() => onUpdate({ ...draft, paymentStatus: status })}
                      disabled={isSaving || (draft.paymentType === 'DEBIT_CARD' && status !== 'APPROVED')}
                    >
                      {statusLabels[status]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {draft.items.map((item, index) => (
                <div key={item.id} className="min-w-0 rounded-xl border border-[#dfe4f5] p-4">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <h3 className="font-[Geist,Inter,sans-serif] text-sm font-semibold text-[#141b2b]">
                      Item {index + 1}
                    </h3>
                    <button
                      type="button"
                      className="grid size-8 place-items-center rounded-lg border border-[#dfe4f5] bg-white text-[#424656] hover:bg-[#f9f9ff] disabled:cursor-not-allowed disabled:bg-[#f4f6fb]"
                      onClick={() => removeItem(item.id)}
                      disabled={isSaving || draft.items.length === 1}
                      aria-label={`Remover item ${index + 1}`}
                    >
                      <span className="material-symbols-rounded text-[18px]" aria-hidden="true">
                        delete
                      </span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    <label className="block">
                      <span className="text-sm font-medium text-[#424656]">Produto</span>
                      <input
                        className="mt-2 h-11 w-full rounded-lg border border-[#dfe4f5] bg-white px-3 text-sm text-[#141b2b] outline-none focus:border-[#0050cb]"
                        value={item.product}
                        onChange={(event) => updateItem(item.id, { product: event.target.value })}
                        disabled={isSaving}
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm font-medium text-[#424656]">Especificacoes</span>
                      <input
                        className="mt-2 h-11 w-full rounded-lg border border-[#dfe4f5] bg-white px-3 text-sm text-[#141b2b] outline-none focus:border-[#0050cb]"
                        value={item.specs}
                        onChange={(event) => updateItem(item.id, { specs: event.target.value })}
                        disabled={isSaving}
                      />
                    </label>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <label className="block">
                        <span className="text-sm font-medium text-[#424656]">Qtd.</span>
                        <input
                          className="mt-2 h-11 w-full rounded-lg border border-[#dfe4f5] bg-white px-3 text-sm text-[#141b2b] outline-none focus:border-[#0050cb]"
                          min="1"
                          type="number"
                          value={item.quantity}
                          onChange={(event) =>
                            updateItem(item.id, {
                              quantity: Math.max(1, Number(event.target.value) || 1),
                            })
                          }
                          disabled={isSaving}
                        />
                      </label>
                      <label className="block">
                        <span className="text-sm font-medium text-[#424656]">Custo</span>
                        <input
                          className="mt-2 h-11 w-full rounded-lg border border-[#dfe4f5] bg-white px-3 text-sm text-[#141b2b] outline-none focus:border-[#0050cb]"
                          inputMode="decimal"
                          placeholder="0,00"
                          value={toReais(item.costInCents)}
                          onChange={(event) =>
                            updateItem(item.id, { costInCents: fromReais(event.target.value) })
                          }
                          disabled={isSaving}
                        />
                      </label>
                      <label className="block">
                        <span className="text-sm font-medium text-[#424656]">Venda</span>
                        <input
                          className="mt-2 h-11 w-full rounded-lg border border-[#dfe4f5] bg-white px-3 text-sm text-[#141b2b] outline-none focus:border-[#0050cb]"
                          inputMode="decimal"
                          placeholder="0,00"
                          value={toReais(item.salePriceInCents)}
                          onChange={(event) =>
                            updateItem(item.id, {
                              salePriceInCents: fromReais(event.target.value),
                            })
                          }
                          disabled={isSaving}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-[#dfe4f5] bg-white px-3 text-sm font-medium text-[#424656] hover:bg-[#f9f9ff] disabled:cursor-not-allowed disabled:bg-[#f4f6fb]"
                onClick={() => onUpdate({ ...draft, items: [...draft.items, emptyItem()] })}
                disabled={isSaving}
              >
                <span className="material-symbols-rounded text-[18px]" aria-hidden="true">
                  add
                </span>
                Adicionar item
              </button>
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-[#edf0fa] px-5 py-4">
          <div className="mb-4 grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-[#727687]">Subtotal</p>
              <p className="mt-1 font-[Geist,Inter,sans-serif] font-semibold text-[#141b2b]">
                {currency(draftTotals.subtotal)}
              </p>
            </div>
            <div>
              <p className="text-[#727687]">Custo total</p>
              <p className="mt-1 font-[Geist,Inter,sans-serif] font-semibold text-[#141b2b]">
                {currency(draftTotals.cost)}
              </p>
            </div>
            <div>
              <p className="text-[#727687]">Lucro estimado</p>
              <p className="mt-1 font-[Geist,Inter,sans-serif] font-semibold text-[#0b7a3b]">
                {currency(draftTotals.profit)}
              </p>
            </div>
            <div>
              <p className="text-[#727687]">Margem</p>
              <p className="mt-1 font-[Geist,Inter,sans-serif] font-semibold text-[#141b2b]">
                {draftTotals.margin.toFixed(1).replace('.', ',')}%
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              className="h-10 rounded-lg border border-[#dfe4f5] bg-white px-3 text-sm font-medium text-[#424656] hover:bg-[#f9f9ff] disabled:cursor-not-allowed disabled:bg-[#f4f6fb]"
              onClick={step === 1 ? closeWithAnimation : () => setStep(1)}
              disabled={isSaving}
            >
              {step === 1 ? 'Cancelar' : 'Voltar'}
            </button>
            <button
              type="button"
              className="h-10 rounded-lg bg-[#0050cb] px-3 text-sm font-medium text-white shadow-sm hover:bg-[#003fa4] disabled:cursor-not-allowed disabled:bg-[#9ca1b2]"
              onClick={step === 1 ? () => setStep(2) : onSave}
              disabled={(step === 2 && !canSave) || isSaving}
            >
              {step === 1 ? 'Continuar' : isSaving ? 'Salvando...' : 'Finalizar'}
            </button>
          </div>
        </div>
      </aside>
    </div>
  )
}

export default function Sales() {
  const [draft, setDraft] = useState<SaleFormDraft | null>(null)
  const [drawerStep, setDrawerStep] = useState<1 | 2>(1)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [filterDraft, setFilterDraft] = useState<SalesFilterState>(emptyFilters)
  const [appliedFilters, setAppliedFilters] = useState<SalesFilterState>(emptyFilters)
  const salesParams = useMemo(
    () => ({
      page,
      limit: 10,
      start: appliedFilters.start || undefined,
      end: appliedFilters.end || undefined,
      status: appliedFilters.status || undefined,
      paymentType: appliedFilters.paymentType || undefined,
      customerId: appliedFilters.customerId ? Number(appliedFilters.customerId) : undefined,
      search: appliedFilters.search.trim() || undefined,
    }),
    [appliedFilters, page],
  )
  const salesQuery = useSales(salesParams)
  const customersQuery = useCustomers({ limit: 100 })
  const createSale = useCreateSale()
  const updateStatus = useUpdateSaleStatus()
  const deleteSale = useDeleteSale()
  const customerOptions = useMemo(
    () => customerOptionsFromResponse(customersQuery.data?.items),
    [customersQuery.data?.items],
  )
  const sales = useMemo(
    () => (salesQuery.data?.items ?? []).map(mapSaleResponse),
    [salesQuery.data?.items],
  )
  const metrics = useMemo(() => buildSalesMetrics(salesQuery.data?.summary), [salesQuery.data])
  const hasCustomers = customerOptions.length > 0
  const canCreateSale = !customersQuery.isLoading && !customersQuery.isError && hasCustomers
  const isInitialLoading = salesQuery.isLoading || customersQuery.isLoading
  const listError = salesQuery.isError
    ? getErrorMessage(salesQuery.error, 'Nao foi possivel carregar as vendas.')
    : customersQuery.isError
      ? getErrorMessage(customersQuery.error, 'Nao foi possivel carregar os clientes.')
      : undefined
  const mutationError =
    updateStatus.isError || deleteSale.isError
      ? getErrorMessage(
          updateStatus.error ?? deleteSale.error,
          'Nao foi possivel salvar a alteracao.',
        )
      : undefined
  const createError = createSale.isError
    ? getErrorMessage(createSale.error, 'Nao foi possivel criar a venda.')
    : undefined
  const isActionPending = createSale.isPending || updateStatus.isPending || deleteSale.isPending

  useEffect(() => {
    const totalPages = salesQuery.data?.totalPages ?? 0

    if (totalPages > 0 && page > totalPages) {
      setPage(totalPages)
    }
  }, [page, salesQuery.data?.totalPages])

  function openNewSale() {
    const firstCustomer = customerOptions[0]

    if (!firstCustomer) {
      return
    }

    createSale.reset()
    setDraft({
      customerId: firstCustomer.id,
      customerName: firstCustomer.name,
      saleDate: new Date().toISOString().slice(0, 10),
      paymentType: 'PIX',
      paymentStatus: 'PENDING',
      installments: undefined,
      billingDay: undefined,
      items: [emptyItem()],
    })
    setDrawerStep(1)
  }

  function saveDraft() {
    if (!draft || createSale.isPending) {
      return
    }

    createSale.mutate(buildSaleRequest(draft), {
      onSuccess: () => {
        setDraft(null)
      },
    })
  }

  function changeStatus(sale: SaleRow, status: PaymentStatus) {
    const id = Number(sale.id)

    if (Number.isFinite(id) && status !== sale.paymentStatus) {
      updateStatus.mutate({ id, status })
    }
  }

  function removeSale(sale: SaleRow) {
    const id = Number(sale.id)

    if (Number.isFinite(id)) {
      deleteSale.mutate(id)
    }
  }

  function applyFilters() {
    setAppliedFilters(filterDraft)
    setPage(1)
  }

  function clearFilters() {
    setFilterDraft(emptyFilters)
    setAppliedFilters(emptyFilters)
    setPage(1)
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="mt-2 font-[Geist,Inter,sans-serif] text-[28px] font-semibold leading-[34px] text-[#141b2b] sm:text-4xl sm:leading-[44px]">
            Vendas
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#424656] sm:text-base">
            Vendas, pagamentos e lucros.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={`flex h-10 items-center gap-2 rounded-lg border px-3 text-sm font-medium ${
              filtersOpen
                ? 'border-[#0050cb] bg-[#eaf1ff] text-[#0050cb]'
                : 'border-[#dfe4f5] bg-white text-[#424656] hover:bg-[#f9f9ff]'
            }`}
            onClick={() => setFiltersOpen((current) => !current)}
          >
            <span className="material-symbols-rounded text-[19px]" aria-hidden="true">
              filter_list
            </span>
            Filtros
          </button>
          <button
            type="button"
            className="flex h-10 items-center gap-2 rounded-lg bg-[#0050cb] px-3 text-sm font-medium text-white shadow-sm hover:bg-[#003fa4] disabled:cursor-not-allowed disabled:bg-[#9ca1b2]"
            disabled={!canCreateSale || createSale.isPending}
            onClick={openNewSale}
            title={hasCustomers ? 'Nova venda' : 'Cadastre um cliente para vender'}
          >
            <span className="material-symbols-rounded text-[19px]" aria-hidden="true">
              add
            </span>
            Nova Venda
          </button>
        </div>
      </section>

      {listError ? (
        <div className="rounded-lg border border-[#fde1e1] bg-[#fff7f7] px-4 py-3 text-sm font-medium text-[#8f1111]">
          {listError}
        </div>
      ) : null}

      {mutationError ? (
        <div className="rounded-lg border border-[#fde1e1] bg-[#fff7f7] px-4 py-3 text-sm font-medium text-[#8f1111]">
          {mutationError}
        </div>
      ) : null}

      {!customersQuery.isLoading && !customersQuery.isError && !hasCustomers ? (
        <div className="rounded-lg border border-[#fff0cf] bg-[#fffaf0] px-4 py-3 text-sm font-medium text-[#7a4a00]">
          Cadastre um cliente antes de registrar uma venda.
        </div>
      ) : null}

      {filtersOpen ? (
        <SalesFilterPanel
          customers={customerOptions}
          filters={filterDraft}
          onApply={applyFilters}
          onClear={clearFilters}
          onUpdate={setFilterDraft}
        />
      ) : null}

      {isInitialLoading ? (
        <div className="rounded-lg border border-[#dfe4f5] bg-white px-4 py-3 text-sm font-medium text-[#424656]">
          Carregando vendas...
        </div>
      ) : null}

      {!isInitialLoading && !listError ? (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {metrics.map((metric) => (
              <SalesMetricCard key={metric.label} metric={metric} />
            ))}
          </section>

          {sales.length > 0 ? (
            <div className="space-y-3">
              <SalesTable
                isActionPending={isActionPending}
                sales={sales}
                onDelete={removeSale}
                onStatusChange={changeStatus}
              />
              <SalesPagination
                isLoading={salesQuery.isFetching}
                page={salesQuery.data?.page ?? page}
                totalItems={salesQuery.data?.totalItems ?? 0}
                totalPages={salesQuery.data?.totalPages ?? 0}
                onPageChange={setPage}
              />
            </div>
          ) : (
            <EmptySalesState canCreate={canCreateSale} onCreate={openNewSale} />
          )}
        </>
      ) : null}

      {draft ? (
        <SaleDrawer
          customerOptions={customerOptions}
          draft={draft}
          isSaving={createSale.isPending}
          onClose={() => setDraft(null)}
          onSave={saveDraft}
          onUpdate={setDraft}
          saveError={createError}
          step={drawerStep}
          setStep={setDrawerStep}
        />
      ) : null}
    </div>
  )
}
