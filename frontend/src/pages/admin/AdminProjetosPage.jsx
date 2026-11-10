import { useState } from 'react';
import { useAsync } from '../../hooks/useAsync';
import { useLab } from '../../hooks/useLab';
import { projetosService } from '../../services/projetosService';
import { usuariosService } from '../../services/usuariosService';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Badge, { corRole } from '../../components/ui/Badge';
import { Checkbox, Input, Select, Textarea } from '../../components/ui/Field';
import Spinner from '../../components/feedback/Spinner';
import ConfirmDialog from '../../components/feedback/ConfirmDialog';
import { AREAS, CATEGORIAS_PROJETO, formatarData } from '../../utils/formatters';
import { validarIntervalo } from '../../utils/validators';

const VAZIO = {
  nome: '', descricao: '', categoria: 'INICIACAO_CIENTIFICA', area_atuacao: 'AGUA',
  data_inicio: '', fim_previsto: '', projeto_pai_id: '',
};

function FormProjeto({ inicial, projetos, aoSalvar, aoFechar }) {
  const [f, setF] = useState({ ...inicial, projeto_pai_id: inicial.projeto_pai_id || '' });
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const salvar = async (e) => {
    e.preventDefault();
    const msg = validarIntervalo(f.data_inicio, f.fim_previsto);
    if (msg) return setErro(msg);
    setSalvando(true);
    try {
      await aoSalvar({ ...f, projeto_pai_id: f.projeto_pai_id ? Number(f.projeto_pai_id) : null });
    } catch (err) {
      setErro(err.message);
    } finally {
      setSalvando(false);
    }
    return null;
  };

  return (
    <form onSubmit={salvar} className="grid gap-4 sm:grid-cols-2">
      <Input label="Nome do projeto" value={f.nome} onChange={set('nome')} required className="sm:col-span-2" />
      <Select label="Categoria" value={f.categoria} onChange={set('categoria')} opcoes={CATEGORIAS_PROJETO} />
      <Select label="Área de atuação" value={f.area_atuacao} onChange={set('area_atuacao')} opcoes={AREAS} />
      <Input label="Data de início" type="date" value={f.data_inicio} onChange={set('data_inicio')} required />
      <Input label="Fim previsto" type="date" value={f.fim_previsto} onChange={set('fim_previsto')} required />
      <Select
        label="Projeto pai (opcional)"
        className="sm:col-span-2"
        value={f.projeto_pai_id}
        onChange={set('projeto_pai_id')}
        opcoes={projetos.filter((p) => p.id !== f.id).map((p) => ({ valor: p.id, rotulo: p.nome }))}
        vazio="Nenhum"
      />
      <Textarea label="Descrição" value={f.descricao || ''} onChange={set('descricao')} className="sm:col-span-2" />
      {erro && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 sm:col-span-2">{erro}</p>}
      <div className="flex justify-end gap-2 sm:col-span-2">
        <Button variante="secundario" onClick={aoFechar}>Cancelar</Button>
        <Button type="submit" carregando={salvando}>{f.id ? 'Salvar' : 'Cadastrar'}</Button>
      </div>
    </form>
  );
}

function FormMembros({ projeto, usuarios, aoSalvar, aoFechar }) {
  const [sel, setSel] = useState(projeto.membros.map((m) => m.id));
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);
  const alternar = (id) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const salvar = async () => {
    setSalvando(true);
    try {
      await aoSalvar(sel);
    } catch (e) {
      setErro(e.message);
    } finally {
      setSalvando(false);
    }
  };
  return (
    <div className="space-y-4">
      <div className="max-h-80 space-y-2 overflow-y-auto">
        {usuarios.filter((u) => u.ativo).map((u) => (
          <div key={u.id} className="flex items-center justify-between rounded-lg px-3 py-2 ring-1 ring-slate-200">
            <Checkbox checked={sel.includes(u.id)} onChange={() => alternar(u.id)} label={<span>{u.nome} <span className="text-xs text-slate-500">· {u.cargo}</span></span>} />
            <Badge cor={corRole[u.role]}>{u.role === 'PADRAO' ? 'Padrão' : u.role === 'ADMIN' ? 'Admin' : 'Resp.'}</Badge>
          </div>
        ))}
      </div>
      {erro && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</p>}
      <div className="flex justify-end gap-2">
        <Button variante="secundario" onClick={aoFechar}>Cancelar</Button>
        <Button carregando={salvando} onClick={salvar}>Salvar integrantes</Button>
      </div>
    </div>
  );
}

