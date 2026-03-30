/**
 * Utilitários genéricos do projeto.
 */

/**
 * Extrai apenas dígitos de uma string.
 * @param {string} value
 * @returns {string}
 */
export const digitsOnly = (value) => String(value).replace(/\D/g, '')

/**
 * Aplica máscara de WhatsApp: (99) 99999-9999
 * @param {string} value - Valor com ou sem formatação
 * @returns {string} Valor formatado
 */
export const formatWhatsApp = (value) => {
  const nums = digitsOnly(value).slice(0, 11)
  if (nums.length <= 2) return nums ? `(${nums}` : ''
  if (nums.length <= 7) return `(${nums.slice(0, 2)}) ${nums.slice(2)}`
  return `(${nums.slice(0, 2)}) ${nums.slice(2, 7)}-${nums.slice(7)}`
}

/**
 * Normaliza quantidade: mínimo 1, vazio ou 0 vira 1.
 * @param {number|string} value
 * @returns {number}
 */
export const normalizeQuantity = (value) => {
  const n = Number(value)
  if (Number.isNaN(n) || n < 1) return 1
  return Math.floor(n)
}
