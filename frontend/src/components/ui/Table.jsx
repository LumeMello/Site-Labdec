/** Tabela simples e responsiva. colunas: [{ titulo, render(linha), className }] */
export default function Table({ colunas, linhas, chave = 'id', vazio = 'Nenhum registro encontrado.' }) {
  if (!linhas.length) return <p className="px-5 py-10 text-center text-sm text-slate-500">{vazio}</p>;
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            {colunas.map((c) => (
              <th key={c.titulo} className={`px-4 py-2.5 text-left text-xs font-semibold tracking-wide whitespace-nowrap text-slate-500 uppercase ${c.className || ''}`}>
                {c.titulo}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {linhas.map((l) => (
            <tr key={l[chave]} className="hover:bg-slate-50/60">
              {colunas.map((c) => (
                <td key={c.titulo} className={`px-4 py-2.5 align-middle text-slate-700 ${c.className || ''}`}>{c.render(l)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
