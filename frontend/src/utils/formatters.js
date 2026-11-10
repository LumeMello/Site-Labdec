export const ROLES = {
  RESPONSAVEL: 'Responsável pelo Laboratório',
  ADMIN: 'Administrador',
  PADRAO: 'Usuário Padrão',
};

export const CATEGORIAS = {
  REAGENTE: 'Reagente',
  MAQUINA_FIXA: 'Máquina Fixa',
  MAQUINA_MOVEL: 'Máquina Móvel',
  EPI: 'EPI',
  VIDRACARIA: 'Vidraria',
};

export const SUBCATEGORIAS = {
  AGUA_DOCE: 'Água Doce',
  AGUA_SALGADA: 'Água Salgada',
  SOLO: 'Solo',
  EFLUENTES: 'Efluentes',
};

export const ESTADOS = { FUNCIONAL: 'Funcional', MANUTENCAO: 'Em Manutenção' };

export const CATEGORIAS_PROJETO = { INICIACAO_CIENTIFICA: 'Iniciação Científica', EXTENSAO: 'Extensão' };

export const AREAS = {
  AGUA: 'Água',
  SOLO: 'Solo',
  EFLUENTES: 'Efluentes',
  ENERGIAS_RENOVAVEIS: 'Energias Renováveis',
};

export const TIPOS_MOV = {
  RESERVA_FIXA: 'Reserva',
  PATRIACAO_MOVEL: 'Patriação',
  REAGENTE_USO: 'Uso de Reagente',
};

export const STATUS_MOV = {
  ATIVO: 'Ativo',
  CONCLUIDO: 'Concluído',
  USO_TOTAL_SINALIZADO: 'Uso Total Sinalizado',
  VETADO: 'Vetado',
};

const pad = (n) => String(n).padStart(2, '0');

export function formatarData(valor) {
  if (!valor) return '—';
  // Datas puras (AAAA-MM-DD) não devem sofrer ajuste de fuso
  if (/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    const [a, m, d] = valor.split('-');
    return `${d}/${m}/${a}`;
  }
  const dt = paraDate(valor);
  return `${pad(dt.getDate())}/${pad(dt.getMonth() + 1)}/${dt.getFullYear()}`;
}

/** SQLite grava CURRENT_TIMESTAMP em UTC sem 'Z' ("AAAA-MM-DD HH:MM:SS") */
const paraDate = (v) => new Date(v.includes('T') ? v : `${v.replace(' ', 'T')}Z`);

export function formatarDataHora(valor) {
  if (!valor) return '—';
  const dt = paraDate(valor);
  return `${formatarData(valor)} ${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
}

/** Valor para <input type="datetime-local"> no fuso local */
export function paraInputDataHora(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export const formatarPeriodo = (p) => {
  const d = String(p || '').replace(/\D/g, '');
  return d.length === 5 ? `${d.slice(0, 4)}.${d.slice(4)}` : p;
};

export const formatarMatricula = (m) => String(m || '').replace(/\D/g, '');

/** Exporta linhas (array de objetos) para CSV compatível com Excel (separador ;) */
export function exportarCSV(nomeArquivo, linhas, colunas) {
  const cols = colunas || Object.keys(linhas[0] || {}).map((k) => ({ chave: k, titulo: k }));
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = [
    cols.map((c) => esc(c.titulo)).join(';'),
    ...linhas.map((l) => cols.map((c) => esc(c.formato ? c.formato(l[c.chave], l) : l[c.chave])).join(';')),
  ].join('\r\n');
  const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { href: url, download: `${nomeArquivo}.csv` });
  a.click();
  URL.revokeObjectURL(url);
}
