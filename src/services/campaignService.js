import { supabase } from '../lib/supabase.js'
import { gerarSlug } from '../utils/index.js'

/**
 * Busca campanha pelo slug — colunas explícitas, sem manager_token.
 * Usado no fluxo do comprador (anon): expor manager_token seria risco de segurança.
 * @param {string} slug - Slug da campanha
 * @returns {Promise<object|null>} Dados da campanha ou null
 */
export const getCampaignBySlug = async (slug) => {
  try {
    const { data, error } = await supabase
      .from('campaigns')
      .select('id, name, slug, price, item_name, pix_key, delivery_at, contact_whatsapp')
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

/**
 * Cria uma nova campanha e retorna os dados incluindo o manager_token.
 *
 * Fluxo de segurança:
 *   1. Obtém o user_id do organizador via supabase.auth.getUser()
 *   2. Gera o id da campanha no frontend com crypto.randomUUID()
 *   3. Persiste o id em sessionStorage como 'multiplica_campaign_id_temp'
 *   4. O custom fetch em supabase.js injeta 'x-campaign-id' em cada request
 *   5. INSERT exige authenticated + user_id = auth.uid() (RLS P8)
 *   6. SELECT pós-INSERT satisfeito pela policy authenticated (user_id = auth.uid())
 *   7. Após o SELECT, limpa sessionStorage — header deixa de ser enviado
 *
 * O manager_token é gerado pelo banco (gen_random_uuid()) — nunca pelo frontend.
 *
 * @param {object} dados - { nome, itemVendido, precoUnitario, chavePix, dataEntrega, whatsapp }
 * @returns {Promise<object|null>} Campanha criada (com manager_token) ou null
 */
export async function criarCampanha(dados) {
  const idCampanha = crypto.randomUUID()
  const slug = gerarSlug(dados.nome)

  // Obtém o user_id do organizador logado — obrigatório para satisfazer a RLS de INSERT
  const { data: dadosAuth } = await supabase.auth.getUser()
  const userId = dadosAuth?.user?.id ?? null

  // Persiste temporariamente para injeção do header x-campaign-id
  try {
    sessionStorage.setItem('multiplica_campaign_id_temp', idCampanha)
  } catch {}

  try {
    // INSERT sem .select() — não exige policy de SELECT para retornar dados
    const { error: erroInsert } = await supabase
      .from('campaigns')
      .insert({
        id: idCampanha,
        name: dados.nome,
        item_name: dados.itemVendido,
        price: dados.precoUnitario,
        pix_key: dados.chavePix,
        delivery_at: dados.dataEntrega || null,
        contact_whatsapp: dados.whatsapp || null,
        slug,
        user_id: userId,
      })

    if (erroInsert) {
      console.error('[campaignService] criarCampanha INSERT:', erroInsert.message)
      return null
    }

    // SELECT separado — a policy RLS permite porque x-campaign-id = id da campanha
    // Retorna o manager_token gerado pelo banco via gen_random_uuid()
    const { data, error: erroSelect } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', idCampanha)
      .single()

    if (erroSelect) {
      console.error('[campaignService] criarCampanha SELECT:', erroSelect.message)
      return null
    }

    return data
  } finally {
    // Limpa sempre — com ou sem erro — para não vazar o header em requests futuros
    try {
      sessionStorage.removeItem('multiplica_campaign_id_temp')
    } catch {}
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
