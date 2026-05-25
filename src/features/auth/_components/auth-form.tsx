import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { ApiError } from '../../../services/api/client'
import { useCreateUser, useSignIn } from '../../../services/api/hooks'

export type AuthMode = 'login' | 'register'

type AuthFormProps = {
  mode: AuthMode
}

type FieldErrors = Partial<Record<'email' | 'password', string>>

const LEGAL_VERSION = '2026-05-25'

const authSchema = z.object({
  email: z.string().trim().min(1, 'Informe seu email.').email('Informe um email valido.'),
  password: z.string().min(1, 'Informe sua senha.').min(6, 'Use pelo menos 6 caracteres.'),
})

function getMutationError(error: unknown) {
  if (error instanceof ApiError) {
    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Nao foi possivel continuar.'
}

export default function AuthForm({ mode }: AuthFormProps) {
  const navigate = useNavigate()
  const signIn = useSignIn()
  const createUser = useCreateUser()
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)

  const isRegister = mode === 'register'
  const isSubmitting = signIn.isPending || createUser.isPending

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)
    setFieldErrors({})

    const formData = new FormData(event.currentTarget)
    const parsed = authSchema.safeParse({
      email: formData.get('email'),
      password: formData.get('password'),
    })

    if (!parsed.success) {
      const errors: FieldErrors = {}

      for (const issue of parsed.error.issues) {
        const field = issue.path[0]

        if ((field === 'email' || field === 'password') && !errors[field]) {
          errors[field] = issue.message
        }
      }

      setFieldErrors(errors)
      return
    }

    const acceptedLegal = formData.get('acceptLegal') === 'on'
    if (isRegister && !acceptedLegal) {
      setFormError('Aceite a Politica de Privacidade e os Termos de Uso para criar sua conta.')
      return
    }

    try {
      if (isRegister) {
        await createUser.mutateAsync({
          ...parsed.data,
          acceptPrivacyPolicy: true,
          acceptTerms: true,
          privacyPolicyVersion: LEGAL_VERSION,
          termsVersion: LEGAL_VERSION,
        })
      }

      await signIn.mutateAsync(parsed.data)
      navigate('/dashboard', { replace: true })
    } catch (error) {
      setFormError(getMutationError(error))
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit} noValidate>
      <div className="space-y-4">
        <div>
          <label htmlFor="email" className="text-sm font-medium text-[#424656]">
            Email
          </label>
          <div className="mt-2 flex h-12 items-center gap-3 rounded-lg border border-[#dfe4f5] bg-[#fbfcff] px-3 transition focus-within:border-[#0050cb] focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(0,80,203,0.10)]">
            <span className="material-symbols-rounded text-[20px] text-[#727687]" aria-hidden="true">
              mail
            </span>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              className="h-full min-w-0 flex-1 bg-transparent text-sm text-[#141b2b] outline-none placeholder:text-[#9ca1b2]"
              placeholder="voce@empresa.com"
              aria-invalid={Boolean(fieldErrors.email)}
              aria-describedby={fieldErrors.email ? 'email-error' : undefined}
            />
          </div>
          {fieldErrors.email ? (
            <p id="email-error" className="mt-2 text-xs font-medium text-[#c4382d]">
              {fieldErrors.email}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="password" className="text-sm font-medium text-[#424656]">
            Senha
          </label>
          <div className="mt-2 flex h-12 items-center gap-3 rounded-lg border border-[#dfe4f5] bg-[#fbfcff] px-3 transition focus-within:border-[#0050cb] focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(0,80,203,0.10)]">
            <span className="material-symbols-rounded text-[20px] text-[#727687]" aria-hidden="true">
              lock
            </span>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete={isRegister ? 'new-password' : 'current-password'}
              className="h-full min-w-0 flex-1 bg-transparent text-sm text-[#141b2b] outline-none placeholder:text-[#9ca1b2]"
              placeholder="minimo 6 caracteres"
              aria-invalid={Boolean(fieldErrors.password)}
              aria-describedby={fieldErrors.password ? 'password-error' : undefined}
            />
          </div>
          {fieldErrors.password ? (
            <p id="password-error" className="mt-2 text-xs font-medium text-[#c4382d]">
              {fieldErrors.password}
            </p>
          ) : null}
        </div>
      </div>

      {formError ? (
        <div className="rounded-lg border border-[#ffd6d2] bg-[#fff4f2] px-3 py-2 text-sm font-medium text-[#9f2c24]">
          {formError}
        </div>
      ) : null}

      {isRegister ? (
        <label className="flex items-start gap-3 rounded-lg border border-[#dfe4f5] bg-[#fbfcff] p-3 text-sm text-[#424656]">
          <input
            name="acceptLegal"
            type="checkbox"
            className="mt-0.5 size-4 rounded border-[#c8d0e8] text-[#0050cb] focus:ring-[#0050cb]"
          />
          <span>
            Li e aceito a{' '}
            <Link to="/privacidade" className="font-semibold text-[#0050cb] hover:text-[#0044ad]">
              Politica de Privacidade
            </Link>{' '}
            e os{' '}
            <Link to="/termos" className="font-semibold text-[#0050cb] hover:text-[#0044ad]">
              Termos de Uso
            </Link>
            .
          </span>
        </label>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#0050cb] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0044ad] disabled:cursor-not-allowed disabled:bg-[#8ab0ee]"
      >
        <span className="material-symbols-rounded text-[20px]" aria-hidden="true">
          {isSubmitting ? 'progress_activity' : isRegister ? 'person_add' : 'login'}
        </span>
        {isSubmitting ? 'Aguarde...' : isRegister ? 'Criar conta' : 'Entrar'}
      </button>

      <p className="text-center text-sm text-[#727687]">
        {isRegister ? 'Ja tem uma conta?' : 'Ainda nao tem uma conta?'}{' '}
        <Link
          to={isRegister ? '/login' : '/registro'}
          className="font-semibold text-[#0050cb] hover:text-[#0044ad]"
        >
          {isRegister ? 'Entrar' : 'Criar conta'}
        </Link>
      </p>

      <p className="text-center text-xs leading-5 text-[#727687]">
        Usamos um cookie essencial de autenticacao para manter sua sessao segura.{' '}
        <Link to="/privacidade" className="font-semibold text-[#0050cb] hover:text-[#0044ad]">
          Privacidade
        </Link>{' '}
        e{' '}
        <Link to="/termos" className="font-semibold text-[#0050cb] hover:text-[#0044ad]">
          Termos
        </Link>
        .
      </p>
    </form>
  )
}
