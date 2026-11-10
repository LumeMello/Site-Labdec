import { Router } from 'express';
import db from '../db.js';
import { permitir } from '../middleware/auth.js';
import { rota, HttpError } from '../utils/http.js';
import { concluirReservasExpiradas } from './movimentacoes.js';

const router = Router();
const CATEGORIAS = ['REAGENTE', 'MAQUINA_FIXA', 'MAQUINA_MOVEL', 'EPI', 'VIDRACARIA'];
const SUBCATEGORIAS = ['AGUA_DOCE', 'AGUA_SALGADA', 'SOLO', 'EFLUENTES'];
const ESTADOS = ['FUNCIONAL', 'MANUTENCAO'];

const buscar = (id) => db.prepare('SELECT * FROM equipamentos WHERE id = ?').get(id);

router.get('/', rota((req, res) => {
  const { busca, categoria, estado, reposicao } = req.query;
  const where = [];
  const params = [];
  if (busca) { where.push('(nome LIKE ? OR descricao LIKE ?)'); params.push(`%${busca}%`, `%${busca}%`); }
  if (categoria) { where.push('categoria_principal = ?'); params.push(categoria); }
  if (estado) { where.push('estado = ?'); params.push(estado); }
  if (reposicao === '1') where.push('necessita_reposicao = 1');
  const sql = `SELECT * FROM equipamentos ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY nome`;
  res.json(db.prepare(sql).all(...params));
}));

/** Detalhes + agenda de reservas futuras (máquinas fixas) e patriações em aberto. */
router.get('/:id', rota((req, res) => {
  concluirReservasExpiradas();
  const e = buscar(Number(req.params.id));
  if (!e) throw new HttpError(404, 'Equipamento não encontrado.');
  const agenda = db.prepare(`
    SELECT m.id, m.tipo, m.quantidade, m.data_inicio, m.data_fim, m.status,
           u.nome AS usuario_nome, p.nome AS projeto_nome
    FROM movimentacoes m JOIN usuarios u ON u.id = m.usuario_id JOIN projetos p ON p.id = m.projeto_id
    WHERE m.equipamento_id = ? AND m.status = 'ATIVO' ORDER BY m.data_inicio`).all(e.id);
  res.json({ ...e, agenda });
}));

function lerCorpo(body) {
  const nome = String(body.nome || '').trim();
  const categoria = body.categoria_principal;
  const estado = body.estado || 'FUNCIONAL';
  const total = Number(body.quantidade_total ?? 1);
  const disponivel = Number(body.quantidade_disponivel ?? total);
  const sub = categoria === 'REAGENTE' ? body.subcategoria_reagente || null : null;
  if (!nome) throw new HttpError(400, 'Nome é obrigatório.');
  if (!CATEGORIAS.includes(categoria)) throw new HttpError(400, 'Categoria inválida.');
  if (sub && !SUBCATEGORIAS.includes(sub)) throw new HttpError(400, 'Subcategoria de reagente inválida.');
  if (!ESTADOS.includes(estado)) throw new HttpError(400, 'Estado inválido.');
  if (!Number.isInteger(total) || total < 0 || !Number.isInteger(disponivel) || disponivel < 0) {
    throw new HttpError(400, 'Quantidades devem ser inteiros não negativos.');
  }
  if (disponivel > total) throw new HttpError(400, 'Quantidade disponível não pode exceder a total.');
  return {
    nome, categoria, sub, estado, total, disponivel,
    descricao: body.descricao?.trim() || null,
    localizacao: body.localizacao?.trim() || null,
    reposicao: body.necessita_reposicao ? 1 : 0,
  };
}

router.post('/', permitir('RESPONSAVEL', 'ADMIN'), rota((req, res) => {
  const d = lerCorpo(req.body || {});
  const { lastInsertRowid } = db.prepare(`
    INSERT INTO equipamentos (nome, descricao, localizacao, categoria_principal, subcategoria_reagente, estado,
      quantidade_total, quantidade_disponivel, necessita_reposicao) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(d.nome, d.descricao, d.localizacao, d.categoria, d.sub, d.estado, d.total, d.disponivel, d.reposicao);
  res.status(201).json(buscar(lastInsertRowid));
}));

router.put('/:id', permitir('RESPONSAVEL', 'ADMIN'), rota((req, res) => {
  const id = Number(req.params.id);
  const atual = buscar(id);
  if (!atual) throw new HttpError(404, 'Equipamento não encontrado.');
  const d = lerCorpo(req.body || {});
  if (d.categoria !== atual.categoria_principal &&
      db.prepare("SELECT 1 FROM movimentacoes WHERE equipamento_id = ? AND status = 'ATIVO'").get(id)) {
    throw new HttpError(409, 'Não é possível alterar a categoria com solicitações ativas.');
  }
  db.prepare(`UPDATE equipamentos SET nome = ?, descricao = ?, localizacao = ?, categoria_principal = ?,
    subcategoria_reagente = ?, estado = ?, quantidade_total = ?, quantidade_disponivel = ?, necessita_reposicao = ?
    WHERE id = ?`)
    .run(d.nome, d.descricao, d.localizacao, d.categoria, d.sub, d.estado, d.total, d.disponivel, d.reposicao, id);
  res.json(buscar(id));
}));

/** Qualquer perfil pode sinalizar necessidade de reposição de um item. */
router.post('/:id/sinalizar-reposicao', rota((req, res) => {
  const r = db.prepare('UPDATE equipamentos SET necessita_reposicao = 1 WHERE id = ?').run(Number(req.params.id));
  if (!r.changes) throw new HttpError(404, 'Equipamento não encontrado.');
  res.json(buscar(Number(req.params.id)));
}));

router.delete('/:id', permitir('RESPONSAVEL', 'ADMIN'), rota((req, res) => {
  const id = Number(req.params.id);
  if (db.prepare('SELECT 1 FROM movimentacoes WHERE equipamento_id = ?').get(id)) {
    throw new HttpError(409, 'Item possui histórico de movimentações. Altere o estado em vez de excluir.');
  }
  const r = db.prepare('DELETE FROM equipamentos WHERE id = ?').run(id);
  if (!r.changes) throw new HttpError(404, 'Equipamento não encontrado.');
  res.status(204).end();
}));

export default router;
