/**
 * PrivacyPage — Página de Política de Privacidade
 * Texto será fornecido pelo usuário e colocado dentro deste componente.
 */
export default function PrivacyPage() {
  return (
    <main className="page-legal">
      <div className="legal-container">
        <h1>Política de Privacidade</h1>
        <div className="legal-content">
          <p><strong>Política de Privacidade — Conformidade LGPD</strong></p>
          <p>Essencial para garantir que o comprador saiba como seus dados são tratados.</p>

          <ul className="legal-list">
            <li>
              <strong>Dados Coletados:</strong> Nome, WhatsApp e imagem do comprovante de pagamento.
            </li>

            <li>
              <strong>Finalidade:</strong> Os dados são coletados exclusivamente para identificação do pedido e validação do pagamento pelo organizador da campanha.
            </li>

            <li>
              <strong>Retenção e Descarte:</strong> Os dados e imagens serão mantidos no servidor (Supabase) apenas pelo tempo necessário para a conclusão da campanha, sendo excluídos permanentemente após 90 dias do encerramento.
            </li>

            <li>
              <strong>Compartilhamento:</strong> Os dados são visíveis apenas para o organizador da campanha específica e para a equipe técnica do Multiplica (fins de suporte). Nunca serão vendidos ou compartilhados com terceiros.
            </li>
          </ul>
        </div>
      </div>
    </main>
  )
}
