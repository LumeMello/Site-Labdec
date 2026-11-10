const CORES = {
  verde: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  amarelo: 'bg-amber-50 text-amber-800 ring-amber-600/20',
  vermelho: 'bg-red-50 text-red-700 ring-red-600/20',
  azul: 'bg-sky-50 text-sky-700 ring-sky-600/20',
  roxo: 'bg-violet-50 text-violet-700 ring-violet-600/20',
  cinza: 'bg-slate-100 text-slate-600 ring-slate-500/20',
  brand: 'bg-brand-50 text-brand-800 ring-brand-600/20',
};

export default function Badge({ cor = 'cinza', children, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset ${CORES[cor]} ${className}`}>
      {children}
    </span>
  );
}

export const corStatus = { ATIVO: 'verde', CONCLUIDO: 'cinza', USO_TOTAL_SINALIZADO: 'amarelo', VETADO: 'vermelho' };
export const corEstado = { FUNCIONAL: 'verde', MANUTENCAO: 'amarelo' };
export const corRole = { RESPONSAVEL: 'roxo', ADMIN: 'azul', PADRAO: 'cinza' };
