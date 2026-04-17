import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { CheckCircle, XCircle, Clock, Eye } from 'lucide-react'
import { getCampaignBySlug, getOrdersByCampaign, updateOrderStatus, gerarUrlAssinadaComprovante } from '../services/adminService'
import LoadingScreen from '../components/LoadingScreen.jsx'

export default function AdminPage() {
  const { slug } = useParams()
  const [campaign, setCampaign] = useState(null)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actionLoading, setActionLoading] = useState(null)
  const [selectedProof, setSelectedProof] = useState(null)
  const [loadingProof, setLoadingProof] = useState(false)
  // ID do pedido que tentou ser aprovado sem comprovante (alerta inline)
  const [alertaSemComprovante, setAlertaSemComprovante] = useState(null)

  useEffect(() => {
    // Lê o token do fragmento da URL (#auth=UUID) — nunca da query string
    // O fragmento não é enviado ao servidor pelo navegador
    const fragmento = window.location.hash.slice(1)
    const parametrosHash = new URLSearchParams(fragmento)
    let authToken = parametrosHash.get('auth')

    // Fallback para sessionStorage: necessário porque o React StrictMode
    // executa efeitos duas vezes em dev. Na segunda execução o hash já foi
    // limpo pela primeira, mas o token foi salvo na sessionStorage.
    if (!authToken) {
      try {
        authToken = sessionStorage.getItem('manager_token')
      } catch {
        // sessionStorage indisponível — ignora
      }
    }

    if (!authToken) {
      setError('Acesso não autorizado')
      setLoading(false)
      return
    }

    // Persiste o token na sessionStorage para que requests posteriores
    // (aprovar/rejeitar) continuem enviando x-manager-token após o hash ser limpo
    try {
      sessionStorage.setItem('manager_token', authToken)
    } catch {
      // sessionStorage indisponível — ignora
    }

    // Remove o fragmento da URL após capturar o token
    // Evita exposição no histórico do navegador e ferramentas de analytics
    history.replaceState(null, '', window.location.pathname)

    loadData()
  }, [slug])

  async function loadData() {
    try {
      setLoading(true)
      const campaignData = await getCampaignBySlug(slug)
      setCampaign(campaignData)
      
      const ordersData = await getOrdersByCampaign(campaignData.id)
      setOrders(ordersData)
    } catch (err) {
      console.error('Erro ao carregar dados:', err)
      setError('Não foi possível carregar os dados')
    } finally {
      setLoading(false)
    }
  }

  async function abrirComprovante(path) {
    setLoadingProof(true)
    try {
      // Gera URL assinada com expiração de 1h — nunca expõe URL pública
      const urlAssinada = await gerarUrlAssinadaComprovante(path)
      setSelectedProof(urlAssinada)
    } catch (err) {
      console.error('Erro ao gerar URL do comprovante:', err)
      alert('Não foi possível abrir o comprovante. Tente novamente.')
    } finally {
      setLoadingProof(false)
    }
  }

  async function handleStatusUpdate(orderId, newStatus) {
    const pedido = orders.find((o) => o.id === orderId)

    // Impede aprovação sem comprovante — exibe alerta inline por 3 segundos
    if (newStatus === 'approved') {
      if (!pedido?.proof_url) {
        setAlertaSemComprovante(orderId)
        setTimeout(() => setAlertaSemComprovante(null), 3000)
        return
      }
      const confirmado = window.confirm(
        `Verificou o comprovante de ${pedido.customer_name} — R$ ${pedido.total_price}? Confirmar?`
      )
      if (!confirmado) return
    }

    if (newStatus === 'rejected') {
      const confirmado = window.confirm('Rejeitar este pedido?')
      if (!confirmado) return
    }

    setActionLoading(orderId)
    try {
      await updateOrderStatus(orderId, newStatus)
      setOrders(orders.map(order =>
        order.id === orderId ? { ...order, status: newStatus } : order
      ))
    } catch (err) {
      console.error('Erro ao atualizar status:', err)
      alert('Erro ao atualizar. Tente novamente.')
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) return <LoadingScreen />
  if (error) return <div className="admin-container"><p className="admin-error">{error}</p></div>
  if (!campaign) return <div className="admin-container"><p>Campanha não encontrada</p></div>

  // Totais calculados do array já carregado — sem requisição extra
  const pedidosAprovados  = orders.filter(o => o.status === 'approved')
  const pedidosPendentes  = orders.filter(o => o.status === 'pending_payment')
  const pedidosRejeitados = orders.filter(o => o.status === 'rejected')
  const itensProduzir     = pedidosAprovados.reduce((acc, o) => acc + (o.quantity || 0), 0)
  const valorConfirmado   = pedidosAprovados.reduce((acc, o) => acc + (Number(o.total_price) || 0), 0)
  const valorPendente     = pedidosPendentes.reduce((acc, o) => acc + (Number(o.total_price) || 0), 0)

  // Breakdown por opção — apenas pedidos aprovados com selected_option preenchido
  const itensPorOpcao = pedidosAprovados.reduce((acc, o) => {
    if (!o.selected_option) return acc
    acc[o.selected_option] = (acc[o.selected_option] || 0) + (o.quantity || 0)
    return acc
  }, {})
  const temOpcoes = Object.keys(itensPorOpcao).length > 0

  // Mensagem de compartilhamento no WhatsApp (P7.3)
  const linkCampanha = `${window.location.origin}/c/${campaign.slug}`
  const linhaEntrega = campaign.delivery_at
    ? `\n🕒 Entrega: ${new Date(campaign.delivery_at).toLocaleDateString('pt-BR')}`
    : ''
  const mensagemCompartilhar =
    `📣 Nossa campanha já está a todo vapor!\n` +
    `Já temos ${itensProduzir} itens aprovados 🙌\n` +
    `Se você ainda não fez seu pedido, ainda dá tempo:\n` +
    `${linkCampanha}` +
    `${linhaEntrega}\n` +
    `Compartilhe com quem puder 💛`

  return (
    <div className="admin-container">
      <header className="admin-header">
        <h1>📋 {campaign.name}</h1>
        {campaign.description?.trim() && (
          <p className="admin-header-descricao">🎯 Objetivo: {campaign.description}</p>
        )}
        {campaign.delivery_at
          ? <p>📅 Entrega: {new Date(campaign.delivery_at).toLocaleDateString('pt-BR')}</p>
          : <p>📅 Entrega: não definida</p>
        }
        {campaign.recipient_name?.trim() && (
          <p className="admin-header-recebedor">🏦 Recebedor: {campaign.recipient_name}</p>
        )}
        {campaign.contact_whatsapp?.trim() && (
          <p>📞 Contato: {campaign.contact_whatsapp}</p>
        )}
      </header>

      {/* Contador operacional — calculado a partir dos pedidos já carregados */}
      <div className="admin-contador">
        <div className="admin-contador-cards">
          <div className="admin-contador-card">
            <span className="admin-contador-valor">{orders.length}</span>
            <span className="admin-contador-label">Total</span>
          </div>
          <div className="admin-contador-card admin-contador-card--aprovado">
            <span className="admin-contador-valor">{pedidosAprovados.length}</span>
            <span className="admin-contador-label">Aprovados</span>
          </div>
          <div className="admin-contador-card admin-contador-card--pendente">
            <span className="admin-contador-valor">{pedidosPendentes.length}</span>
            <span className="admin-contador-label">Pendentes</span>
          </div>
          <div className="admin-contador-card admin-contador-card--rejeitado">
            <span className="admin-contador-valor">{pedidosRejeitados.length}</span>
            <span className="admin-contador-label">Rejeitados</span>
          </div>
        </div>
        <div className="admin-contador-resumo">
          <span>🔨 Itens a produzir: <strong>{itensProduzir}</strong></span>
          <span>✅ Confirmados: <strong>R$ {valorConfirmado.toFixed(2)}</strong></span>
          <span>⏳ Pendentes: <strong>R$ {valorPendente.toFixed(2)}</strong></span>
        </div>

        {/* Breakdown por opção — exibido apenas quando há variações nos pedidos aprovados */}
        {temOpcoes && (
          <div className="admin-contador-opcoes">
            <span className="admin-contador-opcoes-titulo">Produção por variação (aprovados):</span>
            <div className="admin-contador-opcoes-lista">
              {Object.entries(itensPorOpcao).map(([opcao, qtd]) => (
                <span key={opcao} className="admin-contador-opcao-badge">
                  <strong>{qtd}</strong> {opcao}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Botão compartilhar campanha no WhatsApp (P7.3) */}
        <a
          href={`https://wa.me/?text=${encodeURIComponent(mensagemCompartilhar)}`}
          className="btn-compartilhar-whatsapp"
          target="_blank"
          rel="noreferrer"
        >
          📲 Compartilhar no WhatsApp
        </a>
      </div>

      <div className="orders-list">
        <h2>Pedidos ({orders.length})</h2>

        {orders.map(order => {
          // Card sem comprovante recebe classe extra para destaque visual
          const semComprovante = order.status === 'pending_payment' && !order.proof_url
          return (
          <div
            key={order.id}
            className={`order-card order-${order.status}${semComprovante ? ' order-card--sem-comprovante' : ''}`}
          >
            <div className="order-header">
              <strong>{order.customer_name}</strong>
              <div className="order-header-badges">
<span className={`admin-status-badge ${order.status === 'pending_payment' ? 'pending' : order.status}`}>
                  {order.status === 'pending_payment' && '⏳ Aguardando'}
                  {order.status === 'approved' && '✅ Aprovado'}
                  {order.status === 'rejected' && '❌ Rejeitado'}
                </span>
              </div>
            </div>

            <div className="order-details">
              {order.items_detail?.length > 0 ? (
                <p>
                  📦 {order.items_detail.map((item, i) => (
                    <span key={item.name}>
                      {i > 0 && ', '}
                      <strong>{item.qty}×</strong> {item.name} (R$ {Number(item.price).toFixed(2)})
                    </span>
                  ))} — R$ {Number(order.total_price).toFixed(2)}
                </p>
              ) : (
                <p>
                  📦 {order.quantity}×
                  {order.selected_option
                    ? <span className="order-opcao-badge">{order.selected_option}</span>
                    : ' unidade(s)'
                  }
                  {' '}— R$ {order.total_price}
                </p>
              )}
              <p>📞 {order.whatsapp}</p>
              <p>📅 Pedido: {new Date(order.created_at).toLocaleDateString('pt-BR')}</p>
            </div>

            {order.proof_url && (
              <div className="proof-section">
                <button
                  className="proof-button"
                  onClick={() => abrirComprovante(order.proof_url)}
                  disabled={loadingProof}
                >
                  <Eye size={18} /> {loadingProof ? 'Carregando...' : 'Ver comprovante'}
                </button>
              </div>
            )}

            {order.status === 'pending_payment' && (
              <div className="admin-actions">
                <button
                  className="btn-approve"
                  onClick={() => handleStatusUpdate(order.id, 'approved')}
                  disabled={actionLoading === order.id}
                >
                  <CheckCircle size={18} /> Aprovar
                </button>
                <button
                  className="btn-reject"
                  onClick={() => handleStatusUpdate(order.id, 'rejected')}
                  disabled={actionLoading === order.id}
                >
                  <XCircle size={18} /> Rejeitar
                </button>
              </div>
            )}

            {/* Alerta inline ao tentar aprovar sem comprovante */}
            {alertaSemComprovante === order.id && (
              <div className="alerta-sem-comprovante">
                ⚠️ Não é possível aprovar sem comprovante. Aguarde o envio.
              </div>
            )}

            {order.status === 'pending_payment' && !order.proof_url && (
              <div className="no-proof-admin">
                <Clock size={18} /> Aguardando envio do comprovante
              </div>
            )}
          </div>
          )
        })}
      </div>

      {selectedProof && (
        <div className="proof-modal-overlay" onClick={() => setSelectedProof(null)}>
          <div className="proof-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="proof-modal-close" onClick={() => setSelectedProof(null)}>Fechar</button>
            <img src={selectedProof} alt="Comprovante" />
          </div>
        </div>
      )}
    </div>
  )
}

