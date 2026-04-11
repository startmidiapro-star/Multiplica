import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Home from '../pages/Home.jsx'
import OrderPage from '../pages/OrderPage.jsx'
import AdminPage from '../pages/AdminPage.jsx'
import CreateCampaign from '../pages/CreateCampaign.jsx'
import Cadastro from '../pages/Cadastro.jsx'
import Login from '../pages/Login.jsx'
import Dashboard from '../pages/Dashboard.jsx'
import RotaProtegida from '../components/RotaProtegida.jsx'

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
])

export const AppRouter = () => <RouterProvider router={router} />
export default router
