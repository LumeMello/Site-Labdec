import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Badge, { corRole } from '../ui/Badge';
import { ROLES } from '../../utils/formatters';

export default function Header({ aoAbrirMenu }) {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const sair = () => {
    logout();
    navigate('/login', { replace: true });
  };
  return (
    <header className="no-print sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6">
      <button type="button" onClick={aoAbrirMenu} className="rounded-md p-2 text-slate-600 hover:bg-slate-100 lg:hidden" aria-label="Abrir menu">☰</button>
      <div className="flex-1" />
      <div className="text-right">
        <p className="text-sm leading-tight font-medium text-slate-800">{usuario.nome}</p>
        <p className="text-xs text-slate-500">{usuario.username}</p>
      </div>
      <Badge cor={corRole[usuario.role]} className="hidden sm:inline-flex">{ROLES[usuario.role]}</Badge>
      <button type="button" onClick={sair} className="rounded-lg px-3 py-1.5 text-sm text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50">Sair</button>
    </header>
  );
}
