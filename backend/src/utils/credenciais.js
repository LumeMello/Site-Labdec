import bcrypt from 'bcryptjs';

const remover = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');
const capitalizar = (s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

/** "2024.1" / "2024-1" / "20241" -> "20241" */
export function normalizarPeriodo(periodo) {
  const digitos = String(periodo || '').replace(/\D/g, '');
  if (!/^\d{4}[12]$/.test(digitos)) {
    throw new Error('Período de entrada inválido. Use o formato AAAA.S (ex.: 2024.1).');
  }
  return digitos;
}

/** Username: NomeSobrenomePeriodoEntrada (ex.: "João da Silva", "2024.1" -> "JoaoSilva20241") */
export function gerarUsername(nomeCompleto, periodo) {
  const partes = remover(nomeCompleto)
    .replace(/[^A-Za-z\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  if (partes.length === 0) throw new Error('Nome inválido.');
  const primeiro = capitalizar(partes[0]);
  const ultimo = partes.length > 1 ? capitalizar(partes[partes.length - 1]) : '';
  return `${primeiro}${ultimo}${normalizarPeriodo(periodo)}`;
}

/** Senha padrão: MatriculaPeriodoEntrada (ex.: "123456789", "2024.1" -> "12345678920241") */
export function gerarSenhaPadrao(matricula, periodo) {
  return `${String(matricula).trim()}${normalizarPeriodo(periodo)}`;
}

/** Garante username único acrescentando sufixo numérico em caso de homônimos. */
export function usernameDisponivel(db, base, ignorarId = null) {
  const existe = db.prepare('SELECT id FROM usuarios WHERE username = ? AND id IS NOT ?');
  let candidato = base;
  let n = 2;
  while (existe.get(candidato, ignorarId)) candidato = `${base}${n++}`;
  return candidato;
}

export const hashSenha = (senha) => bcrypt.hashSync(senha, 10);
export const conferirSenha = (senha, hash) => bcrypt.compareSync(senha, hash);
