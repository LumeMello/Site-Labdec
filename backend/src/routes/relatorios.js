import { Router } from 'express';
import db from '../db.js';
import { permitir } from '../middleware/auth.js';
import { rota } from '../utils/http.js';
import { concluirReservasExpiradas } from './movimentacoes.js';

const router = Router();
router.use(permitir('RESPONSAVEL', 'ADMIN'));

/** Relatório 1: acervo, quantidades, estado e indicador de reposição. */
router.get('/acervo', rota((req, res) => {
  const itens = db.prepare('SELECT * FROM equipamentos ORDER BY categoria_principal, nome').all();
  const porCategoria = db.prepare(`
    SELECT categoria_principal AS categoria, COUNT(*) AS itens,
           SUM(quantidade_total) AS total, SUM(quantidade_disponivel) AS disponivel,
           SUM(estado = 'MANUTENCAO') AS em_manutencao, SUM(necessita_reposicao) AS reposicao
    FROM equipamentos GROUP BY categoria_principal ORDER BY categoria_principal`).all();
  res.json({
    gerado_em: new Date().toISOString(),
    resumo: {
      itens: itens.length,
      funcionais: itens.filter((i) => i.estado === 'FUNCIONAL').length,
      em_manutencao: itens.filter((i) => i.estado === 'MANUTENCAO').length,
      alertas_reposicao: itens.filter((i) => i.necessita_reposicao).length,
    },
    porCategoria,
    itens,
    alertas: itens.filter((i) => i.necessita_reposicao),
  });
}));

// Métricas comuns agregadas sobre as movimentações do ano
const METRICAS = `
  COUNT(m.id) AS solicitacoes,
  COALESCE(SUM(m.tipo = 'RESERVA_FIXA'), 0) AS reservas,
  COALESCE(SUM(m.tipo = 'PATRIACAO_MOVEL'), 0) AS patriacoes,
  COALESCE(SUM(CASE WHEN m.tipo = 'REAGENTE_USO' THEN m.quantidade ELSE 0 END), 0) AS reagentes_consumidos,
  COALESCE(SUM(m.status = 'USO_TOTAL_SINALIZADO'), 0) AS usos_totais,
  COALESCE(SUM(m.status = 'VETADO'), 0) AS vetos,
  ROUND(COALESCE(SUM(CASE WHEN m.tipo = 'RESERVA_FIXA' AND m.status <> 'VETADO'
    THEN MAX(0, (julianday(m.data_fim) - julianday(m.data_inicio)) * 24) ELSE 0 END), 0), 1) AS horas_maquina`;

/** Relatório 2: uso anual por projeto, por usuário e por área de atuação. */
router.get('/uso-anual', rota((req, res) => {
  concluirReservasExpiradas();
  const ano = String(Number(req.query.ano) || new Date().getFullYear());
  const join = `LEFT JOIN movimentacoes m ON m.%COL% AND strftime('%Y', m.data_inicio) = ?`;

  const porProjeto = db.prepare(`
    SELECT p.id, p.nome, p.categoria, p.area_atuacao, ${METRICAS}
    FROM projetos p ${join.replace('%COL%', 'projeto_id = p.id')}
    GROUP BY p.id ORDER BY solicitacoes DESC, p.nome`).all(ano);

  const porUsuario = db.prepare(`
    SELECT u.id, u.nome, u.username, u.role, ${METRICAS}
    FROM usuarios u ${join.replace('%COL%', 'usuario_id = u.id')}
    GROUP BY u.id ORDER BY solicitacoes DESC, u.nome`).all(ano);

  const porArea = db.prepare(`
    SELECT a.area AS area_atuacao, ${METRICAS}
    FROM (SELECT 'AGUA' AS area UNION ALL SELECT 'SOLO' UNION ALL SELECT 'EFLUENTES' UNION ALL SELECT 'ENERGIAS_RENOVAVEIS') a
    LEFT JOIN projetos p ON p.area_atuacao = a.area
    ${join.replace('%COL%', 'projeto_id = p.id')}
    GROUP BY a.area`).all(ano);

  const itensMaisUsados = db.prepare(`
    SELECT e.id, e.nome, e.categoria_principal, COUNT(*) AS solicitacoes, SUM(m.quantidade) AS quantidade
    FROM movimentacoes m JOIN equipamentos e ON e.id = m.equipamento_id
    WHERE strftime('%Y', m.data_inicio) = ? AND m.status <> 'VETADO'
    GROUP BY e.id ORDER BY solicitacoes DESC LIMIT 10`).all(ano);

  const historico = db.prepare(`
    SELECT m.id, m.tipo, m.status, m.quantidade, m.data_inicio, m.data_fim, m.motivo_veto,
           e.nome AS equipamento_nome, u.nome AS usuario_nome, p.nome AS projeto_nome, p.area_atuacao
    FROM movimentacoes m
    JOIN equipamentos e ON e.id = m.equipamento_id JOIN usuarios u ON u.id = m.usuario_id
    JOIN projetos p ON p.id = m.projeto_id
    WHERE strftime('%Y', m.data_inicio) = ? ORDER BY m.data_inicio DESC`).all(ano);

  const anos = db.prepare(`SELECT DISTINCT strftime('%Y', data_inicio) AS ano FROM movimentacoes ORDER BY ano DESC`)
    .all().map((r) => r.ano);

  res.json({ ano, anos, porProjeto, porUsuario, porArea, itensMaisUsados, historico });
}));

export default router;
