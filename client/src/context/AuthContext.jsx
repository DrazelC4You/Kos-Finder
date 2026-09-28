import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('kosfinder_token') || null);
  const [loading, setLoading] = useState(true);

  // Inisialisasi: Periksa token dan muat profil user saat aplikasi pertama dimuat
  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('kosfinder_token');
      const savedUser = localStorage.getItem('kosfinder_user');

      if (savedToken && savedUser) {
        try {
          setUser(JSON.parse(savedUser));
          // Verifikasi ke server via /api/auth/me
          const res = await api.get('/auth/me');
          if (res.data.success) {
            setUser(res.data.data);
            localStorage.setItem('kosfinder_user', JSON.stringify(res.data.data));
          }
        } catch (err) {
          console.error('Sesi token kedaluwarsa:', err);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  // Login handler
  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.success) {
      const { user: userData, token: jwtToken } = res.data.data;
      setToken(jwtToken);
      setUser(userData);
      localStorage.setItem('kosfinder_token', jwtToken);
      localStorage.setItem('kosfinder_user', JSON.stringify(userData));
      return userData;
    }
    throw new Error(res.data.message || 'Login gagal');
  };

  // Register handler
  const register = async (formData) => {
    const res = await api.post('/auth/register', formData);
    if (res.data.success) {
      const { user: userData, token: jwtToken } = res.data.data;
      setToken(jwtToken);
      setUser(userData);
      localStorage.setItem('kosfinder_token', jwtToken);
      localStorage.setItem('kosfinder_user', JSON.stringify(userData));
      return userData;
    }
    throw new Error(res.data.message || 'Registrasi gagal');
  };

  // Logout handler
  const logout = async () => {
    try {
      await api.post('/auth/logout').catch(() => {});
    } finally {
      setToken(null);
      setUser(null);
      localStorage.removeItem('kosfinder_token');
      localStorage.removeItem('kosfinder_user');
    }
  };

  // Update local user state
  const updateUser = (newUserData) => {
    setUser(newUserData);
    localStorage.setItem('kosfinder_user', JSON.stringify(newUserData));
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated: !!user,
    isOwner: user?.role === 'OWNER',
    isTenant: user?.role === 'TENANT',
    isAdmin: user?.role === 'ADMIN'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth harus digunakan di dalam AuthProvider');
  }
  return context;
};
