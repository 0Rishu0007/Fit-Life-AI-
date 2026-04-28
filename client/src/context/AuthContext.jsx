import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

/**
 * Auth provider — manages JWT token, user state, login, register, and logout.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('fitlife_token'));
  const [loading, setLoading] = useState(true);

  // On mount, if token exists, fetch user data
  useEffect(() => {
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async () => {
    try {
      const res = await api.get('/auth/me');
      setUser(res.data.user);
    } catch (err) {
      // Token invalid or expired
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token: newToken, user: userData } = res.data;
    localStorage.setItem('fitlife_token', newToken);
    setToken(newToken);
    setUser(userData);
    return res.data;
  };

  const register = async (name, email, password) => {
    const res = await api.post('/auth/register', { name, email, password });
    const { token: newToken, user: userData } = res.data;
    localStorage.setItem('fitlife_token', newToken);
    setToken(newToken);
    setUser(userData);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('fitlife_token');
    setToken(null);
    setUser(null);
  };

  const updateGoals = async (goals) => {
    const res = await api.put('/auth/goals', goals);
    setUser((prev) => ({ ...prev, goals: res.data.goals }));
    return res.data;
  };

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, register, logout, updateGoals, fetchUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
