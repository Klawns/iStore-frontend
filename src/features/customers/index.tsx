import { useEffect, useMemo, useState } from 'react'
import {
  useCreateCustomer,
  useCustomers,
  useDeleteCustomer,
  useUpdateCustomer,
} from '../../services/api/hooks'
import type {
  CustomerListSummaryResponse,
  PaymentStatus,
  PaymentType,
} from '../../services/api/types'
import {
  initialCustomers,
  type CustomerFormDraft,
  type CustomerMetricData,
  type CustomerRow,
} from './mock'

const metricToneClasses: Record<CustomerMetricData['tone'], string> = {
  blue: 'bg-[#eaf1ff] text-[#0050cb]',
  green: 'bg-[#eaf8ef] text-[#0b7a3b]',
  violet: 'bg-[#eeeeff] text-[#4648d4]',
}

const emptyDraft = (): CustomerFormDraft => ({
  name: '',
  phone: '',
})

function currency(valueInCents: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valueInCents / 100)
}

function averageTicket(customer: CustomerRow) {
  return customer.salesCount > 0 ? Math.round(customer.revenueInCents / customer.salesCount) : 0
}

type CustomerFilterState = {
  start: string
  end: string
  status: '' | PaymentStatus
  paymentType: '' | PaymentType
  search: string
}

const emptyFilters: CustomerFilterState = {
  start: '',
  end: '',
  status: '',
  paymentType: '',
  search: '',
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

function phoneLabel(phone: string) {
  const digits = phone.replace(/\D/g, '')

  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
  }

  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  }

  return phone
}

function buildMetrics(summary?: CustomerListSummaryResponse, fallbackCustomers?: CustomerRow[]): CustomerMetricData[] {
  const totalCustomers = summary?.totalCustomers ?? fallbackCustomers?.length ?? 0
  const totalSales =
    summary?.salesCount ?? fallbackCustomers?.reduce((sum, customer) => sum + customer.salesCount, 0) ?? 0
  const totalRevenue =
    summary?.revenue ?? fallbackCustomers?.reduce((sum, customer) => sum + customer.revenueInCents, 0) ?? 0
  const averageTicketInCents = summary?.averageTicket ?? (totalSales > 0 ? Math.round(totalRevenue / totalSales) : 0)
  const repeatRate =
    summary?.repeatRate ??
    (fallbackCustomers && totalCustomers > 0
      ? Math.round((fallbackCustomers.filter((customer) => customer.salesCount > 1).length / totalCustomers) * 100)
      : 0)

  return [
    {
      label: 'Total de Clientes',
      value: String(totalCustomers),
      icon: 'groups',
      tone: 'blue',
    },
    {
      label: 'Ticket Medio',
      value: currency(averageTicketInCents),
      icon: 'receipt_long',
      tone: 'violet',
    },
    {
      label: 'Taxa de Recompra',
      value: `${repeatRate}%`,
      icon: 'trending_up',
      tone: 'green',
    },
  ]
}

