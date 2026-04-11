/**
 * MULTIPLICA — Cadastro
 * Responsabilidade: Cadastro do organizador via email e senha
 * Dependências: authService.cadastrar
 */
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { cadastrar } from '../services/authService.js'

// Traduz mensagens de erro do Supabase Auth para português
function traduzirErro(mensagem) {
  if (mensagem.includes('already registered') || mensagem.includes('User already registered')) {
    return 'Este email já está cadastrado. Tente fazer login.'
  }
  if (mensagem.includes('Password should be at least')) {
    return 'A senha deve ter pelo menos 6 caracteres.'
  }
  if (mensagem.includes('invalid email') || mensagem.includes('Invalid email')) {
    return 'Email inválido.'
  }
  return 'Erro ao criar conta. Tente novamente.'
}

export default function Cadastro() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ nome: '', email: '', senha: '', confirmarSenha: '' })
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState(null)
  const [confirmacaoEnviada, setConfirmacaoEnviada] = useState(false)

  function handleChange(campo, valor) {
    setForm((prev) => ({ ...prev, [campo]: valor }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setErro(null)

    if (form.senha !== form.confirmarSenha) {
      setErro('As senhas não coincidem.')
      return
    }
    if (form.senha.length < 6) {
      setErro('A senha deve ter pelo menos 6 caracteres.')
      return
    }

    setEnviando(true)
    try {
      const { data, error } = await cadastrar(form.nome.trim(), form.email.trim(), form.senha)
      if (error) {
        setErro(traduzirErro(error.message))
        return
      }
      // Sessão criada diretamente (confirmação de email desativada no projeto)
      if (data.session) {
        navigate('/dashboard')
        return
      }
      // Supabase exige confirmação por email antes de criar sessão
      setConfirmacaoEnviada(true)
    } catch (err) {
      console.error('[Cadastro] handleSubmit:', err)
      setErro('Erro ao criar conta. Tente novamente.')
    } finally {
      setEnviando(false)
    }
  }

  // Tela de confirmação de email
  if (confirmacaoEnviada) {
    return (
      <main className="page-auth">
        <div className="auth-container">
          <h1>✉️ Confirme seu email</h1>
          <p className="auth-info">
            Enviamos um link de confirmação para <strong>{form.email}</strong>.
            Clique no link para ativar sua conta e acessar o painel.
          </p>
          <Link to="/login" className="auth-link">Já confirmei — fazer login</Link>
        </div>
      </main>
    )
  }

  return (
    <main className="page-auth">
      <div className="auth-container">
        <h1>Criar conta</h1>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            Nome
            <input
              type="text"
              value={form.nome}
              onChange={(e) => handleChange('nome', e.target.value)}
              placeholder="Seu nome"
              required
            />
          </label>

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
              placeholder="Mínimo 6 caracteres"
              required
              autoComplete="new-password"
            />
          </label>

          <label>
            Confirmar senha
            <input
              type="password"
              value={form.confirmarSenha}
              onChange={(e) => handleChange('confirmarSenha', e.target.value)}
              placeholder="Repita a senha"
              required
              autoComplete="new-password"
            />
          </label>

          {erro && <p className="auth-erro">{erro}</p>}

          <button type="submit" className="btn-auth-primario" disabled={enviando}>
            {enviando ? 'Criando...' : 'Criar conta'}
          </button>
        </form>

        <p className="auth-rodape">
          Já tem conta?{' '}
          <Link to="/login" className="auth-link">Fazer login</Link>
        </p>
      </div>
    </main>
  )
}
