import { useCallback, useEffect, useMemo, useState } from 'react';
import api, { setUnauthorizedHandler } from '../api/client';
import { AuthContext } from './auth';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  // true until the first "who am I" request has answered
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await api.get('/users/me');
      setUser(data.data.user);
      return data.data.user;
    } catch (error) {
      // only a 401 means "not logged in"; a network blip must not end the session in the UI
      if (error.response?.status === 401) setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => setUser(null));
    refreshUser().finally(() => setLoading(false));
  }, [refreshUser]);

  // throws on failure so the form can show the server's message
  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/users/login', { email, password });
    setUser(data.data.user);
    return data.data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.get('/users/logout');
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, logout, refreshUser, updateUser: setUser }),
    [user, loading, login, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