function CustomerMetricCard({ metric }: { metric: CustomerMetricData }) {
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

function CustomersTable({
  customers,
  isActionPending,
  isApiBacked,
  onDelete,
  onEdit,
  page,
  totalPages,
  onPreviousPage,
  onNextPage,
}: {
  customers: CustomerRow[]
  isActionPending: boolean
  isApiBacked: boolean
  onDelete: (customer: CustomerRow) => void
  onEdit: (customer: CustomerRow) => void
  page: number
  totalPages: number
  onPreviousPage: () => void
  onNextPage: () => void
}) {
  return (
    <section className="rounded-xl border border-[#dfe4f5] bg-white shadow-[0_1px_3px_rgba(20,27,43,0.05)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#edf0fa] px-5 py-4">
        <div>
          <h2 className="font-[Geist,Inter,sans-serif] text-lg font-semibold text-[#141b2b]">
            Base de Clientes
          </h2>
          <p className="mt-1 text-sm text-[#727687]">Lista de clientes</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] border-collapse text-left">
          <thead>
            <tr className="text-xs font-semibold uppercase tracking-[0.05em] text-[#727687]">
              <th className="px-5 py-3">Cliente</th>
              <th className="px-5 py-3">Telefone</th>
              <th className="px-5 py-3">Faturamento</th>
              <th className="px-5 py-3">Lucro estimado</th>
              <th className="px-5 py-3">Ticket medio</th>
              <th className="px-5 py-3 text-right">Acoes</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id} className="border-t border-[#edf0fa] hover:bg-[#f9f9ff]">
                <td className="px-5 py-4">
                  <div className="font-medium text-[#141b2b]">{customer.name}</div>
                </td>
                <td className="px-5 py-4 text-sm font-medium text-[#424656]">
                  {phoneLabel(customer.phone)}
                </td>
                <td className="px-5 py-4 font-[Geist,Inter,sans-serif] text-sm font-semibold text-[#141b2b]">
                  {currency(customer.revenueInCents)}
                </td>
                <td className="px-5 py-4 font-[Geist,Inter,sans-serif] text-sm font-semibold text-[#0b7a3b]">
                  {currency(customer.profitInCents)}
                </td>
                <td className="px-5 py-4 font-[Geist,Inter,sans-serif] text-sm font-semibold text-[#141b2b]">
                  {currency(averageTicket(customer))}
                </td>
                <td className="px-5 py-4">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      className="grid size-9 place-items-center rounded-lg border border-[#dfe4f5] bg-white text-[#424656] hover:bg-[#f1f3ff] hover:text-[#0050cb] disabled:cursor-not-allowed disabled:bg-[#f4f6fb] disabled:text-[#9ca1b2]"
                      aria-label={`Editar ${customer.name}`}
                      disabled={!isApiBacked || isActionPending}
                      onClick={() => onEdit(customer)}
                      title="Editar cliente"
                    >
                      <span className="material-symbols-rounded text-[19px]" aria-hidden="true">
                        edit
                      </span>
                    </button>
                    <button
                      type="button"
                      className="grid size-9 place-items-center rounded-lg border border-[#dfe4f5] bg-white text-[#424656] hover:bg-[#fff7f7] hover:text-[#ba1a1a] disabled:cursor-not-allowed disabled:bg-[#f4f6fb] disabled:text-[#9ca1b2]"
                      aria-label={`Excluir ${customer.name}`}
                      disabled={!isApiBacked || isActionPending}
                      onClick={() => onDelete(customer)}
                      title="Excluir cliente"
                    >
                      <span className="material-symbols-rounded text-[19px]" aria-hidden="true">
                        delete
                      </span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#edf0fa] px-5 py-4">
        <p className="text-sm font-medium text-[#727687]">
          Pagina {totalPages > 0 ? page : 0} de {totalPages}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            className="h-9 rounded-lg border border-[#dfe4f5] bg-white px-3 text-sm font-medium text-[#424656] hover:bg-[#f9f9ff] disabled:cursor-not-allowed disabled:bg-[#f4f6fb] disabled:text-[#9ca1b2]"
            disabled={page <= 1 || totalPages === 0}
            onClick={onPreviousPage}
          >
            Anterior
          </button>
          <button
            type="button"
            className="h-9 rounded-lg border border-[#dfe4f5] bg-white px-3 text-sm font-medium text-[#424656] hover:bg-[#f9f9ff] disabled:cursor-not-allowed disabled:bg-[#f4f6fb] disabled:text-[#9ca1b2]"
            disabled={totalPages === 0 || page >= totalPages}
            onClick={onNextPage}
          >
            Proxima
          </button>
        </div>
      </div>
    </section>
  )
}

