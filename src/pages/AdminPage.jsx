import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { CheckCircle, XCircle, Clock, Eye } from 'lucide-react'
import { getCampaignBySlug, getOrdersByCampaign, updateOrderStatus, gerarUrlAssinadaComprovante } from '../services/adminService'

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
    // Impede aprovação sem comprovante — exibe alerta inline por 3 segundos
    if (newStatus === 'approved') {
      const pedido = orders.find((o) => o.id === orderId)
      if (!pedido?.proof_url) {
        setAlertaSemComprovante(orderId)
        setTimeout(() => setAlertaSemComprovante(null), 3000)
        return
      }
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

  if (loading) return <div className="admin-container"><p>Carregando...</p></div>
  if (error) return <div className="admin-container"><p className="admin-error">{error}</p></div>
  if (!campaign) return <div className="admin-container"><p>Campanha não encontrada</p></div>

  return (
    <div className="admin-container">
      <header className="admin-header">
        <h1>📋 {campaign.name}</h1>
        <p>📅 Entrega: {new Date(campaign.delivery_at).toLocaleDateString('pt-BR')}</p>
        <p>📞 Contato: {campaign.contact_whatsapp}</p>
      </header>

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
                {order.proof_url && (
                  <span className="badge-tem-comprovante">📸 Comprovante</span>
                )}
                <span className={`admin-status-badge ${order.status === 'pending_payment' ? 'pending' : order.status}`}>
                  {order.status === 'pending_payment' && '⏳ Aguardando'}
                  {order.status === 'approved' && '✅ Aprovado'}
                  {order.status === 'rejected' && '❌ Rejeitado'}
                </span>
              </div>
            </div>

            <div className="order-details">
              <p>📦 {order.quantity} unidade(s) — R$ {order.total_price}</p>
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

