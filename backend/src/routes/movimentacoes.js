import { Router } from 'express';
import db from '../db.js';
import { permitir } from '../middleware/auth.js';
import { agoraISO, projetoAtivo } from '../utils/datas.js';
import { rota, HttpError } from '../utils/http.js';

const router = Router();

/** Tipo de movimentação derivado da categoria do item. */
export const tipoPorCategoria = (categoria) =>
  categoria === 'MAQUINA_FIXA' ? 'RESERVA_FIXA' : categoria === 'REAGENTE' ? 'REAGENTE_USO' : 'PATRIACAO_MOVEL';

/** Reservas de máquinas fixas cujo horário já passou são concluídas automaticamente. */
export function concluirReservasExpiradas() {
  db.prepare(`UPDATE movimentacoes SET status = 'CONCLUIDO'
    WHERE tipo = 'RESERVA_FIXA' AND status = 'ATIVO' AND data_fim IS NOT NULL AND data_fim <= ?`).run(agoraISO());
}

const SELECT = `
  SELECT m.*, e.nome AS equipamento_nome, e.categoria_principal,
         u.nome AS usuario_nome, u.username AS usuario_username,
         p.nome AS projeto_nome, p.area_atuacao
  FROM movimentacoes m
  JOIN equipamentos e ON e.id = m.equipamento_id
  JOIN usuarios u ON u.id = m.usuario_id
  JOIN projetos p ON p.id = m.projeto_id`;

const buscar = (id) => db.prepare(`${SELECT} WHERE m.id = ?`).get(id);

const devolverEstoque = (mov) => {
  if (mov.tipo !== 'RESERVA_FIXA') {
    db.prepare('UPDATE equipamentos SET quantidade_disponivel = MIN(quantidade_total, quantidade_disponivel + ?) WHERE id = ?')
      .run(mov.quantidade, mov.equipamento_id);
  }
};

const toISO = (v, campo) => {
  const d = new Date(v);
  if (!v || Number.isNaN(d.getTime())) throw new HttpError(400, `Data inválida: ${campo}.`);
  return d.toISOString();
};

