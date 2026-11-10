import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAsync } from '../../hooks/useAsync';
import { useLab } from '../../hooks/useLab';
import { movimentacoesService } from '../../services/equipamentosService';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Badge, { corStatus } from '../../components/ui/Badge';
import { Select } from '../../components/ui/Field';
import Spinner from '../../components/feedback/Spinner';
import ConfirmDialog from '../../components/feedback/ConfirmDialog';
import { STATUS_MOV, TIPOS_MOV, formatarData, formatarDataHora } from '../../utils/formatters';

const ACOES = {
  concluir: {
    titulo: (m) => (m.tipo === 'RESERVA_FIXA' ? 'Cancelar reserva' : 'Registrar devolução'),
    mensagem: (m) => (m.tipo === 'RESERVA_FIXA'
      ? `Deseja cancelar a reserva de "${m.equipamento_nome}"?`
      : `Confirma a devolução de ${m.quantidade} un. de "${m.equipamento_nome}"? O estoque disponível será atualizado.`),
    variante: 'primario',
  },
  usoTotal: {
    titulo: () => 'Sinalizar uso total',
    mensagem: (m) => `Confirma o uso total de "${m.equipamento_nome}"? O item será marcado com necessidade de troca/reposição.`,
    variante: 'aviso',
  },
};

export default function MinhasSolicitacoesPage() {
  const { sucesso, erro } = useLab();
  const [status, setStatus] = useState('ATIVO');
  const lista = useAsync(() => movimentacoesService.minhas({ status }), [status]);
  const [acao, setAcao] = useState(null); // { tipo, mov }

  const executar = async () => {
    try {
      if (acao.tipo === 'concluir') await movimentacoesService.concluir(acao.mov.id);
      else await movimentacoesService.usoTotal(acao.mov.id);
      sucesso(acao.tipo === 'concluir' ? 'Solicitação encerrada.' : 'Uso total sinalizado. Alerta de reposição gerado.');
      lista.recarregar();
    } catch (e) {
      erro(e);
      return false;
    }
    return true;
  };

  const colunas = [
    {
      titulo: 'Item',
      render: (m) => (
        <div>
          <Link to={`/equipamentos/${m.equipamento_id}`} className="font-medium text-slate-800 hover:text-brand-700">{m.equipamento_nome}</Link>
          <p className="text-xs text-slate-500">{m.projeto_nome}</p>
        </div>
      ),
    },
    { titulo: 'Tipo', render: (m) => TIPOS_MOV[m.tipo] },
    {
      titulo: 'Período / Qtd.',
      render: (m) => (m.tipo === 'RESERVA_FIXA'
        ? <span className="text-xs">{formatarDataHora(m.data_inicio)}<br />{formatarDataHora(m.data_fim)}</span>
        : <span>{m.quantidade} un. · {formatarData(m.data_inicio)}{m.data_fim && ` → ${formatarData(m.data_fim)}`}</span>),
    },
    {
      titulo: 'Status',
      render: (m) => (
        <div>
          <Badge cor={corStatus[m.status]}>{STATUS_MOV[m.status]}</Badge>
          {m.motivo_veto && <p className="mt-1 max-w-xs text-xs text-red-600">Motivo: {m.motivo_veto}</p>}
        </div>
      ),
    },
    {
      titulo: 'Ações',
      className: 'text-right',
      render: (m) => m.status === 'ATIVO' && (
        <div className="flex justify-end gap-2">
          <Button tamanho="sm" variante="secundario" onClick={() => setAcao({ tipo: 'concluir', mov: m })}>
            {m.tipo === 'RESERVA_FIXA' ? 'Cancelar' : 'Devolver'}
          </Button>
          {m.tipo !== 'RESERVA_FIXA' && (
            <Button tamanho="sm" variante="aviso" onClick={() => setAcao({ tipo: 'usoTotal', mov: m })}>Uso total</Button>
          )}
        </div>
      ),
    },
  ];

  const cfg = acao && ACOES[acao.tipo];
  return (
    <>
      <PageHeader
        titulo="Minhas Solicitações"
        descricao="Gerencie suas patriações e reservas, registre devoluções e sinalize o uso total de reagentes."
        acoes={<Select value={status} onChange={(e) => setStatus(e.target.value)} opcoes={STATUS_MOV} vazio="Todos os status" />}
      />
      <Card semPadding>
        {lista.carregando ? <Spinner /> : <Table colunas={colunas} linhas={lista.dados || []} vazio="Nenhuma solicitação encontrada." />}
      </Card>
      {cfg && (
        <ConfirmDialog
          aberto
          aoFechar={() => setAcao(null)}
          aoConfirmar={executar}
          titulo={cfg.titulo(acao.mov)}
          mensagem={cfg.mensagem(acao.mov)}
          variante={cfg.variante}
        />
      )}
    </>
  );
}
