import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useAsync } from '../../hooks/useAsync';
import { useLab } from '../../hooks/useLab';
import { usuariosService } from '../../services/usuariosService';
import { projetosService } from '../../services/projetosService';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Badge, { corRole } from '../../components/ui/Badge';
import { Checkbox, Input, Select } from '../../components/ui/Field';
import Spinner from '../../components/feedback/Spinner';
import ConfirmDialog from '../../components/feedback/ConfirmDialog';
import { ROLES, formatarPeriodo } from '../../utils/formatters';
import {
  obrigatorio, previaSenha, previaUsername, primeiroErro, validarMatricula, validarPeriodo,
} from '../../utils/validators';

const VAZIO = { nome: '', matricula: '', cargo: '', role: 'PADRAO', periodo_entrada: '', projeto_ids: [] };

function FormUsuario({ inicial, projetos, ehProprio, aoSalvar, aoFechar }) {
  const [f, setF] = useState(inicial);
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);
  const novo = !inicial.id;
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const alternarProjeto = (id) => setF((x) => ({
    ...x,
    projeto_ids: x.projeto_ids.includes(id) ? x.projeto_ids.filter((p) => p !== id) : [...x.projeto_ids, id],
  }));
  const rolesDisponiveis = Object.fromEntries(
    Object.entries(ROLES).filter(([r]) => (novo ? r !== 'RESPONSAVEL' : !ehProprio || r === 'RESPONSAVEL')),
  );

  const salvar = async (e) => {
    e.preventDefault();
    const temAtivo = projetos.some((p) => p.ativo && f.projeto_ids.includes(p.id));
    const msg = primeiroErro(
      obrigatorio(f.nome, 'Nome'), validarMatricula(f.matricula), obrigatorio(f.cargo, 'Cargo'), validarPeriodo(f.periodo_entrada),
      f.role === 'PADRAO' && !temAtivo && 'Usuário Padrão deve estar vinculado a pelo menos um projeto ativo.',
    );
    if (msg) return setErro(msg);
    if (f.role === 'RESPONSAVEL' && inicial.role !== 'RESPONSAVEL'
      && !window.confirm('Só pode haver um Responsável. Você passará a ser Administrador e perderá o acesso exclusivo. Continuar?')) return null;
    setSalvando(true);
    setErro('');
    try {
      await aoSalvar(f);
    } catch (err) {
      setErro(err.message);
    } finally {
      setSalvando(false);
    }
    return null;
  };

  const username = previaUsername(f.nome, f.periodo_entrada);
  return (
    <form onSubmit={salvar} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Nome completo" value={f.nome} onChange={set('nome')} className="sm:col-span-2" required />
        <Input label="Matrícula" inputMode="numeric" value={f.matricula} onChange={set('matricula')} required />
        <Input label="Período de entrada" placeholder="2024.1" value={f.periodo_entrada} onChange={set('periodo_entrada')} required />
        <Input label="Cargo" placeholder="Aluno de Graduação, Mestrando..." value={f.cargo} onChange={set('cargo')} required />
        <Select label="Perfil de acesso" value={f.role} onChange={set('role')} opcoes={rolesDisponiveis} />
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-slate-700">
          Projetos vinculados {f.role === 'PADRAO' && <span className="text-red-600">*</span>}
        </p>
        <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg p-3 ring-1 ring-slate-200">
          {projetos.map((p) => (
            <Checkbox
              key={p.id}
              checked={f.projeto_ids.includes(p.id)}
              onChange={() => alternarProjeto(p.id)}
              label={<span>{p.nome}{!p.ativo && <span className="ml-1 text-xs text-slate-400">(encerrado)</span>}</span>}
            />
          ))}
        </div>
      </div>

      {novo && (
        <div className="rounded-lg bg-slate-50 p-3 text-sm ring-1 ring-slate-200">
          <p className="mb-1 font-medium text-slate-700">Credenciais geradas automaticamente</p>
          <p className="text-slate-600">Usuário: <code className="font-mono">{username || '—'}</code></p>
          <p className="text-slate-600">Senha: <code className="font-mono">{previaSenha(f.matricula, f.periodo_entrada) || '—'}</code></p>
          <p className="mt-1 text-xs text-slate-500">O usuário não poderá alterar nem visualizar a senha. Em caso de homônimos, um número é acrescentado ao usuário.</p>
        </div>
      )}

      {erro && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</p>}
      <div className="flex justify-end gap-2">
        <Button variante="secundario" onClick={aoFechar}>Cancelar</Button>
        <Button type="submit" carregando={salvando}>{novo ? 'Cadastrar' : 'Salvar'}</Button>
      </div>
    </form>
  );
}

