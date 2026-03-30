import { createClient } from '@supabase/supabase-js'

/**
 * Custom fetch que adiciona o header x-manager-token quando
 * o parâmetro "auth" existe na URL (para acesso do organizador).
 * O projeto não quebra se o parâmetro não existir.
 */
const createFetchWithAuthHeader = () => {
  const defaultFetch = fetch.bind(globalThis)

  return (url, options = {}) => {
    const urlParams = new URLSearchParams(window.location.search)
    const authToken = urlParams.get('auth')

    const headers = new Headers(options.headers || {})
    if (authToken) {
      headers.set('x-manager-token', authToken)
    }

    return defaultFetch(url, { ...options, headers })
  }
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: createFetchWithAuthHeader(),
  },
})

// Expor globalmente para debug (remover depois)
if (typeof window !== 'undefined') {
  window.supabase = supabase
}