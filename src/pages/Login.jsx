/**
 * MULTIPLICA — Login
 * Responsabilidade: Autenticação do organizador via email e senha
 * Dependências: authService.entrar, authService.recuperarSenha
 */
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { entrar, recuperarSenha } from '../services/authService.js'

// Traduz mensagens de erro do Supabase Auth para português
function traduzirErro(mensagem) {
  if (
    mensagem.includes('Invalid login credentials') ||
    mensagem.includes('invalid_credentials')
  ) {
    return 'Email ou senha incorretos.'
  }
  if (mensagem.includes('Email not confirmed')) {
    return 'Email ainda não confirmado. Verifique sua caixa de entrada.'
  }
  if (mensagem.includes('Too many requests')) {
    return 'Muitas tentativas. Aguarde alguns minutos e tente novamente.'
  }
  return 'Erro ao fazer login. Tente novamente.'
}

export default function Login() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', senha: '' })
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState(null)
  const [recuperacaoEnviada, setRecuperacaoEnviada] = useState(false)
  const [enviandoRecuperacao, setEnviandoRecuperacao] = useState(false)

  function handleChange(campo, valor) {
    setForm((prev) => ({ ...prev, [campo]: valor }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setErro(null)
    setEnviando(true)
    try {
      const { data, error } = await entrar(form.email.trim(), form.senha)
      if (error) {
        setErro(traduzirErro(error.message))
        return
      }
      if (data.session) {
        navigate('/dashboard')
      }
    } catch (err) {
      console.error('[Login] handleSubmit:', err)
      setErro('Erro ao fazer login. Tente novamente.')
    } finally {
      setEnviando(false)
    }
  }

  async function handleRecuperarSenha() {
    if (!form.email.trim()) {
      setErro('Digite seu email acima para recuperar a senha.')
      return
    }
    setErro(null)
    setEnviandoRecuperacao(true)
    try {
      const { error } = await recuperarSenha(form.email.trim())
      if (error) {
        setErro('Não foi possível enviar o email. Verifique o endereço.')
        return
      }
      setRecuperacaoEnviada(true)
    } catch {
      setErro('Erro ao enviar email de recuperação.')
    } finally {
      setEnviandoRecuperacao(false)
    }
  }

  return (
    <main className="page-auth">
      <div className="auth-container">
        <h1>Entrar</h1>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            Email
            <input
              type="email"
              value={form.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="seu@email.com"
              required
              autoComplete="email"
            />
          </label>

          <label>
            Senha
            <input
              type="password"
              value={form.senha}
              onChange={(e) => handleChange('senha', e.target.value)}
              placeholder="Sua senha"
              required
              autoComplete="current-password"
            />
          </label>

          {erro && <p className="auth-erro">{erro}</p>}
          {recuperacaoEnviada && (
            <p className="auth-sucesso">✅ Email de recuperação enviado!</p>
          )}

          <button type="submit" className="btn-auth-primario" disabled={enviando}>
            {enviando ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <button
          type="button"
          className="btn-auth-link"
          onClick={handleRecuperarSenha}
          disabled={enviandoRecuperacao}
        >
          {enviandoRecuperacao ? 'Enviando...' : 'Esqueci minha senha'}
        </button>

        <p className="auth-rodape">
          Ainda não tem conta?{' '}
          <Link to="/cadastro" className="auth-link">Criar conta</Link>
        </p>
      </div>
    </main>
  )
}
