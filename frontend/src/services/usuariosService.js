import api from './api';

export const usuariosService = {
  listar: () => api.get('/usuarios'),
  criar: (dados) => api.post('/usuarios', dados),
  atualizar: (id, dados) => api.put(`/usuarios/${id}`, dados),
  redefinirCredenciais: (id) => api.post(`/usuarios/${id}/redefinir-credenciais`),
  definirAtivo: (id, ativo) => api.patch(`/usuarios/${id}/ativo`, { ativo }),
};
