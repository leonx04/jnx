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
import { useCallback, useEffect, useState } from 'react';

interface User {
  id: string;
  email: string;
  name?: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
  accessToken?: string;
}

export function useAuth() {
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
      // Refresh token every 55 minutes
      tokenRefreshInterval = setInterval(refreshToken, 55 * 60 * 1000);
    };

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const user = await getUserData(firebaseUser.uid);
        const token = await getIdToken(firebaseUser);
        if (user) {
          setUser({ ...user, accessToken: token });
        }
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
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt,
        accessToken: userData.accessToken
      };
    }
    return null;
  };

  const createOrUpdateUser = async (user: User, isNewUser: boolean) => {
    const userRef = ref(database, `user/${user.id}`);
    const now = new Date().toISOString();
    const { accessToken, ...userWithoutToken } = user;

    if (isNewUser) {
      await set(userRef, {
        ...userWithoutToken,
        createdAt: now,
        updatedAt: now,
      });
    } else {
      const updates: Partial<User> = {
        email: user.email,
        name: user.name,
        imageUrl: user.imageUrl,
        updatedAt: now,
      };
      await update(userRef, updates);
    }
  };

  const login = async (email: string, password: string): Promise<User> => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      const token = await getIdToken(firebaseUser);
      const user = await getUserData(firebaseUser.uid);

      if (user) {
        const updatedUser = { ...user, accessToken: token };
        await createOrUpdateUser(updatedUser, false);
        setUser(updatedUser);
        return updatedUser;
      }

      // If user doesn't exist in database, create new user
      const newUser: User = {
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        name: firebaseUser.displayName || undefined,
        imageUrl: firebaseUser.photoURL || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        accessToken: token
      };
      await createOrUpdateUser(newUser, true);
      setUser(newUser);
      return newUser;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const updateUser = async (updatedUser: Partial<User>) => {
    if (!auth.currentUser) throw new Error('No authenticated user');

    try {
      await updateProfile(auth.currentUser, {
        displayName: updatedUser.name,
        photoURL: updatedUser.imageUrl,
      });

      const token = await getIdToken(auth.currentUser, true);
      const user = await getUserData(auth.currentUser.uid);
      if (user) {
        const updatedUserData = {
          ...user,
          ...updatedUser,
          accessToken: token,
          updatedAt: new Date().toISOString()
        };
        await createOrUpdateUser(updatedUserData, false);
        setUser(updatedUserData);
      }
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    }
  };

  const handleAuthError = async (error: any): Promise<never> => {
    if (error.code === 'auth/account-exists-with-different-credential') {
      const email = error.customData.email;
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
    console.error('Auth error:', error);
    throw error;
  };

  const loginWithProvider = async (provider: AuthProvider): Promise<User> => {
    try {
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;
      const token = await getIdToken(firebaseUser);
      let user = await getUserData(firebaseUser.uid);
      const isNewUser = !user;

      if (!user) {
        user = {
          id: firebaseUser.uid,
          email: firebaseUser.email!,
          name: firebaseUser.displayName || undefined,
          imageUrl: firebaseUser.photoURL || undefined,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          accessToken: token
        };
      } else {
        user.accessToken = token;
        user.updatedAt = new Date().toISOString();
      }

      await createOrUpdateUser(user, isNewUser);
      setUser(user);
      return user;
    } catch (error: any) {
      return handleAuthError(error);
    }
  };

  const loginWithGoogle = () => loginWithProvider(googleProvider);
  const loginWithGithub = () => loginWithProvider(githubProvider);
  const loginWithFacebook = () => loginWithProvider(facebookProvider);

  return {
    user,
    loading,
    login,
    logout,
    updateUser,
    loginWithGoogle,
    loginWithGithub,
    loginWithFacebook,
    refreshToken
  };
}