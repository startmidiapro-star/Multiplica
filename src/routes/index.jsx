import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Home from '../pages/Home.jsx'
import OrderPage from '../pages/OrderPage.jsx'
import AdminPage from '../pages/AdminPage.jsx'
import CreateCampaign from '../pages/CreateCampaign.jsx'
import Cadastro from '../pages/Cadastro.jsx'
import Login from '../pages/Login.jsx'
import Dashboard from '../pages/Dashboard.jsx'
import RotaProtegida from '../components/RotaProtegida.jsx'
import TermsPage from '../pages/legal/TermsPage.jsx'
import PrivacyPage from '../pages/legal/PrivacyPage.jsx'

const router = createBrowserRouter([
  { path: '/',             element: <Home /> },
  { path: '/cadastro',     element: <Cadastro /> },
  { path: '/login',        element: <Login /> },
  {
    // Rota protegida — exige sessão ativa do organizador
    path: '/dashboard',
    element: <RotaProtegida><Dashboard /></RotaProtegida>,
  },
  {
    // Rota protegida — exige sessão ativa do organizador
    path: '/nova-campanha',
    element: <RotaProtegida><CreateCampaign /></RotaProtegida>,
  },
  { path: '/c/:slug',      element: <OrderPage /> },
  { path: '/admin/:slug',  element: <AdminPage /> },
  { path: '/legal/terms',  element: <TermsPage /> },
  { path: '/legal/privacy',element: <PrivacyPage /> },
])

export default function AppRouter() {
  return <RouterProvider router={router} />
}
