import { Router } from 'express';
import db from '../db.js';
import { autenticar, assinarToken } from '../middleware/auth.js';
import { conferirSenha } from '../utils/credenciais.js';
import { rota, HttpError } from '../utils/http.js';
import { carregarProjetosDoUsuario } from './usuarios.js';

const router = Router();

router.post('/login', rota((req, res) => {
  const { username, senha } = req.body || {};
  if (!username || !senha) throw new HttpError(400, 'Informe usuário e senha.');
  const u = db.prepare('SELECT * FROM usuarios WHERE username = ?').get(String(username).trim());
  if (!u || !conferirSenha(String(senha), u.senha_hash)) {
    throw new HttpError(401, 'Usuário ou senha inválidos.');
  }
  if (!u.ativo) throw new HttpError(403, 'Conta desativada. Procure o Responsável pelo Laboratório.');
  const { senha_hash, ...usuario } = u;
  res.json({ token: assinarToken(u), usuario: { ...usuario, projetos: carregarProjetosDoUsuario(u.id) } });
}));

router.get('/me', autenticar, rota((req, res) => {
  res.json({ ...req.usuario, projetos: carregarProjetosDoUsuario(req.usuario.id) });
}));

export default router;
