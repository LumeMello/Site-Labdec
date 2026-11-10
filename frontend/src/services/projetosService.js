import api from './api';

export const projetosService = {
  listar: (apenasAtivos = false) => api.get('/projetos', apenasAtivos ? { ativos: 1 } : undefined),
  obter: (id) => api.get(`/projetos/${id}`),
  criar: (dados) => api.post('/projetos', dados),
  atualizar: (id, dados) => api.put(`/projetos/${id}`, dados),
  definirMembros: (id, usuario_ids) => api.put(`/projetos/${id}/membros`, { usuario_ids }),
  estender: (id) => api.post(`/projetos/${id}/estender`),
  remover: (id) => api.delete(`/projetos/${id}`),
};
