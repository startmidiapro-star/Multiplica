/**
 * MULTIPLICA — Auth Service
 * Responsabilidade: Gerencia autenticação do organizador via Supabase Auth
 * Dependências: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
 */
import { supabase } from '../lib/supabase.js'

/**
 * Cadastra um novo organizador.
 * O nome é salvo nos metadados do usuário no Supabase Auth.
 * @param {string} nome
 * @param {string} email
 * @param {string} senha
 * @returns {Promise<{data, error}>}
 */
export async function cadastrar(nome, email, senha) {
  return await supabase.auth.signUp({
    email,
    password: senha,
    options: {
      data: { nome },
    },
  })
}

/**
 * Autentica o organizador com email e senha.
 * @param {string} email
 * @param {string} senha
 * @returns {Promise<{data, error}>}
 */
export async function entrar(email, senha) {
  return await supabase.auth.signInWithPassword({ email, password: senha })
}

/**
 * Encerra a sessão do organizador.
 * @returns {Promise<{error}>}
 */
export async function sair() {
  return await supabase.auth.signOut()
}

/**
 * Envia email de redefinição de senha.
 * @param {string} email
 * @returns {Promise<{data, error}>}
 */
export async function recuperarSenha(email) {
  return await supabase.auth.resetPasswordForEmail(email)
}

/**
 * Retorna a sessão ativa do organizador, ou null se não logado.
 * @returns {Promise<import('@supabase/supabase-js').Session|null>}
 */
export async function obterSessao() {
  const { data } = await supabase.auth.getSession()
  return data?.session ?? null
}
