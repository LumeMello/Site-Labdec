import { useId } from 'react';

const base = `block w-full rounded-lg border-0 bg-white px-3 py-2 text-sm text-slate-900 ring-1 ring-inset ring-slate-300
  placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-brand-600 disabled:bg-slate-100 disabled:text-slate-500`;

function Campo({ label, ajuda, erro, children, className = '' }) {
  return (
    <div className={className}>
      {label && <label htmlFor={children.props.id} className="mb-1 block text-sm font-medium text-slate-700">{label}</label>}
      {children}
      {erro ? <p className="mt-1 text-xs text-red-600">{erro}</p> : ajuda && <p className="mt-1 text-xs text-slate-500">{ajuda}</p>}
    </div>
  );
}

export function Input({ label, ajuda, erro, className, ...props }) {
  const id = useId();
  return (
    <Campo label={label} ajuda={ajuda} erro={erro} className={className}>
      <input id={id} className={base} {...props} />
    </Campo>
  );
}

export function Textarea({ label, ajuda, erro, className, ...props }) {
  const id = useId();
  return (
    <Campo label={label} ajuda={ajuda} erro={erro} className={className}>
      <textarea id={id} rows={3} className={base} {...props} />
    </Campo>
  );
}

/** opcoes: objeto { valor: rótulo } ou array [{ valor, rotulo }] */
export function Select({ label, ajuda, erro, opcoes, vazio, className, ...props }) {
  const id = useId();
  const lista = Array.isArray(opcoes) ? opcoes : Object.entries(opcoes).map(([valor, rotulo]) => ({ valor, rotulo }));
  return (
    <Campo label={label} ajuda={ajuda} erro={erro} className={className}>
      <select id={id} className={base} {...props}>
        {vazio !== undefined && <option value="">{vazio}</option>}
        {lista.map((o) => <option key={o.valor} value={o.valor}>{o.rotulo}</option>)}
      </select>
    </Campo>
  );
}

export function Checkbox({ label, className = '', ...props }) {
  return (
    <label className={`flex cursor-pointer items-center gap-2 text-sm text-slate-700 ${className}`}>
      <input type="checkbox" className="h-4 w-4 rounded border-slate-300 accent-brand-700" {...props} />
      {label}
    </label>
  );
}
