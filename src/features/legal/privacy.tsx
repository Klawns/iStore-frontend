import { Link } from 'react-router-dom'

export default function PrivacyPolicy() {
  return (
    <main className="min-h-screen bg-[#f9f9ff] px-4 py-10 text-[#141b2b]">
      <div className="mx-auto max-w-3xl space-y-6">
        <Link to="/login" className="text-sm font-semibold text-[#0050cb] hover:text-[#0044ad]">
          Voltar
        </Link>
        <section className="space-y-4">
          <h1 className="text-3xl font-semibold">Politica de Privacidade</h1>
          <p className="text-sm leading-6 text-[#424656]">Versao 2026-05-25</p>
          <p className="leading-7 text-[#424656]">
            O iStore trata os dados necessarios para criar e operar a conta: email, senha em hash,
            clientes cadastrados, telefone, vendas, itens, parcelas, relatorios derivados e logs
            tecnicos de seguranca.
          </p>
          <p className="leading-7 text-[#424656]">
            Esses dados sao usados para autenticar o usuario, organizar a gestao comercial,
            calcular indicadores, acompanhar pagamentos, prevenir abuso e cumprir obrigacoes legais.
            Cada usuario e responsavel pelos dados de clientes que registra no sistema.
          </p>
          <p className="leading-7 text-[#424656]">
            Usamos cookie essencial de autenticacao e token CSRF para manter a sessao segura. Nao
            usamos cookies de marketing nesta versao. Dados financeiros e historicos de venda podem
            ser mantidos quando houver obrigacao legal ou necessidade de defesa de direitos.
          </p>
          <p className="leading-7 text-[#424656]">
            Solicitacoes de acesso, correcao, exportacao ou exclusao podem ser enviadas pelo canal
            LGPD informado pelo responsavel do servico. Esta politica deve ser revisada juridicamente
            antes de publicacao formal.
          </p>
        </section>
      </div>
    </main>
  )
}
