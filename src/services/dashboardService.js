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
 * Exclui uma campanha e todos os dados vinculados a ela.
 * Ordem de deleção respeita as FKs: orders → campaign_options → campaigns.
 * A RLS garante que apenas o dono da campanha pode executar esta operação.
 *
 * Nota LGPD: a limpeza automática de dados após 90 dias do encerramento
 * deve ser implementada via Supabase Cron Job na V2.0.
 *
 * @param {string} campanhaId
 * @throws {Error} Se qualquer etapa da exclusão falhar
 */
export async function excluirCampanha(campanhaId) {
  // 1. Remove os pedidos vinculados (dados do comprador — LGPD)
  //    count: 0 é válido — campanha pode não ter pedidos
  const { error: erroPedidos } = await supabase
    .from('orders')
    .delete()
    .eq('campaign_id', campanhaId)

  if (erroPedidos) {
    console.error('[dashboardService] excluirCampanha - pedidos:', erroPedidos.message)
    throw new Error('Não foi possível excluir os pedidos da campanha.')
  }

  // 2. Remove as opções/variantes vinculadas
  //    count: 0 é válido — campanha pode não ter variantes
  const { error: erroOpcoes } = await supabase
    .from('campaign_options')
    .delete()
    .eq('campaign_id', campanhaId)

  if (erroOpcoes) {
    console.error('[dashboardService] excluirCampanha - opções:', erroOpcoes.message)
    throw new Error('Não foi possível excluir as opções da campanha.')
  }

  // 3. Remove a campanha em si — usa count para detectar bloqueio silencioso de RLS.
  //    Supabase retorna { error: null, count: 0 } quando o DELETE é bloqueado por policy,
  //    sem lançar erro. Se count === 0, a policy DELETE não está configurada no banco.
  const { error, count } = await supabase
    .from('campaigns')
    .delete({ count: 'exact' })
    .eq('id', campanhaId)

  if (error) {
    console.error('[dashboardService] excluirCampanha:', error.message)
    throw new Error('Não foi possível excluir a campanha.')
  }

  if (count === 0) {
    console.error('[dashboardService] excluirCampanha: DELETE retornou 0 linhas — policy RLS ausente. Execute sql/rls_delete_campaigns.sql no Supabase.')
    throw new Error('Sem permissão para excluir esta campanha. Contacte o suporte.')
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
