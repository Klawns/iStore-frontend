import { Link } from 'react-router-dom'

export default function TermsOfUse() {
  return (
    <main className="min-h-screen bg-[#f9f9ff] px-4 py-10 text-[#141b2b]">
      <div className="mx-auto max-w-3xl space-y-6">
        <Link to="/login" className="text-sm font-semibold text-[#0050cb] hover:text-[#0044ad]">
          Voltar
        </Link>
        <section className="space-y-4">
          <h1 className="text-3xl font-semibold">Termos de Uso</h1>
          <p className="text-sm leading-6 text-[#424656]">Versao 2026-05-25</p>
          <p className="leading-7 text-[#424656]">
            O iStore e uma ferramenta de apoio a gestao de loja. O usuario deve cadastrar apenas
            dados necessarios para sua operacao e manter suas credenciais protegidas.
          </p>
          <p className="leading-7 text-[#424656]">
            Ao registrar clientes, produtos, observacoes ou parcelas, o usuario se compromete a nao
            inserir dados sensiveis ou informacoes pessoais desnecessarias, como saude, biometria,
            origem racial, opinioes politicas ou documentos sem finalidade legitima.
          </p>
          <p className="leading-7 text-[#424656]">
            O uso abusivo, tentativa de acesso indevido, violacao de direitos de terceiros ou
            manipulacao do servico pode levar a restricao de acesso. Medidas de seguranca sao
            aplicadas, mas a disponibilidade pode variar por manutencao, infraestrutura ou incidentes.
          </p>
          <p className="leading-7 text-[#424656]">
            Estes termos precisam de revisao juridica antes de publicacao formal.
          </p>
        </section>
      </div>
    </main>
  )
}
