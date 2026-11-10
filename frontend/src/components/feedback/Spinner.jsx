export default function Spinner({ texto = 'Carregando...', telaCheia }) {
  return (
    <div className={`flex items-center justify-center gap-3 text-sm text-slate-500 ${telaCheia ? 'min-h-screen' : 'py-12'}`}>
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand-600 border-r-transparent" />
      {texto}
    </div>
  );
}