function CustomerFiltersPanel({
  draft,
  onApply,
  onClear,
  onUpdate,
}: {
  draft: CustomerFilterState
  onApply: () => void
  onClear: () => void
  onUpdate: (draft: CustomerFilterState) => void
}) {
  return (
    <section className="rounded-xl border border-[#dfe4f5] bg-white p-4 shadow-[0_1px_3px_rgba(20,27,43,0.05)]">
      <div className="grid gap-3 md:grid-cols-5">
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.05em] text-[#727687]">
            Busca
          </span>
          <input
            className="mt-2 h-10 w-full rounded-lg border border-[#dfe4f5] bg-white px-3 text-sm text-[#141b2b] outline-none focus:border-[#0050cb]"
            value={draft.search}
            onChange={(event) => onUpdate({ ...draft, search: event.target.value })}
            placeholder="Nome ou telefone"
          />
        </label>
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
              onUpdate({ ...draft, status: event.target.value as CustomerFilterState['status'] })
            }
          >
            <option value="">Todos</option>
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
                paymentType: event.target.value as CustomerFilterState['paymentType'],
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

function CustomerDrawer({
  draft,
  onClose,
  onSave,
  onUpdate,
}: {
  draft: CustomerFormDraft
  onClose: () => void
  onSave: () => void
  onUpdate: (draft: CustomerFormDraft) => void
}) {
  const [isVisible, setIsVisible] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const canSave = draft.name.trim().length > 0 && draft.phone.trim().length > 0
  const isEditing = typeof draft.id === 'number'

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setIsVisible(true))

    return () => window.cancelAnimationFrame(frame)
  }, [])

  function closeWithAnimation(afterClose?: () => void) {
    if (isClosing) {
      return
    }

    setIsClosing(true)
    setIsVisible(false)

    window.setTimeout(() => {
      afterClose?.()
      onClose()
    }, 220)
  }

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      <button
        type="button"
        className={`fixed inset-0 bg-[#141b2b]/45 transition-opacity duration-200 ease-out ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={() => closeWithAnimation()}
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
              {isEditing ? 'Editar cliente' : 'Novo cliente'}
            </p>
            <h2 className="mt-1 font-[Geist,Inter,sans-serif] text-xl font-semibold text-[#141b2b]">
              Dados do cliente
            </h2>
          </div>
          <button
            type="button"
            className="grid size-9 place-items-center rounded-lg border border-[#dfe4f5] bg-white text-[#424656] hover:bg-[#f9f9ff]"
            onClick={() => closeWithAnimation()}
            aria-label="Fechar"
          >
            <span className="material-symbols-rounded text-[20px]" aria-hidden="true">
              close
            </span>
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          <div className="space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-[#424656]">Nome</span>
              <input
                className="mt-2 h-11 w-full rounded-lg border border-[#dfe4f5] bg-white px-3 text-sm text-[#141b2b] outline-none focus:border-[#0050cb]"
                value={draft.name}
                onChange={(event) => onUpdate({ ...draft, name: event.target.value })}
                placeholder="Nome do cliente"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-[#424656]">Telefone</span>
              <input
                className="mt-2 h-11 w-full rounded-lg border border-[#dfe4f5] bg-white px-3 text-sm text-[#141b2b] outline-none focus:border-[#0050cb]"
                inputMode="tel"
                value={draft.phone}
                onChange={(event) => onUpdate({ ...draft, phone: event.target.value })}
                placeholder="(00) 00000-0000"
              />
            </label>
          </div>
        </div>

        <div className="shrink-0 border-t border-[#edf0fa] px-5 py-4">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              className="h-10 rounded-lg border border-[#dfe4f5] bg-white px-3 text-sm font-medium text-[#424656] hover:bg-[#f9f9ff]"
              onClick={() => closeWithAnimation()}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="h-10 rounded-lg bg-[#0050cb] px-3 text-sm font-medium text-white shadow-sm hover:bg-[#003fa4] disabled:cursor-not-allowed disabled:bg-[#9ca1b2]"
              onClick={() => closeWithAnimation(onSave)}
              disabled={!canSave}
            >
              {isEditing ? 'Atualizar' : 'Salvar'}
            </button>
          </div>
        </div>
      </aside>
    </div>
  )
}

export default function Customers() {
  const [draft, setDraft] = useState<CustomerFormDraft | null>(null)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [filterDraft, setFilterDraft] = useState<CustomerFilterState>(emptyFilters)
  const [appliedFilters, setAppliedFilters] = useState<CustomerFilterState>(emptyFilters)
  const customerParams = useMemo(
    () => ({
      page,
      limit: 10,
      start: appliedFilters.start || undefined,
      end: appliedFilters.end || undefined,
      status: appliedFilters.status || undefined,
      paymentType: appliedFilters.paymentType || undefined,
      search: appliedFilters.search.trim() || undefined,
    }),
    [appliedFilters, page],
  )
  const customersQuery = useCustomers(customerParams)
  const createCustomer = useCreateCustomer()
  const updateCustomer = useUpdateCustomer()
  const deleteCustomer = useDeleteCustomer()
  const isApiBacked = Boolean(customersQuery.data)
  const customers: CustomerRow[] = useMemo(() => {
    if (!customersQuery.data) {
      return initialCustomers
    }

    return customersQuery.data.items.map((customer) => ({
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      salesCount: customer.salesCount,
      revenueInCents: customer.revenue,
      profitInCents: customer.profit,
    }))
  }, [customersQuery.data])
  const metrics = useMemo(
    () => buildMetrics(customersQuery.data?.summary, customers),
    [customers, customersQuery.data?.summary],
  )
  const totalPages = customersQuery.data?.totalPages ?? (customersQuery.data ? 0 : 1)

  function saveDraft() {
    if (!draft) {
      return
    }

    const payload = {
      name: draft.name.trim() || 'Cliente sem nome',
      phone: draft.phone.trim(),
    }

    if (typeof draft.id === 'number') {
      updateCustomer.mutate({ id: draft.id, payload })
    } else {
      createCustomer.mutate(payload)
    }
    setDraft(null)
  }

  function editCustomer(customer: CustomerRow) {
    setDraft({
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
    })
  }

  function removeCustomer(customer: CustomerRow) {
    deleteCustomer.mutate(customer.id)
  }

  const isActionPending =
    createCustomer.isPending || updateCustomer.isPending || deleteCustomer.isPending

  useEffect(() => {
    const pages = customersQuery.data?.totalPages ?? 0

    if (pages > 0 && page > pages) {
      setPage(pages)
    }
  }, [customersQuery.data?.totalPages, page])

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
            Clientes
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#424656] sm:text-base">
            Clientes e resultados de venda.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="flex h-10 items-center gap-2 rounded-lg border border-[#dfe4f5] bg-white px-3 text-sm font-medium text-[#424656] hover:bg-[#f9f9ff]"
            onClick={() => setFiltersOpen((open) => !open)}
            aria-expanded={filtersOpen}
          >
            <span className="material-symbols-rounded text-[19px]" aria-hidden="true">
              filter_list
            </span>
            Filtros
          </button>
          <button
            type="button"
            className="flex h-10 items-center gap-2 rounded-lg bg-[#0050cb] px-3 text-sm font-medium text-white shadow-sm hover:bg-[#003fa4]"
            onClick={() => setDraft(emptyDraft())}
          >
            <span className="material-symbols-rounded text-[19px]" aria-hidden="true">
              add
            </span>
            Novo Cliente
          </button>
        </div>
      </section>

      {customersQuery.isError ||
      createCustomer.isError ||
      updateCustomer.isError ||
      deleteCustomer.isError ? (
        <div className="rounded-lg border border-[#fde1e1] bg-[#fff7f7] px-4 py-3 text-sm font-medium text-[#8f1111]">
          Nao foi possivel atualizar clientes.
        </div>
      ) : null}

      {customersQuery.isLoading || isActionPending ? (
        <div className="rounded-lg border border-[#dfe4f5] bg-white px-4 py-3 text-sm font-medium text-[#424656]">
          Carregando clientes...
        </div>
      ) : null}

      {filtersOpen ? (
        <CustomerFiltersPanel
          draft={filterDraft}
          onApply={applyFilters}
          onClear={clearFilters}
          onUpdate={setFilterDraft}
        />
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {metrics.map((metric) => (
          <CustomerMetricCard key={metric.label} metric={metric} />
        ))}
      </section>

      <CustomersTable
        customers={customers}
        isActionPending={isActionPending}
        isApiBacked={isApiBacked}
        onDelete={removeCustomer}
        onEdit={editCustomer}
        page={page}
        totalPages={totalPages}
        onPreviousPage={() => setPage((current) => Math.max(1, current - 1))}
        onNextPage={() => setPage((current) => current + 1)}
      />

      {draft ? (
        <CustomerDrawer
          draft={draft}
          onClose={() => setDraft(null)}
          onSave={saveDraft}
          onUpdate={setDraft}
        />
      ) : null}
    </div>
  )
}
