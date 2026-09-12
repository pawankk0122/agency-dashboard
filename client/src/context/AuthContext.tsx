import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, setAccessToken } from '../services/api';

export type UserRole = 'ADMIN' | 'PROJECT_MANAGER' | 'DEVELOPER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const initAuth = async () => {
    try {
      const res = await api.post('/auth/refresh');
      setAccessToken(res.data.data.accessToken);
      setToken(res.data.data.accessToken);
      // Fetch session identity
      const meRes = await api.get('/auth/me');
      setUser(meRes.data.data);
    } catch {
      setAccessToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initAuth();
  }, []);

  const login = async (email: string, pass: string) => {
    const res = await api.post('/auth/login', { email, password: pass });
    setAccessToken(res.data.data.accessToken);
    setToken(res.data.data.accessToken);
    setUser(res.data.data.user);
  };

  const logout = async () => {
    await api.post('/auth/logout');
    setAccessToken(null);
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
