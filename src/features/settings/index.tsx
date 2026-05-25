import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDeleteOwnAccount, useMe } from '../../services/api/hooks'

function dateTimeLabel(value?: string) {
  if (!value) {
    return 'Nao registrado'
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}

export default function Settings() {
  const navigate = useNavigate()
  const me = useMe()
  const deleteOwnAccount = useDeleteOwnAccount()
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteConfirmation, setDeleteConfirmation] = useState(false)

  function submitDeleteAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    deleteOwnAccount.mutate(
      { password: deletePassword },
      {
        onSuccess: () => navigate('/login', { replace: true }),
      },
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.08em] text-[#727687]">
          Configuracoes
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-[#141b2b]">Configuracoes da Conta</h1>
      </div>

      {deleteOwnAccount.isError ? (
        <div className="rounded-lg border border-[#fde1e1] bg-[#fff7f7] px-4 py-3 text-sm font-medium text-[#8f1111]">
          Nao foi possivel excluir a conta. Confira sua senha e tente novamente.
        </div>
      ) : null}

      <section className="rounded-lg border border-[#dfe4f5] bg-white p-5 shadow-sm">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
          <div>
            <h2 className="text-lg font-semibold text-[#141b2b]">Conta</h2>
            <p className="mt-2 text-sm leading-6 text-[#424656]">
              {me.data?.email || 'Carregando...'}
            </p>
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs font-medium text-[#727687]">
            <Link to="/privacidade" className="hover:text-[#0050cb] hover:underline">
              Politica de Privacidade
            </Link>
            <Link to="/termos" className="hover:text-[#0050cb] hover:underline">
              Termos de Uso
            </Link>
          </div>
        </div>

        <dl className="mt-6 grid gap-4 border-t border-[#edf0fa] pt-5 text-sm md:grid-cols-2">
          <div>
            <dt className="font-medium text-[#424656]">Politica de Privacidade</dt>
            <dd className="mt-1 text-[#727687]">
              Versao {me.data?.privacyPolicyVersion || 'Nao registrada'} aceita em{' '}
              {dateTimeLabel(me.data?.privacyAcceptedAt)}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-[#424656]">Termos de Uso</dt>
            <dd className="mt-1 text-[#727687]">
              Versao {me.data?.termsVersion || 'Nao registrada'} aceita em{' '}
              {dateTimeLabel(me.data?.termsAcceptedAt)}
            </dd>
          </div>
        </dl>
      </section>

      <section className="rounded-lg border border-[#f2c6c6] bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <h2 className="text-lg font-semibold text-[#141b2b]">Zona de perigo</h2>
            <p className="mt-2 text-sm leading-6 text-[#424656]">
              Excluir a conta remove permanentemente clientes, vendas, parcelas, alertas e dados
              vinculados ao usuario.
            </p>
          </div>
          <form className="w-full max-w-md space-y-3" onSubmit={submitDeleteAccount}>
            <label className="block">
              <span className="text-sm font-medium text-[#424656]">Senha atual</span>
              <input
                type="password"
                className="mt-2 h-11 w-full rounded-lg border border-[#dfe4f5] bg-white px-3 text-sm text-[#141b2b] outline-none focus:border-[#ba1a1a]"
                value={deletePassword}
                onChange={(event) => setDeletePassword(event.target.value)}
                autoComplete="current-password"
              />
            </label>
            <label className="flex items-start gap-3 text-sm leading-6 text-[#424656]">
              <input
                type="checkbox"
                className="mt-1 size-4 rounded border-[#c7cede] text-[#ba1a1a]"
                checked={deleteConfirmation}
                onChange={(event) => setDeleteConfirmation(event.target.checked)}
              />
              Confirmo que desejo excluir permanentemente minha conta e encerrar a sessao.
            </label>
            <button
              type="submit"
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#ba1a1a] px-3 text-sm font-medium text-white shadow-sm hover:bg-[#8f1111] disabled:cursor-not-allowed disabled:bg-[#c9cdd8]"
              disabled={!deletePassword || !deleteConfirmation || deleteOwnAccount.isPending}
            >
              <span className="material-symbols-rounded text-[19px]" aria-hidden="true">
                delete_forever
              </span>
              {deleteOwnAccount.isPending ? 'Excluindo...' : 'Excluir minha conta'}
            </button>
          </form>
        </div>
      </section>
    </div>
  )
}
