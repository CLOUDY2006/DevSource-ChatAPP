import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);
const TOKEN_KEY = 'chat_token';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(null);
  // If a token is already stored we must verify it before deciding what to render.
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem(TOKEN_KEY)));

  const saveSession = useCallback(({ token, user }) => {
    localStorage.setItem(TOKEN_KEY, token);
    setToken(token);
    setUser(user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  // On page load: turn a stored token back into a user.
  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    if (user) return;

    let cancelled = false;
    api
      .get('/auth/me')
      .then(({ data }) => !cancelled && setUser(data.user))
      .catch(() => !cancelled && logout())
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const login = useCallback(
    async (email, password) => saveSession((await api.post('/auth/login', { email, password })).data),
    [saveSession]
  );

  const register = useCallback(
    async (username, email, password) =>
      saveSession((await api.post('/auth/register', { username, email, password })).data),
    [saveSession]
  );

  // Change username and/or avatar; the server returns the updated user.
  const updateProfile = useCallback(async (changes) => {
    const { data } = await api.patch('/users/me', changes);
    setUser(data.user);
  }, []);

  const value = useMemo(
    () => ({ user, token, loading, login, register, logout, updateProfile }),
    [user, token, loading, login, register, logout, updateProfile]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);