import { useCallback, useEffect, useRef, useState } from 'react';

/** Executa uma função assíncrona e expõe { dados, carregando, erro, recarregar }. */
export function useAsync(fn, deps = []) {
  const [estado, setEstado] = useState({ dados: null, carregando: true, erro: null });
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const recarregar = useCallback(async () => {
    setEstado((e) => ({ ...e, carregando: true, erro: null }));
    try {
      const dados = await fnRef.current();
      setEstado({ dados, carregando: false, erro: null });
      return dados;
    } catch (erro) {
      setEstado((e) => ({ ...e, carregando: false, erro }));
      return null;
    }
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { recarregar(); }, deps);

  return { ...estado, recarregar, setDados: (d) => setEstado((e) => ({ ...e, dados: d })) };
}
