import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../api/index.js';
import { tokenStore } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(() => Boolean(tokenStore.get()));

  useEffect(() => {
    if (!tokenStore.get()) return;
    authApi.me()
      .then(setUser)
      .catch((err) => { if (err.status === 401) tokenStore.clear(); })
      .finally(() => setLoading(false));
  }, []);

  const finish = useCallback((res) => {
    tokenStore.set(res.access_token);
    setUser(res.user);
    return res.user;
  }, []);

  const login = useCallback((payload) => authApi.login(payload).then(finish), [finish]);
  const register = useCallback((payload) => authApi.register(payload).then(finish), [finish]);
  const logout = useCallback(() => { tokenStore.clear(); setUser(null); }, []);

  const value = useMemo(() => ({ user, loading, login, register, logout }), [user, loading, login, register, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
