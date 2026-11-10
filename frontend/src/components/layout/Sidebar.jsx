import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import logo from '../../assets/labdec-logo.jpg';

// Cada item recebe a cor de uma pétala do logo
const SECOES = [
  {
    titulo: 'Laboratório',
    itens: [
      { to: '/dashboard', rotulo: 'Visão Geral', cor: 'bg-petala-amarelo' },
      { to: '/equipamentos', rotulo: 'Equipamentos', cor: 'bg-petala-laranja' },
      { to: '/minhas-solicitacoes', rotulo: 'Minhas Solicitações', cor: 'bg-petala-vermelho' },
      { to: '/projetos', rotulo: 'Projetos', cor: 'bg-petala-rosa' },
    ],
  },
  {
    titulo: 'Gestão',
    roles: ['RESPONSAVEL', 'ADMIN'],
    itens: [
      { to: '/admin/equipamentos', rotulo: 'Acervo', cor: 'bg-petala-roxo' },
      { to: '/admin/relatorios', rotulo: 'Relatórios', cor: 'bg-petala-azul' },
      { to: '/admin/usuarios', rotulo: 'Usuários', cor: 'bg-petala-ciano', roles: ['RESPONSAVEL'] },
      { to: '/admin/projetos', rotulo: 'Projetos', cor: 'bg-petala-verde', roles: ['RESPONSAVEL'] },
      { to: '/admin/vetos', rotulo: 'Auditoria e Vetos', cor: 'bg-petala-vermelho', roles: ['RESPONSAVEL'] },
    ],
  },
];

export default function Sidebar({ aberta, aoFechar }) {
  const { temPerfil } = useAuth();
  return (
    <>
      {aberta && <div className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden" onClick={aoFechar} />}
      <aside
        className={`no-print fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform lg:translate-x-0
          ${aberta ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="faixa-labdec h-1 shrink-0" />
        <div className="flex flex-col items-center border-b border-slate-100 px-5 py-4">
          <img src={logo} alt="LABDEC" className="h-24 w-auto" />
          <p className="mt-1 text-xs font-semibold tracking-wider text-slate-400 uppercase">UFCI-RJ</p>
        </div>
        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
          {SECOES.filter((s) => !s.roles || temPerfil(...s.roles)).map((s) => (
            <div key={s.titulo}>
              <p className="mb-1 px-3 text-xs font-bold tracking-wider text-slate-400 uppercase">{s.titulo}</p>
              <ul className="space-y-0.5">
                {s.itens.filter((i) => !i.roles || temPerfil(...i.roles)).map((i) => (
                  <li key={i.to}>
                    <NavLink
                      to={i.to}
                      end={i.to === '/equipamentos'}
                      onClick={aoFechar}
                      className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors
                        ${isActive ? 'bg-brand-50 font-bold text-brand-800' : 'font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                    >
                      {({ isActive }) => (
                        <>
                          <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${i.cor} ${isActive ? 'ring-4 ring-brand-100' : ''}`} aria-hidden />
                          {i.rotulo}
                        </>
                      )}
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
