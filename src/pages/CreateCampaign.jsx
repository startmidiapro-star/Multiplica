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
  itemDescription: '',
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
  // Sabores/variantes da campanha: [{name: string, price: string}]
  // price vazio = usar o preço padrão da campanha
  const [temVariantes, setTemVariantes] = useState(false)
  const [variantes, setVariantes] = useState([])
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

  function adicionarVariante() {
    const name = novaVariante.name.trim()
    if (!name) return
    // Evita duplicatas (case-insensitive)
    if (variantes.some((v) => v.name.toLowerCase() === name.toLowerCase())) return
    setVariantes((prev) => [...prev, { name, price: novaVariante.price.trim() }])
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

  function formularioValido() {
    return (
      form.nome.trim().length > 0 &&
      form.itemDescription.trim().length > 0 &&
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
        itemDescription: form.itemDescription.trim(),
        precoUnitario: Number(form.precoUnitario),
        chavePix: form.chavePix.trim(),
        dataEntrega: form.dataEntrega || null,
        whatsapp: digitsOnly(form.whatsapp) || null,
        hasVariantes: temVariantes,
      })
      if (!campanha) {
        setErro('Não foi possível criar a campanha. Tente novamente.')
        return
      }

      // Insere as variantes vinculadas à campanha (mapeia name → label esperado pelo serviço)
      if (temVariantes && variantes.length > 0) {
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
              placeholder="Ex: Bancos da Igreja"
              required
            />
          </label>

          <label>
            Produto / Item *
            <input
              type="text"
              value={form.itemDescription}
              onChange={(e) => handleChange('itemDescription', e.target.value)}
              placeholder="Ex: Pastéis de Feira"
              required
            />
          </label>

          <div className="create-campo-preco">
            <label>
              Preço padrão por unidade (R$) *
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
            <p className="create-campo-preco-dica">
              Aplicado automaticamente nas opções sem preço próprio definido.
            </p>
          </div>

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

          {/* Checkbox: produto com sabores/variantes */}
          <label className="create-variantes-checkbox-label">
            <input
              type="checkbox"
              checked={temVariantes}
              onChange={(e) => {
                setTemVariantes(e.target.checked)
                if (!e.target.checked) setVariantes([])
              }}
            />
            Produto com sabores / variantes
          </label>

          {/* Seção de variantes — exibida apenas quando checkbox marcado */}
          {temVariantes && (
            <div className="create-opcoes-secao">
              <div className="create-opcoes-input-linha">
                <input
                  type="text"
                  className="create-opcao-input"
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
                  className="create-opcao-preco-input"
                  value={novaVariante.price}
                  onChange={(e) =>
                    setNovaVariante((prev) => ({ ...prev, price: e.target.value }))
                  }
                  onKeyDown={handleVarianteKeyDown}
                  placeholder="R$ preço"
                  min="0"
                  step="0.01"
                />
                <button
                  type="button"
                  className="btn-adicionar-opcao"
                  onClick={adicionarVariante}
                >
                  + Adicionar sabor
                </button>
              </div>
              <p className="create-opcoes-dica">
                Deixe o preço em branco para usar o valor padrão da campanha.
              </p>

              {variantes.length > 0 && (
                <>
                  <div className="create-opcoes-lista">
                    {variantes.map((variante, idx) => {
                      const temPrecoProrio = variante.price !== ''
                      return (
                        <span
                          key={idx}
                          className={`create-opcao-tag ${temPrecoProrio ? 'create-opcao-tag--proprio' : ''}`}
                        >
                          {variante.name}
                          {temPrecoProrio ? (
                            <span className="create-opcao-tag-preco">
                              R$ {Number(variante.price).toFixed(2)}
                            </span>
                          ) : (
                            <span className="create-opcao-tag-padrao">padrão</span>
                          )}
                          <button
                            type="button"
                            className="create-opcao-remover"
                            onClick={() => removerVariante(idx)}
                            aria-label={`Remover ${variante.name}`}
                          >
                            ×
                          </button>
                        </span>
                      )
                    })}
                  </div>

                  {/* Aviso quando há mix de preços próprios e padrão */}
                  {variantes.some((v) => v.price !== '') && (
                    <div className="create-opcoes-aviso-preco">
                      Sabores em laranja têm preço próprio e substituem o valor padrão
                      {form.precoUnitario
                        ? ` (R$ ${Number(form.precoUnitario).toFixed(2)})`
                        : ''
                      } apenas para aquele item.
                    </div>
                  )}
                </>
              )}
            </div>
          )}

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
