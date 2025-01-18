import { auth, database, facebookProvider, githubProvider, googleProvider } from '@/lib/firebaseConfig';
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

const LOCAL_STORAGE_TOKEN_KEY = 'auth_token_expiration';

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

  const handleLogout = useCallback(async () => {
    try {
      await signOut(auth);
      setUser(null);
      clearRefreshTimeout();
      localStorage.removeItem(LOCAL_STORAGE_TOKEN_KEY);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }, [clearRefreshTimeout]);

  const isTokenExpired = useCallback((expiration?: number): boolean => {
    if (!expiration) return true;
    return Date.now() >= expiration - TOKEN_REFRESH_MARGIN;
  }, []);

  const refreshToken = useCallback(async (): Promise<string | null> => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        await handleLogout();
        return null;
      }

      const token = await getIdToken(currentUser, true);
      const tokenExpiration = Date.now() + TOKEN_EXPIRATION_TIME;

      // Store token expiration in localStorage
      localStorage.setItem(LOCAL_STORAGE_TOKEN_KEY, tokenExpiration.toString());

      setUser(prev => prev ? {
        ...prev,
        accessToken: token,
        tokenExpiration
      } : null);

      return token;
    } catch (error) {
      console.error('Error refreshing token:', error);
      await handleLogout();
      return null;
    }
  }, [handleLogout]);

  const setupTokenRefresh = useCallback(() => {
    clearRefreshTimeout();

    if (user?.tokenExpiration) {
      const timeUntilRefresh = user.tokenExpiration - Date.now() - TOKEN_REFRESH_MARGIN;

      if (timeUntilRefresh > 0) {
        refreshTokenTimeout.current = setTimeout(async () => {
          const token = await refreshToken();
          if (!token) {
            await handleLogout();
          }
        }, timeUntilRefresh);
      } else {
        refreshToken().then(token => {
          if (!token) {
            handleLogout();
          }
        });
      }
    }
  }, [user?.tokenExpiration, refreshToken, clearRefreshTimeout, handleLogout]);

  const getValidToken = useCallback(async (): Promise<string | null> => {
    if (!user?.accessToken) return null;

    if (isTokenExpired(user.tokenExpiration)) {
      return refreshToken();
    }

    return user.accessToken;
  }, [user, refreshToken, isTokenExpired]);

  const validateStoredToken = useCallback(async () => {
    const storedExpiration = localStorage.getItem(LOCAL_STORAGE_TOKEN_KEY);
    if (storedExpiration) {
      const expiration = parseInt(storedExpiration, 10);
      if (isTokenExpired(expiration)) {
        await handleLogout();
        return false;
      }
    }
    return true;
  }, [isTokenExpired, handleLogout]);

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
      try {
        if (firebaseUser) {
          // Validate stored token first
          const isValid = await validateStoredToken();
          if (!isValid) {
            return;
          }

          const token = await getIdToken(firebaseUser);
          const tokenExpiration = Date.now() + TOKEN_EXPIRATION_TIME;
          const uid = firebaseUser.uid;
          const userRef = ref(database, `user/${uid}`);
          const userSnapshot = await get(userRef);
          const dbUser = userSnapshot.val();

          // Store new token expiration
          localStorage.setItem(LOCAL_STORAGE_TOKEN_KEY, tokenExpiration.toString());

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
          localStorage.removeItem(LOCAL_STORAGE_TOKEN_KEY);
        }
      } catch (error) {
        console.error('Auth state change error:', error);
        await handleLogout();
      } finally {
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      clearRefreshTimeout();
    };
  }, [clearRefreshTimeout, handleLogout, validateStoredToken]);

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
      
      // Store token expiration in localStorage
      localStorage.setItem(LOCAL_STORAGE_TOKEN_KEY, tokenExpiration.toString());

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

  const updateUser = useCallback(async (updatedUser: Partial<User>) => {
    if (!auth.currentUser || !user) throw new Error('No authenticated user');

    try {
      await updateProfile(auth.currentUser, {
        displayName: updatedUser.name,
        photoURL: updatedUser.imageUrl,
      });

      const token = await getIdToken(auth.currentUser, true);
      const tokenExpiration = Date.now() + TOKEN_EXPIRATION_TIME;
      
      // Update token expiration in localStorage
      localStorage.setItem(LOCAL_STORAGE_TOKEN_KEY, tokenExpiration.toString());

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
      
      // Store token expiration in localStorage
      localStorage.setItem(LOCAL_STORAGE_TOKEN_KEY, tokenExpiration.toString());

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
    logout: handleLogout,
    updateUser,
    loginWithGoogle,
    loginWithGithub,
    loginWithFacebook,
    getValidToken
  };
}