'use client';

import { auth, database, facebookProvider, githubProvider, googleProvider } from '@/firebaseConfig';
import {
  getIdToken,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile
} from 'firebase/auth';
import { get, ref, set, update } from 'firebase/database';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

interface User {
  id: string;
  email: string;
  name?: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
  accessToken?: string;
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
  refreshToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshToken = useCallback(async (): Promise<string | null> => {
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        const token = await getIdToken(currentUser, true);
        setUser(prev => prev ? { ...prev, accessToken: token } : null);
        return token;
      }
      return null;
    } catch (error) {
      console.error('Error refreshing token:', error);
      return null;
    }
  }, []);

  useEffect(() => {
    let tokenRefreshInterval: NodeJS.Timeout;

    const setupTokenRefresh = () => {
      // Refresh token every 55 minutes (Firebase tokens expire in 1 hour)
      tokenRefreshInterval = setInterval(refreshToken, 55 * 60 * 1000);
    };

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const uid = firebaseUser.uid;
        const token = await getIdToken(firebaseUser);
        const userRef = ref(database, `user/${uid}`);
        const userSnapshot = await get(userRef);
        const dbUser = userSnapshot.val();
        const currentUser: User = {
          id: uid,
          email: firebaseUser.email || '',
          name: dbUser?.name || firebaseUser.displayName || '',
          imageUrl: dbUser?.imageUrl || firebaseUser.photoURL || '',
          createdAt: dbUser?.createdAt || new Date().toISOString(),
          updatedAt: dbUser?.updatedAt || new Date().toISOString(),
          accessToken: token
        };
        setUser(currentUser);
        setupTokenRefresh();
      } else {
        setUser(null);
        if (tokenRefreshInterval) {
          clearInterval(tokenRefreshInterval);
        }
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
      if (tokenRefreshInterval) {
        clearInterval(tokenRefreshInterval);
      }
    };
  }, [refreshToken]);

  const login = useCallback(async (email: string, password: string): Promise<User> => {
    setLoading(true);
    try {
      const { user: firebaseUser } = await signInWithEmailAndPassword(auth, email, password);
      const token = await getIdToken(firebaseUser);
      const uid = firebaseUser.uid;
      const userRef = ref(database, `user/${uid}`);
      const userSnapshot = await get(userRef);
      const dbUser = userSnapshot.val();
      const currentUser: User = {
        id: uid,
        email: firebaseUser.email || '',
        name: dbUser?.name || firebaseUser.displayName || '',
        imageUrl: dbUser?.imageUrl || firebaseUser.photoURL || '',
        createdAt: dbUser?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        accessToken: token
      };
      await update(userRef, { updatedAt: currentUser.updatedAt });
      setUser(currentUser);
      return currentUser;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateUserInfo = useCallback(async (updatedUser: Partial<User>): Promise<void> => {
    setLoading(true);
    try {
      if (user && auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: updatedUser.name,
          photoURL: updatedUser.imageUrl,
        });
        const userRef = ref(database, `user/${user.id}`);
        const updates = {
          ...updatedUser,
          updatedAt: new Date().toISOString(),
        };
        await update(userRef, updates);
        setUser((prevUser) => prevUser ? { ...prevUser, ...updates } : null);
      }
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const loginWithProvider = useCallback(async (provider: any): Promise<User> => {
    setLoading(true);
    try {
      const { user: firebaseUser } = await signInWithPopup(auth, provider);
      const token = await getIdToken(firebaseUser);
      const uid = firebaseUser.uid;
      const userRef = ref(database, `user/${uid}`);
      const userSnapshot = await get(userRef);
      const dbUser = userSnapshot.val();
      const now = new Date().toISOString();
      const currentUser: User = {
        id: uid,
        email: firebaseUser.email || '',
        name: dbUser?.name || firebaseUser.displayName || '',
        imageUrl: dbUser?.imageUrl || firebaseUser.photoURL || '',
        createdAt: dbUser?.createdAt || now,
        updatedAt: now,
        accessToken: token
      };
      if (dbUser) {
        await update(userRef, {
          email: currentUser.email,
          name: currentUser.name,
          imageUrl: currentUser.imageUrl,
          updatedAt: currentUser.updatedAt,
        });
      } else {
        await set(userRef, currentUser);
      }
      setUser(currentUser);
      return currentUser;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const loginWithGoogle = useCallback(() => loginWithProvider(googleProvider), [loginWithProvider]);
  const loginWithGithub = useCallback(() => loginWithProvider(githubProvider), [loginWithProvider]);
  const loginWithFacebook = useCallback(() => loginWithProvider(facebookProvider), [loginWithProvider]);

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      logout,
      updateUserInfo,
      loginWithGoogle,
      loginWithGithub,
      loginWithFacebook,
      refreshToken
    }}>
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