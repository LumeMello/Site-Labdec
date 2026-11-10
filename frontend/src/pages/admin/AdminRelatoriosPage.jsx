import { useState } from 'react';
import { useAsync } from '../../hooks/useAsync';
import { relatoriosService } from '../../services/equipamentosService';
import PageHeader from '../../components/ui/PageHeader';
import Card, { StatCard } from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Badge, { corEstado, corRole, corStatus } from '../../components/ui/Badge';
import { Select } from '../../components/ui/Field';
import Spinner from '../../components/feedback/Spinner';
import {
  AREAS, CATEGORIAS, CATEGORIAS_PROJETO, ESTADOS, ROLES, STATUS_MOV, SUBCATEGORIAS, TIPOS_MOV,
  exportarCSV, formatarData, formatarDataHora,
} from '../../utils/formatters';

const COR_AREA = {
  AGUA: 'bg-petala-azul', SOLO: 'bg-petala-laranja', EFLUENTES: 'bg-petala-roxo', ENERGIAS_RENOVAVEIS: 'bg-petala-verde',
};

const ABAS = { acervo: 'Acervo e Equipamentos', projeto: 'Uso por Projeto', usuario: 'Uso por Usuário', area: 'Uso por Área' };

const metricas = [
  { chave: 'solicitacoes', titulo: 'Solicitações' },
  { chave: 'reservas', titulo: 'Reservas' },
  { chave: 'horas_maquina', titulo: 'Horas de máquina' },
  { chave: 'patriacoes', titulo: 'Patriações' },
  { chave: 'reagentes_consumidos', titulo: 'Reagentes (un.)' },
  { chave: 'usos_totais', titulo: 'Usos totais' },
  { chave: 'vetos', titulo: 'Vetos' },
];
const colsMetricas = metricas.map((m) => ({
  titulo: m.titulo,
  className: 'text-right tabular-nums',
  render: (l) => <span className={m.chave === 'vetos' && l.vetos ? 'font-semibold text-red-600' : ''}>{l[m.chave]}</span>,
}));

