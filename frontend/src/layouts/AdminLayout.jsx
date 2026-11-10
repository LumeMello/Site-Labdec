import { Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ROLES } from '../utils/formatters';

/** Envolve as páginas de gestão com uma faixa indicando a área administrativa. */
export default function AdminLayout() {
  const { usuario } = useAuth();
  return (
    <>
      <div className="no-print mb-5 flex items-center gap-2 rounded-lg bg-brand-50 px-4 py-2 text-xs text-brand-800 ring-1 ring-brand-100">
        <span aria-hidden>⚙</span>
        Área administrativa · acesso como <strong>{ROLES[usuario.role]}</strong>
      </div>
      <Outlet />
    </>
  );
}
