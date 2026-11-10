import { createContext, useCallback, useMemo, useState } from 'react';

export const LabContext = createContext(null);

/** Estado global de notificações (toasts) e filtros persistentes do catálogo. */
export function LabProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [filtrosCatalogo, setFiltrosCatalogo] = useState({ busca: '', categoria: '', estado: '' });

  const remover = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const notificar = useCallback((mensagem, tipo = 'sucesso') => {
    const id = crypto.randomUUID?.() ?? String(Date.now() + Math.random());
    setToasts((t) => [...t, { id, mensagem, tipo }]);
    setTimeout(() => remover(id), 4500);
  }, [remover]);

  const valor = useMemo(() => ({
    toasts,
    notificar,
    sucesso: (m) => notificar(m, 'sucesso'),
    erro: (m) => notificar(m instanceof Error ? m.message : m, 'erro'),
    removerToast: remover,
    filtrosCatalogo,
    setFiltrosCatalogo,
  }), [toasts, notificar, remover, filtrosCatalogo]);

  return <LabContext.Provider value={valor}>{children}</LabContext.Provider>;
}
