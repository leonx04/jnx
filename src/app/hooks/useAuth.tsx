import { app } from '@/firebaseConfig';
import bcrypt from 'bcryptjs';
import { get, getDatabase, ref, set } from 'firebase/database';
import { useEffect, useState } from 'react';

interface User {
  email: string;
  name?: string;
  imageUrl?: string;
  id?: string;
}

interface UserWithPassword extends User {
  password: string;
}

const TOKEN_EXPIRY_TIME = 60 * 60 * 1000; // 1 hour

const generateToken = () => ({
  value: Math.random().toString(36).substr(2),
  expiry: Date.now() + TOKEN_EXPIRY_TIME
});

export const isTokenValid = (token: { value: string; expiry: number }) => token.expiry > Date.now();

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);

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
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const db = getDatabase(app);
    const usersRef = ref(db, 'user');

    try {
      const snapshot = await get(usersRef);
      if (snapshot.exists()) {
        const users = snapshot.val();
        for (const userId in users) {
          const user = users[userId] as UserWithPassword;
          if (user.email === email) {
            const passwordMatch = await bcrypt.compare(password, user.password);
            if (passwordMatch) {
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              // eslint-disable-next-line
              const { password: _, ...userWithoutPassword } = user;
              const userWithId = { ...userWithoutPassword, id: userId };
              const token = generateToken();
              localStorage.setItem('token', JSON.stringify(token));
              localStorage.setItem('user', JSON.stringify(userWithId));
              setUser(userWithId);
              return userWithId;
            }
          }
        }
      }
    } catch (error) {
      console.error('Firebase query error:', error);
    }

    throw new Error('Invalid email or password');
  };

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
  };

  const updateUser = async (updatedUser: User) => {
    if (user && user.id) {
      const db = getDatabase(app);
      const userRef = ref(db, `user/${user.id}`);
      await set(userRef, updatedUser);
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  return { user, login, logout, updateUser };
}

