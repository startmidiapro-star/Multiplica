/**
 * TermsPage — Página de Termos e Condições
 * Conteúdo textual será inserido pelo usuário posteriormente.
 */
export default function TermsPage() {
  return (
    <main className="page-legal">
      <div className="legal-container">
        <h1>Termos e Condições</h1>
        <div className="legal-content">
          <section className="legal-section">
            <h2>Termos de Uso do Multiplica</h2>
            <p>Este documento define a natureza do serviço prestado pelo Multiplica.</p>

            <ul className="legal-list">
              <li>
                <strong>Natureza Jurídica:</strong> O Multiplica é uma plataforma tecnológica facilitadora de gestão. Não é o vendedor, produtor ou responsável pela entrega dos itens.
              </li>

              <li>
                <strong>Isenção de Responsabilidade:</strong> O Multiplica não se responsabiliza por qualidade, quantidade ou entrega dos produtos; erros no envio do Pix por parte do comprador; ou veracidade das informações prestadas pelos organizadores.
              </li>

              <li>
                <strong>Regras de Uso:</strong> É proibido utilizar a plataforma para fins ilícitos, sorteios não autorizados ou venda de produtos proibidos por lei.
              </li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>Termo de Responsabilidade do Organizador</h2>
            <p>Ao criar uma campanha, o organizador concorda com os seguintes termos:</p>

            <ul className="legal-list">
              <li>
                <strong>Gestão de Dados:</strong> O organizador compromete-se a utilizar os dados dos compradores exclusivamente para a finalidade da campanha.
              </li>

              <li>
                <strong>Entrega e Qualidade:</strong> O organizador assume total responsabilidade pela produção, higiene e entrega dos itens vendidos.
              </li>

              <li>
                <strong>Fiel Depositário:</strong> O organizador é responsável pela conferência dos valores recebidos via Pix em sua conta pessoal.
              </li>
            </ul>
          </section>
        </div>
      </div>
    </main>
  )
}
