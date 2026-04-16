import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <nav className="footer-links">
          <Link to="/legal/terms">Termos de Uso</Link>
          <Link to="/legal/privacy">Privacidade</Link>
        </nav>
        <p className="footer-copy">Multiplica — Juntos fazemos mais.</p>
      </div>
    </footer>
  )
}
