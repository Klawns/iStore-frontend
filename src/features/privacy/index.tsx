import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDeleteOwnAccount, useMe, usePrivacyExport } from '../../services/api/hooks'

function dateTimeLabel(value?: string) {
  if (!value) {
    return 'Nao registrado'
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}

function downloadJson(payload: unknown) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `istore-lgpd-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export default function Privacy() {
  const navigate = useNavigate()
  const me = useMe()
  const deleteOwnAccount = useDeleteOwnAccount()
  const exportData = usePrivacyExport()
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteConfirmation, setDeleteConfirmation] = useState(false)

  function handleExport() {
    exportData.mutate(undefined, {
      onSuccess: (payload) => downloadJson(payload),
    })
  }

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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.08em] text-[#727687]">
            Privacidade
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-[#141b2b]">
            Dados e direitos LGPD
          </h1>
        </div>
        <button
          type="button"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#0050cb] px-3 text-sm font-medium text-white shadow-sm hover:bg-[#003fa4] disabled:cursor-not-allowed disabled:bg-[#9ca1b2]"
          onClick={handleExport}
          disabled={exportData.isPending}
        >
          <span className="material-symbols-rounded text-[19px]" aria-hidden="true">
            download
          </span>
          {exportData.isPending ? 'Exportando...' : 'Exportar JSON'}
        </button>
      </div>

      {exportData.isError || deleteOwnAccount.isError ? (
        <div className="rounded-lg border border-[#fde1e1] bg-[#fff7f7] px-4 py-3 text-sm font-medium text-[#8f1111]">
          {deleteOwnAccount.isError
            ? 'Nao foi possivel excluir a conta. Confira sua senha e tente novamente.'
            : 'Nao foi possivel exportar seus dados.'}
        </div>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(340px,420px)]">
        <div className="rounded-lg border border-[#dfe4f5] bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-[#141b2b]">Exportacao de dados</h2>
          <p className="mt-2 text-sm leading-6 text-[#424656]">
            Baixe um arquivo JSON com dados da conta, consentimentos, clientes e vendas vinculados
            ao seu usuario.
          </p>
          <button
            type="button"
            className="mt-4 inline-flex h-10 items-center gap-2 rounded-lg bg-[#0050cb] px-3 text-sm font-medium text-white shadow-sm hover:bg-[#003fa4] disabled:cursor-not-allowed disabled:bg-[#9ca1b2]"
            onClick={handleExport}
            disabled={exportData.isPending}
          >
            <span className="material-symbols-rounded text-[19px]" aria-hidden="true">
              file_download
            </span>
            {exportData.isPending ? 'Exportando...' : 'Baixar exportacao'}
          </button>
        </div>

        <div className="rounded-lg border border-[#dfe4f5] bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-[#141b2b]">Conta</h2>
          <p className="mt-2 text-sm leading-6 text-[#424656]">{me.data?.email}</p>
          <dl className="mt-4 space-y-3 text-sm">
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
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              to="/privacidade"
              className="rounded-lg border border-[#dfe4f5] px-4 py-2 text-sm font-semibold text-[#0050cb] hover:bg-[#f1f3ff]"
            >
              Politica de Privacidade
            </Link>
            <Link
              to="/termos"
              className="rounded-lg border border-[#dfe4f5] px-4 py-2 text-sm font-semibold text-[#0050cb] hover:bg-[#f1f3ff]"
            >
              Termos de Uso
            </Link>
          </div>
        </div>
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
