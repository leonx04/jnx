'use client'

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  updateUserImage: (imageUrl: string) => void; // Thêm phương thức này
}

interface User {
  email: string;
  name?: string;
  imageUrl?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const auth = useAuth();
  const [user, setUser] = useState<User | null>(auth.user);

  useEffect(() => {
    const storedUser = sessionStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = async (email: string, password: string) => {
    const loggedInUser = await auth.login(email, password);
    setUser(loggedInUser);
    return loggedInUser;
  };

  const logout = () => {
    auth.logout();
    setUser(null);
  };

  // Phương thức cập nhật ảnh người dùng
  const updateUserImage = (imageUrl: string) => {
    if (user) {
      const updatedUser = { ...user, imageUrl };
      setUser(updatedUser);
      sessionStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUserImage }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};