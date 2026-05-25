import { NavLink, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useSignOut } from '../services/api/hooks'

export type NavItem = {
  id: string
  label: string
  icon: string
  to: string
  enabled?: boolean
}

type AppSidebarProps = {
  items: NavItem[]
  onNavigate?: () => void
}

export default function AppSidebar({ items, onNavigate }: AppSidebarProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const signOut = useSignOut()

  function handleSignOut() {
    signOut.mutate(undefined, {
      onSettled: () => {
        queryClient.clear()
        onNavigate?.()
        navigate('/login', { replace: true })
      },
    })
  }

  return (
    <aside className="flex h-full w-[260px] flex-col border-r border-[#dfe4f5] bg-white px-4 py-5 shadow-[0_1px_3px_rgba(20,27,43,0.05)]">
      <div className="flex items-center gap-3 px-2">
        <div className="grid size-10 place-items-center rounded-lg bg-[#0050cb] text-lg font-semibold text-white shadow-sm">
          iS
        </div>
        <div className="min-w-0">
          <div className="font-[Geist,Inter,sans-serif] text-lg font-semibold leading-6 text-[#141b2b]">
            iStore
          </div>
          <div className="text-xs font-medium uppercase tracking-[0.05em] text-[#727687]">
            Gestao de loja
          </div>
        </div>
      </div>

      <nav className="mt-9 flex flex-1 flex-col gap-1">
        {items.map((item) =>
          item.enabled === false ? (
            <span
              key={item.id}
              className="flex h-11 w-full cursor-default items-center gap-3 rounded-lg px-3 text-left text-sm font-medium text-[#9ca1b2] transition"
              aria-disabled="true"
            >
              <span className="material-symbols-rounded text-[21px] leading-none" aria-hidden="true">
                {item.icon}
              </span>
              <span>{item.label}</span>
            </span>
          ) : (
            <NavLink
              key={item.id}
              to={item.to}
              onClick={onNavigate}
              className={({ isActive }) =>
                `flex h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-medium transition ${
                  isActive
                    ? 'bg-[#eaf1ff] text-[#0050cb] shadow-[inset_0_0_0_1px_rgba(0,80,203,0.08)]'
                    : 'text-[#424656] hover:bg-[#f1f3ff] hover:text-[#141b2b]'
                }`
              }
            >
              <span className="material-symbols-rounded text-[21px] leading-none" aria-hidden="true">
                {item.icon}
              </span>
              <span>{item.label}</span>
            </NavLink>
          ),
        )}
      </nav>

      <button
        type="button"
        onClick={handleSignOut}
        disabled={signOut.isPending}
        className="mt-4 flex h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-medium text-[#424656] transition hover:bg-[#fff4f2] hover:text-[#c4382d] disabled:cursor-not-allowed disabled:text-[#9ca1b2]"
      >
        <span className="material-symbols-rounded text-[21px] leading-none" aria-hidden="true">
          {signOut.isPending ? 'progress_activity' : 'logout'}
        </span>
        <span>{signOut.isPending ? 'Saindo...' : 'Sair'}</span>
      </button>
    </aside>
  )
}
