import type { MetricCardData } from '../types'

const toneClasses: Record<MetricCardData['tone'], string> = {
  blue: 'bg-[#eaf1ff] text-[#0050cb]',
  green: 'bg-[#eaf8ef] text-[#0b7a3b]',
  violet: 'bg-[#eeeeff] text-[#4648d4]',
  amber: 'bg-[#fff3df] text-[#9a5200]',
}

type MetricCardProps = {
  metric: MetricCardData
}

export default function MetricCard({ metric }: MetricCardProps) {
  const isDown = metric.trendDirection === 'down'
  const hasTrend = metric.trend || metric.description

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
        <div className={`grid size-11 shrink-0 place-items-center rounded-lg ${toneClasses[metric.tone]}`}>
          <span className="material-symbols-rounded text-[24px]" aria-hidden="true">
            {metric.icon}
          </span>
        </div>
      </div>

      {hasTrend ? (
        <div className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          {metric.trend ? (
            <span className={`font-semibold ${isDown ? 'text-[#ba1a1a]' : 'text-[#0b7a3b]'}`}>
              {metric.trend}
            </span>
          ) : null}
          {metric.description ? (
            <span className="text-[#727687]">{metric.description}</span>
          ) : null}
        </div>
      ) : null}
    </article>
  )
}