function Acervo() {
  const { dados, carregando } = useAsync(() => relatoriosService.acervo(), []);
  if (carregando || !dados) return <Spinner />;
  const exportar = () => exportarCSV(`acervo-labdec-${new Date().toISOString().slice(0, 10)}`, dados.itens, [
    { chave: 'nome', titulo: 'Item' },
    { chave: 'categoria_principal', titulo: 'Categoria', formato: (v) => CATEGORIAS[v] },
    { chave: 'subcategoria_reagente', titulo: 'Subcategoria', formato: (v) => SUBCATEGORIAS[v] || '' },
    { chave: 'localizacao', titulo: 'Localização' },
    { chave: 'quantidade_total', titulo: 'Qtd. total' },
    { chave: 'quantidade_disponivel', titulo: 'Qtd. disponível' },
    { chave: 'estado', titulo: 'Estado', formato: (v) => ESTADOS[v] },
    { chave: 'necessita_reposicao', titulo: 'Necessita reposição', formato: (v) => (v ? 'SIM' : 'Não') },
  ]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard acento="bg-petala-azul" rotulo="Itens cadastrados" valor={dados.resumo.itens} />
        <StatCard acento="bg-petala-verde" rotulo="Funcionais" valor={dados.resumo.funcionais} destaque="brand" />
        <StatCard acento="bg-petala-amarelo" rotulo="Em manutenção" valor={dados.resumo.em_manutencao} destaque={dados.resumo.em_manutencao ? 'amber' : 'slate'} />
        <StatCard acento="bg-petala-rosa" rotulo="Alertas de reposição" valor={dados.resumo.alertas_reposicao} destaque={dados.resumo.alertas_reposicao ? 'red' : 'slate'} />
      </div>

      {dados.alertas.length > 0 && (
        <Card titulo="⚠ Indicador de Reposição — Uso Total / Necessidade de Troca" className="ring-red-200">
          <ul className="grid gap-2 sm:grid-cols-2">
            {dados.alertas.map((a) => (
              <li key={a.id} className="flex justify-between rounded-lg bg-red-50 px-3 py-2 text-sm">
                <span className="font-medium text-red-800">{a.nome}</span>
                <span className="text-red-700">{CATEGORIAS[a.categoria_principal]} · {a.quantidade_disponivel}/{a.quantidade_total}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card titulo="Resumo por categoria" semPadding>
        <Table
          chave="categoria"
          linhas={dados.porCategoria}
          colunas={[
            { titulo: 'Categoria', render: (c) => CATEGORIAS[c.categoria] },
            { titulo: 'Itens', className: 'text-right', render: (c) => c.itens },
            { titulo: 'Total', className: 'text-right', render: (c) => c.total },
            { titulo: 'Disponível', className: 'text-right', render: (c) => c.disponivel },
            { titulo: 'Manutenção', className: 'text-right', render: (c) => c.em_manutencao },
            { titulo: 'Reposição', className: 'text-right', render: (c) => c.reposicao },
          ]}
        />
      </Card>

      <Card titulo="Listagem completa" acoes={<Button tamanho="sm" variante="secundario" className="no-print" onClick={exportar}>Exportar CSV</Button>} semPadding>
        <Table
          linhas={dados.itens}
          colunas={[
            { titulo: 'Item', render: (e) => e.nome },
            { titulo: 'Categoria', render: (e) => `${CATEGORIAS[e.categoria_principal]}${e.subcategoria_reagente ? ` · ${SUBCATEGORIAS[e.subcategoria_reagente]}` : ''}` },
            { titulo: 'Total', className: 'text-right', render: (e) => e.quantidade_total },
            { titulo: 'Disponível', className: 'text-right', render: (e) => e.quantidade_disponivel },
            { titulo: 'Estado', render: (e) => <Badge cor={corEstado[e.estado]}>{ESTADOS[e.estado]}</Badge> },
            { titulo: 'Reposição', render: (e) => (e.necessita_reposicao ? <Badge cor="vermelho">Necessária</Badge> : '—') },
          ]}
        />
      </Card>
      <p className="text-xs text-slate-400">Gerado em {formatarDataHora(dados.gerado_em)}</p>
    </div>
  );
}

function UsoAnual({ aba }) {
  const [ano, setAno] = useState(String(new Date().getFullYear()));
  const { dados, carregando } = useAsync(() => relatoriosService.usoAnual(ano), [ano]);
  if (carregando || !dados) return <Spinner />;

  const anos = [...new Set([String(new Date().getFullYear()), ...dados.anos])].sort().reverse();
  const config = {
    projeto: {
      linhas: dados.porProjeto,
      chave: 'id',
      colunas: [{
        titulo: 'Projeto',
        render: (p) => <span>{p.nome}<span className="block text-xs text-slate-500">{CATEGORIAS_PROJETO[p.categoria]} · {AREAS[p.area_atuacao]}</span></span>,
      }],
      csv: [{ chave: 'nome', titulo: 'Projeto' }, { chave: 'area_atuacao', titulo: 'Área', formato: (v) => AREAS[v] }],
    },
    usuario: {
      linhas: dados.porUsuario,
      chave: 'id',
      colunas: [{
        titulo: 'Usuário',
        render: (u) => <span>{u.nome} <Badge cor={corRole[u.role]} className="ml-1">{ROLES[u.role]}</Badge></span>,
      }],
      csv: [{ chave: 'nome', titulo: 'Usuário' }, { chave: 'username', titulo: 'Login' }, { chave: 'role', titulo: 'Perfil', formato: (v) => ROLES[v] }],
    },
    area: {
      linhas: dados.porArea,
      chave: 'area_atuacao',
      colunas: [{ titulo: 'Área de atuação', render: (a) => <strong>{AREAS[a.area_atuacao]}</strong> }],
      csv: [{ chave: 'area_atuacao', titulo: 'Área', formato: (v) => AREAS[v] }],
    },
  }[aba];

  const totalArea = dados.porArea.reduce((s, a) => s + a.solicitacoes, 0);

  return (
    <div className="space-y-6">
      <div className="no-print flex flex-wrap items-center gap-3">
        <Select value={ano} onChange={(e) => setAno(e.target.value)} opcoes={anos.map((a) => ({ valor: a, rotulo: a }))} />
        <Button
          variante="secundario"
          onClick={() => exportarCSV(`uso-anual-${aba}-${ano}`, config.linhas, [...config.csv, ...metricas])}
        >
          Exportar CSV
        </Button>
      </div>
      <p className="hidden text-sm print:block">Ano de referência: <strong>{ano}</strong></p>

      {aba === 'area' && totalArea > 0 && (
        <Card titulo="Distribuição de solicitações por área">
          <div className="space-y-3">
            {dados.porArea.map((a) => (
              <div key={a.area_atuacao}>
                <div className="mb-1 flex justify-between text-sm"><span>{AREAS[a.area_atuacao]}</span><span className="tabular-nums">{a.solicitacoes}</span></div>
                <div className="h-2.5 rounded-full bg-slate-100">
                  <div className={`h-2.5 rounded-full ${COR_AREA[a.area_atuacao]}`} style={{ width: `${(a.solicitacoes / totalArea) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card titulo={`${ABAS[aba]} · ${ano}`} semPadding>
        <Table chave={config.chave} linhas={config.linhas} colunas={[...config.colunas, ...colsMetricas]} />
      </Card>

      {aba === 'projeto' && dados.itensMaisUsados.length > 0 && (
        <Card titulo="Itens mais utilizados no ano" semPadding>
          <Table
            linhas={dados.itensMaisUsados}
            colunas={[
              { titulo: 'Item', render: (i) => i.nome },
              { titulo: 'Categoria', render: (i) => CATEGORIAS[i.categoria_principal] },
              { titulo: 'Solicitações', className: 'text-right', render: (i) => i.solicitacoes },
              { titulo: 'Quantidade', className: 'text-right', render: (i) => i.quantidade },
            ]}
          />
        </Card>
      )}

      <Card
        titulo="Histórico de solicitações"
        semPadding
        acoes={(
          <Button tamanho="sm" variante="secundario" className="no-print" onClick={() => exportarCSV(`historico-${ano}`, dados.historico, [
            { chave: 'data_inicio', titulo: 'Data', formato: formatarData },
            { chave: 'usuario_nome', titulo: 'Usuário' },
            { chave: 'projeto_nome', titulo: 'Projeto' },
            { chave: 'area_atuacao', titulo: 'Área', formato: (v) => AREAS[v] },
            { chave: 'equipamento_nome', titulo: 'Item' },
            { chave: 'tipo', titulo: 'Tipo', formato: (v) => TIPOS_MOV[v] },
            { chave: 'quantidade', titulo: 'Qtd.' },
            { chave: 'status', titulo: 'Status', formato: (v) => STATUS_MOV[v] },
            { chave: 'motivo_veto', titulo: 'Motivo do veto' },
          ])}
          >
            Exportar CSV
          </Button>
        )}
      >
        <Table
          linhas={dados.historico}
          vazio="Nenhuma solicitação neste ano."
          colunas={[
            { titulo: 'Data', render: (m) => <span className="text-xs whitespace-nowrap">{formatarDataHora(m.data_inicio)}</span> },
            { titulo: 'Usuário', render: (m) => m.usuario_nome },
            { titulo: 'Projeto', render: (m) => <span className="text-xs">{m.projeto_nome}</span> },
            { titulo: 'Item', render: (m) => m.equipamento_nome },
            { titulo: 'Tipo', render: (m) => TIPOS_MOV[m.tipo] },
            { titulo: 'Status', render: (m) => <Badge cor={corStatus[m.status]}>{STATUS_MOV[m.status]}</Badge> },
          ]}
        />
      </Card>
    </div>
  );
}

export default function AdminRelatoriosPage() {
  const [aba, setAba] = useState('acervo');
  return (
    <>
      <PageHeader
        titulo="Relatórios"
        descricao="Acervo, alertas de reposição e relatório anual de uso."
        acoes={<Button variante="secundario" onClick={() => window.print()}>Imprimir / PDF</Button>}
      />
      <div className="no-print mb-6 flex gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1">
        {Object.entries(ABAS).map(([k, v]) => (
          <button
            key={k}
            type="button"
            onClick={() => setAba(k)}
            className={`rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap transition ${aba === k ? 'bg-white text-brand-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            {v}
          </button>
        ))}
      </div>
      {aba === 'acervo' ? <Acervo /> : <UsoAnual key={aba} aba={aba} />}
    </>
  );
}
