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
    // Token do admin (via hash ou sessionStorage)
    const authToken = (() => {
      const fragmento = window.location.hash.slice(1)
      const params = new URLSearchParams(fragmento)
      const hashToken = params.get('auth')
      if (hashToken) return hashToken
      try {
        return sessionStorage.getItem('manager_token')
      } catch {
        return null
      }
    })()

    // Order ID do comprador (via localStorage)
    const orderId = (() => {
      try {
        return localStorage.getItem('multiplica_order_id')
      } catch {
        return null
      }
    })()

    // ID temporário da campanha recém-criada (via sessionStorage)
    // Usado apenas durante o INSERT + SELECT de criação de campanha
    const campaignIdTemp = (() => {
      try {
        return sessionStorage.getItem('multiplica_campaign_id_temp')
      } catch {
        return null
      }
    })()

    const headers = new Headers(options.headers || {})
    if (authToken) {
      headers.set('x-manager-token', authToken)
    }
    if (orderId) {
      headers.set('x-order-id', orderId)
    }
    if (campaignIdTemp) {
      headers.set('x-campaign-id', campaignIdTemp)
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

