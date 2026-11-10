import { useState } from 'react';
import { useEquipamentos } from '../../hooks/useEquipamentos';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Badge, { corEstado } from '../../components/ui/Badge';
import { Checkbox, Input, Select, Textarea } from '../../components/ui/Field';
import Spinner from '../../components/feedback/Spinner';
import ConfirmDialog from '../../components/feedback/ConfirmDialog';
import { CATEGORIAS, ESTADOS, SUBCATEGORIAS } from '../../utils/formatters';

const VAZIO = {
  nome: '', descricao: '', localizacao: '', categoria_principal: 'VIDRACARIA', subcategoria_reagente: '',
  estado: 'FUNCIONAL', quantidade_total: 1, quantidade_disponivel: 1, necessita_reposicao: false,
};

function FormEquipamento({ inicial, aoSalvar, aoFechar }) {
  const [f, setF] = useState(inicial);
  const [salvando, setSalvando] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  const novo = !inicial.id;

  const salvar = async (e) => {
    e.preventDefault();
    setSalvando(true);
    try {
      await aoSalvar({
        ...f,
        quantidade_total: Number(f.quantidade_total),
        quantidade_disponivel: Number(novo ? f.quantidade_total : f.quantidade_disponivel),
      });
      aoFechar();
    } catch {
      /* toast exibido pelo hook */
    } finally {
      setSalvando(false);
    }
  };

  return (
    <form id="form-equip" onSubmit={salvar} className="grid gap-4 sm:grid-cols-2">
      <Input label="Nome" value={f.nome} onChange={set('nome')} required className="sm:col-span-2" />
      <Select label="Categoria" value={f.categoria_principal} onChange={set('categoria_principal')} opcoes={CATEGORIAS} />
      {f.categoria_principal === 'REAGENTE'
        ? <Select label="Subcategoria" value={f.subcategoria_reagente || ''} onChange={set('subcategoria_reagente')} opcoes={SUBCATEGORIAS} vazio="—" />
        : <Select label="Estado" value={f.estado} onChange={set('estado')} opcoes={ESTADOS} />}
      {f.categoria_principal === 'REAGENTE' && <Select label="Estado" value={f.estado} onChange={set('estado')} opcoes={ESTADOS} />}
      <Input label="Localização" value={f.localizacao || ''} onChange={set('localizacao')} />
      <Input label="Quantidade total" type="number" min={0} value={f.quantidade_total} onChange={set('quantidade_total')} required />
      {!novo && (
        <Input
          label="Quantidade disponível"
          type="number"
          min={0}
          max={f.quantidade_total}
          value={f.quantidade_disponivel}
          onChange={set('quantidade_disponivel')}
          ajuda="Ajuste após reposição ou baixa de estoque."
          required
        />
      )}
      <Textarea label="Descrição" value={f.descricao || ''} onChange={set('descricao')} className="sm:col-span-2" />
      {!novo && (
        <Checkbox
          label="Necessita reposição (desmarque após repor o item)"
          checked={!!f.necessita_reposicao}
          onChange={set('necessita_reposicao')}
          className="sm:col-span-2"
        />
      )}
      <div className="flex justify-end gap-2 sm:col-span-2">
        <Button variante="secundario" onClick={aoFechar}>Cancelar</Button>
        <Button type="submit" carregando={salvando}>{novo ? 'Cadastrar' : 'Salvar'}</Button>
      </div>
    </form>
  );
}

export default function AdminEquipamentosPage() {
  const [filtros, setFiltros] = useState({ busca: '', categoria: '', estado: '' });
  const { equipamentos, carregando, criar, atualizar, remover } = useEquipamentos(filtros);
  const [editando, setEditando] = useState(null);
  const [excluindo, setExcluindo] = useState(null);

  const colunas = [
    {
      titulo: 'Item',
      render: (e) => (
        <div>
          <p className="font-medium text-slate-800">{e.nome}</p>
          <p className="text-xs text-slate-500">{e.localizacao || '—'}</p>
        </div>
      ),
    },
    {
      titulo: 'Categoria',
      render: (e) => (
        <>
          {CATEGORIAS[e.categoria_principal]}
          {e.subcategoria_reagente && <span className="block text-xs text-slate-500">{SUBCATEGORIAS[e.subcategoria_reagente]}</span>}
        </>
      ),
    },
    { titulo: 'Disp. / Total', render: (e) => <span className="tabular-nums">{e.quantidade_disponivel} / {e.quantidade_total}</span> },
    {
      titulo: 'Estado',
      render: (e) => (
        <div className="flex flex-wrap gap-1">
          <Badge cor={corEstado[e.estado]}>{ESTADOS[e.estado]}</Badge>
          {!!e.necessita_reposicao && <Badge cor="vermelho">Reposição</Badge>}
        </div>
      ),
    },
    {
      titulo: 'Ações',
      className: 'text-right',
      render: (e) => (
        <div className="flex justify-end gap-2">
          <Button tamanho="sm" variante="secundario" onClick={() => setEditando(e)}>Editar</Button>
          <Button tamanho="sm" variante="fantasma" className="text-red-600" onClick={() => setExcluindo(e)}>Excluir</Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        titulo="Gerenciamento do Acervo"
        descricao="Cadastre e mantenha equipamentos, reagentes, EPIs e vidrarias."
        acoes={<Button onClick={() => setEditando(VAZIO)}>+ Novo item</Button>}
      />
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Input placeholder="Buscar..." value={filtros.busca} onChange={(e) => setFiltros({ ...filtros, busca: e.target.value })} />
        <Select value={filtros.categoria} onChange={(e) => setFiltros({ ...filtros, categoria: e.target.value })} opcoes={CATEGORIAS} vazio="Todas as categorias" />
        <Select value={filtros.estado} onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })} opcoes={ESTADOS} vazio="Todos os estados" />
      </div>
      <Card semPadding>{carregando ? <Spinner /> : <Table colunas={colunas} linhas={equipamentos} />}</Card>

      <Modal aberto={!!editando} aoFechar={() => setEditando(null)} titulo={editando?.id ? 'Editar item' : 'Novo item'} largura="max-w-2xl">
        {editando && (
          <FormEquipamento
            key={editando.id || 'novo'}
            inicial={editando}
            aoFechar={() => setEditando(null)}
            aoSalvar={(d) => (editando.id ? atualizar(editando.id, d) : criar(d))}
          />
        )}
      </Modal>
      <ConfirmDialog
        aberto={!!excluindo}
        aoFechar={() => setExcluindo(null)}
        aoConfirmar={() => remover(excluindo.id)}
        titulo="Excluir item"
        mensagem={`Excluir "${excluindo?.nome}"? Itens com histórico de movimentações não podem ser excluídos.`}
        rotulo="Excluir"
        variante="perigo"
      />
    </>
  );
}
