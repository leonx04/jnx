'use client'

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth as useAuthHook } from '../hooks/useAuth';

const AuthContext = createContext<ReturnType<typeof useAuthHook> | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const auth = useAuthHook();
  const [user, setUser] = useState(auth.user);

  useEffect(() => {
    setUser(auth.user);
  }, [auth.user]);

  return (
    <AuthContext.Provider value={{ ...auth, user }}>
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

