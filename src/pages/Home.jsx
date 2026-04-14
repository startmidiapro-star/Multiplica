import { useNavigate } from 'react-router-dom'
import { Link2, TrendingUp, LayoutGrid } from 'lucide-react'

// Benefícios exibidos como cards de 3 colunas
const beneficios = [
  { Icone: Link2,      titulo: 'Pedidos',      descricao: 'Via link' },
  { Icone: TrendingUp, titulo: 'Pagamentos',   descricao: 'Sem planilhas' },
  { Icone: LayoutGrid, titulo: 'Organização',  descricao: 'Em tempo real' },
]

const Home = () => {
  const navigate = useNavigate()

  return (
    <main className="page-home">
      {/* Símbolo: três anéis concêntricos com pulso suave */}
      <div className="home-simbolo" aria-hidden="true" />

      {/* Título: "multi" escuro + "plica" azul itálico
          O "i" usa o caractere sem ponto (ı) — ponto azul adicionado via ::after */}
      <h1 className="home-titulo" aria-label="Multiplica">
        <span className="home-titulo-escuro">
          mult<span className="home-titulo-ponto-i">ı</span>
        </span>
        <span className="home-titulo-azul">plica</span>
      </h1>

      {/* Área de conteúdo — largura compartilhada entre headline, botões e cards */}
      <div className="home-conteudo">
        <p className="home-headline">
          Gerencie vendas e arrecadações da sua comunidade com simplicidade.
        </p>
        <p className="home-subheadline">
          Pedidos, comprovantes e confirmações em um só lugar.
        </p>

        {/* Botões de ação */}
        <div className="home-acoes">
          <button
            className="btn-home btn-home--primario"
            onClick={() => navigate('/nova-campanha')}
          >
            Começar Minha Campanha Grátis
          </button>

          <button
            className="btn-home btn-home--secundario"
            onClick={() => navigate('/login')}
          >
            Acessar Minha Campanha
          </button>
        </div>

        {/* Cards de benefícios — 3 colunas em desktop, 1 coluna em mobile */}
        <div className="home-cards">
          {beneficios.map(({ Icone, titulo, descricao }) => (
            <div key={titulo} className="home-card">
              <Icone size={22} className="home-card-icone" aria-hidden="true" />
              <p className="home-card-titulo">{titulo}</p>
              <p className="home-card-descricao">{descricao}</p>
            </div>
          ))}
        </div>

        <p className="home-assinatura">Juntos fazemos mais.</p>
      </div>
    </main>
  )
}

export default Home
