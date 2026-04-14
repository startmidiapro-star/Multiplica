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
 * A filtragem por user_id é feita pelo RLS (policy "Organizador autenticado lê campanhas").
 * A contagem usa a policy "Organizador autenticado lê pedidos" — não precisa de
 * manager_token em sessionStorage. As queries são executadas em paralelo.
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

  // Busca contagens em paralelo — sem race condition porque não usamos sessionStorage
  const totais = await Promise.all(
    campanhas.map((campanha) => contarPedidosDaCampanha(campanha.id))
  )

  return campanhas.map((campanha, i) => ({ ...campanha, totalPedidos: totais[i] }))
}

/**
 * Conta os pedidos de uma campanha.
 *
 * Funciona com o organizador autenticado via RLS:
 *   "Organizador autenticado lê pedidos" — campaign_id IN (campaigns WHERE user_id = auth.uid())
 *
 * @param {string} campaignId
 * @returns {Promise<number>}
 */
async function contarPedidosDaCampanha(campaignId) {
  const { count, error } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('campaign_id', campaignId)

  if (error) {
    console.error('[dashboardService] contarPedidosDaCampanha:', error.message)
    return 0
  }

  return count ?? 0
}
