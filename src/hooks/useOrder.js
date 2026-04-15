import { useState, useCallback, useEffect, useRef } from 'react'
// TODO: comprimir imagem antes do upload para <300kb
import imageCompression from 'browser-image-compression'
import { getCampaignBySlug, createOrder, uploadProof, getOrderStatus, getOrderById, buscarOpcoesCampanha } from '../services/campaignService.js'
import { digitsOnly, normalizeQuantity } from '../utils/index.js'

const initialFormState = {
  customer_name: '',
  whatsapp: '',
  quantity: 1,
}

const MIN_QUANTITY = 1
const STORAGE_KEY_ORDER_ID = 'multiplica_order_id'
const STORAGE_KEY_SLUG = 'multiplica_order_slug'

const readStoredOrderId = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_ORDER_ID)
    return stored || null
  } catch {
    return null
  }
}

const getStoredSlug = () => {
  try {
    return localStorage.getItem(STORAGE_KEY_SLUG)
  } catch {
    return null
  }
}

export const useOrder = (slug) => {
  const [form, setForm] = useState(initialFormState)
  const [campaign, setCampaign] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [orderId, setOrderId] = useState(null)
  const [showPix, setShowPix] = useState(false)
  const [proofSent, setProofSent] = useState(false)
  const [order, setOrder] = useState(null)
  const [orderStatus, setOrderStatus] = useState('pending_payment')
  // Opções/variações da campanha e a opção escolhida pelo comprador
  const [opcoes, setOpcoes] = useState([])
  const [opcaoSelecionada, setOpcaoSelecionada] = useState('')

  // Resolve o preço por unidade de forma defensiva:
  //   1. Parseia campaign.price explicitamente — pode vir como string do Supabase
  //   2. Usa o preço da opção selecionada se válido; senão, usa o padrão da campanha
  const _precoCampanha = Number(campaign?.price)
  const _precoPadrao = Number.isFinite(_precoCampanha) ? _precoCampanha : 0
  const _opcaoDisplay = opcaoSelecionada
    ? opcoes.find((o) => o.label === opcaoSelecionada)
    : null
  const _precoOpcao = _opcaoDisplay?.price != null ? Number(_opcaoDisplay.price) : null
  const precoPorUnidade =
    _precoOpcao != null && Number.isFinite(_precoOpcao) ? _precoOpcao : _precoPadrao

  const total = campaign
    ? (form.quantity || MIN_QUANTITY) * precoPorUnidade
    : 0

  const hasValidOrderId = Boolean(orderId)

  const fetchCampaign = useCallback(
    async (campaignSlug = slug) => {
      if (!campaignSlug) return
      setLoading(true)
      setError(null)
      try {
        const data = await getCampaignBySlug(campaignSlug)
        setCampaign(data)
        if (!data) {
          setError('Campanha não encontrada.')
          return
        }
        // Carrega as opções/variações da campanha para o dropdown do comprador
        const opts = await buscarOpcoesCampanha(data.id)
        setOpcoes(opts)
      } catch (err) {
        setError('Erro ao carregar campanha.')
        setCampaign(null)
      } finally {
        setLoading(false)
      }
    },
    [slug]
  )

  const handleChange = useCallback((field, value) => {
    if (field === 'quantity') {
      const normalized = normalizeQuantity(value)
      setForm((prev) => ({ ...prev, quantity: normalized }))
      return
    }
    if (field === 'whatsapp') {
      setForm((prev) => ({ ...prev, whatsapp: digitsOnly(value) }))
      return
    }
    setForm((prev) => ({ ...prev, [field]: value }))
  }, [])

  const isFormValid = useCallback(() => {
    const nameOk = form.customer_name?.trim().length > 0
    const whatsappOk = digitsOnly(form.whatsapp).length >= 10
    const quantityOk = (form.quantity || MIN_QUANTITY) >= MIN_QUANTITY
    // Dropdown obrigatório apenas quando a campanha tem opções configuradas
    const opcaoOk = opcoes.length === 0 || opcaoSelecionada.trim().length > 0
    return nameOk && whatsappOk && quantityOk && opcaoOk
  }, [form, opcoes, opcaoSelecionada])

  const generatePix = useCallback(async () => {
    if (!campaign) return null
    if (!isFormValid()) {
      setError('Preencha nome, WhatsApp e quantidade corretamente.')
      return null
    }
    setError(null)
    setLoading(true)
    try {
      const quantity = normalizeQuantity(form.quantity)

      // Gera o id do pedido antes do INSERT e persiste no localStorage.
      // O custom fetch (supabase.js) lê 'multiplica_order_id' a cada requisição
      // e injeta o header 'x-order-id'. Isso faz a policy de SELECT reconhecer
      // o pedido recém-criado no RETURNING do INSERT (id::text = x-order-id),
      // evitando o erro PGRST116 causado pelo SELECT retornar 0 linhas.
      const novoId = crypto.randomUUID()
      try {
        localStorage.setItem(STORAGE_KEY_ORDER_ID, novoId)
        if (slug) localStorage.setItem(STORAGE_KEY_SLUG, slug)
      } catch {}

      // Resolve o preço por unidade de forma defensiva antes do INSERT:
      //   - Number() converte strings e null de forma previsível
      //   - Number.isFinite() rejeita NaN, Infinity e undefined
      //   - Fallback garante que campaign.price é sempre o último recurso
      const precoCampanha = Number(campaign.price)
      const precoPadrao = Number.isFinite(precoCampanha) ? precoCampanha : 0

      // Busca o objeto da opção pelo label com trim — evita mismatch por espaço acidental
      const labelNormalizado = opcaoSelecionada.trim()
      const opcaoEscolhida = labelNormalizado
        ? opcoes.find((o) => o.label.trim() === labelNormalizado)
        : null
      const precoOpcaoRaw = opcaoEscolhida?.price != null ? Number(opcaoEscolhida.price) : null
      const precoUnidade =
        precoOpcaoRaw != null && Number.isFinite(precoOpcaoRaw) ? precoOpcaoRaw : precoPadrao

      const totalPrice = quantity * precoUnidade

      // Guarda final: bloqueia INSERT se o total for inválido (NaN, negativo, Infinity)
      if (!Number.isFinite(totalPrice) || totalPrice < 0) {
        console.error('[useOrder] total_price inválido:', { totalPrice, precoUnidade, quantity })
        setError('Não foi possível calcular o valor total. Verifique o preço da campanha.')
        try {
          localStorage.removeItem(STORAGE_KEY_ORDER_ID)
          localStorage.removeItem(STORAGE_KEY_SLUG)
        } catch {}
        return null
      }

      const orderData = {
        id: novoId,
        campaign_id: campaign.id,
        customer_name: form.customer_name.trim(),
        whatsapp: digitsOnly(form.whatsapp),
        quantity,
        total_price: totalPrice,
        // Inclui a opção escolhida — null quando a campanha não tem variações
        selected_option: labelNormalizado || null,
      }

      // Debug — visível no console do navegador durante testes
      console.log('[useOrder] generatePix — pré-insert:', {
        opcaoSelecionada: labelNormalizado,
        opcaoEscolhida,
        precoPadrao,
        precoUnidade,
        quantity,
        totalPrice,
        orderData,
      })

      const order = await createOrder(orderData)
      if (order?.id) {
        setOrderId(order.id)
        setShowPix(true)
        return order
      }

      // INSERT falhou — limpa localStorage para não contaminar sessões futuras
      try {
        localStorage.removeItem(STORAGE_KEY_ORDER_ID)
        localStorage.removeItem(STORAGE_KEY_SLUG)
      } catch {}
      setError('Não foi possível gerar o pedido. Tente novamente.')
      return null
    } catch (err) {
      setError('Erro ao gerar pedido.')
      return null
    } finally {
      setLoading(false)
    }
  }, [campaign, form, isFormValid, opcoes, opcaoSelecionada, slug])

  const handleFileUpload = useCallback(async (file, id) => {
    if (!file) {
      setError('Selecione um arquivo para enviar.')
      return null
    }
    const targetOrderId = id ?? orderId
    if (!targetOrderId) {
      setError('Gere o Pix antes de enviar o comprovante.')
      return null
    }
    setLoading(true)
    setError(null)
    try {
      const result = await uploadProof(file, targetOrderId)
      if (result) setProofSent(true)
      return result
    } catch (err) {
      setError('Erro ao enviar comprovante.')
      return null
    } finally {
      setLoading(false)
    }
  }, [orderId])

  useEffect(() => {
    const storedOrderId = readStoredOrderId()
    const storedSlug = getStoredSlug()

    if (storedOrderId && storedSlug === slug) {
      setOrderId(storedOrderId)
      // setProofSent(true) removed to avoid persisting proofSent after reload
    }
  }, [slug])

  useEffect(() => {
    if (!orderId) {
      setOrder(null)
      return
    }

    async function loadOrder() {
      try {
        const orderData = await getOrderById(orderId)
        setOrder(orderData)
      } catch (err) {
        console.error('Erro ao buscar pedido:', err)
      }
    }

    loadOrder()
  }, [orderId])

  const handleFormChange = useCallback((e) => {
    const name = e.target.name
    const value = e.target.type === 'number' ? Number(e.target.value) : e.target.value
    if (name === 'customer_name') {
      handleChange('customer_name', value)
      return
    }
    if (name === 'whatsapp') {
      handleChange('whatsapp', value)
      return
    }
    if (name === 'quantity') {
      handleChange('quantity', value)
      return
    }
  }, [handleChange])

  const handleSubmit = useCallback(async (e) => {
    if (e && e.preventDefault) e.preventDefault()
    return await generatePix()
  }, [generatePix])

  const handleProofUpload = useCallback((e) => {
    const file = e.target.files?.[0]
    if (!file) return
    return handleFileUpload(file, orderId)
  }, [handleFileUpload, orderId])

  const resetOrder = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY_ORDER_ID)
      localStorage.removeItem(STORAGE_KEY_SLUG)
    } catch {}
    setOrderId(null)
    setOrder(null)
    setProofSent(false)
    setShowPix(false)
  }, [])

  const revealPix = useCallback(() => {
    setShowPix(true)
  }, [])

  const fetchOrderStatus = useCallback(async () => {
    if (!orderId) return null
    console.log('🔍 fetchOrderStatus chamado para orderId:', orderId)
    const status = await getOrderStatus(orderId)
    console.log('📊 Status retornado do banco:', status)
    if (status) setOrderStatus(status)
    return status
  }, [orderId])

  useEffect(() => {
    if (!orderId) return
    console.log('🚀 Polling iniciado para orderId:', orderId)
    fetchOrderStatus()
    const intervalId = setInterval(async () => {
      const status = await fetchOrderStatus()
      if (status === 'approved' || status === 'rejected') {
        console.log('🛑 Polling parado. Status final:', status)
        clearInterval(intervalId)
      }
    }, 5000)
    return () => {
      console.log('🧹 Polling limpo para orderId:', orderId)
      clearInterval(intervalId)
    }
  }, [orderId, fetchOrderStatus])

  return {
    form,
    campaign,
    loading,
    error,
    total,
    orderId,
    order,
    showPix,
    revealPix,
    proofSent,
    orderStatus,
    hasValidOrderId,
    fetchCampaign,
    handleChange,
    generatePix,
    handleFileUpload,
    handleFormChange,
    handleSubmit,
    handleProofUpload,
    resetOrder,
    isFormValid,
    opcoes,
    opcaoSelecionada,
    setOpcaoSelecionada,
  }
}
