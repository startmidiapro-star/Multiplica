import { supabase } from '../lib/supabase.js'

/**
 * Busca campanha pelo slug.
 * @param {string} slug - Slug da campanha
 * @returns {Promise<object|null>} Dados da campanha ou null
 */
export const getCampaignBySlug = async (slug) => {
  try {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('slug', slug)
      .single()

    if (error) {
      console.error('[campaignService] getCampaignBySlug:', error.message)
      return null
    }

    return data
  } catch (err) {
    console.error('[campaignService] getCampaignBySlug:', err)
    return null
  }
}

/**
 * Cria um novo pedido no banco.
 * @param {object} orderData - Dados do pedido
 * @returns {Promise<object|null>} Pedido criado ou null
 */
export const createOrder = async (orderData) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .insert(orderData)
      .select()
      .single()

    if (error) {
      console.error('[campaignService] createOrder:', error.message)
      return null
    }

    return data
  } catch (err) {
    console.error('[campaignService] createOrder:', err)
    return null
  }
}

/**
 * Busca o status de um pedido pelo ID.
 * @param {string} orderId - ID do pedido
 * @returns {Promise<string|null>} Status ou null
 */
export async function getOrderStatus(orderId) {
  const { data, error } = await supabase
    .from('orders')
    .select('status')
    .eq('id', orderId)
    .single()

  if (error) throw error

  // Garantir que o status é uma string limpa sem aspas extras
  const cleanStatus = data?.status?.replace(/^['"]|['"]$/g, '') || null
  return cleanStatus
}

/**
 * Faz upload do comprovante no bucket "comprovantes".
 * @param {File} file - Arquivo de imagem
 * @param {string} orderId - ID do pedido
 * @returns {Promise<object|null>} Caminho do arquivo ou null
 */
export const uploadProof = async (file, orderId) => {
  try {
    const fileExt = file.name.split('.').pop()
    const fileName = `${orderId}-${Date.now()}.${fileExt}`

    const { data, error } = await supabase.storage
      .from('comprovantes')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (error) {
      console.error('[campaignService] uploadProof:', error.message)
      return null
    }

    // Salva o path relativo no banco — nunca URL pública (LGPD)
    const { error: erroAtualizacao } = await supabase
      .from('orders')
      .update({ proof_url: data.path })
      .eq('id', orderId)

    if (erroAtualizacao) {
      console.error('[campaignService] uploadProof - salvar path:', erroAtualizacao.message)
      return null
    }

    return data
  } catch (err) {
    console.error('[campaignService] uploadProof:', err)
    return null
  }
}

export async function getOrderById(orderId) {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (error) {
      console.error('[campaignService] getOrderById:', error.message)
      return null
    }

    return data
  } catch (err) {
    console.error('[campaignService] getOrderById:', err)
    return null
  }
}
