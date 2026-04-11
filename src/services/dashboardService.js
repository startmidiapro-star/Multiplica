/**
 * MULTIPLICA — Dashboard Service
 * Responsabilidade: Busca campanhas vinculadas ao organizador logado
 * Dependências: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
 */
import { supabase } from '../lib/supabase.js'

/**
 * Lista todas as campanhas do organizador autenticado.
 * Requer sessão ativa — a RLS filtra por user_id = auth.uid().
 * @returns {Promise<Array>} Lista de campanhas ou array vazio
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

  return data ?? []
}
