import { useState } from 'react';
import { useAsync } from '../../hooks/useAsync';
import { projetosService } from '../../services/projetosService';
import PageHeader from '../../components/ui/PageHeader';
import Badge from '../../components/ui/Badge';
import { Checkbox, Select } from '../../components/ui/Field';
import Spinner from '../../components/feedback/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import { AREAS, CATEGORIAS_PROJETO, formatarData } from '../../utils/formatters';

export default function ProjetosPage() {
  const [area, setArea] = useState('');
  const [apenasAtivos, setApenasAtivos] = useState(true);
  const { dados, carregando } = useAsync(() => projetosService.listar(apenasAtivos), [apenasAtivos]);
  const projetos = (dados || []).filter((p) => !area || p.area_atuacao === area);

  return (
    <>
      <PageHeader
        titulo="Projetos"
        descricao="Projetos do laboratório e seus integrantes."
        acoes={(
          <div className="flex items-center gap-4">
            <Checkbox label="Somente ativos" checked={apenasAtivos} onChange={(e) => setApenasAtivos(e.target.checked)} />
            <Select value={area} onChange={(e) => setArea(e.target.value)} opcoes={AREAS} vazio="Todas as áreas" />
          </div>
        )}
      />
      {carregando ? <Spinner /> : projetos.length === 0 ? <EmptyState titulo="Nenhum projeto encontrado" /> : (
        <div className="grid gap-4 md:grid-cols-2">
          {projetos.map((p) => (
            <article key={p.id} className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <div className="mb-2 flex flex-wrap gap-1.5">
                <Badge cor="brand">{CATEGORIAS_PROJETO[p.categoria]}</Badge>
                <Badge cor="azul">{AREAS[p.area_atuacao]}</Badge>
                {!!p.extendido_um_ano && <Badge cor="roxo">Estendido +1 ano</Badge>}
                {!p.ativo && <Badge>Encerrado</Badge>}
              </div>
              <h3 className="font-semibold text-slate-900">{p.nome}</h3>
              {p.projeto_pai_nome && <p className="text-xs text-slate-500">Subprojeto de: {p.projeto_pai_nome}</p>}
              {p.descricao && <p className="mt-2 text-sm text-slate-600">{p.descricao}</p>}
              <p className="mt-3 text-xs text-slate-500">
                {formatarData(p.data_inicio)} → {formatarData(p.fim_efetivo)}
                {!!p.extendido_um_ano && ` (original: ${formatarData(p.fim_previsto)})`}
              </p>
              <div className="mt-4 border-t border-slate-100 pt-3">
                <p className="mb-2 text-xs font-semibold text-slate-500 uppercase">Integrantes ({p.membros.length})</p>
                <div className="flex flex-wrap gap-1.5">
                  {p.membros.length ? p.membros.map((m) => (
                    <span key={m.id} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700" title={m.cargo}>{m.nome}</span>
                  )) : <span className="text-xs text-slate-400">Sem integrantes</span>}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
