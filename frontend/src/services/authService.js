import api from './api';

export const authService = {
  login: (username, senha) => api.post('/auth/login', { username, senha }),
  me: () => api.get('/auth/me'),
};
