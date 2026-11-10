import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useAsync } from '../../hooks/useAsync';
import { useLab } from '../../hooks/useLab';
import { equipamentosService, movimentacoesService } from '../../services/equipamentosService';
import { projetosService } from '../../services/projetosService';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge, { corEstado } from '../../components/ui/Badge';
import { Input, Select } from '../../components/ui/Field';
import Spinner from '../../components/feedback/Spinner';
import ConfirmDialog from '../../components/feedback/ConfirmDialog';
import {
  CATEGORIAS, ESTADOS, SUBCATEGORIAS, TIPOS_MOV, formatarDataHora, formatarData, paraInputDataHora,
} from '../../utils/formatters';
import { validarIntervalo } from '../../utils/validators';

function proximaHoraCheia(offsetH = 1) {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  d.setHours(d.getHours() + offsetH);
  return d;
}

export default function DetalheEquipamentoPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { usuario, temPerfil } = useAuth();
  const { sucesso, erro } = useLab();
  const item = useAsync(() => equipamentosService.obter(id), [id]);
  const projetos = useAsync(
    () => (temPerfil('PADRAO') ? Promise.resolve(usuario.projetos.filter((p) => p.ativo)) : projetosService.listar(true)),
    [usuario.id],
  );
  const [form, setForm] = useState({
    projeto_id: '',
    quantidade: 1,
    data_inicio: paraInputDataHora(proximaHoraCheia(1)),
    data_fim: paraInputDataHora(proximaHoraCheia(3)),
    data_devolucao: '',
  });
  const [enviando, setEnviando] = useState(false);
  const [confirmarReposicao, setConfirmarReposicao] = useState(false);

  const opcoesProjeto = useMemo(
    () => (projetos.dados || []).map((p) => ({ valor: p.id, rotulo: p.nome })),
    [projetos.dados],
  );

  if (item.carregando && !item.dados) return <Spinner />;
  if (item.erro) {
    return (
      <Card>
        <p className="text-sm text-slate-600">{item.erro.message}</p>
        <Button variante="secundario" className="mt-4" onClick={() => navigate('/equipamentos')}>Voltar ao catálogo</Button>
      </Card>
    );
  }
  const e = item.dados;
  const fixa = e.categoria_principal === 'MAQUINA_FIXA';
  const reagente = e.categoria_principal === 'REAGENTE';
  const bloqueado = e.estado !== 'FUNCIONAL' || (!fixa && e.quantidade_disponivel === 0);
  const set = (k) => (ev) => setForm((f) => ({ ...f, [k]: ev.target.value }));

  const enviar = async (ev) => {
    ev.preventDefault();
    const projetoId = form.projeto_id || opcoesProjeto[0]?.valor;
    if (!projetoId) return erro('Você precisa estar vinculado a um projeto ativo para solicitar itens.');
    if (fixa) {
      const msg = validarIntervalo(form.data_inicio, form.data_fim);
      if (msg) return erro(msg);
    }
    setEnviando(true);
    try {
      await movimentacoesService.solicitar({
        equipamento_id: e.id,
        projeto_id: Number(projetoId),
        quantidade: Number(form.quantidade),
        ...(fixa
          ? { data_inicio: new Date(form.data_inicio).toISOString(), data_fim: new Date(form.data_fim).toISOString() }
          : form.data_devolucao && { data_fim: new Date(`${form.data_devolucao}T18:00`).toISOString() }),
      });
      sucesso(fixa ? 'Reserva confirmada!' : reagente ? 'Reagente patriado com sucesso.' : 'Patriação registrada!');
      item.recarregar();
    } catch (err) {
      erro(err);
    } finally {
      setEnviando(false);
    }
  };

  const sinalizar = async () => {
    try {
      await equipamentosService.sinalizarReposicao(e.id);
      sucesso('Necessidade de reposição sinalizada.');
      item.recarregar();
    } catch (err) {
      erro(err);
      return false;
    }
    return true;
  };

  return (
    <>
      <Link to="/equipamentos" className="mb-4 inline-block text-sm text-brand-700 hover:underline">← Voltar ao catálogo</Link>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <div className="mb-3 flex flex-wrap gap-1.5">
              <Badge cor="brand">{CATEGORIAS[e.categoria_principal]}</Badge>
              {e.subcategoria_reagente && <Badge>{SUBCATEGORIAS[e.subcategoria_reagente]}</Badge>}
              <Badge cor={corEstado[e.estado]}>{ESTADOS[e.estado]}</Badge>
              {!!e.necessita_reposicao && <Badge cor="vermelho">Necessita reposição</Badge>}
            </div>
            <h1 className="text-2xl font-bold text-slate-900">{e.nome}</h1>
            {e.descricao && <p className="mt-2 text-sm text-slate-600">{e.descricao}</p>}
            <dl className="mt-5 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
              <div><dt className="text-slate-500">Localização</dt><dd className="font-medium">{e.localizacao || '—'}</dd></div>
              <div><dt className="text-slate-500">Quantidade total</dt><dd className="font-medium">{e.quantidade_total}</dd></div>
              {!fixa && <div><dt className="text-slate-500">Disponível</dt><dd className="font-medium">{e.quantidade_disponivel}</dd></div>}
            </dl>
            {!e.necessita_reposicao && (
              <Button variante="secundario" tamanho="sm" className="mt-5" onClick={() => setConfirmarReposicao(true)}>
                Sinalizar necessidade de reposição
              </Button>
            )}
          </Card>

          <Card titulo={fixa ? 'Agenda de reservas' : 'Patriações em aberto'} semPadding>
            {e.agenda.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-slate-500">{fixa ? 'Nenhuma reserva agendada.' : 'Nenhuma patriação em aberto.'}</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {e.agenda.map((m) => (
                  <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-sm">
                    <div>
                      <p className="font-medium text-slate-800">
                        {fixa ? `${formatarDataHora(m.data_inicio)} → ${formatarDataHora(m.data_fim)}` : `${m.quantidade} un. desde ${formatarData(m.data_inicio)}`}
                      </p>
                      <p className="text-xs text-slate-500">{m.usuario_nome} · {m.projeto_nome}</p>
                    </div>
                    <Badge>{TIPOS_MOV[m.tipo]}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <Card titulo={fixa ? 'Reservar horário' : reagente ? 'Patriar reagente' : 'Solicitar patriação'} className="h-fit">
          {bloqueado ? (
            <p className="text-sm text-slate-600">
              {e.estado !== 'FUNCIONAL' ? 'Item em manutenção — indisponível para solicitações.' : 'Sem unidades disponíveis no momento.'}
            </p>
          ) : opcoesProjeto.length === 0 && !projetos.carregando ? (
            <p className="text-sm text-slate-600">Você precisa estar vinculado a um projeto ativo para realizar solicitações.</p>
          ) : (
            <form onSubmit={enviar} className="space-y-4">
              <Select label="Projeto vinculado" value={form.projeto_id || opcoesProjeto[0]?.valor || ''} onChange={set('projeto_id')} opcoes={opcoesProjeto} required />
              {fixa ? (
                <>
                  <Input label="Início" type="datetime-local" value={form.data_inicio} onChange={set('data_inicio')} required />
                  <Input label="Fim" type="datetime-local" value={form.data_fim} onChange={set('data_fim')} required />
                </>
              ) : (
                <>
                  <Input
                    label="Quantidade"
                    type="number"
                    min={1}
                    max={e.quantidade_disponivel}
                    value={form.quantidade}
                    onChange={set('quantidade')}
                    required
                  />
                  {!reagente && (
                    <Input label="Devolução prevista (opcional)" type="date" value={form.data_devolucao} onChange={set('data_devolucao')} />
                  )}
                </>
              )}
              <Button type="submit" className="w-full" carregando={enviando}>
                {fixa ? 'Confirmar reserva' : 'Confirmar solicitação'}
              </Button>
              <p className="text-xs text-slate-500">
                A solicitação entra em vigor imediatamente. O Responsável pelo Laboratório pode vetá-la posteriormente.
              </p>
            </form>
          )}
        </Card>
      </div>

      <ConfirmDialog
        aberto={confirmarReposicao}
        aoFechar={() => setConfirmarReposicao(false)}
        aoConfirmar={sinalizar}
        titulo="Sinalizar reposição"
        mensagem={`Confirma que "${e.nome}" precisa de troca/reposição? Um alerta será gerado no relatório de acervo.`}
        rotulo="Sinalizar"
        variante="aviso"
      />
    </>
  );
}
