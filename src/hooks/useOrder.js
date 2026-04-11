import { useState, useCallback, useEffect, useRef } from 'react'
// TODO: comprimir imagem antes do upload para <300kb
import imageCompression from 'browser-image-compression'
import { getCampaignBySlug, createOrder, uploadProof, getOrderStatus, getOrderById } from '../services/campaignService.js'
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

  const total = campaign
    ? (form.quantity || MIN_QUANTITY) * (campaign.price ?? 0)
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
        }
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
    return nameOk && whatsappOk && quantityOk
  }, [form])

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

      const orderData = {
        id: novoId,
        campaign_id: campaign.id,
        customer_name: form.customer_name.trim(),
        whatsapp: digitsOnly(form.whatsapp),
        quantity,
        total_price: quantity * (campaign.price ?? 0),
      }
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
  }, [campaign, form, isFormValid, slug])

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
  }
}
