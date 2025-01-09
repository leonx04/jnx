'use client';

import { auth, database, facebookProvider, githubProvider, googleProvider } from '@/firebaseConfig';
import { onAuthStateChanged, signInWithEmailAndPassword, signInWithPopup, signOut, updateProfile } from 'firebase/auth';
import { get, ref, set } from 'firebase/database';
import React, { createContext, useContext, useEffect, useState } from 'react';

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
        const userData = await getUserData(firebaseUser.uid);
        setUser(userData);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getUserData = async (uid: string): Promise<User | null> => {
    const userRef = ref(database, `user/${uid}`);
    const snapshot = await get(userRef);
    if (snapshot.exists()) {
      const userData = snapshot.val();
      return {
        id: uid,
        email: userData.email,
        name: userData.name,
        imageUrl: userData.imageUrl,
      };
    }
    return null;
  };

  const createOrUpdateUser = async (user: User) => {
    const userRef = ref(database, `user/${user.id}`);
    await set(userRef, {
      ...user,
      updatedAt: new Date().toISOString(),
    });
  };

  const login = async (email: string, password: string): Promise<User> => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;
    const user: User = {
      id: firebaseUser.uid,
      email: firebaseUser.email!,
      name: firebaseUser.displayName || undefined,
      imageUrl: firebaseUser.photoURL || undefined,
    };
    await createOrUpdateUser(user);
    return user;
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  const updateUserInfo = async (updatedUser: Partial<User>) => {
    if (!auth.currentUser) throw new Error('No authenticated user');

    try {
      await updateProfile(auth.currentUser, {
        displayName: updatedUser.name,
        photoURL: updatedUser.imageUrl,
      });

      const user = await getUserData(auth.currentUser.uid);
      if (user) {
        const updatedUserData = { ...user, ...updatedUser };
        await createOrUpdateUser(updatedUserData);
        setUser(updatedUserData);
      }
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    }
  };

  const loginWithProvider = async (provider: any): Promise<User> => {
    const result = await signInWithPopup(auth, provider);
    const firebaseUser = result.user;
    const user: User = {
      id: firebaseUser.uid,
      email: firebaseUser.email!,
      name: firebaseUser.displayName || undefined,
      imageUrl: firebaseUser.photoURL || undefined,
    };
    await createOrUpdateUser(user);
    return user;
  };

  const loginWithGoogle = () => loginWithProvider(googleProvider);
  const loginWithGithub = () => loginWithProvider(githubProvider);
  const loginWithFacebook = () => loginWithProvider(facebookProvider);

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

