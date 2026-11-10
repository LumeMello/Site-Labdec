import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Spinner from '../components/feedback/Spinner';
import Toaster from '../components/feedback/Toaster';

const BOLHAS = [
  'left-[-6rem] top-[-6rem] bg-petala-amarelo',
  'right-[-5rem] top-[10%] bg-petala-rosa',
  'left-[8%] bottom-[-7rem] bg-petala-ciano',
  'right-[12%] bottom-[-6rem] bg-petala-verde',
];

export default function AuthLayout() {
  const { usuario, carregando } = useAuth();
  if (carregando) return <Spinner telaCheia />;
  if (usuario) return <Navigate to="/dashboard" replace />;
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-4 py-10">
      <div className="faixa-labdec absolute inset-x-0 top-0 h-1.5" />
      {BOLHAS.map((b) => <div key={b} className={`pointer-events-none absolute h-72 w-72 rounded-full opacity-15 blur-3xl ${b}`} />)}
      <div className="relative w-full max-w-sm"><Outlet /></div>
      <Toaster />
    </div>
  );
}
