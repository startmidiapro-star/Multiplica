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
  if (error) return <div className="admin-container"><p className="error">{error}</p></div>
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
        
        {orders.map(order => (
          <div key={order.id} className={`order-card order-${order.status}`}>
            <div className="order-header">
              <strong>{order.customer_name}</strong>
              <span className={`status-badge status-${order.status}`}>
                {order.status === 'pending_payment' && '⏳ Aguardando'}
                {order.status === 'approved' && '✅ Aprovado'}
                {order.status === 'rejected' && '❌ Rejeitado'}
              </span>
            </div>
            
            <div className="order-details">
              <p>📦 {order.quantity} unidade(s) - R$ {order.total_price}</p>
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

            {order.status === 'pending_payment' && order.proof_url && (
              <div className="actions">
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

            {order.status === 'pending_payment' && !order.proof_url && (
              <div className="no-proof">
                <Clock size={18} /> Aguardando envio do comprovante
              </div>
            )}
          </div>
        ))}
      </div>

      <style>{`
        .admin-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          font-family: system-ui, -apple-system, sans-serif;
        }
        .admin-header {
          background: #f5f5f5;
          padding: 20px;
          border-radius: 12px;
          margin-bottom: 24px;
        }
        .orders-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .order-card {
          background: white;
          border-radius: 12px;
          padding: 16px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          border-left: 4px solid;
        }
        .order-pending_payment {
          border-left-color: #f59e0b;
          background: #fffbeb;
        }
        .order-approved {
          border-left-color: #10b981;
          background: #f0fdf4;
        }
        .order-rejected {
          border-left-color: #ef4444;
          background: #fef2f2;
        }
        .order-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        .status-badge {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 500;
        }
        .status-pending_payment {
          background: #fef3c7;
          color: #d97706;
        }
        .status-approved {
          background: #d1fae5;
          color: #059669;
        }
        .status-rejected {
          background: #fee2e2;
          color: #dc2626;
        }
        .order-details {
          margin-bottom: 12px;
          font-size: 14px;
          color: #374151;
        }
        .proof-section {
          margin-bottom: 12px;
        }
        .proof-button {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #3b82f6;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
        }
        .actions {
          display: flex;
          gap: 12px;
          margin-top: 12px;
        }
        .btn-approve {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #10b981;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
        }
        .btn-reject {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #ef4444;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
        }
        button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .no-proof {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #f59e0b;
          font-size: 14px;
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid #fef3c7;
        }
        .error {
          color: #ef4444;
          text-align: center;
          padding: 40px;
        }
        .proof-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.65);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .proof-modal-content {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 12px;
        }
        .proof-modal-content img {
          max-width: 90vw;
          max-height: 90vh;
          border-radius: 8px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.6);
        }
        .proof-modal-close {
          position: absolute;
          top: 8px;
          right: 8px;
          background: rgba(0,0,0,0.6);
          color: #fff;
          border: none;
          padding: 6px 10px;
          border-radius: 6px;
          cursor: pointer;
          z-index: 1001;
        }
      `}</style>
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

