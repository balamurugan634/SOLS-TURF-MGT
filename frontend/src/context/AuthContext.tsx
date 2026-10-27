import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api, getAuthToken, getStoredUser, removeAuthToken } from '../services/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  mustChangePassword: boolean;
  login: (credentials: { email: string; password: string; role?: string }) => Promise<User>;
  register: (formData: { name: string; email: string; phone: string; password: string }) => Promise<User>;
  logout: () => void;
  quickLogin: (roleKey: 'admin' | 'owner' | 'new_owner' | 'customer') => Promise<User>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(getStoredUser());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchCurrentUser = async () => {
    const token = getAuthToken();
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    try {
      const userData = await api.getMe();
      setUser(userData);
    } catch (err) {
      console.warn('Session expired or invalid token:', err);
      removeAuthToken();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (credentials: { email: string; password: string; role?: string }) => {
    setIsLoading(true);
    try {
      const res = await api.login(credentials);
      setUser(res.user);
      return res.user;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (formData: { name: string; email: string; phone: string; password: string }) => {
    setIsLoading(true);
    try {
      const res = await api.registerCustomer(formData);
      setUser(res.user);
      return res.user;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    api.logout();
    setUser(null);
  };

  const quickLogin = async (roleKey: 'admin' | 'owner' | 'new_owner' | 'customer') => {
    let credentials = { email: '', password: '' };
    switch (roleKey) {
      case 'admin':
        credentials = { email: 'admin@turfhub.com', password: 'admin123' };
        break;
      case 'owner':
        credentials = { email: 'owner.greenfield@turfhub.com', password: 'owner123' };
        break;
      case 'new_owner':
        // Demonstrates mandatory first-login password change!
        credentials = { email: 'newowner@turfhub.com', password: 'tempPass#2026' };
        break;
      case 'customer':
        credentials = { email: 'john.doe@example.com', password: 'customer123' };
        break;
    }
    return login(credentials);
  };

  const refreshUser = async () => {
    await fetchCurrentUser();
  };

  const mustChangePassword = Boolean(user && user.must_change_password);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        mustChangePassword,
        login,
        register,
        logout,
        quickLogin,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
