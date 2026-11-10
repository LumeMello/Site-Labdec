/**
 * Popula o banco com dados iniciais. Uso: npm run seed  (use --reset para recriar do zero)
 * O Responsável inicial é criado com as mesmas regras de credenciais do sistema.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gerarUsername, gerarSenhaPadrao, hashSenha } from './utils/credenciais.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
if (process.argv.includes('--reset')) {
  const base = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'labdec.db');
  for (const f of [base, `${base}-wal`, `${base}-shm`]) fs.rmSync(f, { force: true });
}
const { default: db } = await import('./db.js');

if (db.prepare('SELECT COUNT(*) AS n FROM usuarios').get().n > 0) {
  console.log('Banco já possui dados. Use "npm run seed -- --reset" para recriar.');
  process.exit(0);
}

const ano = new Date().getFullYear();
const credenciais = [];

const criarUsuario = (nome, matricula, cargo, role, periodo) => {
  const username = gerarUsername(nome, periodo);
  const senha = gerarSenhaPadrao(matricula, periodo);
  credenciais.push({ role, username, senha });
  return db.prepare(`INSERT INTO usuarios (nome, matricula, cargo, role, username, senha_hash, periodo_entrada)
    VALUES (?, ?, ?, ?, ?, ?, ?)`).run(nome, matricula, cargo, role, username, hashSenha(senha), periodo).lastInsertRowid;
};

const criarProjeto = (nome, descricao, categoria, area, inicio, fim, pai = null) =>
  db.prepare(`INSERT INTO projetos (nome, descricao, projeto_pai_id, categoria, area_atuacao, data_inicio, fim_previsto)
    VALUES (?, ?, ?, ?, ?, ?, ?)`).run(nome, descricao, pai, categoria, area, inicio, fim).lastInsertRowid;

const vincular = (u, p) => db.prepare('INSERT INTO usuario_projetos VALUES (?, ?)').run(u, p);

const criarItem = (nome, categoria, total, extra = {}) =>
  db.prepare(`INSERT INTO equipamentos (nome, descricao, localizacao, categoria_principal, subcategoria_reagente,
    estado, quantidade_total, quantidade_disponivel) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(nome, extra.descricao || null, extra.local || null, categoria, extra.sub || null,
      extra.estado || 'FUNCIONAL', total, total).lastInsertRowid;

db.transaction(() => {
  const resp = criarUsuario('Maria Souza', '100000001', 'Professora Coordenadora', 'RESPONSAVEL', '2015.1');
  const admin = criarUsuario('Carlos Pereira', '100000002', 'Técnico de Laboratório', 'ADMIN', '2019.2');
  const joao = criarUsuario('João da Silva', '123456789', 'Aluno de Graduação', 'PADRAO', '2024.1');
  const ana = criarUsuario('Ana Oliveira', '987654321', 'Mestranda', 'PADRAO', '2023.2');

  const pAgua = criarProjeto('Monitoramento da Qualidade da Água da Baía de Guanabara',
    'Análises físico-químicas periódicas.', 'INICIACAO_CIENTIFICA', 'AGUA', `${ano - 1}-03-01`, `${ano + 1}-02-28`);
  const pSolo = criarProjeto('Recuperação de Solos Contaminados', null, 'EXTENSAO', 'SOLO', `${ano}-01-15`, `${ano + 1}-12-15`);
  const pSub = criarProjeto('Fitorremediação com espécies nativas', null, 'INICIACAO_CIENTIFICA', 'SOLO',
    `${ano}-04-01`, `${ano + 1}-03-31`, pSolo);
  criarProjeto('Biodigestores para Comunidades', null, 'EXTENSAO', 'ENERGIAS_RENOVAVEIS', `${ano}-02-01`, `${ano + 2}-01-31`);

  vincular(resp, pAgua); vincular(admin, pSolo);
  vincular(joao, pAgua); vincular(ana, pSolo); vincular(ana, pSub);

  criarItem('Espectrofotômetro UV-Vis', 'MAQUINA_FIXA', 1, { local: 'Bancada 1' });
  criarItem('Cromatógrafo Gasoso', 'MAQUINA_FIXA', 1, { local: 'Sala 2', estado: 'MANUTENCAO' });
  criarItem('Autoclave Vertical', 'MAQUINA_FIXA', 1, { local: 'Sala de Esterilização' });
  criarItem('pHmetro Portátil', 'MAQUINA_MOVEL', 4, { local: 'Armário A' });
  criarItem('Sonda Multiparâmetro', 'MAQUINA_MOVEL', 2, { local: 'Armário A' });
  criarItem('Luvas Nitrílicas (caixa)', 'EPI', 20);
  criarItem('Óculos de Proteção', 'EPI', 15);
  criarItem('Béquer 250 mL', 'VIDRACARIA', 30);
  criarItem('Erlenmeyer 500 mL', 'VIDRACARIA', 12);
  criarItem('Kit Reagente Nitrato', 'REAGENTE', 10, { sub: 'AGUA_DOCE' });
  criarItem('Kit Salinidade', 'REAGENTE', 6, { sub: 'AGUA_SALGADA' });
  criarItem('Reagente para Análise de Fósforo no Solo', 'REAGENTE', 8, { sub: 'SOLO' });
  criarItem('Kit DBO/DQO', 'REAGENTE', 5, { sub: 'EFLUENTES' });
})();

console.log('Banco populado. Credenciais iniciais (usuário / senha):');
console.table(credenciais);
