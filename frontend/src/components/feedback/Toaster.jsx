import { useLab } from '../../hooks/useLab';

const ESTILOS = {
  sucesso: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  erro: 'border-red-200 bg-red-50 text-red-800',
  info: 'border-sky-200 bg-sky-50 text-sky-800',
};

export default function Toaster() {
  const { toasts, removerToast } = useLab();
  return (
    <div className="no-print pointer-events-none fixed inset-x-4 bottom-4 z-[60] flex flex-col items-end gap-2 sm:left-auto sm:w-96">
      {toasts.map((t) => (
        <div key={t.id} role="status" className={`pointer-events-auto flex w-full items-start gap-3 rounded-lg border px-4 py-3 text-sm shadow-lg ${ESTILOS[t.tipo]}`}>
          <span className="flex-1">{t.mensagem}</span>
          <button type="button" onClick={() => removerToast(t.id)} className="opacity-60 hover:opacity-100" aria-label="Fechar">✕</button>
        </div>
      ))}
    </div>
  );
}
