import { Router } from 'express';
import db from '../db.js';
import { permitir } from '../middleware/auth.js';
import { fimEfetivo, projetoAtivo } from '../utils/datas.js';
import { rota, HttpError } from '../utils/http.js';

const router = Router();
const CATEGORIAS = ['INICIACAO_CIENTIFICA', 'EXTENSAO'];
const AREAS = ['AGUA', 'SOLO', 'EFLUENTES', 'ENERGIAS_RENOVAVEIS'];
const DATA = /^\d{4}-\d{2}-\d{2}$/;

const membrosDe = db.prepare(`
  SELECT u.id, u.nome, u.username, u.cargo, u.role FROM usuarios u
  JOIN usuario_projetos up ON up.usuario_id = u.id
  WHERE up.projeto_id = ? AND u.ativo = 1 ORDER BY u.nome`);

const enriquecer = (p) => ({
  ...p,
  fim_efetivo: fimEfetivo(p),
  ativo: projetoAtivo(p),
  pode_estender: p.categoria === 'INICIACAO_CIENTIFICA' && !p.extendido_um_ano,
  membros: membrosDe.all(p.id),
});

const buscar = (id) => {
  const p = db.prepare(`
    SELECT p.*, pai.nome AS projeto_pai_nome FROM projetos p
    LEFT JOIN projetos pai ON pai.id = p.projeto_pai_id WHERE p.id = ?`).get(id);
  return p && enriquecer(p);
};

function lerCorpo(body, idAtual = null) {
  const nome = String(body.nome || '').trim();
  const descricao = body.descricao ? String(body.descricao).trim() : null;
  const { categoria, area_atuacao, data_inicio, fim_previsto } = body;
  const pai = body.projeto_pai_id ? Number(body.projeto_pai_id) : null;
  if (!nome) throw new HttpError(400, 'Nome do projeto é obrigatório.');
  if (!CATEGORIAS.includes(categoria)) throw new HttpError(400, 'Categoria inválida.');
  if (!AREAS.includes(area_atuacao)) throw new HttpError(400, 'Área de atuação inválida.');
  if (!DATA.test(data_inicio || '') || !DATA.test(fim_previsto || '')) throw new HttpError(400, 'Datas inválidas.');
  if (fim_previsto < data_inicio) throw new HttpError(400, 'O fim previsto deve ser posterior ao início.');
  if (pai) {
    if (pai === idAtual) throw new HttpError(400, 'Um projeto não pode ser pai de si mesmo.');
    if (!db.prepare('SELECT 1 FROM projetos WHERE id = ?').get(pai)) throw new HttpError(400, 'Projeto pai inexistente.');
  }
  return { nome, descricao, categoria, area_atuacao, data_inicio, fim_previsto, pai };
}

router.get('/', rota((req, res) => {
  const lista = db.prepare(`
    SELECT p.*, pai.nome AS projeto_pai_nome FROM projetos p
    LEFT JOIN projetos pai ON pai.id = p.projeto_pai_id ORDER BY p.nome`).all().map(enriquecer);
  res.json(req.query.ativos === '1' ? lista.filter((p) => p.ativo) : lista);
}));

router.get('/:id', rota((req, res) => {
  const p = buscar(Number(req.params.id));
  if (!p) throw new HttpError(404, 'Projeto não encontrado.');
  res.json(p);
}));

router.post('/', permitir('RESPONSAVEL'), rota((req, res) => {
  const d = lerCorpo(req.body || {});
  const { lastInsertRowid } = db.prepare(`
    INSERT INTO projetos (nome, descricao, projeto_pai_id, categoria, area_atuacao, data_inicio, fim_previsto)
    VALUES (?, ?, ?, ?, ?, ?, ?)`).run(d.nome, d.descricao, d.pai, d.categoria, d.area_atuacao, d.data_inicio, d.fim_previsto);
  res.status(201).json(buscar(lastInsertRowid));
}));

