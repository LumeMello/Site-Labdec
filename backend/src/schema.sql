-- Modelagem relacional do LABDEC (seção 6 do documento de contexto)

CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    matricula TEXT NOT NULL UNIQUE,
    cargo TEXT NOT NULL,
    role TEXT CHECK(role IN ('RESPONSAVEL', 'ADMIN', 'PADRAO')) NOT NULL,
    username TEXT NOT NULL UNIQUE,
    senha_hash TEXT NOT NULL,
    periodo_entrada TEXT NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT 1,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Garante que exista no máximo 1 Responsável pelo Laboratório por vez
CREATE UNIQUE INDEX IF NOT EXISTS idx_usuarios_responsavel_unico
    ON usuarios(role) WHERE role = 'RESPONSAVEL';

CREATE TABLE IF NOT EXISTS projetos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    descricao TEXT NULL,
    projeto_pai_id INTEGER NULL REFERENCES projetos(id) ON DELETE SET NULL,
    categoria TEXT CHECK(categoria IN ('INICIACAO_CIENTIFICA', 'EXTENSAO')) NOT NULL,
    area_atuacao TEXT CHECK(area_atuacao IN ('AGUA', 'SOLO', 'EFLUENTES', 'ENERGIAS_RENOVAVEIS')) NOT NULL,
    data_inicio DATE NOT NULL,
    fim_previsto DATE NOT NULL,
    extendido_um_ano BOOLEAN DEFAULT 0,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS usuario_projetos (
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    projeto_id INTEGER NOT NULL REFERENCES projetos(id) ON DELETE CASCADE,
    PRIMARY KEY (usuario_id, projeto_id)
);

CREATE TABLE IF NOT EXISTS equipamentos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    descricao TEXT NULL,
    localizacao TEXT NULL,
    categoria_principal TEXT CHECK(categoria_principal IN ('REAGENTE', 'MAQUINA_FIXA', 'MAQUINA_MOVEL', 'EPI', 'VIDRACARIA')) NOT NULL,
    subcategoria_reagente TEXT CHECK(subcategoria_reagente IS NULL OR subcategoria_reagente IN ('AGUA_DOCE', 'AGUA_SALGADA', 'SOLO', 'EFLUENTES')),
    estado TEXT CHECK(estado IN ('FUNCIONAL', 'MANUTENCAO')) DEFAULT 'FUNCIONAL',
    quantidade_total INTEGER NOT NULL DEFAULT 1 CHECK(quantidade_total >= 0),
    quantidade_disponivel INTEGER NOT NULL DEFAULT 1 CHECK(quantidade_disponivel >= 0),
    necessita_reposicao BOOLEAN DEFAULT 0
);

CREATE TABLE IF NOT EXISTS movimentacoes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    equipamento_id INTEGER NOT NULL REFERENCES equipamentos(id),
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
    projeto_id INTEGER NOT NULL REFERENCES projetos(id),
    tipo TEXT CHECK(tipo IN ('RESERVA_FIXA', 'PATRIACAO_MOVEL', 'REAGENTE_USO')) NOT NULL,
    quantidade INTEGER DEFAULT 1,
    data_inicio DATETIME NOT NULL,
    data_fim DATETIME NULL,
    status TEXT CHECK(status IN ('ATIVO', 'CONCLUIDO', 'USO_TOTAL_SINALIZADO', 'VETADO')) DEFAULT 'ATIVO',
    vetado_por_responsavel BOOLEAN DEFAULT 0,
    motivo_veto TEXT NULL,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_mov_equipamento ON movimentacoes(equipamento_id, status);
CREATE INDEX IF NOT EXISTS idx_mov_usuario ON movimentacoes(usuario_id, status);
