import type { ProductRow } from '../types'

type TopProductsTableProps = {
  products: ProductRow[]
}

export default function TopProductsTable({ products }: TopProductsTableProps) {
  return (
    <section className="rounded-xl border border-[#dfe4f5] bg-white shadow-[0_1px_3px_rgba(20,27,43,0.05)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#edf0fa] px-5 py-4">
        <div>
          <h2 className="font-[Geist,Inter,sans-serif] text-lg font-semibold text-[#141b2b]">
            Produtos em destaque
          </h2>
          <p className="mt-1 text-sm text-[#727687]">Mais vendidos no periodo</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px] border-collapse text-left">
          <thead>
            <tr className="text-xs font-semibold uppercase tracking-[0.05em] text-[#727687]">
              <th className="px-5 py-3">Produto</th>
              <th className="px-5 py-3">Quantidade</th>
              <th className="px-5 py-3">Receita</th>
              <th className="px-5 py-3">Tendencia</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.sku} className="border-t border-[#edf0fa] hover:bg-[#f9f9ff]">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-[#f1f3ff] text-[#0050cb]">
                      <span className="material-symbols-rounded text-[22px]" aria-hidden="true">
                        {product.icon}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-[#141b2b]">{product.name}</div>
                      <div className="mt-0.5 text-xs text-[#727687]">{product.sku}</div>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4 font-[Geist,Inter,sans-serif] text-sm font-medium text-[#424656]">
                  {product.quantity}
                </td>
                <td className="px-5 py-4 font-[Geist,Inter,sans-serif] text-sm font-semibold text-[#141b2b]">
                  {product.revenue}
                </td>
                <td className="px-5 py-4 text-sm font-semibold text-[#0b7a3b]">{product.trend}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