router.put('/:id', permitir('RESPONSAVEL'), rota((req, res) => {
  const id = Number(req.params.id);
  const atual = buscar(id);
  if (!atual) throw new HttpError(404, 'Projeto não encontrado.');
  const d = lerCorpo(req.body || {}, id);
  if (atual.extendido_um_ano && d.categoria !== 'INICIACAO_CIENTIFICA') {
    throw new HttpError(400, 'Projeto já estendido não pode deixar de ser Iniciação Científica.');
  }
  db.prepare(`UPDATE projetos SET nome = ?, descricao = ?, projeto_pai_id = ?, categoria = ?, area_atuacao = ?,
    data_inicio = ?, fim_previsto = ? WHERE id = ?`)
    .run(d.nome, d.descricao, d.pai, d.categoria, d.area_atuacao, d.data_inicio, d.fim_previsto, id);
  res.json(buscar(id));
}));

/** Define os integrantes do projeto, respeitando o vínculo obrigatório dos Usuários Padrão. */
router.put('/:id/membros', permitir('RESPONSAVEL'), rota((req, res) => {
  const id = Number(req.params.id);
  if (!buscar(id)) throw new HttpError(404, 'Projeto não encontrado.');
  const novos = new Set((req.body?.usuario_ids || []).map(Number));
  const atuais = db.prepare('SELECT usuario_id FROM usuario_projetos WHERE projeto_id = ?').all(id).map((r) => r.usuario_id);
  const removidos = atuais.filter((u) => !novos.has(u));

  const outrosAtivos = db.prepare(`
    SELECT p.* FROM projetos p JOIN usuario_projetos up ON up.projeto_id = p.id
    WHERE up.usuario_id = ? AND p.id <> ?`);
  for (const uid of removidos) {
    const u = db.prepare('SELECT nome, role, ativo FROM usuarios WHERE id = ?').get(uid);
    if (u.role === 'PADRAO' && u.ativo && !outrosAtivos.all(uid, id).some(projetoAtivo)) {
      throw new HttpError(400, `${u.nome} ficaria sem projeto ativo. Vincule-o a outro projeto antes de removê-lo.`);
    }
  }
  db.transaction(() => {
    db.prepare('DELETE FROM usuario_projetos WHERE projeto_id = ?').run(id);
    const ins = db.prepare('INSERT INTO usuario_projetos (usuario_id, projeto_id) SELECT id, ? FROM usuarios WHERE id = ?');
    for (const uid of novos) ins.run(id, uid);
  })();
  res.json(buscar(id));
}));

/** Regra 5: projetos de IC podem ser estendidos por +1 ano sobre o fim previsto original. */
router.post('/:id/estender', permitir('RESPONSAVEL'), rota((req, res) => {
  const p = buscar(Number(req.params.id));
  if (!p) throw new HttpError(404, 'Projeto não encontrado.');
  if (p.categoria !== 'INICIACAO_CIENTIFICA') throw new HttpError(400, 'Apenas projetos de Iniciação Científica podem ser estendidos.');
  if (p.extendido_um_ano) throw new HttpError(400, 'Este projeto já foi estendido por 1 ano.');
  db.prepare('UPDATE projetos SET extendido_um_ano = 1 WHERE id = ?').run(p.id);
  res.json(buscar(p.id));
}));

router.delete('/:id', permitir('RESPONSAVEL'), rota((req, res) => {
  const id = Number(req.params.id);
  if (db.prepare('SELECT 1 FROM movimentacoes WHERE projeto_id = ?').get(id)) {
    throw new HttpError(409, 'Projeto possui histórico de movimentações e não pode ser excluído.');
  }
  const padroesSoNeste = db.prepare(`
    SELECT u.id, u.nome FROM usuarios u JOIN usuario_projetos up ON up.usuario_id = u.id
    WHERE up.projeto_id = ? AND u.role = 'PADRAO' AND u.ativo = 1`).all(id)
    .filter((u) => !db.prepare(`SELECT p.* FROM projetos p JOIN usuario_projetos up ON up.projeto_id = p.id
      WHERE up.usuario_id = ? AND p.id <> ?`).all(u.id, id).some(projetoAtivo));
  if (padroesSoNeste.length) {
    throw new HttpError(409, `Os usuários ${padroesSoNeste.map((u) => u.nome).join(', ')} ficariam sem projeto ativo.`);
  }
  const r = db.prepare('DELETE FROM projetos WHERE id = ?').run(id);
  if (!r.changes) throw new HttpError(404, 'Projeto não encontrado.');
  res.status(204).end();
}));

export default router;
