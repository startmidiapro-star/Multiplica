import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { CheckCircle, Clock, XCircle } from 'lucide-react'
import { useOrder } from '../hooks/useOrder.js'
import { formatWhatsApp } from '../utils/index.js'

const OrderPage = () => {
  const { slug } = useParams()
  const pixRef = useRef(null)
  const {
    form,
    campaign,
    loading,
    error,
    total,
    orderId,
    order,
    hasValidOrderId,
    showPix,
    revealPix,
    proofSent,
    orderStatus,
    fetchCampaign,
    handleChange,
    generatePix,
    handleFileUpload,
    handleFormChange,
    handleSubmit,
    handleProofUpload,
    resetOrder,
  } = useOrder(slug)
  const [uploading, setUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [uploadError, setUploadError] = useState(false)

  useEffect(() => {
    if (slug) fetchCampaign(slug)
  }, [slug, fetchCampaign])

  useEffect(() => {
    if (showPix && pixRef.current) {
      pixRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [showPix])

  const onGerarPix = () => generatePix()

  const onFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    handleFileUpload(file, orderId)
    e.target.value = ''
  }

  const handleNewOrder = () => {
    try {
      localStorage.removeItem('multiplica_order_id')
      localStorage.removeItem('multiplica_order_slug')
    } catch {}
    window.location.href = `/c/${slug}`
  }

  if (loading && !campaign) {
    return (
      <main className="page-order">
        <p className="loading">Carregando...</p>
      </main>
    )
  }

  if (error && !campaign) {
    return (
      <main className="page-order">
        <p className="error">{error}</p>
      </main>
    )
  }
  // Early conditional returns to preserve original structure and behavior
  if (!order && orderId) {
    return (
      <main className="page-order">
        <p>Carregando pedido...</p>
      </main>
    )
  }

  if (!order) {
    // Show original form UI
    return (
      <main className="page-order">
        {campaign && (
          <>
            <section className="campaign-info">
              <h1>{campaign.name}</h1>
            </section>

            <form
              className="order-form"
              onSubmit={(e) => {
                e.preventDefault()
                onGerarPix()
              }}
            >
              <label>
                Nome
                <input
                  type="text"
                  value={form.customer_name}
                  onChange={(e) => handleChange('customer_name', e.target.value)}
                  placeholder="Seu nome"
                  required
                />
              </label>

              <label>
                WhatsApp
                <input
                  type="tel"
                  value={formatWhatsApp(form.whatsapp)}
                  onChange={(e) => handleChange('whatsapp', e.target.value)}
                  placeholder="(00) 00000-0000"
                  required
                />
              </label>

              <label>
                Quantidade
                <input
                  type="number"
                  min="1"
                  value={form.quantity}
                  onChange={(e) =>
                    handleChange('quantity', e.target.value)
                  }
                  placeholder="1"
                  required
                />
              </label>

              <p className="total">Total: R$ {total.toFixed(2)}</p>

              {error && <p className="error">{error}</p>}

              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-pix"
                  onClick={onGerarPix}
                  disabled={loading}
                >
                  {loading ? 'Gerando...' : 'Gerar Pix'}
                </button>

                {hasValidOrderId && showPix && !proofSent && (
                  <label
                    className={`btn btn-submit btn-upload ${loading ? 'btn-disabled' : ''}`}
                  >
                    {loading ? 'Enviando...' : 'Enviar Comprovante'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={onFileSelect}
                      disabled={loading}
                      className="sr-only"
                    />
                  </label>
                )}
              </div>
            </form>
          </>
        )}
      </main>
    )
  }

  // order exists — show original visual structure with order details
  console.log('🔍 Debug render:', { orderStatus, showPix, campaign })
  return (
    <main className="page-order">
      <div className="order-page">
        <h2>{campaign?.name}</h2>
        {campaign?.delivery_at && (
          <p className="delivery-date">📅 Entrega: {new Date(campaign.delivery_at).toLocaleDateString('pt-BR')}</p>
        )}

        <div className="customer-info">
          <p><strong>Nome:</strong> {order.customer_name}</p>
          <p><strong>WhatsApp:</strong> {order.whatsapp}</p>
          <p><strong>Quantidade:</strong> {order.quantity}</p>
          <p><strong>Total:</strong> R$ {order.total_price}</p>
        </div>

        {/* Status block */}
        <div className={`status-block status-${orderStatus}`}>
          {orderStatus === 'pending_payment' && (
            <>
              <Clock size={24} />
              <p>Aguardando pagamento.</p>
            </>
          )}
          {orderStatus === 'approved' && (
            <>
              <CheckCircle size={24} />
              <p>✅ Pedido confirmado!</p>
            </>
          )}
          {orderStatus === 'rejected' && (
            <>
              <XCircle size={24} />
              <p>❌ Pagamento não identificado.</p>
            </>
          )}
        </div>

        {/* Upload de comprovante - apenas quando pending_payment E showPix */}
        {orderStatus === 'pending_payment' && showPix && (
          <div className="proof-upload">
            <p><strong>Chave Pix:</strong> {campaign?.pix_key}</p>
            <label htmlFor="proof-upload" className="upload-button">
              📸 Enviar comprovante
            </label>
            <input
              id="proof-upload"
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={async (e) => {
                const file = e.target.files?.[0]
                if (!file) return

                setUploading(true)
                setUploadSuccess(false)
                setUploadError(false)
                try {
                  await handleFileUpload(file, orderId)
                  setUploadSuccess(true)
                  e.target.value = ''
                } catch (err) {
                  setUploadError(true)
                } finally {
                  setUploading(false)
                }
              }}
            />

            {uploading && <p>⏳ Enviando comprovante...</p>}
            {uploadSuccess && <p className="success-message">✅ Comprovante enviado com sucesso!</p>}
            {uploadError && <p className="error-message">❌ Erro ao enviar. Tente novamente.</p>}
          </div>
        )}

        {/* Botão 'Ver Pix' quando pedido existe, está pendente e showPix=false */}
        {orderStatus === 'pending_payment' && !showPix && (
          <button className="show-pix-button" onClick={revealPix}>
            🔑 Ver chave Pix
          </button>
        )}

        {/* Botão WhatsApp - apenas quando rejected E campaign tem contato */}
        {orderStatus === 'rejected' && campaign?.contact_whatsapp && (
          <button 
            className="whatsapp-button"
            onClick={() => window.open(`https://wa.me/55${campaign.contact_whatsapp.replace(/\D/g, '')}`, '_blank')}
          >
            💬 Falar no WhatsApp
          </button>
        )}

        {/* Botão novo pedido - apenas quando approved OU rejected */}
        {(orderStatus === 'approved' || orderStatus === 'rejected') && (
          <button 
            className="new-order-button"
            onClick={() => {
              localStorage.removeItem('multiplica_order_id')
              localStorage.removeItem('multiplica_order_slug')
              window.location.href = `/c/${slug}`
            }}
          >
            🔄 Fazer novo pedido
          </button>
        )}
      </div>
    </main>
  )
}

export default OrderPage
