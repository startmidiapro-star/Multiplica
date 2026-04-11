/**
 * MULTIPLICA — Dashboard
 * Responsabilidade: Painel do organizador — lista campanhas e ações principais
 * Dependências: dashboardService.listarCampanhasDoOrganizador, authService.sair
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { listarCampanhasDoOrganizador } from '../services/dashboardService.js'
import { sair } from '../services/authService.js'

export default function Dashboard() {
  const navigate = useNavigate()
  const [campanhas, setCampanhas] = useState([])
  const [carregando, setCarregando] = useState(true)
  // slug da campanha cujo link foi copiado — volta a null após 2s
  const [copiado, setCopiado] = useState(null)

  useEffect(() => {
    listarCampanhasDoOrganizador().then((dados) => {
      setCampanhas(dados)
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

  function abrirAdmin(campanha) {
    // Usa window.location.href para preservar o fragmento #auth=token
    // React Router navigate() descartaria o hash
    window.location.href = `/admin/${campanha.slug}#auth=${campanha.manager_token}`
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

      {carregando && <p className="dashboard-carregando">Carregando...</p>}

      {!carregando && campanhas.length === 0 && (
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

              {campanha.delivery_at && (
                <p className="dashboard-card-entrega">
                  📅 Entrega:{' '}
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
                  {copiado === campanha.slug ? '✅ Copiado!' : 'Copiar link'}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </main>
  )
}
