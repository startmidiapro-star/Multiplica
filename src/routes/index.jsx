import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Home from '../pages/Home.jsx'
import OrderPage from '../pages/OrderPage.jsx'
import AdminPage from '../pages/AdminPage.jsx'
import CreateCampaign from '../pages/CreateCampaign.jsx'
import RotaProtegida from '../components/RotaProtegida.jsx'
// Sessão B — importar quando os arquivos existirem:
// import Cadastro from '../pages/Cadastro.jsx'
// import Login from '../pages/Login.jsx'
// import Dashboard from '../pages/Dashboard.jsx'

const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />,
  },
  {
    // Rota protegida — exige sessão ativa do organizador
    path: '/nova-campanha',
    element: <RotaProtegida><CreateCampaign /></RotaProtegida>,
  },
  {
    path: '/c/:slug',
    element: <OrderPage />,
  },
  {
    path: '/admin/:slug',
    element: <AdminPage />,
  },
  // Sessão B — adicionar quando os arquivos existirem:
  // { path: '/cadastro', element: <Cadastro /> },
  // { path: '/login',    element: <Login /> },
  // { path: '/dashboard', element: <RotaProtegida><Dashboard /></RotaProtegida> },
])

export const AppRouter = () => <RouterProvider router={router} />
export default router
