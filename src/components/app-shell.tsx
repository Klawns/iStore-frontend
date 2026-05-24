import { useState, type ReactNode } from 'react'
import AppSidebar, { type NavItem } from './app-sidebar'

type AppShellProps = {
  children: ReactNode
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', to: '/dashboard' },
  { id: 'sales', label: 'Vendas', icon: 'shopping_bag', to: '/vendas' },
  { id: 'customers', label: 'Clientes', icon: 'groups', to: '/clientes' },
  { id: 'finance', label: 'Financeiro', icon: 'account_balance_wallet', to: '/financeiro' },
]

export default function AppShell({ children }: AppShellProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#f9f9ff] text-[#141b2b]">
      <div className="fixed inset-y-0 left-0 z-30 hidden lg:block">
        <AppSidebar items={navItems} />
      </div>

      <button
        type="button"
        className="fixed left-4 top-4 z-20 grid size-10 place-items-center rounded-lg border border-[#dfe4f5] bg-white text-[#141b2b] shadow-sm lg:hidden"
        onClick={() => setIsMobileMenuOpen(true)}
        aria-label="Abrir menu"
      >
        <span className="material-symbols-rounded text-[22px]" aria-hidden="true">
          menu
        </span>
      </button>

      {isMobileMenuOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-[#141b2b]/45"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="Fechar menu"
          />
          <div className="relative h-full w-[260px]">
            <AppSidebar items={navItems} onNavigate={() => setIsMobileMenuOpen(false)} />
          </div>
        </div>
      ) : null}

      <main className="lg:pl-[260px]">
        <div className="mx-auto max-w-[1440px] px-4 py-6 pt-18 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </div>
      </main>
    </div>
  )
}