export default function AdminProjetosPage() {
  const { sucesso, erro } = useLab();
  const projetos = useAsync(() => projetosService.listar(), []);
  const usuarios = useAsync(() => usuariosService.listar(), []);
  const [editando, setEditando] = useState(null);
  const [membros, setMembros] = useState(null);
  const [estendendo, setEstendendo] = useState(null);
  const [excluindo, setExcluindo] = useState(null);

  const acao = async (fn, msg) => {
    try {
      await fn();
      sucesso(msg);
      projetos.recarregar();
    } catch (e) {
      erro(e);
      return false;
    }
    return true;
  };

  const salvarProjeto = async (f) => {
    if (f.id) await projetosService.atualizar(f.id, f);
    else await projetosService.criar(f);
    sucesso(f.id ? 'Projeto atualizado.' : 'Projeto cadastrado.');
    setEditando(null);
    projetos.recarregar();
  };

  const colunas = [
    {
      titulo: 'Projeto',
      render: (p) => (
        <div className="max-w-sm">
          <p className="font-medium text-slate-800">{p.nome}</p>
          {p.projeto_pai_nome && <p className="text-xs text-slate-500">↳ {p.projeto_pai_nome}</p>}
        </div>
      ),
    },
    { titulo: 'Categoria / Área', render: (p) => <span>{CATEGORIAS_PROJETO[p.categoria]}<span className="block text-xs text-slate-500">{AREAS[p.area_atuacao]}</span></span> },
    {
      titulo: 'Vigência',
      render: (p) => (
        <span className="text-xs whitespace-nowrap">
          {formatarData(p.data_inicio)} → {formatarData(p.fim_efetivo)}
          {!!p.extendido_um_ano && <span className="block text-violet-700">+1 ano (orig. {formatarData(p.fim_previsto)})</span>}
        </span>
      ),
    },
    { titulo: 'Status', render: (p) => <Badge cor={p.ativo ? 'verde' : 'cinza'}>{p.ativo ? 'Ativo' : 'Encerrado'}</Badge> },
    { titulo: 'Integrantes', render: (p) => p.membros.length },
    {
      titulo: 'Ações',
      className: 'text-right',
      render: (p) => (
        <div className="flex justify-end gap-1.5">
          <Button tamanho="sm" variante="secundario" onClick={() => setEditando(p)}>Editar</Button>
          <Button tamanho="sm" variante="secundario" onClick={() => setMembros(p)}>Membros</Button>
          {p.pode_estender && <Button tamanho="sm" variante="aviso" onClick={() => setEstendendo(p)}>+1 ano</Button>}
          <Button tamanho="sm" variante="fantasma" className="text-red-600" onClick={() => setExcluindo(p)}>Excluir</Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        titulo="Gestão de Projetos"
        descricao="Cadastro, vínculo de integrantes e extensão de projetos de Iniciação Científica."
        acoes={<Button onClick={() => setEditando(VAZIO)}>+ Novo projeto</Button>}
      />
      <Card semPadding>{projetos.carregando ? <Spinner /> : <Table colunas={colunas} linhas={projetos.dados || []} />}</Card>

      <Modal aberto={!!editando} aoFechar={() => setEditando(null)} titulo={editando?.id ? 'Editar projeto' : 'Novo projeto'} largura="max-w-2xl">
        {editando && (
          <FormProjeto key={editando.id || 'novo'} inicial={editando} projetos={projetos.dados || []} aoSalvar={salvarProjeto} aoFechar={() => setEditando(null)} />
        )}
      </Modal>

      <Modal aberto={!!membros} aoFechar={() => setMembros(null)} titulo={`Integrantes · ${membros?.nome || ''}`}>
        {membros && (
          <FormMembros
            projeto={membros}
            usuarios={usuarios.dados || []}
            aoFechar={() => setMembros(null)}
            aoSalvar={async (ids) => {
              await projetosService.definirMembros(membros.id, ids);
              sucesso('Integrantes atualizados.');
              setMembros(null);
              projetos.recarregar();
            }}
          />
        )}
      </Modal>

      <ConfirmDialog
        aberto={!!estendendo}
        aoFechar={() => setEstendendo(null)}
        aoConfirmar={() => acao(() => projetosService.estender(estendendo.id), 'Projeto estendido por +1 ano.')}
        titulo="Estender projeto de IC"
        mensagem={estendendo && `O fim do projeto "${estendendo.nome}" passará de ${formatarData(estendendo.fim_previsto)} para um ano depois. A extensão só pode ser feita uma vez.`}
        rotulo="Estender +1 ano"
        variante="aviso"
      />
      <ConfirmDialog
        aberto={!!excluindo}
        aoFechar={() => setExcluindo(null)}
        aoConfirmar={() => acao(() => projetosService.remover(excluindo.id), 'Projeto excluído.')}
        titulo="Excluir projeto"
        mensagem={`Excluir "${excluindo?.nome}"? Projetos com histórico de movimentações não podem ser excluídos.`}
        rotulo="Excluir"
        variante="perigo"
      />
    </>
  );
}