export default function AdminUsuariosPage() {
  const { usuario: eu, recarregar: recarregarSessao } = useAuth();
  const { sucesso, erro } = useLab();
  const usuarios = useAsync(() => usuariosService.listar(), []);
  const projetos = useAsync(() => projetosService.listar(), []);
  const [editando, setEditando] = useState(null);
  const [credenciais, setCredenciais] = useState(null);
  const [redefinindo, setRedefinindo] = useState(null);
  const [busca, setBusca] = useState('');

  const salvar = async (f) => {
    if (f.id) {
      const r = await usuariosService.atualizar(f.id, f);
      sucesso(r.responsabilidadeTransferida ? 'Responsabilidade transferida.' : 'Usuário atualizado.');
      if (r.responsabilidadeTransferida) {
        await recarregarSessao(); // perde acesso a esta página
        return;
      }
    } else {
      const r = await usuariosService.criar(f);
      setCredenciais({ nome: r.usuario.nome, ...r.credenciais });
    }
    setEditando(null);
    usuarios.recarregar();
  };

  const alternarAtivo = async (u) => {
    try {
      await usuariosService.definirAtivo(u.id, !u.ativo);
      sucesso(u.ativo ? 'Conta desativada.' : 'Conta reativada.');
      usuarios.recarregar();
    } catch (e) {
      erro(e);
    }
  };

  const redefinir = async () => {
    try {
      const r = await usuariosService.redefinirCredenciais(redefinindo.id);
      setCredenciais({ nome: r.usuario.nome, ...r.credenciais });
      usuarios.recarregar();
    } catch (e) {
      erro(e);
      return false;
    }
    return true;
  };

  const linhas = (usuarios.dados || []).filter((u) =>
    !busca || `${u.nome} ${u.username} ${u.matricula}`.toLowerCase().includes(busca.toLowerCase()));

  const colunas = [
    {
      titulo: 'Usuário',
      render: (u) => (
        <div className={u.ativo ? '' : 'opacity-50'}>
          <p className="font-medium text-slate-800">{u.nome} {!u.ativo && <span className="text-xs">(inativo)</span>}</p>
          <p className="font-mono text-xs text-slate-500">{u.username} · mat. {u.matricula}</p>
        </div>
      ),
    },
    { titulo: 'Cargo / Entrada', render: (u) => <span>{u.cargo}<span className="block text-xs text-slate-500">{formatarPeriodo(u.periodo_entrada)}</span></span> },
    { titulo: 'Perfil', render: (u) => <Badge cor={corRole[u.role]}>{ROLES[u.role]}</Badge> },
    {
      titulo: 'Projetos',
      render: (u) => (
        <span className={u.role === 'PADRAO' && !u.projetos.some((p) => p.ativo) ? 'text-red-600' : ''}>
          {u.projetos.filter((p) => p.ativo).length} ativo(s)
        </span>
      ),
    },
    {
      titulo: 'Ações',
      className: 'text-right',
      render: (u) => (
        <div className="flex flex-wrap justify-end gap-1.5">
          <Button tamanho="sm" variante="secundario" onClick={() => setEditando({ ...u, projeto_ids: u.projetos.map((p) => p.id) })}>Editar</Button>
          <Button tamanho="sm" variante="fantasma" onClick={() => setRedefinindo(u)}>Credenciais</Button>
          {u.id !== eu.id && (
            <Button tamanho="sm" variante="fantasma" className={u.ativo ? 'text-red-600' : 'text-emerald-700'} onClick={() => alternarAtivo(u)}>
              {u.ativo ? 'Desativar' : 'Reativar'}
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        titulo="Usuários"
        descricao="Cadastro de contas com geração automática de credenciais."
        acoes={<Button onClick={() => setEditando(VAZIO)}>+ Novo usuário</Button>}
      />
      <Input className="mb-4 max-w-sm" placeholder="Buscar por nome, usuário ou matrícula..." value={busca} onChange={(e) => setBusca(e.target.value)} />
      <Card semPadding>{usuarios.carregando ? <Spinner /> : <Table colunas={colunas} linhas={linhas} />}</Card>

      <Modal aberto={!!editando} aoFechar={() => setEditando(null)} titulo={editando?.id ? 'Editar usuário' : 'Novo usuário'} largura="max-w-2xl">
        {editando && (
          <FormUsuario
            key={editando.id || 'novo'}
            inicial={editando}
            projetos={projetos.dados || []}
            ehProprio={editando.id === eu.id}
            aoSalvar={salvar}
            aoFechar={() => setEditando(null)}
          />
        )}
      </Modal>

      <ConfirmDialog
        aberto={!!redefinindo}
        aoFechar={() => setRedefinindo(null)}
        aoConfirmar={redefinir}
        titulo="Redefinir credenciais"
        mensagem={`O usuário e a senha de ${redefinindo?.nome} serão regenerados a partir dos dados cadastrais atuais (nome, matrícula e período).`}
        rotulo="Redefinir"
        variante="aviso"
      />

      <Modal
        aberto={!!credenciais}
        aoFechar={() => setCredenciais(null)}
        titulo="Credenciais de acesso"
        rodape={<Button onClick={() => setCredenciais(null)}>Concluir</Button>}
      >
        {credenciais && (
          <div className="space-y-3 text-sm">
            <p className="text-slate-600">Repasse as credenciais abaixo a <strong>{credenciais.nome}</strong>:</p>
            <div className="rounded-lg bg-slate-900 p-4 font-mono text-emerald-300">
              <p>Usuário: {credenciais.username}</p>
              <p>Senha: {credenciais.senha}</p>
            </div>
            <p className="text-xs text-slate-500">A senha segue a regra Matrícula + Período de Entrada e não pode ser alterada pelo usuário.</p>
          </div>
        )}
      </Modal>
    </>
  );
}
