import { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

/** Modal de confirmação. aoConfirmar pode ser assíncrono. */
export default function ConfirmDialog({ aberto, aoFechar, aoConfirmar, titulo, mensagem, rotulo = 'Confirmar', variante = 'primario', children }) {
  const [carregando, setCarregando] = useState(false);
  const confirmar = async () => {
    setCarregando(true);
    try {
      const ok = await aoConfirmar();
      if (ok !== false) aoFechar();
    } catch {
      // o erro já foi notificado por quem chamou
    } finally {
      setCarregando(false);
    }
  };
  return (
    <Modal
      aberto={aberto}
      aoFechar={aoFechar}
      titulo={titulo}
      rodape={(
        <>
          <Button variante="secundario" onClick={aoFechar}>Cancelar</Button>
          <Button variante={variante} carregando={carregando} onClick={confirmar}>{rotulo}</Button>
        </>
      )}
    >
      {mensagem && <p className="text-sm text-slate-600">{mensagem}</p>}
      {children}
    </Modal>
  );
}
