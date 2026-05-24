import type { OrderStatus } from '../mock'

const toneClasses: Record<OrderStatus['tone'], string> = {
  green: 'bg-[#12a150]',
  blue: 'bg-[#0050cb]',
  amber: 'bg-[#d97706]',
  red: 'bg-[#ba1a1a]',
}

type OrderStatusCardProps = {
  statuses: OrderStatus[]
}

export default function OrderStatusCard({ statuses }: OrderStatusCardProps) {
  return (
    <section className="rounded-xl border border-[#dfe4f5] bg-white p-5 shadow-[0_1px_3px_rgba(20,27,43,0.05)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-[Geist,Inter,sans-serif] text-lg font-semibold text-[#141b2b]">
            Status dos Pedidos
          </h2>
          <p className="mt-1 text-sm text-[#727687]">Resumo das vendas</p>
        </div>
        <div className="grid size-10 place-items-center rounded-lg bg-[#f1f3ff] text-[#0050cb]">
          <span className="material-symbols-rounded text-[22px]" aria-hidden="true">
            checklist
          </span>
        </div>
      </div>

      <div className="mt-6 space-y-5">
        {statuses.map((status) => (
          <div key={status.label}>
            <div className="mb-2 flex items-center justify-between gap-3 text-sm">
              <span className="font-medium text-[#424656]">{status.label}</span>
              <span className="font-[Geist,Inter,sans-serif] font-semibold text-[#141b2b]">
                {status.count}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[#edf0fa]">
              <div
                className={`h-full rounded-full ${toneClasses[status.tone]}`}
                style={{ width: `${status.percent}%` }}
                aria-label={`${status.label}: ${status.percent}%`}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
