import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { CheckCircle, Clock, XCircle } from 'lucide-react'
import { useOrder } from '../hooks/useOrder.js'
import { formatWhatsApp } from '../utils/index.js'
import LoadingScreen from '../components/LoadingScreen.jsx'

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
    opcoes,
    opcaoSelecionada,
    setOpcaoSelecionada,
    itemsDetail,
    alterarQtdVariante,
  } = useOrder(slug)
  const [uploading, setUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [uploadError, setUploadError] = useState(false)
  const [uploadedAt, setUploadedAt] = useState(null)
  // Feedback visual do botão "Copiar Chave Pix" — volta a false após 2s
  const [pixCopiado, setPixCopiado] = useState(false)

  useEffect(() => {
    if (slug) fetchCampaign(slug)
  }, [slug, fetchCampaign])

  useEffect(() => {
    console.log('Opções carregadas:', opcoes)
  }, [opcoes])

  useEffect(() => {
    if (showPix && pixRef.current) {
      pixRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [showPix])

  // Erro de upload desaparece após 3 segundos
  useEffect(() => {
    if (!uploadError) return
    const timer = setTimeout(() => setUploadError(false), 3000)
    return () => clearTimeout(timer)
  }, [uploadError])

  const onGerarPix = () => generatePix()

  const onFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    handleFileUpload(file, orderId)
    e.target.value = ''
  }

  async function copiarChavePix() {
    if (!campaign?.pix_key) return
    try {
      await navigator.clipboard.writeText(campaign.pix_key)
    } catch {
      // fallback para ambientes sem Clipboard API
      const input = document.createElement('input')
      input.value = campaign.pix_key
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
    }
    setPixCopiado(true)
    setTimeout(() => setPixCopiado(false), 2000)
  }

  const handleNewOrder = () => {
    try {
      localStorage.removeItem('multiplica_order_id')
      localStorage.removeItem('multiplica_order_slug')
    } catch {}
    window.location.href = `/c/${slug}`
  }

  if (loading && !campaign) return <LoadingScreen />

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
              {campaign.description?.trim() && (
                <p className="campaign-description">{campaign.description}</p>
              )}
              {campaign.item_description && (
                <p className="campaign-item-description">{campaign.item_description}</p>
              )}
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

              {/* Modo variantes: botões +/- por sabor */}
              {campaign.has_variants ? (
                <div className="variants-list">
                  {itemsDetail.map((item) => (
                    <div key={item.name} className="variant-row">
                      <div className="variant-info">
                        <span className="variant-name">{item.name}</span>
                        <span className="variant-price">R$ {item.price.toFixed(2)}</span>
                      </div>
                      <div className="variant-qty-control">
                        <button
                          type="button"
                          className="variant-qty-btn"
                          onClick={() => alterarQtdVariante(item.name, -1)}
                          disabled={item.qty === 0}
                        >−</button>
                        <span className="variant-qty-value">{item.qty}</span>
                        <button
                          type="button"
                          className="variant-qty-btn"
                          onClick={() => alterarQtdVariante(item.name, +1)}
                        >+</button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <div className="quantity-control">
                    <span>Quantidade</span>
                    <div className="variant-qty-control">
                      <button
                        type="button"
                        className="variant-qty-btn"
                        onClick={() => handleChange('quantity', form.quantity - 1)}
                        disabled={form.quantity <= 1}
                      >−</button>
                      <span className="variant-qty-value">{form.quantity}</span>
                      <button
                        type="button"
                        className="variant-qty-btn"
                        onClick={() => handleChange('quantity', form.quantity + 1)}
                      >+</button>
                    </div>
                  </div>

                  {/* Dropdown de opções — exibido apenas quando a campanha tem variações */}
                  {opcoes.length > 0 && (
                    <label>
                      Opção *
                      <select
                        value={opcaoSelecionada}
                        onChange={(e) => setOpcaoSelecionada(e.target.value)}
                        required
                        className="order-select"
                      >
                        <option value="">Escolha uma opção</option>
                        {opcoes.map((opcao) => (
                          <option key={opcao.id} value={opcao.label}>
                            {opcao.price != null
                              ? `${opcao.label} — R$ ${Number(opcao.price).toFixed(2)}`
                              : opcao.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                </>
              )}

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

                <p className="order-legal-note">
                  Ao continuar, você concorda com nossos <a href="/legal/terms">Termos</a> e <a href="/legal/privacy">Política de Privacidade</a>.
                </p>

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
        {campaign?.item_description && (
          <p className="campaign-item-description">{campaign.item_description}</p>
        )}
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

        {/* Upload de comprovante - apenas quando pending_payment, showPix e ainda não enviou */}
        {orderStatus === 'pending_payment' && showPix && !uploadSuccess && (
          <div className="proof-upload">
            <div className="pix-key-row">
              <p className="pix-key-text"><strong>Chave Pix:</strong> {campaign?.pix_key}</p>
              <button
                type="button"
                className="btn-copiar-pix"
                onClick={copiarChavePix}
              >
                {pixCopiado ? '✓ Copiado!' : 'Copiar'}
              </button>
            </div>
            {campaign?.recipient_name?.trim() && (
              <p className="pix-recebedor">✅ O valor será transferido para <strong>{campaign.recipient_name}</strong></p>
            )}
            <label
              htmlFor="proof-upload"
              className={`upload-button${uploading ? ' upload-button--enviando' : ''}`}
            >
              {uploading ? '⏳ Enviando...' : '📸 Enviar comprovante'}
            </label>
            <input
              id="proof-upload"
              type="file"
              accept="image/*"
              disabled={uploading}
              style={{ display: 'none' }}
              onChange={async (e) => {
                const file = e.target.files?.[0]
                if (!file) return

                setUploading(true)
                setUploadError(false)
                try {
                  const resultado = await handleFileUpload(file, orderId)
                  if (resultado) {
                    setUploadSuccess(true)
                    setUploadedAt(new Date())
                  } else {
                    setUploadError(true)
                  }
                  e.target.value = ''
                } catch {
                  setUploadError(true)
                } finally {
                  setUploading(false)
                }
              }}
            />

            {uploadError && <p className="error-message">❌ Erro ao enviar. Tente novamente.</p>}
          </div>
        )}

        {/* Confirmação pós-upload */}
        {uploadSuccess && uploadedAt && (
          <div className="upload-confirmacao">
            <p className="confirmacao-titulo">✅ Comprovante enviado!</p>
            <div className="confirmacao-detalhes">
              <p><strong>Nome:</strong> {order.customer_name}</p>
              <p><strong>Quantidade:</strong> {order.quantity}</p>
              <p><strong>Total:</strong> R$ {order.total_price}</p>
              <p><strong>Pedido:</strong> <span className="order-id-curto">#{order.id.slice(0, 8).toUpperCase()}</span></p>
              <p><strong>Enviado em:</strong> {uploadedAt.toLocaleString('pt-BR')}</p>
            </div>
            <p className="confirmacao-aviso">
              Assim que o organizador confirmar o pagamento, você recebe a notificação aqui.
            </p>
            {campaign?.contact_whatsapp?.trim() && (
              <a
                href={`https://wa.me/55${campaign.contact_whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá! Enviei o comprovante do pedido #${order.id.slice(0, 8).toUpperCase()}. Pode verificar? 🙏`)}`}
                className="whatsapp-acompanhamento"
                target="_blank"
                rel="noreferrer"
              >
                💬 Falar com o organizador
              </a>
            )}
          </div>
        )}

        {/* Botão 'Ver Pix' quando pedido existe, está pendente e showPix=false */}
        {orderStatus === 'pending_payment' && !showPix && (
          <button className="show-pix-button" onClick={revealPix}>
            🔑 Ver chave Pix
          </button>
        )}

        {/* Botão WhatsApp - apenas quando rejected E campaign tem contato */}
        {orderStatus === 'rejected' && campaign?.contact_whatsapp?.trim() && (
          <button 
            className="whatsapp-button"
            onClick={() => window.open(`https://wa.me/55${campaign.contact_whatsapp.replace(/\D/g, '')}`, '_blank')}
          >
            💬 Falar no WhatsApp
          </button>
        )}

        {/* Botão novo pedido - após envio do comprovante, aprovação ou rejeição */}
        {(uploadSuccess || orderStatus === 'approved' || orderStatus === 'rejected') && (
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
