'use client';

import React, { createContext, useContext } from 'react';
import { useAuth } from '@/app/hooks/useAuth';

interface User {
  id: string;
  email: string;
  name?: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
  accessToken?: string;
  tokenExpiration?: number;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  updateUserInfo: (updatedUser: Partial<User>) => Promise<void>;
  loginWithGoogle: () => Promise<User>;
  loginWithGithub: () => Promise<User>;
  loginWithFacebook: () => Promise<User>;
  getValidToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    user,
    loading,
    login,
    logout,
    updateUser: updateUserInfo,
    loginWithGoogle,
    loginWithGithub,
    loginWithFacebook,
    getValidToken
  } = useAuth();

  const value = {
    user,
    loading,
    login,
    logout,
    updateUserInfo,
    loginWithGoogle,
    loginWithGithub,
    loginWithFacebook,
    getValidToken
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};