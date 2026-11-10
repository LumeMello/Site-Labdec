const VARIANTES = {
  primario: 'bg-brand-700 text-white hover:bg-brand-800 focus-visible:outline-brand-700',
  secundario: 'bg-white text-slate-700 ring-1 ring-inset ring-slate-300 hover:bg-slate-50',
  perigo: 'bg-red-600 text-white hover:bg-red-700 focus-visible:outline-red-600',
  aviso: 'bg-amber-500 text-white hover:bg-amber-600 focus-visible:outline-amber-500',
  fantasma: 'text-slate-600 hover:bg-slate-100',
};
const TAMANHOS = { sm: 'px-2.5 py-1.5 text-xs', md: 'px-3.5 py-2 text-sm', lg: 'px-5 py-2.5 text-base' };

export default function Button({ variante = 'primario', tamanho = 'md', carregando, className = '', children, disabled, ...props }) {
  return (
    <button
      type="button"
      disabled={disabled || carregando}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors
        focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50
        ${VARIANTES[variante]} ${TAMANHOS[tamanho]} ${className}`}
      {...props}
    >
      {carregando && <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />}
      {children}
    </button>
  );
}
