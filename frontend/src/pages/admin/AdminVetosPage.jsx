import { useState } from 'react';
import { useVetos } from '../../hooks/useVetos';
import PageHeader from '../../components/ui/PageHeader';
import Card, { StatCard } from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Badge, { corStatus } from '../../components/ui/Badge';
import { Input, Select, Textarea } from '../../components/ui/Field';
import Spinner from '../../components/feedback/Spinner';
import ConfirmDialog from '../../components/feedback/ConfirmDialog';
import { STATUS_MOV, TIPOS_MOV, formatarData, formatarDataHora } from '../../utils/formatters';

export default function AdminVetosPage() {
  const [filtros, setFiltros] = useState({ status: 'ATIVO', tipo: '', busca: '' });
  const { movimentacoes, carregando, vetar } = useVetos(filtros);
  const [alvo, setAlvo] = useState(null);
  const [motivo, setMotivo] = useState('');
  const set = (k) => (e) => setFiltros({ ...filtros, [k]: e.target.value });

  const colunas = [
    { titulo: 'Data', render: (m) => <span className="text-xs whitespace-nowrap">{formatarDataHora(m.criado_em)}</span> },
    {
      titulo: 'Solicitante',
      render: (m) => (
        <div>
          <p className="font-medium text-slate-800">{m.usuario_nome}</p>
          <p className="text-xs text-slate-500">{m.projeto_nome}</p>
        </div>
      ),
    },
    {
      titulo: 'Item',
      render: (m) => (
        <div>
          <p>{m.equipamento_nome}</p>
          <p className="text-xs text-slate-500">
            {TIPOS_MOV[m.tipo]} · {m.tipo === 'RESERVA_FIXA'
              ? `${formatarDataHora(m.data_inicio)} → ${formatarDataHora(m.data_fim)}`
              : `${m.quantidade} un. desde ${formatarData(m.data_inicio)}`}
          </p>
        </div>
      ),
    },
    {
      titulo: 'Status',
      render: (m) => (
        <div>
          <Badge cor={corStatus[m.status]}>{STATUS_MOV[m.status]}</Badge>
          {m.motivo_veto && <p className="mt-1 max-w-xs text-xs text-red-600">{m.motivo_veto}</p>}
        </div>
      ),
    },
    {
      titulo: 'Ação',
      className: 'text-right',
      render: (m) => m.status === 'ATIVO' && (
        <Button tamanho="sm" variante="perigo" onClick={() => { setAlvo(m); setMotivo(''); }}>Vetar</Button>
      ),
    },
  ];

  return (
    <>
      <PageHeader titulo="Auditoria e Vetos" descricao="Todas as solicitações entram em vigor imediatamente. Aqui você pode vetá-las ou cancelá-las a qualquer momento." />
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Input placeholder="Buscar por item, usuário ou projeto..." value={filtros.busca} onChange={set('busca')} />
        <Select value={filtros.status} onChange={set('status')} opcoes={STATUS_MOV} vazio="Todos os status" />
        <Select value={filtros.tipo} onChange={set('tipo')} opcoes={TIPOS_MOV} vazio="Todos os tipos" />
      </div>
      {filtros.status === 'ATIVO' && !carregando && (
        <div className="mb-4 grid grid-cols-3 gap-4">
          <StatCard acento="bg-petala-laranja" rotulo="Reservas ativas" valor={movimentacoes.filter((m) => m.tipo === 'RESERVA_FIXA').length} />
          <StatCard acento="bg-petala-ciano" rotulo="Patriações ativas" valor={movimentacoes.filter((m) => m.tipo === 'PATRIACAO_MOVEL').length} />
          <StatCard acento="bg-petala-verde" rotulo="Reagentes patriados" valor={movimentacoes.filter((m) => m.tipo === 'REAGENTE_USO').length} />
        </div>
      )}
      <Card semPadding>{carregando ? <Spinner /> : <Table colunas={colunas} linhas={movimentacoes} />}</Card>

      <ConfirmDialog
        aberto={!!alvo}
        aoFechar={() => setAlvo(null)}
        aoConfirmar={() => (motivo.trim() ? vetar(alvo.id, motivo.trim()) : false)}
        titulo="Vetar solicitação"
        rotulo="Confirmar veto"
        variante="perigo"
      >
        {alvo && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              {TIPOS_MOV[alvo.tipo]} de <strong>{alvo.equipamento_nome}</strong> por <strong>{alvo.usuario_nome}</strong>.
              {alvo.tipo !== 'RESERVA_FIXA' && ' A quantidade será devolvida ao estoque.'}
            </p>
            <Textarea label="Motivo do veto" value={motivo} onChange={(e) => setMotivo(e.target.value)} required placeholder="Será exibido ao solicitante." />
          </div>
        )}
      </ConfirmDialog>
    </>
  );
}
