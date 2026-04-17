/**
 * MULTIPLICA — Criação de Campanha V1.1
 * Responsabilidade: Formulário em 3 seções + tela de confirmação
 * Dependências: campaignService, utils
 *
 * V1.1 — mudanças em relação à V1.0:
 *   - Seção 1: campos description (motivação, opcional) e itemDescription
 *   - Seção 2: radio mutuamente exclusivo (single/multiple) com reset ao alternar
 *   - Modo multiple: preço obrigatório por variante — sem fallback, sem herança
 *   - Seção 3: nomeRecebedor (novo campo obrigatório)
 *   - Data de entrega e WhatsApp agora obrigatórios
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { criarCampanha, inserirOpcoesCampanha } from '../services/campaignService.js'
import { formatWhatsApp, digitsOnly } from '../utils/index.js'

const estadoInicialFormulario = {
  nome: '',
  descricao: '',
  itemDescription: '',
  chavePix: '',
  nomeRecebedor: '',
  dataEntrega: '',
  whatsapp: '',
}

export default function CreateCampaign() {
  const navigate = useNavigate()
  const [form, setForm] = useState(estadoInicialFormulario)
  const [campanhaCriada, setCampanhaCriada] = useState(null)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState(null)
  // 'comprador' | 'admin' | null — feedback do botão copiar na tela de confirmação
  const [copiado, setCopiado] = useState(null)
  const [aceitoTermos, setAceitoTermos] = useState(false)

  // Seção 2 — tipo de campanha
  const [tipoCampanha, setTipoCampanha] = useState('single')
  const [precoUnitario, setPrecoUnitario] = useState('')
  // Lista de variantes confirmadas: [{name, price}]
  const [variantes, setVariantes] = useState([])
  // Inputs temporários para a próxima variante a adicionar
  const [novaVariante, setNovaVariante] = useState({ name: '', price: '' })

  const linkComprador = campanhaCriada
    ? `${window.location.origin}/c/${campanhaCriada.slug}`
    : ''
  const linkAdmin = campanhaCriada
    ? `${window.location.origin}/admin/${campanhaCriada.slug}#auth=${campanhaCriada.manager_token}`
    : ''

  function handleChange(campo, valor) {
    setForm((prev) => ({ ...prev, [campo]: valor }))
  }

  // Alterna o tipo e limpa completamente o estado da opção anterior
  function alterarTipo(tipo) {
    setTipoCampanha(tipo)
    if (tipo === 'single') {
      setVariantes([])
      setNovaVariante({ name: '', price: '' })
    } else {
      setPrecoUnitario('')
    }
  }

  function adicionarVariante() {
    const name = novaVariante.name.trim()
    const price = novaVariante.price.trim()
    // Preço obrigatório — sem fallback
    if (!name || !(Number(price) > 0)) return
    // Evita duplicatas (case-insensitive)
    if (variantes.some((v) => v.name.toLowerCase() === name.toLowerCase())) return
    setVariantes((prev) => [...prev, { name, price }])
    setNovaVariante({ name: '', price: '' })
  }

  function removerVariante(idx) {
    setVariantes((prev) => prev.filter((_, i) => i !== idx))
  }

  function handleVarianteKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault()
      adicionarVariante()
    }
  }

  // Retorna mensagem de erro ou null se válido
  function validar() {
    if (!form.nome.trim()) return 'Nome da campanha é obrigatório.'
    if (!form.itemDescription.trim()) return 'Produto/Item é obrigatório.'

    if (tipoCampanha === 'single') {
      if (!(Number(precoUnitario) > 0)) return 'Informe o preço por unidade.'
    } else {
      if (variantes.length === 0) return 'Adicione pelo menos um item.'
      if (variantes.some((v) => !(Number(v.price) > 0)))
        return 'Todos os itens precisam ter um preço válido.'
    }

    if (!form.chavePix.trim()) return 'Chave Pix é obrigatória.'
    if (!form.nomeRecebedor.trim()) return 'Nome do recebedor é obrigatório.'
    if (!form.dataEntrega) return 'Data de entrega é obrigatória.'
    if (digitsOnly(form.whatsapp).length < 10)
      return 'WhatsApp inválido — informe DDD + número (mínimo 10 dígitos).'
    if (!aceitoTermos)
      return 'Você deve aceitar os Termos de Responsabilidade do Organizador.'
    return null
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const mensagemErro = validar()
    if (mensagemErro) {
      setErro(mensagemErro)
      return
    }
    setErro(null)
    setSalvando(true)
    try {
      const campanha = await criarCampanha({
        nome: form.nome.trim(),
        descricao: form.descricao.trim() || null,
        itemDescription: form.itemDescription.trim(),
        chavePix: form.chavePix.trim(),
        nomeRecebedor: form.nomeRecebedor.trim(),
        dataEntrega: form.dataEntrega,
        whatsapp: digitsOnly(form.whatsapp) || null,
        tipo: tipoCampanha,
        precoUnitario: tipoCampanha === 'single' ? Number(precoUnitario) : null,
        hasVariantes: tipoCampanha === 'multiple',
        // Passado para popular o JSONB variants (cópia desnormalizada)
        variantesSalvas: tipoCampanha === 'multiple' ? variantes : [],
      })

      if (!campanha) {
        setErro('Não foi possível criar a campanha. Tente novamente.')
        return
      }

      // Insere variantes na tabela campaign_options (apenas modo múltiplo)
      if (tipoCampanha === 'multiple' && variantes.length > 0) {
        await inserirOpcoesCampanha(
          campanha.id,
          variantes.map((v) => ({ label: v.name, price: v.price }))
        )
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
      // Fallback para ambientes sem Clipboard API
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
    setTipoCampanha('single')
    setPrecoUnitario('')
    setVariantes([])
    setNovaVariante({ name: '', price: '' })
    setAceitoTermos(false)
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

          {/* ── Seção 1: Sobre a campanha ──────────────────────── */}
          <p className="create-secao-titulo">Sobre a campanha</p>

          <label>
            Nome da campanha *
            <input
              type="text"
              value={form.nome}
              onChange={(e) => handleChange('nome', e.target.value)}
              placeholder="Ex: Pastelada de Outubro ou Rifa do Dia das Crianças"
              required
            />
            <span className="create-microcopy">Use um nome que facilite sua organização.</span>
          </label>

          <label>
            Objetivo / motivação
            <textarea
              className="create-textarea"
              value={form.descricao}
              onChange={(e) => handleChange('descricao', e.target.value)}
              placeholder="Ex: Arrecadar fundos para a pintura da fachada da igreja."
              rows={3}
            />
            <span className="create-microcopy">Conte brevemente por que as pessoas devem ajudar.</span>
          </label>

          <label>
            Produto / Item *
            <input
              type="text"
              value={form.itemDescription}
              onChange={(e) => handleChange('itemDescription', e.target.value)}
              placeholder="Ex: Pastel, Rifas, Ingressos ou Marmitas"
              required
            />
          </label>

          {/* ── Seção 2: Tipo de campanha ───────────────────────── */}
          <p className="create-secao-titulo">Tipo de campanha</p>

          <div className="create-tipo-secao">
            {/* Opção A — preço único */}
            <label className="create-tipo-opcao">
              <input
                type="radio"
                name="tipoCampanha"
                value="single"
                checked={tipoCampanha === 'single'}
                onChange={() => alterarTipo('single')}
              />
              <div className="create-tipo-opcao-texto">
                <strong>Vou vender produto de preço único</strong>
                <span>Todos pagam o mesmo valor por unidade.</span>
              </div>
            </label>

            {tipoCampanha === 'single' && (
              <div className="create-preco-unico">
                <label>
                  Preço por unidade (R$) *
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={precoUnitario}
                    onChange={(e) => setPrecoUnitario(e.target.value)}
                    placeholder="0,00"
                    required
                  />
                </label>
              </div>
            )}

            {/* Opção B — sabores/preços diferentes */}
            <label className="create-tipo-opcao">
              <input
                type="radio"
                name="tipoCampanha"
                value="multiple"
                checked={tipoCampanha === 'multiple'}
                onChange={() => alterarTipo('multiple')}
              />
              <div className="create-tipo-opcao-texto">
                <strong>Produto tem sabores ou preços diferentes</strong>
                <span>Cada item pode ter seu próprio preço.</span>
              </div>
            </label>

            {tipoCampanha === 'multiple' && (
              <div className="create-variantes-secao">

                {/* Lista de variantes já adicionadas */}
                {variantes.length > 0 && (
                  <div className="create-variantes-lista">
                    {variantes.map((variante, idx) => (
                      <div key={idx} className="create-variante-linha">
                        <span className="create-variante-nome-texto">{variante.name}</span>
                        <span className="create-variante-preco-texto">
                          R$ {Number(variante.price).toFixed(2)}
                        </span>
                        <button
                          type="button"
                          className="create-variante-remover"
                          onClick={() => removerVariante(idx)}
                          aria-label={`Remover ${variante.name}`}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Input para adicionar nova variante */}
                <div className="create-variante-input-linha">
                  <input
                    type="text"
                    className="create-variante-input-nome"
                    value={novaVariante.name}
                    onChange={(e) =>
                      setNovaVariante((prev) => ({ ...prev, name: e.target.value }))
                    }
                    onKeyDown={handleVarianteKeyDown}
                    placeholder="Ex: Carne"
                    maxLength={60}
                  />
                  <input
                    type="number"
                    className="create-variante-input-preco"
                    value={novaVariante.price}
                    onChange={(e) =>
                      setNovaVariante((prev) => ({ ...prev, price: e.target.value }))
                    }
                    onKeyDown={handleVarianteKeyDown}
                    placeholder="R$ 0,00"
                    min="0.01"
                    step="0.01"
                  />
                  <button
                    type="button"
                    className="btn-adicionar-variante"
                    onClick={adicionarVariante}
                  >
                    + Adicionar
                  </button>
                </div>
                <p className="create-microcopy">Preço obrigatório em cada item.</p>
              </div>
            )}
          </div>

          {/* ── Seção 3: Pagamento e contato ────────────────────── */}
          <p className="create-secao-titulo">Pagamento e contato</p>

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
            Nome do recebedor *
            <input
              type="text"
              value={form.nomeRecebedor}
              onChange={(e) => handleChange('nomeRecebedor', e.target.value)}
              placeholder="Nome que aparecerá no banco (Ex: Paróquia São Mateus)"
              required
            />
          </label>

          <label>
            Data de entrega *
            <input
              type="date"
              value={form.dataEntrega}
              onChange={(e) => handleChange('dataEntrega', e.target.value)}
              required
            />
          </label>

          <label>
            WhatsApp de contato *
            <input
              type="tel"
              value={formatWhatsApp(form.whatsapp)}
              onChange={(e) => handleChange('whatsapp', e.target.value)}
              placeholder="(00) 00000-0000"
              required
            />
          </label>

          {/* ── Footer ──────────────────────────────────────────── */}
          <label className="create-termos-checkbox">
            <input
              type="checkbox"
              checked={aceitoTermos}
              onChange={(e) => setAceitoTermos(e.target.checked)}
            />
            Li e concordo com os{' '}
            <a href="/legal/terms">Termos de Responsabilidade do Organizador</a>.
          </label>

          {erro && <p className="create-erro">{erro}</p>}

          <div className="create-acoes">
            <button
              type="button"
              className="btn-voltar"
              onClick={() => navigate('/dashboard')}
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
