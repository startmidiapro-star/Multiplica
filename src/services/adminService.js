import { supabase } from '../lib/supabase'

export async function getCampaignBySlug(slug) {
  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('slug', slug)
    .single()
  
  if (error) throw error
  return data
}

export async function getOrdersByCampaign(campaignId) {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('created_at', { ascending: false })
  
  if (error) throw error

  // Normaliza status: remove aspas extras que possam ter sido gravadas no banco
  const pedidosNormalizados = data.map((pedido) => ({
    ...pedido,
    status: pedido.status?.replace(/^['"]|['"]$/g, '') ?? pedido.status,
  }))

  // Ordenar por prioridade: pending_payment → approved → rejected
  const orderPriority = { pending_payment: 1, approved: 2, rejected: 3 }
  return pedidosNormalizados.sort((a, b) => orderPriority[a.status] - orderPriority[b.status])
}

export async function updateOrderStatus(orderId, newStatus) {
  const { data, error } = await supabase
    .from('orders')
    .update({ status: newStatus })
    .eq('id', orderId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Gera URL assinada para visualização do comprovante.
 * Expira em 1 hora — nunca expõe URL pública permanente.
 * @param {string} path - Path relativo do arquivo no bucket
 * @returns {Promise<string>} URL assinada temporária
 */
export async function gerarUrlAssinadaComprovante(path) {
  const { data, error } = await supabase.storage
    .from('comprovantes')
    .createSignedUrl(path, 3600) // 1 hora de expiração

  if (error) throw error
  return data.signedUrl
}
