import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/api';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      setLoading(true);
      const savedUserStr = await AsyncStorage.getItem('user');
      const token = await AsyncStorage.getItem('accessToken');

      if (savedUserStr && token) {
        setUser(JSON.parse(savedUserStr));
        // Verify with backend
        try {
          const res = await authService.getCurrentUser();
          if (res?.data?.user) {
            setUser(res.data.user);
            await AsyncStorage.setItem('user', JSON.stringify(res.data.user));
          }
        } catch (err) {
          console.log('Verify user token error:', err.message);
        }
      }
    } catch (e) {
      console.error('Check auth error:', e);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const res = await authService.login(email, password);
    if (res?.data) {
      const { user: userData, accessToken, refreshToken } = res.data;
      setUser(userData);
      await AsyncStorage.setItem('accessToken', accessToken);
      await AsyncStorage.setItem('refreshToken', refreshToken);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      return { success: true, user: userData };
    }
    return { success: false, error: 'Login failed' };
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (e) {
      console.log('Logout error:', e.message);
    } finally {
      setUser(null);
      try {
        if (typeof AsyncStorage.multiRemove === 'function') {
          await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
        } else {
          await AsyncStorage.removeItem('accessToken');
          await AsyncStorage.removeItem('refreshToken');
          await AsyncStorage.removeItem('user');
        }
      } catch (err) {
        console.error('Storage clear error:', err);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
