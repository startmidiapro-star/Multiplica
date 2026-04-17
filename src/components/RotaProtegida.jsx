/**
 * MULTIPLICA — RotaProtegida
 * Responsabilidade: Bloqueia acesso a rotas privadas se não houver sessão ativa
 * Dependências: authService.obterSessao
 */
import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { obterSessao } from '../services/authService.js'
import LoadingScreen from './LoadingScreen.jsx'

/**
 * Envolve rotas que exigem login do organizador.
 * Exibe nada enquanto verifica a sessão (evita flash de conteúdo protegido).
 * Redireciona para /login se não houver sessão ativa.
 */
const RotaProtegida = ({ children }) => {
  const [verificando, setVerificando] = useState(true)
  const [autenticado, setAutenticado] = useState(false)

  useEffect(() => {
    obterSessao().then((sessao) => {
      setAutenticado(Boolean(sessao))
      setVerificando(false)
    })
  }, [])

  // Aguarda verificação — exibe LoadingScreen para evitar flash de conteúdo protegido
  if (verificando) return <LoadingScreen />

  if (!autenticado) return <Navigate to="/login" replace />

  return children
}

export default RotaProtegida
