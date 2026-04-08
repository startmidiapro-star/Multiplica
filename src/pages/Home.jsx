import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const Home = () => {
  const navigate = useNavigate()
  const [mostrarInstrucao, setMostrarInstrucao] = useState(false)

  return (
    <main className="page-home">
      <h1>Multiplica</h1>
      <p className="subtitle">Gestão de pedidos comunitários</p>

      <div className="home-acoes">
        <button
          className="btn-home btn-home--primario"
          onClick={() => navigate('/nova-campanha')}
        >
          Criar nova campanha
        </button>

        <button
          className="btn-home btn-home--secundario"
          onClick={() => setMostrarInstrucao((v) => !v)}
        >
          Já tenho uma campanha
        </button>

        {mostrarInstrucao && (
          <p className="home-instrucao">
            Use o <strong>Link Mágico</strong> que você recebeu ao criar sua campanha.
            Ele tem o formato <code>/admin/sua-campanha#auth=...</code> e dá acesso direto ao painel.
          </p>
        )}
      </div>
    </main>
  )
}

export default Home
