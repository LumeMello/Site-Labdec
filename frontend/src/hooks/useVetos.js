import { movimentacoesService } from '../services/equipamentosService';
import { useAsync } from './useAsync';
import { useLab } from './useLab';

/** Central de auditoria e veto posterior (Responsável). */
export function useVetos(filtros = {}) {
  const { sucesso, erro } = useLab();
  const lista = useAsync(() => movimentacoesService.todas(filtros), [JSON.stringify(filtros)]);

  const vetar = async (id, motivo) => {
    try {
      await movimentacoesService.vetar(id, motivo);
      sucesso('Solicitação vetada. O solicitante verá o motivo em seu painel.');
      await lista.recarregar();
      return true;
    } catch (e) {
      erro(e);
      return false;
    }
  };

  return { movimentacoes: lista.dados || [], carregando: lista.carregando, recarregar: lista.recarregar, vetar };
}
