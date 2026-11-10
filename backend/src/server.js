import express from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import './db.js';
import { autenticar } from './middleware/auth.js';
import authRoutes from './routes/auth.js';
import usuariosRoutes from './routes/usuarios.js';
import projetosRoutes from './routes/projetos.js';
import equipamentosRoutes from './routes/equipamentos.js';
import movimentacoesRoutes from './routes/movimentacoes.js';
import relatoriosRoutes from './routes/relatorios.js';

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN || true }));
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', autenticar, usuariosRoutes);
app.use('/api/projetos', autenticar, projetosRoutes);
app.use('/api/equipamentos', autenticar, equipamentosRoutes);
app.use('/api/movimentacoes', autenticar, movimentacoesRoutes);
app.use('/api/relatorios', autenticar, relatoriosRoutes);
app.use('/api', (req, res) => res.status(404).json({ erro: 'Rota não encontrada.' }));

// Em produção, serve o build do frontend (npm run build)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dist = path.join(__dirname, '..', '..', 'frontend', 'dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get('*', (req, res) => res.sendFile(path.join(dist, 'index.html')));
} else {
  app.get('/', (req, res) => res.type('html').send(`
    <h2>API LABDEC funcionando</h2>
    <p>O site ainda não foi compilado. Escolha uma opção:</p>
    <ul>
      <li>Desenvolvimento: pare este servidor e rode <code>npm run dev</code>; depois abra <a href="http://localhost:5173">http://localhost:5173</a>.</li>
      <li>Produção: rode <code>npm run build</code> e depois <code>npm start</code> de novo.</li>
    </ul>`));
}

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.status) return res.status(err.status).json({ erro: err.message });
  if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') return res.status(409).json({ erro: 'Registro duplicado.' });
  console.error(err);
  res.status(500).json({ erro: 'Erro interno do servidor.' });
});

const PORT = Number(process.env.PORT) || 3001;
app.listen(PORT, () => console.log(`API LABDEC em http://localhost:${PORT}`));
