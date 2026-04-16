/**
 * MULTIPLICA — Dashboard Service
 * Responsabilidade: Busca e gerencia campanhas vinculadas ao organizador logado,
 *                   incluindo contagem de pedidos e exclusão de campanhas
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
 * Exclui uma campanha e suas opções vinculadas.
 * Remove campaign_options primeiro para evitar violação de FK,
 * depois remove a campanha em si.
 * A RLS garante que apenas o dono da campanha pode excluí-la.
 *
 * @param {string} campanhaId
 * @throws {Error} Se qualquer etapa da exclusão falhar
 */
export async function excluirCampanha(campanhaId) {
  // Remove as opções da campanha antes de excluir a campanha em si
  const { error: erroOpcoes } = await supabase
    .from('campaign_options')
    .delete()
    .eq('campaign_id', campanhaId)

  if (erroOpcoes) {
    console.error('[dashboardService] excluirCampanha - opções:', erroOpcoes.message)
    throw new Error('Não foi possível excluir as opções da campanha.')
  }

  const { error } = await supabase
    .from('campaigns')
    .delete()
    .eq('id', campanhaId)

  if (error) {
    console.error('[dashboardService] excluirCampanha:', error.message)
    throw new Error('Não foi possível excluir a campanha.')
  }
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
