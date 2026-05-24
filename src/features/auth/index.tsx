import AuthForm, { type AuthMode } from './_components/auth-form'

type AuthProps = {
  mode: AuthMode
}

export default function Auth({ mode }: AuthProps) {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f9f9ff] px-4 py-10 text-[#141b2b]">
      <div className="w-full max-w-[440px] rounded-lg border border-[#dfe4f5] bg-white p-6 shadow-[0_24px_80px_rgba(20,27,43,0.12)] sm:p-8">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="grid size-12 place-items-center rounded-lg bg-[#0050cb] font-[Geist,Inter,sans-serif] text-xl font-semibold text-white shadow-sm">
            iS
          </div>
          <h1 className="mt-5 font-[Geist,Inter,sans-serif] text-3xl font-semibold leading-9">
            iStore CRM
          </h1>
          <p className="mt-2 max-w-[320px] text-sm leading-6 text-[#727687]">
            Entre para gerenciar sua loja.
          </p>
        </div>

        <AuthForm mode={mode} />
      </div>
    </main>
  )
}
