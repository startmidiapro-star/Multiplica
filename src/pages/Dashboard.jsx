/**
 * MULTIPLICA — Dashboard
 * Responsabilidade: Painel do organizador — lista campanhas e ações principais
 * Dependências: dashboardService.listarCampanhasDoOrganizador, authService.sair
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { listarCampanhasDoOrganizador, excluirCampanha } from '../services/dashboardService.js'
import { sair } from '../services/authService.js'
import LoadingScreen from '../components/LoadingScreen.jsx'

export default function Dashboard() {
  const navigate = useNavigate()
  const [campanhas, setCampanhas] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)
  // slug da campanha cujo link foi copiado — volta a null após 2s
  const [copiado, setCopiado] = useState(null)
  // ID da campanha em processo de exclusão — controla estado de loading no botão
  const [excluindo, setExcluindo] = useState(null)
  // Mensagem de erro da última tentativa de exclusão — some após 3s
  const [erroExclusao, setErroExclusao] = useState(null)

  useEffect(() => {
    listarCampanhasDoOrganizador()
      .then((dados) => {
        setCampanhas(dados)
      })
      .catch(() => {
        setErro('Não foi possível carregar as campanhas. Tente recarregar a página.')
      })
      .finally(() => {
        setCarregando(false)
      })
  }, [])

  async function handleSair() {
    await sair()
    navigate('/')
  }

  async function copiarLinkComprador(slug) {
    const link = `${window.location.origin}/c/${slug}`
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
    setCopiado(slug)
    setTimeout(() => setCopiado(null), 2000)
  }

  async function handleExcluir(campanha) {
    const confirmado = window.confirm(
      'Tem certeza que deseja excluir esta campanha? Esta ação não pode ser desfeita.'
    )
    if (!confirmado) return

    setExcluindo(campanha.id)
    setErroExclusao(null)
    try {
      await excluirCampanha(campanha.id)
      // Remove a campanha da lista sem recarregar do banco
      setCampanhas((prev) => prev.filter((c) => c.id !== campanha.id))
    } catch (e) {
      setErroExclusao(e.message)
      setTimeout(() => setErroExclusao(null), 3000)
    } finally {
      setExcluindo(null)
    }
  }

  function abrirAdmin(campanha) {
    // Usa window.location.href para preservar o fragmento #auth=token
    // React Router navigate() descartaria o hash
    window.location.href = `/admin/${campanha.slug}#auth=${campanha.manager_token}`
  }

  if (carregando) return <LoadingScreen />

  if (erro) {
    return (
      <main className="page-dashboard">
        <p className="dashboard-erro">{erro}</p>
        <button className="btn-nova-campanha-dashboard" onClick={() => window.location.reload()}>
          Tentar novamente
        </button>
      </main>
    )
  }

  return (
    <main className="page-dashboard">
      <header className="dashboard-header">
        <h1>Minhas campanhas</h1>
        <div className="dashboard-header-acoes">
          <button
            className="btn-nova-campanha-dashboard"
            onClick={() => navigate('/nova-campanha')}
          >
            + Nova campanha
          </button>
          <button className="btn-sair" onClick={handleSair}>
            Sair
          </button>
        </div>
      </header>

      {campanhas.length === 0 && (
        <div className="dashboard-vazio">
          <p>Você ainda não tem campanhas.</p>
          <button
            className="btn-nova-campanha-dashboard"
            onClick={() => navigate('/nova-campanha')}
          >
            Criar minha primeira campanha
          </button>
        </div>
      )}

      {erroExclusao && (
        <p className="dashboard-erro-exclusao">{erroExclusao}</p>
      )}

      <div className="dashboard-lista">
        {campanhas.map((campanha) => {
          // Campanha encerrada: data de entrega definida e já passou
          const encerrada =
            campanha.delivery_at && new Date(campanha.delivery_at) < new Date()

          return (
            <div key={campanha.id} className="dashboard-card">
              <div className="dashboard-card-info">
                <h2 className="dashboard-card-nome">{campanha.name}</h2>
                <span
                  className={`dashboard-status ${
                    encerrada
                      ? 'dashboard-status--encerrada'
                      : 'dashboard-status--ativa'
                  }`}
                >
                  {encerrada ? 'Encerrada' : 'Ativa'}
                </span>
              </div>

              <p className="dashboard-card-preco">
                R$ {Number(campanha.price).toFixed(2)} por unidade
              </p>

              <p className="dashboard-card-pedidos">
                {campanha.totalPedidos === 1
                  ? '1 pedido'
                  : `${campanha.totalPedidos} pedidos`}
              </p>

              {campanha.delivery_at && (
                <p className="dashboard-card-entrega">
                  Entrega:{' '}
                  {new Date(campanha.delivery_at).toLocaleDateString('pt-BR')}
                </p>
              )}

              <div className="dashboard-card-acoes">
                <button
                  className="btn-gerenciar"
                  onClick={() => abrirAdmin(campanha)}
                >
                  Gerenciar pedidos
                </button>
                <button
                  className="btn-copiar-link"
                  onClick={() => copiarLinkComprador(campanha.slug)}
                >
                  {copiado === campanha.slug ? 'Copiado!' : 'Copiar link'}
                </button>
                <button
                  className="btn-excluir"
                  onClick={() => handleExcluir(campanha)}
                  disabled={excluindo === campanha.id}
                  aria-label={`Excluir campanha ${campanha.name}`}
                >
                  {excluindo === campanha.id ? 'Excluindo…' : '🗑'}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </main>
  )
}
