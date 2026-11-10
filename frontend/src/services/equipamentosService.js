import api from './api';

export const equipamentosService = {
  listar: (filtros) => api.get('/equipamentos', filtros),
  obter: (id) => api.get(`/equipamentos/${id}`),
  criar: (dados) => api.post('/equipamentos', dados),
  atualizar: (id, dados) => api.put(`/equipamentos/${id}`, dados),
  remover: (id) => api.delete(`/equipamentos/${id}`),
  sinalizarReposicao: (id) => api.post(`/equipamentos/${id}/sinalizar-reposicao`),
};

export const movimentacoesService = {
  solicitar: (dados) => api.post('/movimentacoes', dados),
  minhas: (filtros) => api.get('/movimentacoes/minhas', filtros),
  todas: (filtros) => api.get('/movimentacoes', filtros),
  concluir: (id) => api.post(`/movimentacoes/${id}/concluir`),
  usoTotal: (id) => api.post(`/movimentacoes/${id}/uso-total`),
  vetar: (id, motivo) => api.post(`/movimentacoes/${id}/vetar`, { motivo }),
};

export const relatoriosService = {
  acervo: () => api.get('/relatorios/acervo'),
  usoAnual: (ano) => api.get('/relatorios/uso-anual', { ano }),
};
