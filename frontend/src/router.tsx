
import { createBrowserRouter } from 'react-router-dom'
import MainLayout from './components/layout/MainLayout'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import AllowancePage from './pages/AllowancePage'
import TransactionsPage from './pages/TransactionsPage'

export const router = createBrowserRouter([
    {
        path: '/',
        element: <MainLayout />,
        children: [
            {
                path: '/',
                element: <Home />,
            },
            {
                path: '/dashboard',
                element: <Dashboard />,
            },
            {
                path: '/allowances',
                element: <AllowancePage />,
            },
            {
                path: '/transactions',
                element: <TransactionsPage />,
            },
        ],
    },
])