/** Nova solicitação: entra em vigor imediatamente (aprovação imediata, sujeita a veto). */
router.post('/', rota((req, res) => {
  const { equipamento_id, projeto_id } = req.body || {};
  const quantidade = Number(req.body?.quantidade ?? 1);
  const e = db.prepare('SELECT * FROM equipamentos WHERE id = ?').get(Number(equipamento_id));
  if (!e) throw new HttpError(404, 'Item não encontrado.');
  if (e.estado !== 'FUNCIONAL') throw new HttpError(409, 'Item em manutenção não pode ser solicitado.');

  const projeto = db.prepare('SELECT * FROM projetos WHERE id = ?').get(Number(projeto_id));
  if (!projeto) throw new HttpError(400, 'Selecione o projeto ao qual a solicitação está vinculada.');
  if (!projetoAtivo(projeto)) throw new HttpError(400, 'O projeto selecionado não está ativo.');
  const membro = db.prepare('SELECT 1 FROM usuario_projetos WHERE usuario_id = ? AND projeto_id = ?')
    .get(req.usuario.id, projeto.id);
  if (!membro && req.usuario.role === 'PADRAO') throw new HttpError(403, 'Você não integra este projeto.');

  const tipo = tipoPorCategoria(e.categoria_principal);
  let inicio;
  let fim = null;

  const criar = db.transaction(() => {
    if (tipo === 'RESERVA_FIXA') {
      concluirReservasExpiradas();
      inicio = toISO(req.body.data_inicio, 'início');
      fim = toISO(req.body.data_fim, 'fim');
      if (fim <= inicio) throw new HttpError(400, 'O fim da reserva deve ser posterior ao início.');
      if (fim <= agoraISO()) throw new HttpError(400, 'Não é possível reservar um horário no passado.');
      const conflitos = db.prepare(`SELECT COUNT(*) AS n FROM movimentacoes
        WHERE equipamento_id = ? AND tipo = 'RESERVA_FIXA' AND status = 'ATIVO'
          AND data_inicio < ? AND data_fim > ?`).get(e.id, fim, inicio).n;
      if (conflitos >= Math.max(1, e.quantidade_total)) {
        throw new HttpError(409, 'Já existe reserva neste horário. Consulte a agenda do equipamento.');
      }
    } else {
      if (!Number.isInteger(quantidade) || quantidade < 1) throw new HttpError(400, 'Quantidade inválida.');
      const r = db.prepare(`UPDATE equipamentos SET quantidade_disponivel = quantidade_disponivel - ?
        WHERE id = ? AND quantidade_disponivel >= ?`).run(quantidade, e.id, quantidade);
      if (!r.changes) throw new HttpError(409, `Quantidade indisponível (disponível: ${e.quantidade_disponivel}).`);
      inicio = agoraISO();
      fim = req.body.data_fim ? toISO(req.body.data_fim, 'devolução prevista') : null;
    }
    return db.prepare(`INSERT INTO movimentacoes (equipamento_id, usuario_id, projeto_id, tipo, quantidade, data_inicio, data_fim)
      VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .run(e.id, req.usuario.id, projeto.id, tipo, tipo === 'RESERVA_FIXA' ? 1 : quantidade, inicio, fim).lastInsertRowid;
  });
  res.status(201).json(buscar(criar()));
}));

router.get('/minhas', rota((req, res) => {
  concluirReservasExpiradas();
  const { status } = req.query;
  const params = [req.usuario.id];
  let filtro = '';
  if (status) { filtro = 'AND m.status = ?'; params.push(status); }
  res.json(db.prepare(`${SELECT} WHERE m.usuario_id = ? ${filtro} ORDER BY m.criado_em DESC`).all(...params));
}));

/** Painel de auditoria (apenas Responsável). */
router.get('/', permitir('RESPONSAVEL'), rota((req, res) => {
  concluirReservasExpiradas();
  const { status, tipo, busca } = req.query;
  const where = [];
  const params = [];
  if (status) { where.push('m.status = ?'); params.push(status); }
  if (tipo) { where.push('m.tipo = ?'); params.push(tipo); }
  if (busca) {
    where.push('(e.nome LIKE ? OR u.nome LIKE ? OR p.nome LIKE ?)');
    params.push(`%${busca}%`, `%${busca}%`, `%${busca}%`);
  }
  res.json(db.prepare(`${SELECT} ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY m.criado_em DESC`).all(...params));
}));

function exigirAtiva(id, usuario, { somenteDono = true } = {}) {
  const mov = buscar(Number(id));
  if (!mov) throw new HttpError(404, 'Solicitação não encontrada.');
  if (somenteDono && mov.usuario_id !== usuario.id && usuario.role !== 'RESPONSAVEL') {
    throw new HttpError(403, 'Esta solicitação pertence a outro usuário.');
  }
  if (mov.status !== 'ATIVO') throw new HttpError(409, 'Esta solicitação não está mais ativa.');
  return mov;
}

/** Devolução de patriação / cancelamento de reserva pelo próprio usuário. */
router.post('/:id/concluir', rota((req, res) => {
  db.transaction(() => {
    const mov = exigirAtiva(req.params.id, req.usuario);
    devolverEstoque(mov);
    db.prepare("UPDATE movimentacoes SET status = 'CONCLUIDO', data_fim = ? WHERE id = ?")
      .run(mov.tipo === 'RESERVA_FIXA' && mov.data_fim < agoraISO() ? mov.data_fim : agoraISO(), mov.id);
  })();
  res.json(buscar(Number(req.params.id)));
}));

/** Regra 4: sinalizar Uso Total -> necessidade de troca/reposição do item. */
router.post('/:id/uso-total', rota((req, res) => {
  db.transaction(() => {
    const mov = exigirAtiva(req.params.id, req.usuario);
    if (mov.tipo === 'RESERVA_FIXA') throw new HttpError(400, 'Reservas de máquinas fixas não têm uso total.');
    db.prepare("UPDATE movimentacoes SET status = 'USO_TOTAL_SINALIZADO', data_fim = ? WHERE id = ?").run(agoraISO(), mov.id);
    db.prepare('UPDATE equipamentos SET necessita_reposicao = 1 WHERE id = ?').run(mov.equipamento_id);
  })();
  res.json(buscar(Number(req.params.id)));
}));

/** Regra 3: veto posterior, exclusivo do Responsável pelo Laboratório. */
router.post('/:id/vetar', permitir('RESPONSAVEL'), rota((req, res) => {
  const motivo = String(req.body?.motivo || '').trim();
  if (!motivo) throw new HttpError(400, 'Informe o motivo do veto.');
  db.transaction(() => {
    const mov = exigirAtiva(req.params.id, req.usuario, { somenteDono: false });
    devolverEstoque(mov);
    db.prepare(`UPDATE movimentacoes SET status = 'VETADO', vetado_por_responsavel = 1, motivo_veto = ?, data_fim = ?
      WHERE id = ?`).run(motivo, agoraISO(), mov.id);
  })();
  res.json(buscar(Number(req.params.id)));
}));

export default router;
