import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Spinner from '../components/feedback/Spinner';

/** Middleware de rota: exige login e, opcionalmente, um dos perfis informados (RBAC). */
export default function ProtectedRoute({ roles }) {
  const { usuario, carregando } = useAuth();
  const location = useLocation();
  if (carregando) return <Spinner telaCheia />;
  if (!usuario) return <Navigate to="/login" replace state={{ from: location }} />;
  if (roles && !roles.includes(usuario.role)) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
