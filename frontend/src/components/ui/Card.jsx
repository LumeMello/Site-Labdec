export default function Card({ titulo, acoes, children, className = '', semPadding }) {
  return (
    <section className={`rounded-xl bg-white shadow-sm ring-1 ring-slate-200 ${className}`}>
      {(titulo || acoes) && (
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-3">
          {titulo && <h2 className="font-semibold text-slate-800">{titulo}</h2>}
          {acoes && <div className="flex flex-wrap gap-2">{acoes}</div>}
        </header>
      )}
      <div className={semPadding ? '' : 'p-5'}>{children}</div>
    </section>
  );
}

export function StatCard({ rotulo, valor, destaque = 'slate', detalhe }) {
  const cores = {
    slate: 'text-slate-900', brand: 'text-brand-700', amber: 'text-amber-600', red: 'text-red-600',
  };
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">{rotulo}</p>
      <p className={`mt-1 text-2xl font-bold ${cores[destaque]}`}>{valor}</p>
      {detalhe && <p className="mt-0.5 text-xs text-slate-500">{detalhe}</p>}
    </div>
  );
}
