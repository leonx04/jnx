import { auth, database, facebookProvider, githubProvider, googleProvider } from '@/firebaseConfig';
import {
  AuthProvider,
  fetchSignInMethodsForEmail,
  getIdToken,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile
} from 'firebase/auth';
import { get, ref, set, update } from 'firebase/database';
import { useCallback, useEffect, useRef, useState } from 'react';

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

interface UseAuthReturn {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  updateUser: (updatedUser: Partial<User>) => Promise<void>;
  loginWithGoogle: () => Promise<User>;
  loginWithGithub: () => Promise<User>;
  loginWithFacebook: () => Promise<User>;
  getValidToken: () => Promise<string | null>;
}

const TOKEN_REFRESH_MARGIN = 5 * 60 * 1000; // 5 minutes before expiration
const TOKEN_EXPIRATION_TIME = 55 * 60 * 1000; // 55 minutes

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const refreshTokenTimeout = useRef<NodeJS.Timeout | undefined>(undefined);

  const clearRefreshTimeout = useCallback(() => {
    if (refreshTokenTimeout.current) {
      clearTimeout(refreshTokenTimeout.current);
      refreshTokenTimeout.current = undefined;
    }
  }, []);

  const refreshToken = useCallback(async (): Promise<string | null> => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return null;

      const token = await getIdToken(currentUser, true);
      const tokenExpiration = Date.now() + TOKEN_EXPIRATION_TIME;

      setUser(prev => prev ? {
        ...prev,
        accessToken: token,
        tokenExpiration
      } : null);

      return token;
    } catch (error) {
      console.error('Error refreshing token:', error);
      return null;
    }
  }, []);

  const setupTokenRefresh = useCallback(() => {
    clearRefreshTimeout();

    if (user?.tokenExpiration) {
      const timeUntilRefresh = user.tokenExpiration - Date.now() - TOKEN_REFRESH_MARGIN;

      if (timeUntilRefresh > 0) {
        refreshTokenTimeout.current = setTimeout(refreshToken, timeUntilRefresh);
      } else {
        refreshToken();
      }
    }
  }, [user?.tokenExpiration, refreshToken, clearRefreshTimeout]);

  const getValidToken = useCallback(async (): Promise<string | null> => {
    if (!user?.accessToken) return null;

    const now = Date.now();
    if (!user.tokenExpiration || now >= user.tokenExpiration - TOKEN_REFRESH_MARGIN) {
      return refreshToken();
    }

    return user.accessToken;
  }, [user, refreshToken]);

  const updateUserInDatabase = async (
    uid: string,
    userData: Partial<User> & { tokenExpiration?: number }
  ) => {
    const userRef = ref(database, `user/${uid}`);
    const userSnapshot = await get(userRef);
    const dbUser = userSnapshot.val();
    const now = new Date().toISOString();

    if (dbUser) {
      await update(userRef, {
        ...userData,
        updatedAt: now
      });
    } else {
      await set(userRef, {
        ...userData,
        createdAt: now,
        updatedAt: now
      });
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const token = await getIdToken(firebaseUser);
        const tokenExpiration = Date.now() + TOKEN_EXPIRATION_TIME;
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
          accessToken: token,
          tokenExpiration
        };

        await updateUserInDatabase(uid, {
          email: currentUser.email,
          name: currentUser.name,
          imageUrl: currentUser.imageUrl,
          tokenExpiration
        });

        setUser(currentUser);
      } else {
        setUser(null);
        clearRefreshTimeout();
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
      clearRefreshTimeout();
    };
  }, [clearRefreshTimeout]);

  useEffect(() => {
    setupTokenRefresh();
    return clearRefreshTimeout;
  }, [setupTokenRefresh, clearRefreshTimeout]);

  const login = useCallback(async (email: string, password: string): Promise<User> => {
    setLoading(true);
    try {
      const { user: firebaseUser } = await signInWithEmailAndPassword(auth, email, password);
      const token = await getIdToken(firebaseUser);
      const tokenExpiration = Date.now() + TOKEN_EXPIRATION_TIME;
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
        accessToken: token,
        tokenExpiration
      };

      await updateUserInDatabase(uid, {
        email: currentUser.email,
        name: currentUser.name,
        imageUrl: currentUser.imageUrl,
        tokenExpiration
      });

      setUser(currentUser);
      return currentUser;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
      setUser(null);
      clearRefreshTimeout();
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }, [clearRefreshTimeout]);

  const updateUser = useCallback(async (updatedUser: Partial<User>) => {
    if (!auth.currentUser || !user) throw new Error('No authenticated user');

    try {
      await updateProfile(auth.currentUser, {
        displayName: updatedUser.name,
        photoURL: updatedUser.imageUrl,
      });

      const token = await getIdToken(auth.currentUser, true);
      const tokenExpiration = Date.now() + TOKEN_EXPIRATION_TIME;

      await updateUserInDatabase(user.id, {
        ...updatedUser,
        tokenExpiration
      });

      setUser(prev => prev ? {
        ...prev,
        ...updatedUser,
        accessToken: token,
        tokenExpiration,
        updatedAt: new Date().toISOString()
      } : null);
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    }
  }, [user]);

  const handleAuthError = async (error: any): Promise<never> => {
    if (error.code === 'auth/account-exists-with-different-credential') {
      const email = error.customData?.email;
      if (email) {
        const methods = await fetchSignInMethodsForEmail(auth, email);
        if (methods.includes('password')) {
          throw new Error('EMAIL_PASSWORD_ACCOUNT');
        } else if (methods.includes('google.com')) {
          throw new Error('GOOGLE_ACCOUNT');
        } else if (methods.includes('github.com')) {
          throw new Error('GITHUB_ACCOUNT');
        } else if (methods.includes('facebook.com')) {
          throw new Error('FACEBOOK_ACCOUNT');
        }
      }
    }
    throw error;
  };

  const loginWithProvider = useCallback(async (provider: AuthProvider): Promise<User> => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;
      const token = await getIdToken(firebaseUser);
      const tokenExpiration = Date.now() + TOKEN_EXPIRATION_TIME;
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
        accessToken: token,
        tokenExpiration
      };

      await updateUserInDatabase(uid, {
        email: currentUser.email,
        name: currentUser.name,
        imageUrl: currentUser.imageUrl,
        tokenExpiration
      });

      setUser(currentUser);
      return currentUser;
    } catch (error: any) {
      return handleAuthError(error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loginWithGoogle = useCallback(() => loginWithProvider(googleProvider), [loginWithProvider]);
  const loginWithGithub = useCallback(() => loginWithProvider(githubProvider), [loginWithProvider]);
  const loginWithFacebook = useCallback(() => loginWithProvider(facebookProvider), [loginWithProvider]);

  return {
    user,
    loading,
    login,
    logout,
    updateUser,
    loginWithGoogle,
    loginWithGithub,
    loginWithFacebook,
    getValidToken
  };
}