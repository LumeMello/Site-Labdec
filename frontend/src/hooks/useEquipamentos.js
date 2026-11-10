import { useCallback } from 'react';
import { equipamentosService, movimentacoesService } from '../services/equipamentosService';
import { useAsync } from './useAsync';
import { useLab } from './useLab';

/** Lista de equipamentos com filtros + operações de CRUD e solicitação. */
export function useEquipamentos(filtros = {}) {
  const { sucesso, erro } = useLab();
  const chave = JSON.stringify(filtros);
  const lista = useAsync(() => equipamentosService.listar(filtros), [chave]);

  const executar = useCallback(async (acao, msg) => {
    try {
      const r = await acao();
      if (msg) sucesso(msg);
      await lista.recarregar();
      return r;
    } catch (e) {
      erro(e);
      throw e;
    }
  }, [lista, sucesso, erro]);

  return {
    equipamentos: lista.dados || [],
    carregando: lista.carregando,
    erro: lista.erro,
    recarregar: lista.recarregar,
    criar: (d) => executar(() => equipamentosService.criar(d), 'Item cadastrado.'),
    atualizar: (id, d) => executar(() => equipamentosService.atualizar(id, d), 'Item atualizado.'),
    remover: (id) => executar(() => equipamentosService.remover(id), 'Item excluído.'),
    solicitar: (d) => executar(() => movimentacoesService.solicitar(d), 'Solicitação registrada e em vigor.'),
  };
}
