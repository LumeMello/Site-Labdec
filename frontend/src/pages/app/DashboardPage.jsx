import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useAsync } from '../../hooks/useAsync';
import { equipamentosService, movimentacoesService } from '../../services/equipamentosService';
import Card, { StatCard } from '../../components/ui/Card';
import Badge, { corStatus } from '../../components/ui/Badge';
import PageHeader from '../../components/ui/PageHeader';
import Spinner from '../../components/feedback/Spinner';
import { STATUS_MOV, TIPOS_MOV, formatarData, formatarDataHora } from '../../utils/formatters';

function ListaMov({ itens, vazio }) {
  if (!itens.length) return <p className="py-6 text-center text-sm text-slate-500">{vazio}</p>;
  return (
    <ul className="divide-y divide-slate-100">
      {itens.map((m) => (
        <li key={m.id} className="flex items-center justify-between gap-3 py-2.5">
          <div className="min-w-0">
            <Link to={`/equipamentos/${m.equipamento_id}`} className="block truncate text-sm font-medium text-slate-800 hover:text-brand-700">
              {m.equipamento_nome}
            </Link>
            <p className="truncate text-xs text-slate-500">
              {m.tipo === 'RESERVA_FIXA'
                ? `${formatarDataHora(m.data_inicio)} → ${formatarDataHora(m.data_fim)}`
                : `${m.quantidade} un. · desde ${formatarData(m.data_inicio)}`} · {m.projeto_nome}
            </p>
          </div>
          <Badge cor={corStatus[m.status]}>{STATUS_MOV[m.status]}</Badge>
        </li>
      ))}
    </ul>
  );
}

export default function DashboardPage() {
  const { usuario, pode } = useAuth();
  const { dados, carregando } = useAsync(async () => {
    const [minhas, reposicao] = await Promise.all([
      movimentacoesService.minhas(),
      pode('gerarRelatorios') ? equipamentosService.listar({ reposicao: 1 }) : Promise.resolve([]),
    ]);
    return { minhas, reposicao };
  }, []);

  if (carregando || !dados) return <Spinner />;
  const ativas = dados.minhas.filter((m) => m.status === 'ATIVO');
  const reservas = ativas.filter((m) => m.tipo === 'RESERVA_FIXA');
  const patriacoes = ativas.filter((m) => m.tipo !== 'RESERVA_FIXA');
  const vetadas = dados.minhas.filter((m) => m.status === 'VETADO').slice(0, 5);
  const projetosAtivos = usuario.projetos.filter((p) => p.ativo);

  return (
    <>
      <PageHeader titulo={`Olá, ${usuario.nome.split(' ')[0]}!`} descricao="Resumo das suas patriações, reservas e avisos do laboratório." />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard rotulo="Patriações ativas" valor={patriacoes.length} destaque="brand" />
        <StatCard rotulo="Reservas agendadas" valor={reservas.length} destaque="brand" />
        <StatCard rotulo="Projetos ativos" valor={projetosAtivos.length} />
        {pode('gerarRelatorios')
          ? <StatCard rotulo="Alertas de reposição" valor={dados.reposicao.length} destaque={dados.reposicao.length ? 'amber' : 'slate'} />
          : <StatCard rotulo="Vetos recebidos" valor={vetadas.length} destaque={vetadas.length ? 'red' : 'slate'} />}
      </div>

      {vetadas.length > 0 && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="mb-2 text-sm font-semibold text-red-800">Avisos: solicitações vetadas pelo Responsável</p>
          <ul className="space-y-1 text-sm text-red-700">
            {vetadas.map((m) => (
              <li key={m.id}>• <strong>{m.equipamento_nome}</strong> ({TIPOS_MOV[m.tipo]}) — {m.motivo_veto}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card titulo="Minhas Patriações" acoes={<Link to="/minhas-solicitacoes" className="text-sm text-brand-700 hover:underline">Gerenciar</Link>}>
          <ListaMov itens={patriacoes} vazio="Nenhuma patriação em aberto." />
        </Card>
        <Card titulo="Minhas Reservas" acoes={<Link to="/equipamentos?categoria=MAQUINA_FIXA" className="text-sm text-brand-700 hover:underline">Nova reserva</Link>}>
          <ListaMov itens={reservas} vazio="Nenhuma reserva agendada." />
        </Card>

        {pode('gerarRelatorios') && (
          <Card titulo="Itens com necessidade de reposição" acoes={<Link to="/admin/relatorios" className="text-sm text-brand-700 hover:underline">Relatórios</Link>}>
            {dados.reposicao.length ? (
              <ul className="divide-y divide-slate-100">
                {dados.reposicao.map((e) => (
                  <li key={e.id} className="flex justify-between py-2 text-sm">
                    <Link to={`/equipamentos/${e.id}`} className="hover:text-brand-700">{e.nome}</Link>
                    <span className="text-slate-500">{e.quantidade_disponivel}/{e.quantidade_total} disp.</span>
                  </li>
                ))}
              </ul>
            ) : <p className="py-6 text-center text-sm text-slate-500">Nenhum alerta de reposição.</p>}
          </Card>
        )}

        <Card titulo="Meus Projetos" acoes={<Link to="/projetos" className="text-sm text-brand-700 hover:underline">Ver todos</Link>}>
          {usuario.projetos.length ? (
            <ul className="divide-y divide-slate-100">
              {usuario.projetos.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <span className="truncate">{p.nome}</span>
                  <Badge cor={p.ativo ? 'verde' : 'cinza'}>{p.ativo ? `até ${formatarData(p.fim_efetivo)}` : 'Encerrado'}</Badge>
                </li>
              ))}
            </ul>
          ) : <p className="py-6 text-center text-sm text-slate-500">Você não está vinculado a projetos.</p>}
        </Card>
      </div>
    </>
  );
}
