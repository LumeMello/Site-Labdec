import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useEquipamentos } from '../../hooks/useEquipamentos';
import { useLab } from '../../hooks/useLab';
import PageHeader from '../../components/ui/PageHeader';
import { Input, Select } from '../../components/ui/Field';
import Badge, { corEstado } from '../../components/ui/Badge';
import Spinner from '../../components/feedback/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import { CATEGORIAS, ESTADOS, SUBCATEGORIAS } from '../../utils/formatters';

export default function EquipamentosPage() {
  const { filtrosCatalogo, setFiltrosCatalogo } = useLab();
  const [params] = useSearchParams();
  const [busca, setBusca] = useState(filtrosCatalogo.busca);

  // Permite links como /equipamentos?categoria=MAQUINA_FIXA
  useEffect(() => {
    const cat = params.get('categoria');
    if (cat) setFiltrosCatalogo((f) => ({ ...f, categoria: cat }));
  }, [params, setFiltrosCatalogo]);

  // Debounce da busca textual
  useEffect(() => {
    const t = setTimeout(() => setFiltrosCatalogo((f) => ({ ...f, busca })), 300);
    return () => clearTimeout(t);
  }, [busca, setFiltrosCatalogo]);

  const { equipamentos, carregando } = useEquipamentos(filtrosCatalogo);
  const set = (k) => (e) => setFiltrosCatalogo((f) => ({ ...f, [k]: e.target.value }));

  return (
    <>
      <PageHeader titulo="Catálogo de Equipamentos e Materiais" descricao="Consulte o acervo, reserve máquinas fixas e solicite patriação de itens móveis." />

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Input placeholder="Buscar por nome ou descrição..." value={busca} onChange={(e) => setBusca(e.target.value)} />
        <Select value={filtrosCatalogo.categoria} onChange={set('categoria')} opcoes={CATEGORIAS} vazio="Todas as categorias" />
        <Select value={filtrosCatalogo.estado} onChange={set('estado')} opcoes={ESTADOS} vazio="Todos os estados" />
      </div>

      {carregando ? <Spinner /> : equipamentos.length === 0 ? (
        <EmptyState titulo="Nenhum item encontrado" descricao="Ajuste os filtros de busca." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {equipamentos.map((e) => {
            const indisponivel = e.categoria_principal !== 'MAQUINA_FIXA' && e.quantidade_disponivel === 0;
            return (
              <Link
                key={e.id}
                to={`/equipamentos/${e.id}`}
                className="group flex flex-col rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 transition hover:shadow-md hover:ring-brand-500"
              >
                <div className="mb-2 flex flex-wrap gap-1.5">
                  <Badge cor="brand">{CATEGORIAS[e.categoria_principal]}</Badge>
                  {e.subcategoria_reagente && <Badge>{SUBCATEGORIAS[e.subcategoria_reagente]}</Badge>}
                  <Badge cor={corEstado[e.estado]}>{ESTADOS[e.estado]}</Badge>
                  {!!e.necessita_reposicao && <Badge cor="vermelho">Reposição</Badge>}
                </div>
                <h3 className="font-semibold text-slate-900 group-hover:text-brand-700">{e.nome}</h3>
                {e.localizacao && <p className="text-xs text-slate-500">{e.localizacao}</p>}
                <div className="mt-auto flex items-end justify-between pt-4 text-sm">
                  {e.categoria_principal === 'MAQUINA_FIXA'
                    ? <span className="text-slate-500">Reserva por agenda</span>
                    : (
                      <span className={indisponivel ? 'text-red-600' : 'text-slate-600'}>
                        <strong>{e.quantidade_disponivel}</strong> de {e.quantidade_total} disponíveis
                      </span>
                    )}
                  <span className="text-brand-700">Detalhes →</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
