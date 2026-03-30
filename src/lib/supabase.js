import { createClient } from '@supabase/supabase-js'

/**
 * Custom fetch que adiciona o header x-manager-token quando
 * o fragmento "#auth=UUID" existe na URL (para acesso do organizador).
 * O fragmento nunca é enviado ao servidor — fica apenas no cliente.
 * O projeto não quebra se o fragmento não existir.
 */
const createFetchWithAuthHeader = () => {
  const defaultFetch = fetch.bind(globalThis)

  return (url, options = {}) => {
    // Lê o token do fragmento da URL (#auth=UUID), nunca da query string
    const fragmento = window.location.hash.slice(1)
    const parametrosHash = new URLSearchParams(fragmento)
    const authToken = parametrosHash.get('auth')

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