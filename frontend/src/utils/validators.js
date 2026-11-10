export const obrigatorio = (v, campo) => (!String(v ?? '').trim() ? `${campo} é obrigatório.` : null);

export const validarMatricula = (m) => (!/^\d+$/.test(String(m || '').trim()) ? 'Matrícula deve conter apenas números.' : null);

export const validarPeriodo = (p) =>
  !/^\d{4}[.\-]?[12]$/.test(String(p || '').trim()) ? 'Período deve estar no formato AAAA.S (ex.: 2024.1).' : null;

export const validarIntervalo = (inicio, fim) =>
  inicio && fim && new Date(fim) <= new Date(inicio) ? 'O fim deve ser posterior ao início.' : null;

/** Retorna o primeiro erro encontrado ou null */
export const primeiroErro = (...erros) => erros.find(Boolean) || null;

// Prévia das credenciais (mesma regra do backend)
const semAcento = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

export function previaUsername(nome, periodo) {
  const partes = semAcento(nome || '').replace(/[^A-Za-z\s]/g, ' ').split(/\s+/).filter(Boolean);
  const per = String(periodo || '').replace(/\D/g, '');
  if (!partes.length || per.length !== 5) return '';
  return `${cap(partes[0])}${partes.length > 1 ? cap(partes.at(-1)) : ''}${per}`;
}

export function previaSenha(matricula, periodo) {
  const per = String(periodo || '').replace(/\D/g, '');
  return matricula && per.length === 5 ? `${String(matricula).trim()}${per}` : '';
}
