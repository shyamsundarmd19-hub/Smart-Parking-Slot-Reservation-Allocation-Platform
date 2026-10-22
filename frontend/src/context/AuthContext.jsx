import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('parkcloud_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('parkcloud_token'));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleAuthExpired = () => {
      setUser(null);
      setToken(null);
    };

    window.addEventListener('parkcloud:auth_expired', handleAuthExpired);
    return () => window.removeEventListener('parkcloud:auth_expired', handleAuthExpired);
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await authService.login({ email, password });
      const { access_token, user: loggedUser } = res.data;
      localStorage.setItem('parkcloud_token', access_token);
      localStorage.setItem('parkcloud_user', JSON.stringify(loggedUser));
      setToken(access_token);
      setUser(loggedUser);
      return { success: true, user: loggedUser };
    } catch (err) {
      const msg = err.response?.data?.detail || 'Login failed. Please check your credentials.';
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  const register = async ({ name, email, phone, role, password }) => {
    setLoading(true);
    try {
      const res = await authService.register({ name, email, phone, role, password });
      const { access_token, user: newUser } = res.data;
      localStorage.setItem('parkcloud_token', access_token);
      localStorage.setItem('parkcloud_user', JSON.stringify(newUser));
      setToken(access_token);
      setUser(newUser);
      return { success: true, user: newUser };
    } catch (err) {
      const msg = err.response?.data?.detail || 'Registration failed.';
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('parkcloud_token');
    localStorage.removeItem('parkcloud_user');
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        role: user?.role || 'guest',
        loading,
        login,
        register,
        logout,
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
