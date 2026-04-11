/**
 * MULTIPLICA — Dashboard Service
 * Responsabilidade: Busca campanhas vinculadas ao organizador logado,
 *                   incluindo contagem de pedidos por campanha
 * Dependências: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
 */
import { supabase } from '../lib/supabase.js'

/**
 * Lista todas as campanhas do organizador autenticado,
 * com o total de pedidos de cada uma.
 *
 * A contagem de pedidos é feita sequencialmente (não em paralelo)
 * porque `contarPedidosDaCampanha` usa sessionStorage temporariamente
 * para injetar x-manager-token. Execução paralela causaria race condition.
 *
 * @returns {Promise<Array>} Campanhas com campo `totalPedidos`
 */
export async function listarCampanhasDoOrganizador() {
  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[dashboardService] listarCampanhasDoOrganizador:', error.message)
    return []
  }

  const campanhas = data ?? []

  // Busca total de pedidos de cada campanha — sequencial para evitar race no sessionStorage
  const resultado = []
  for (const campanha of campanhas) {
    const totalPedidos = await contarPedidosDaCampanha(campanha.id, campanha.manager_token)
    resultado.push({ ...campanha, totalPedidos })
  }

  return resultado
}

/**
 * Conta os pedidos de uma campanha via manager_token.
 *
 * A RLS de SELECT em orders exige x-manager-token OU x-order-id.
 * O custom fetch em supabase.js lê sessionStorage('manager_token') a cada
 * requisição e injeta o header. Aqui setamos temporariamente o token da
 * campanha para satisfazer a policy, depois removemos.
 *
 * Pedidos são criados por compradores anon (sem user_id) — por isso a
 * contagem usa campaign_id, não user_id.
 *
 * @param {string} campaignId
 * @param {string} managerToken
 * @returns {Promise<number>}
 */
async function contarPedidosDaCampanha(campaignId, managerToken) {
  // Injeta o token temporariamente
  try {
    sessionStorage.setItem('manager_token', managerToken)
  } catch {
    return 0
  }

  try {
    const { count, error } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('campaign_id', campaignId)

    if (error) {
      console.error('[dashboardService] contarPedidosDaCampanha:', error.message)
      return 0
    }

    return count ?? 0
  } finally {
    // Remove o token — no dashboard não há sessão de admin ativa
    // O organizador recupera o token pelo hash ao abrir o painel da campanha
    try {
      sessionStorage.removeItem('manager_token')
    } catch {}
  }
}
