/**
 * MULTIPLICA — Criação de Campanha
 * Responsabilidade: Tela 1 (formulário) e Tela 2 (confirmação com links)
 * Dependências: campaignService, utils
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { criarCampanha, inserirOpcoesCampanha } from '../services/campaignService.js'
import { formatWhatsApp, digitsOnly } from '../utils/index.js'

const estadoInicialFormulario = {
  nome: '',
  itemVendido: '',
  precoUnitario: '',
  chavePix: '',
  dataEntrega: '',
  whatsapp: '',
}

export default function CreateCampaign() {
  const navigate = useNavigate()
  const [form, setForm] = useState(estadoInicialFormulario)
  const [campanhaCriada, setCampanhaCriada] = useState(null)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState(null)
  // 'comprador' | 'admin' | null — controla feedback do botão copiar
  const [copiado, setCopiado] = useState(null)
  // Opções/variações da campanha (ex: ['Carne', 'Queijo'])
  const [opcoes, setOpcoes] = useState([])
  const [novaOpcao, setNovaOpcao] = useState('')

  const linkComprador = campanhaCriada
    ? `${window.location.origin}/c/${campanhaCriada.slug}`
    : ''
  const linkAdmin = campanhaCriada
    ? `${window.location.origin}/admin/${campanhaCriada.slug}#auth=${campanhaCriada.manager_token}`
    : ''

  function handleChange(campo, valor) {
    setForm((prev) => ({ ...prev, [campo]: valor }))
  }

  function adicionarOpcao() {
    const label = novaOpcao.trim()
    if (!label) return
    // Evita duplicatas (case-insensitive)
    if (opcoes.some((o) => o.toLowerCase() === label.toLowerCase())) return
    setOpcoes((prev) => [...prev, label])
    setNovaOpcao('')
  }

  function removerOpcao(idx) {
    setOpcoes((prev) => prev.filter((_, i) => i !== idx))
  }

  function handleOpcaoKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault()
      adicionarOpcao()
    }
  }

  function formularioValido() {
    return (
      form.nome.trim().length > 0 &&
      form.itemVendido.trim().length > 0 &&
      Number(form.precoUnitario) > 0 &&
      form.chavePix.trim().length > 0
    )
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!formularioValido()) {
      setErro('Preencha todos os campos obrigatórios.')
      return
    }
    setErro(null)
    setSalvando(true)
    try {
      const campanha = await criarCampanha({
        nome: form.nome.trim(),
        itemVendido: form.itemVendido.trim(),
        precoUnitario: Number(form.precoUnitario),
        chavePix: form.chavePix.trim(),
        dataEntrega: form.dataEntrega || null,
        whatsapp: digitsOnly(form.whatsapp) || null,
      })
      if (!campanha) {
        setErro('Não foi possível criar a campanha. Tente novamente.')
        return
      }

      // Insere as opções/variações vinculadas à campanha (não-bloqueante para o fluxo)
      if (opcoes.length > 0) {
        await inserirOpcoesCampanha(campanha.id, opcoes)
      }

      setCampanhaCriada(campanha)
    } catch (err) {
      console.error('[CreateCampaign] handleSubmit:', err)
      setErro('Erro ao criar campanha. Tente novamente.')
    } finally {
      setSalvando(false)
    }
  }

  async function copiarLink(tipo, link) {
    try {
      await navigator.clipboard.writeText(link)
    } catch {
      // fallback para navegadores sem suporte à Clipboard API
      const input = document.createElement('input')
      input.value = link
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
    }
    setCopiado(tipo)
    setTimeout(() => setCopiado(null), 2000)
  }

  function reiniciar() {
    setForm(estadoInicialFormulario)
    setCampanhaCriada(null)
    setErro(null)
  }

  // ── Tela 2: Confirmação ──────────────────────────────────────
  if (campanhaCriada) {
    return (
      <main className="page-create">
        <div className="create-confirmacao">
          <h1 className="confirmacao-titulo">✅ Campanha criada!</h1>
          <p className="confirmacao-nome">{campanhaCriada.name}</p>

          <div className="link-bloco">
            <p className="link-label">🔗 Link dos compradores</p>
            <code className="link-texto">{linkComprador}</code>
            <button
              className="btn-copiar"
              onClick={() => copiarLink('comprador', linkComprador)}
            >
              {copiado === 'comprador' ? '✅ Copiado!' : 'Copiar link'}
            </button>
          </div>

          <div className="link-bloco link-bloco--admin">
            <p className="link-label">🔐 Seu link de gestão</p>
            <code className="link-texto link-texto--admin">{linkAdmin}</code>
            <button
              className="btn-copiar btn-copiar--admin"
              onClick={() => copiarLink('admin', linkAdmin)}
            >
              {copiado === 'admin' ? '✅ Copiado!' : 'Copiar link'}
            </button>
          </div>

          <div className="aviso-guardar">
            ⚠️ Guarde este link! Ele é sua senha de acesso. Não compartilhe.
          </div>

          <div className="confirmacao-acoes">
            <button
              className="btn-abrir-painel"
              onClick={() => window.open(linkAdmin, '_blank')}
            >
              Abrir painel agora
            </button>
            <button className="btn-nova-campanha" onClick={reiniciar}>
              Criar outra campanha
            </button>
          </div>
        </div>
      </main>
    )
  }

  // ── Tela 1: Formulário ───────────────────────────────────────
  return (
    <main className="page-create">
      <div className="create-container">
        <h1>Nova campanha</h1>

        <form className="create-form" onSubmit={handleSubmit}>
          <label>
            Nome da campanha *
            <input
              type="text"
              value={form.nome}
              onChange={(e) => handleChange('nome', e.target.value)}
              placeholder="Ex: Pastel da Dona Neide"
              required
            />
          </label>

          <label>
            Item vendido *
            <input
              type="text"
              value={form.itemVendido}
              onChange={(e) => handleChange('itemVendido', e.target.value)}
              placeholder="Ex: Pastel de queijo"
              required
            />
          </label>

          <label>
            Preço unitário (R$) *
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={form.precoUnitario}
              onChange={(e) => handleChange('precoUnitario', e.target.value)}
              placeholder="0,00"
              required
            />
          </label>

          <label>
            Chave Pix *
            <input
              type="text"
              value={form.chavePix}
              onChange={(e) => handleChange('chavePix', e.target.value)}
              placeholder="CPF, e-mail, telefone ou chave aleatória"
              required
            />
          </label>

          <label>
            Data de entrega
            <input
              type="date"
              value={form.dataEntrega}
              onChange={(e) => handleChange('dataEntrega', e.target.value)}
            />
          </label>

          <label>
            WhatsApp de contato
            <input
              type="tel"
              value={formatWhatsApp(form.whatsapp)}
              onChange={(e) => handleChange('whatsapp', e.target.value)}
              placeholder="(00) 00000-0000"
            />
          </label>

          {/* Opções/variações — ex: Carne, Queijo, Frango */}
          <div className="create-opcoes-secao">
            <span className="create-opcoes-titulo">Opções / Variações</span>
            <p className="create-opcoes-dica">
              Deixe em branco se não houver. Ex: Carne, Queijo, Frango.
            </p>
            <div className="create-opcoes-input-linha">
              <input
                type="text"
                className="create-opcao-input"
                value={novaOpcao}
                onChange={(e) => setNovaOpcao(e.target.value)}
                onKeyDown={handleOpcaoKeyDown}
                placeholder="Ex: Carne"
                maxLength={60}
              />
              <button
                type="button"
                className="btn-adicionar-opcao"
                onClick={adicionarOpcao}
              >
                + Adicionar
              </button>
            </div>
            {opcoes.length > 0 && (
              <div className="create-opcoes-lista">
                {opcoes.map((opcao, idx) => (
                  <span key={idx} className="create-opcao-tag">
                    {opcao}
                    <button
                      type="button"
                      className="create-opcao-remover"
                      onClick={() => removerOpcao(idx)}
                      aria-label={`Remover ${opcao}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {erro && <p className="create-erro">{erro}</p>}

          <div className="create-acoes">
            <button
              type="button"
              className="btn-voltar"
              onClick={() => navigate('/')}
            >
              Voltar
            </button>
            <button type="submit" className="btn-criar" disabled={salvando}>
              {salvando ? 'Criando...' : 'Criar campanha'}
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}
