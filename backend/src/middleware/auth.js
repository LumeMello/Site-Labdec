import jwt from 'jsonwebtoken';
import db from '../db.js';

export const JWT_SECRET = process.env.JWT_SECRET || 'labdec-dev-secret-troque-em-producao';
if (!process.env.JWT_SECRET) {
  console.warn('[auth] JWT_SECRET não definido; usando segredo de desenvolvimento.');
}

export function autenticar(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ erro: 'Não autenticado.' });
  try {
    const { sub } = jwt.verify(token, JWT_SECRET);
    const usuario = db
      .prepare('SELECT id, nome, matricula, cargo, role, username, periodo_entrada, ativo FROM usuarios WHERE id = ?')
      .get(sub);
    if (!usuario || !usuario.ativo) return res.status(401).json({ erro: 'Sessão inválida.' });
    req.usuario = usuario;
    next();
  } catch {
    return res.status(401).json({ erro: 'Sessão expirada. Faça login novamente.' });
  }
}

/** Restringe a rota aos perfis informados (RBAC). */
export const permitir = (...roles) => (req, res, next) => {
  if (!roles.includes(req.usuario.role)) {
    return res.status(403).json({ erro: 'Você não tem permissão para esta ação.' });
  }
  next();
};

export const assinarToken = (usuario) =>
  jwt.sign({ sub: usuario.id, role: usuario.role }, JWT_SECRET, { expiresIn: '8h' });
