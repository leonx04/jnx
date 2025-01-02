'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { isTokenValid, useAuth } from '../hooks/useAuth';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  updateUserInfo: (updatedUser: User) => Promise<void>;
  isLoading: boolean; // Add this line
}

interface User {
  email: string;
  name?: string;
  imageUrl?: string;
  id?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const auth = useAuth();
  const [user, setUser] = useState<User | null>(auth.user);
  const [isLoading, setIsLoading] = useState(true); // Add this line

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');

    if (storedUser && storedToken) {
      const parsedToken = JSON.parse(storedToken);
      if (isTokenValid(parsedToken)) {
        setUser(JSON.parse(storedUser));
      } else {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
    setIsLoading(false); // Add this line
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

  const updateUserInfo = async (updatedUser: User) => {
    await auth.updateUser(updatedUser);
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUserInfo, isLoading }}> {/* Update this line */}
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

