import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Home from '../pages/Home.jsx'
import OrderPage from '../pages/OrderPage.jsx'
import AdminPage from '../pages/AdminPage.jsx'

const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '/c/:slug',
    element: <OrderPage />,
  },
  {
    path: '/admin/:slug',
    element: <AdminPage />,
  },
])

export const AppRouter = () => <RouterProvider router={router} />
export default router
