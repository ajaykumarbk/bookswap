import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api, getAuthToken, setAuthToken, removeAuthToken } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  googleLogin: (email: string, name?: string, picture?: string) => Promise<void>;
  register: (body: any) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(getAuthToken());
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadUser() {
      if (token) {
        try {
          const res = await api.getCurrentUser();
          setUser(res.user);
        } catch (err) {
          console.error('Session restore failed:', err);
          removeAuthToken();
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    }
    loadUser();
  }, [token]);

  const login = async (email: string, pass: string) => {
    const res = await api.login({ email, password: pass });
    setAuthToken(res.token);
    setToken(res.token);
    setUser(res.user);
  };

  const googleLogin = async (email: string, name?: string, picture?: string) => {
    const res = await api.googleLogin({ email, name, picture });
    setAuthToken(res.token);
    setToken(res.token);
    setUser(res.user);
  };

  const register = async (body: any) => {
    const res = await api.register(body);
    setAuthToken(res.token);
    setToken(res.token);
    setUser(res.user);
  };

  const logout = () => {
    removeAuthToken();
    setToken(null);
    setUser(null);
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, googleLogin, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
