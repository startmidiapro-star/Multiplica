/**
 * MULTIPLICA — LoadingScreen
 * Responsabilidade: Tela de carregamento padrão — usada em RotaProtegida e páginas
 */
export default function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="loading-spinner" aria-hidden="true" />
      <p className="loading-screen-texto">Carregando...</p>
      <p className="loading-screen-assinatura">Multiplica — Juntos fazemos mais.</p>
    </div>
  )
}
