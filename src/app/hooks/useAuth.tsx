import { auth, database, facebookProvider, githubProvider, googleProvider } from '@/firebaseConfig';
import { AuthProvider, fetchSignInMethodsForEmail, onAuthStateChanged, signInWithEmailAndPassword, signInWithPopup, signOut, updateProfile } from 'firebase/auth';
import { get, ref, set, update } from 'firebase/database';
import { useEffect, useState } from 'react';

interface User {
  id: string;
  email: string;
  name?: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const user = await getUserData(firebaseUser.uid);
        setUser(user);
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
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt,
      };
    }
    return null;
  };

  const createOrUpdateUser = async (user: User, isNewUser: boolean) => {
    const userRef = ref(database, `user/${user.id}`);
    const now = new Date().toISOString();

    if (isNewUser) {
      await set(userRef, {
        ...user,
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
      const user = await getUserData(firebaseUser.uid);
      if (user) {
        await createOrUpdateUser(user, false);
        setUser(user);
        return user;
      }
      throw new Error('User data not found');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  const updateUser = async (updatedUser: Partial<User>) => {
    if (!auth.currentUser) throw new Error('No authenticated user');

    try {
      await updateProfile(auth.currentUser, {
        displayName: updatedUser.name,
        photoURL: updatedUser.imageUrl,
      });

      const user = await getUserData(auth.currentUser.uid);
      if (user) {
        const updatedUserData = { ...user, ...updatedUser, updatedAt: new Date().toISOString() };
        await createOrUpdateUser(updatedUserData, false);
        setUser(updatedUserData);
      }
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    }
  };

  const loginWithProvider = async (provider: AuthProvider): Promise<User> => {
    try {
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;
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
        };
      }
      
      await createOrUpdateUser(user, isNewUser);
      setUser(user);
      return user;
    } catch (error: any) {
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
        } else {
          throw new Error('ACCOUNT_EXISTS_WITH_DIFFERENT_CREDENTIAL');
        }
      }
      console.error('Social login error:', error);
      throw error;
    }
  };

  const loginWithGoogle = () => loginWithProvider(googleProvider);
  const loginWithGithub = () => loginWithProvider(githubProvider);
  const loginWithFacebook = () => loginWithProvider(facebookProvider);

  return { user, login, logout, updateUser, loginWithGoogle, loginWithGithub, loginWithFacebook, loading };
}

