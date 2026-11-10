import { Router } from 'express';
import db from '../db.js';
import { permitir } from '../middleware/auth.js';
import {
  gerarUsername, gerarSenhaPadrao, usernameDisponivel, hashSenha, normalizarPeriodo,
} from '../utils/credenciais.js';
import { projetoAtivo, fimEfetivo } from '../utils/datas.js';
import { rota, HttpError } from '../utils/http.js';

const router = Router();
const ROLES = ['RESPONSAVEL', 'ADMIN', 'PADRAO'];
const CAMPOS = 'id, nome, matricula, cargo, role, username, periodo_entrada, ativo, criado_em';

export function carregarProjetosDoUsuario(usuarioId) {
  return db.prepare(`
    SELECT p.* FROM projetos p
    JOIN usuario_projetos up ON up.projeto_id = p.id
    WHERE up.usuario_id = ? ORDER BY p.nome`).all(usuarioId)
    .map((p) => ({ ...p, fim_efetivo: fimEfetivo(p), ativo: projetoAtivo(p) }));
}

/** Regra 1: todo Usuário Padrão deve estar vinculado a pelo menos um projeto ativo. */
function validarVinculo(role, projetoIds) {
  if (role !== 'PADRAO') return;
  const projetos = projetoIds.length
    ? db.prepare(`SELECT * FROM projetos WHERE id IN (${projetoIds.map(() => '?').join(',')})`).all(...projetoIds)
    : [];
  if (projetos.length !== projetoIds.length) throw new HttpError(400, 'Projeto inexistente informado.');
  if (!projetos.some(projetoAtivo)) {
    throw new HttpError(400, 'Usuário Padrão deve estar vinculado a pelo menos um projeto ativo.');
  }
}

function salvarVinculos(usuarioId, projetoIds) {
  db.prepare('DELETE FROM usuario_projetos WHERE usuario_id = ?').run(usuarioId);
  const ins = db.prepare('INSERT INTO usuario_projetos (usuario_id, projeto_id) VALUES (?, ?)');
  for (const pid of projetoIds) ins.run(usuarioId, pid);
}

function lerCorpo(body) {
  const nome = String(body.nome || '').trim();
  const matricula = String(body.matricula || '').trim();
  const cargo = String(body.cargo || '').trim();
  const role = body.role;
  const projetoIds = [...new Set((body.projeto_ids || []).map(Number))];
  if (!nome || !matricula || !cargo) throw new HttpError(400, 'Nome, matrícula e cargo são obrigatórios.');
  if (!/^\d+$/.test(matricula)) throw new HttpError(400, 'Matrícula deve conter apenas números.');
  if (!ROLES.includes(role)) throw new HttpError(400, 'Perfil inválido.');
  let periodo;
  try {
    normalizarPeriodo(body.periodo_entrada);
    periodo = String(body.periodo_entrada).trim();
  } catch (e) {
    throw new HttpError(400, e.message);
  }
  return { nome, matricula, cargo, role, periodo, projetoIds };
}

const buscar = (id) => {
  const u = db.prepare(`SELECT ${CAMPOS} FROM usuarios WHERE id = ?`).get(id);
  return u && { ...u, projetos: carregarProjetosDoUsuario(u.id) };
};

router.get('/', permitir('RESPONSAVEL'), rota((req, res) => {
  const lista = db.prepare(`SELECT ${CAMPOS} FROM usuarios ORDER BY ativo DESC, nome`).all();
  res.json(lista.map((u) => ({ ...u, projetos: carregarProjetosDoUsuario(u.id) })));
}));

