import { createBrowserRouter, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import AuthLayout from '../layouts/AuthLayout';
import AppLayout from '../layouts/AppLayout';
import AdminLayout from '../layouts/AdminLayout';
import LoginPage from '../pages/auth/LoginPage';
import DashboardPage from '../pages/app/DashboardPage';
import EquipamentosPage from '../pages/app/EquipamentosPage';
import DetalheEquipamentoPage from '../pages/app/DetalheEquipamentoPage';
import MinhasSolicitacoesPage from '../pages/app/MinhasSolicitacoesPage';
import ProjetosPage from '../pages/app/ProjetosPage';
import AdminEquipamentosPage from '../pages/admin/AdminEquipamentosPage';
import AdminRelatoriosPage from '../pages/admin/AdminRelatoriosPage';
import AdminUsuariosPage from '../pages/admin/AdminUsuariosPage';
import AdminProjetosPage from '../pages/admin/AdminProjetosPage';
import AdminVetosPage from '../pages/admin/AdminVetosPage';

const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/dashboard" replace /> },
  {
    element: <AuthLayout />,
    children: [{ path: '/login', element: <LoginPage /> }],
  },
  {
    // Área autenticada - todos os perfis
    element: <ProtectedRoute />,
    children: [{
      element: <AppLayout />,
      children: [
        { path: '/dashboard', element: <DashboardPage /> },
        { path: '/equipamentos', element: <EquipamentosPage /> },
        { path: '/equipamentos/:id', element: <DetalheEquipamentoPage /> },
        { path: '/minhas-solicitacoes', element: <MinhasSolicitacoesPage /> },
        { path: '/projetos', element: <ProjetosPage /> },
        {
          // Área administrativa - Admins + Responsável
          element: <ProtectedRoute roles={['RESPONSAVEL', 'ADMIN']} />,
          children: [{
            element: <AdminLayout />,
            children: [
              { path: '/admin/equipamentos', element: <AdminEquipamentosPage /> },
              { path: '/admin/relatorios', element: <AdminRelatoriosPage /> },
              {
                // Área exclusiva - apenas Responsável
                element: <ProtectedRoute roles={['RESPONSAVEL']} />,
                children: [
                  { path: '/admin/usuarios', element: <AdminUsuariosPage /> },
                  { path: '/admin/projetos', element: <AdminProjetosPage /> },
                  { path: '/admin/vetos', element: <AdminVetosPage /> },
                ],
              },
            ],
          }],
        },
      ],
    }],
  },
  { path: '*', element: <Navigate to="/dashboard" replace /> },
]);

export default router;
