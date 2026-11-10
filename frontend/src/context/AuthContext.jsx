import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { authService } from '../services/authService';
import { setUnauthorizedHandler, tokenStorage } from '../services/api';

export const AuthContext = createContext(null);

/** Matriz de permissões (seção 2.1) */
const PERMISSOES = {
  gerenciarUsuarios: ['RESPONSAVEL'],
  gerenciarProjetos: ['RESPONSAVEL'],
  gerenciarEquipamentos: ['RESPONSAVEL', 'ADMIN'],
  solicitar: ['RESPONSAVEL', 'ADMIN', 'PADRAO'],
  vetar: ['RESPONSAVEL'],
  sinalizarUsoTotal: ['RESPONSAVEL', 'ADMIN', 'PADRAO'],
  gerarRelatorios: ['RESPONSAVEL', 'ADMIN'],
};

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [carregando, setCarregando] = useState(true);

  const logout = useCallback(() => {
    tokenStorage.clear();
    setUsuario(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(logout);
    if (!tokenStorage.get()) {
      setCarregando(false);
      return;
    }
    authService.me().then(setUsuario).catch(logout).finally(() => setCarregando(false));
  }, [logout]);

  const login = useCallback(async (username, senha) => {
    const { token, usuario: u } = await authService.login(username, senha);
    tokenStorage.set(token);
    setUsuario(u);
    return u;
  }, []);

  const recarregar = useCallback(() => authService.me().then(setUsuario), []);

  const valor = useMemo(() => ({
    usuario,
    carregando,
    login,
    logout,
    recarregar,
    pode: (acao) => !!usuario && PERMISSOES[acao]?.includes(usuario.role),
    temPerfil: (...roles) => !!usuario && roles.includes(usuario.role),
  }), [usuario, carregando, login, logout, recarregar]);

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}
