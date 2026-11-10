export default function EmptyState({ titulo, descricao, acao }) {
  return (
    <div className="rounded-xl border-2 border-dashed border-slate-200 px-6 py-10 text-center">
      <p className="font-medium text-slate-700">{titulo}</p>
      {descricao && <p className="mt-1 text-sm text-slate-500">{descricao}</p>}
      {acao && <div className="mt-4">{acao}</div>}
    </div>
  );
}
