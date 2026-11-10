import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import logo from '../../assets/logo.svg';

const SECOES = [
  {
    titulo: 'Laboratório',
    itens: [
      { to: '/dashboard', rotulo: 'Visão Geral', icone: '◧' },
      { to: '/equipamentos', rotulo: 'Equipamentos', icone: '⚗' },
      { to: '/minhas-solicitacoes', rotulo: 'Minhas Solicitações', icone: '☰' },
      { to: '/projetos', rotulo: 'Projetos', icone: '◎' },
    ],
  },
  {
    titulo: 'Gestão',
    roles: ['RESPONSAVEL', 'ADMIN'],
    itens: [
      { to: '/admin/equipamentos', rotulo: 'Acervo', icone: '▤' },
      { to: '/admin/relatorios', rotulo: 'Relatórios', icone: '▥' },
      { to: '/admin/usuarios', rotulo: 'Usuários', icone: '◉', roles: ['RESPONSAVEL'] },
      { to: '/admin/projetos', rotulo: 'Projetos', icone: '◈', roles: ['RESPONSAVEL'] },
      { to: '/admin/vetos', rotulo: 'Auditoria e Vetos', icone: '⊘', roles: ['RESPONSAVEL'] },
    ],
  },
];

export default function Sidebar({ aberta, aoFechar }) {
  const { temPerfil } = useAuth();
  return (
    <>
      {aberta && <div className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden" onClick={aoFechar} />}
      <aside
        className={`no-print fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-brand-900 text-brand-50 transition-transform lg:translate-x-0
          ${aberta ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex items-center gap-3 px-5 py-5">
          <img src={logo} alt="" className="h-9 w-9" />
          <div>
            <p className="text-lg leading-tight font-bold">LABDEC</p>
            <p className="text-xs text-brand-100/70">UFCI-RJ</p>
          </div>
        </div>
        <nav className="flex-1 space-y-6 overflow-y-auto px-3 pb-6">
          {SECOES.filter((s) => !s.roles || temPerfil(...s.roles)).map((s) => (
            <div key={s.titulo}>
              <p className="mb-1 px-3 text-xs font-semibold tracking-wider text-brand-100/50 uppercase">{s.titulo}</p>
              <ul className="space-y-0.5">
                {s.itens.filter((i) => !i.roles || temPerfil(...i.roles)).map((i) => (
                  <li key={i.to}>
                    <NavLink
                      to={i.to}
                      end={i.to === '/equipamentos'}
                      onClick={aoFechar}
                      className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors
                        ${isActive ? 'bg-white/15 font-medium text-white' : 'text-brand-100/80 hover:bg-white/10 hover:text-white'}`}
                    >
                      <span className="w-4 text-center" aria-hidden>{i.icone}</span>
                      {i.rotulo}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
