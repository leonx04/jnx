'use client';

import { auth, database, facebookProvider, githubProvider, googleProvider } from '@/firebaseConfig';
import { onAuthStateChanged, signInWithEmailAndPassword, signInWithPopup, signOut, updateProfile } from 'firebase/auth';
import { get, ref, set } from 'firebase/database';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

interface User {
  id: string;
  email: string;
  name?: string;
  imageUrl?: string;
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
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const uid = firebaseUser.uid;
        const userRef = ref(database, `users/${uid}`);
        const userSnapshot = await get(userRef);
        const dbUser = userSnapshot.val();
        const currentUser: User = {
          id: uid,
          email: firebaseUser.email || '',
          name: dbUser?.name || firebaseUser.displayName || '',
          imageUrl: dbUser?.imageUrl || firebaseUser.photoURL || '',
        };
        setUser(currentUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<User> => {
    setLoading(true);
    try {
      const { user: firebaseUser } = await signInWithEmailAndPassword(auth, email, password);
      const uid = firebaseUser.uid;
      const userRef = ref(database, `users/${uid}`);
      const userSnapshot = await get(userRef);
      const dbUser = userSnapshot.val();
      const currentUser: User = {
        id: uid,
        email: firebaseUser.email || '',
        name: dbUser?.name || firebaseUser.displayName || '',
        imageUrl: dbUser?.imageUrl || firebaseUser.photoURL || '',
      };
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
        await set(ref(database, `users/${user.id}`), { ...user, ...updatedUser });
        setUser((prevUser) => prevUser ? { ...prevUser, ...updatedUser } : null);
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
      const uid = firebaseUser.uid;
      const userRef = ref(database, `users/${uid}`);
      const userSnapshot = await get(userRef);
      const dbUser = userSnapshot.val();
      const currentUser: User = {
        id: uid,
        email: firebaseUser.email || '',
        name: dbUser?.name || firebaseUser.displayName || '',
        imageUrl: dbUser?.imageUrl || firebaseUser.photoURL || '',
      };
      await set(userRef, currentUser);
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
    <AuthContext.Provider value={{ user, loading, login, logout, updateUserInfo, loginWithGoogle, loginWithGithub, loginWithFacebook }}>
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

