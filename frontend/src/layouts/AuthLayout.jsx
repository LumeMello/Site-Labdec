import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Spinner from '../components/feedback/Spinner';
import Toaster from '../components/feedback/Toaster';

export default function AuthLayout() {
  const { usuario, carregando } = useAuth();
  if (carregando) return <Spinner telaCheia />;
  if (usuario) return <Navigate to="/dashboard" replace />;
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-900 via-brand-800 to-slate-900 px-4 py-10">
      <Outlet />
      <Toaster />
    </div>
  );
}
