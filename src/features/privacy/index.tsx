import { useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  useCreatePrivacyRequest,
  useDeleteOwnAccount,
  useMe,
  usePrivacyExport,
  usePrivacyRequests,
} from '../../services/api/hooks'
import type { PrivacyRequestType } from '../../services/api/types'

const requestTypes = [
  { value: 'ACCESS', label: 'Acesso' },
  { value: 'CORRECTION', label: 'Correcao' },
  { value: 'EXPORT', label: 'Exportacao' },
  { value: 'PORTABILITY', label: 'Portabilidade' },
  { value: 'DELETION', label: 'Exclusao' },
] satisfies { value: PrivacyRequestType; label: string }[]

const statusLabels = {
  OPEN: 'Aberta',
  IN_REVIEW: 'Em revisao',
  DONE: 'Concluida',
  REJECTED: 'Rejeitada',
}

const statusClasses = {
  OPEN: 'bg-[#fff3df] text-[#9a5200]',
  IN_REVIEW: 'bg-[#eaf1ff] text-[#0050cb]',
  DONE: 'bg-[#eaf8ef] text-[#0b7a3b]',
  REJECTED: 'bg-[#fdecec] text-[#ba1a1a]',
}

function dateTimeLabel(value: string) {
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
  const requests = usePrivacyRequests()
  const createRequest = useCreatePrivacyRequest()
  const deleteOwnAccount = useDeleteOwnAccount()
  const exportData = usePrivacyExport()
  const [type, setType] = useState<PrivacyRequestType>('ACCESS')
  const [message, setMessage] = useState('')
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteConfirmation, setDeleteConfirmation] = useState(false)
  const typeLabel = useMemo(
    () => requestTypes.find((option) => option.value === type)?.label ?? type,
    [type],
  )

  function submitRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    createRequest.mutate(
      { type, message },
      {
        onSuccess: () => {
          setType('ACCESS')
          setMessage('')
        },
      },
    )
  }

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

      {createRequest.isError || exportData.isError || requests.isError || deleteOwnAccount.isError ? (
        <div className="rounded-lg border border-[#fde1e1] bg-[#fff7f7] px-4 py-3 text-sm font-medium text-[#8f1111]">
          {deleteOwnAccount.isError
            ? 'Nao foi possivel excluir a conta. Confira sua senha e tente novamente.'
            : 'Nao foi possivel processar a solicitacao de privacidade.'}
        </div>
      ) : null}

      {createRequest.isSuccess ? (
        <div className="rounded-lg border border-[#d8efdf] bg-[#f3fbf6] px-4 py-3 text-sm font-medium text-[#0b7a3b]">
          Solicitacao registrada para revisao.
        </div>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(340px,420px)]">
        <div className="rounded-lg border border-[#dfe4f5] bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-[#141b2b]">Nova solicitacao</h2>
          <form className="mt-4 space-y-4" onSubmit={submitRequest}>
            <label className="block">
              <span className="text-sm font-medium text-[#424656]">Tipo</span>
              <select
                className="mt-2 h-11 w-full rounded-lg border border-[#dfe4f5] bg-white px-3 text-sm text-[#141b2b] outline-none focus:border-[#0050cb]"
                value={type}
                onChange={(event) => setType(event.target.value as PrivacyRequestType)}
              >
                {requestTypes.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-[#424656]">Mensagem</span>
              <textarea
                className="mt-2 min-h-32 w-full resize-y rounded-lg border border-[#dfe4f5] bg-white px-3 py-2 text-sm leading-6 text-[#141b2b] outline-none focus:border-[#0050cb]"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder={`Detalhe sua solicitacao de ${typeLabel.toLowerCase()}`}
              />
            </label>

            <button
              type="submit"
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#0050cb] px-3 text-sm font-medium text-white shadow-sm hover:bg-[#003fa4] disabled:cursor-not-allowed disabled:bg-[#9ca1b2]"
              disabled={createRequest.isPending}
            >
              <span className="material-symbols-rounded text-[19px]" aria-hidden="true">
                send
              </span>
              {createRequest.isPending ? 'Enviando...' : 'Enviar solicitacao'}
            </button>
          </form>
        </div>

        <div className="rounded-lg border border-[#dfe4f5] bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-[#141b2b]">Conta</h2>
          <p className="mt-2 text-sm leading-6 text-[#424656]">{me.data?.email}</p>
          <p className="mt-4 text-sm leading-6 text-[#727687]">
            Aceites de Politica de Privacidade e Termos de Uso ficam disponiveis na exportacao JSON.
          </p>
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
              Excluir a conta remove permanentemente clientes, vendas, parcelas, alertas e solicitacoes LGPD vinculadas ao usuario.
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

      <section className="rounded-lg border border-[#dfe4f5] bg-white shadow-sm">
        <div className="border-b border-[#edf0fa] px-5 py-4">
          <h2 className="text-lg font-semibold text-[#141b2b]">Historico de solicitacoes</h2>
        </div>
        <div className="divide-y divide-[#edf0fa]">
          {requests.isLoading ? (
            <p className="px-5 py-4 text-sm font-medium text-[#424656]">Carregando...</p>
          ) : null}
          {!requests.isLoading && requests.data?.length === 0 ? (
            <p className="px-5 py-4 text-sm text-[#727687]">Nenhuma solicitacao registrada.</p>
          ) : null}
          {requests.data?.map((request) => (
            <article key={request.id} className="px-5 py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-[#141b2b]">
                    {requestTypes.find((option) => option.value === request.type)?.label ??
                      request.type}
                  </p>
                  <p className="mt-1 text-sm text-[#727687]">
                    Criada em {dateTimeLabel(request.createdAt)}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    statusClasses[request.status]
                  }`}
                >
                  {statusLabels[request.status]}
                </span>
              </div>
              {request.message ? (
                <p className="mt-3 text-sm leading-6 text-[#424656]">{request.message}</p>
              ) : null}
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