router.post('/', permitir('RESPONSAVEL'), rota((req, res) => {
  const d = lerCorpo(req.body || {});
  if (d.role === 'RESPONSAVEL') {
    throw new HttpError(409, 'Já existe um Responsável. Use a transferência de responsabilidade na edição de um usuário.');
  }
  validarVinculo(d.role, d.projetoIds);
  if (db.prepare('SELECT 1 FROM usuarios WHERE matricula = ?').get(d.matricula)) {
    throw new HttpError(409, 'Já existe um usuário com esta matrícula.');
  }
  // Regra 2: credenciais geradas automaticamente
  const username = usernameDisponivel(db, gerarUsername(d.nome, d.periodo));
  const senha = gerarSenhaPadrao(d.matricula, d.periodo);

  const criar = db.transaction(() => {
    const { lastInsertRowid } = db.prepare(`
      INSERT INTO usuarios (nome, matricula, cargo, role, username, senha_hash, periodo_entrada)
      VALUES (?, ?, ?, ?, ?, ?, ?)`).run(d.nome, d.matricula, d.cargo, d.role, username, hashSenha(senha), d.periodo);
    salvarVinculos(lastInsertRowid, d.projetoIds);
    return lastInsertRowid;
  });
  const id = criar();
  // As credenciais são exibidas apenas ao Responsável, para repasse ao usuário.
  res.status(201).json({ usuario: buscar(id), credenciais: { username, senha } });
}));

router.put('/:id', permitir('RESPONSAVEL'), rota((req, res) => {
  const id = Number(req.params.id);
  const atual = buscar(id);
  if (!atual) throw new HttpError(404, 'Usuário não encontrado.');
  const d = lerCorpo(req.body || {});
  validarVinculo(d.role, d.projetoIds);
  if (db.prepare('SELECT 1 FROM usuarios WHERE matricula = ? AND id <> ?').get(d.matricula, id)) {
    throw new HttpError(409, 'Já existe um usuário com esta matrícula.');
  }
  const ehProprio = id === req.usuario.id;
  if (ehProprio && d.role !== 'RESPONSAVEL') {
    throw new HttpError(400, 'Para deixar de ser Responsável, transfira a responsabilidade a outro usuário.');
  }
  const transferir = d.role === 'RESPONSAVEL' && !ehProprio;

  db.transaction(() => {
    if (transferir) {
      // Só pode haver 1 Responsável: o atual passa a Administrador.
      db.prepare("UPDATE usuarios SET role = 'ADMIN' WHERE id = ?").run(req.usuario.id);
    }
    db.prepare('UPDATE usuarios SET nome = ?, matricula = ?, cargo = ?, role = ?, periodo_entrada = ? WHERE id = ?')
      .run(d.nome, d.matricula, d.cargo, d.role, d.periodo, id);
    salvarVinculos(id, d.projetoIds);
  })();
  res.json({ usuario: buscar(id), responsabilidadeTransferida: transferir });
}));

/** Regenera username e senha padrão a partir dos dados cadastrais atuais. */
router.post('/:id/redefinir-credenciais', permitir('RESPONSAVEL'), rota((req, res) => {
  const u = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(Number(req.params.id));
  if (!u) throw new HttpError(404, 'Usuário não encontrado.');
  const username = usernameDisponivel(db, gerarUsername(u.nome, u.periodo_entrada), u.id);
  const senha = gerarSenhaPadrao(u.matricula, u.periodo_entrada);
  db.prepare('UPDATE usuarios SET username = ?, senha_hash = ? WHERE id = ?').run(username, hashSenha(senha), u.id);
  res.json({ usuario: buscar(u.id), credenciais: { username, senha } });
}));

router.patch('/:id/ativo', permitir('RESPONSAVEL'), rota((req, res) => {
  const id = Number(req.params.id);
  if (id === req.usuario.id) throw new HttpError(400, 'Você não pode desativar sua própria conta.');
  if (!buscar(id)) throw new HttpError(404, 'Usuário não encontrado.');
  db.prepare('UPDATE usuarios SET ativo = ? WHERE id = ?').run(req.body?.ativo ? 1 : 0, id);
  res.json(buscar(id));
}));

export default router;
