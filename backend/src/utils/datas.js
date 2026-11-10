export const hoje = () => new Date().toISOString().slice(0, 10);
export const agoraISO = () => new Date().toISOString();

/** Soma 1 ano a uma data AAAA-MM-DD */
export function maisUmAno(data) {
  const [a, m, d] = data.split('-').map(Number);
  const dt = new Date(Date.UTC(a + 1, m - 1, d));
  return dt.toISOString().slice(0, 10);
}

/** Fim efetivo do projeto considerando a extensão de +1 ano (IC) */
export function fimEfetivo(projeto) {
  return projeto.extendido_um_ano ? maisUmAno(projeto.fim_previsto) : projeto.fim_previsto;
}

export const projetoAtivo = (projeto) => fimEfetivo(projeto) >= hoje();
