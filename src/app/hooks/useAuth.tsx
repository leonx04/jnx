import { useState, useEffect } from 'react';
import { getDatabase, ref, get } from 'firebase/database';
import { app } from '@/firebaseConfig';

interface User {
  email: string;
  name?: string;
  imageUrl?: string;
}

interface UserWithPassword extends User {
  password: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = sessionStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    console.log(`Attempting login with email: ${email}`);
    const db = getDatabase(app);
    const usersRef = ref(db, 'user');
    try {
      const snapshot = await get(usersRef);
      console.log('Firebase snapshot received:', snapshot.val());

      if (snapshot.exists()) {
        const users = snapshot.val();
        for (const userId in users) {
          const user = users[userId] as UserWithPassword;
          if (user.email === email && String(user.password) === password) {
            console.log('User found:', user);
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { password: _, ...userWithoutPassword } = user;
            sessionStorage.setItem('user', JSON.stringify(userWithoutPassword));
            setUser(userWithoutPassword);
            return userWithoutPassword;
          }
        }
        console.log('No matching user found');
      } else {
        console.log('No users found in the database');
      }
    } catch (error) {
      console.error('Firebase query error:', error);
    }

    throw new Error('Invalid email or password');
  };

  const logout = () => {
    sessionStorage.removeItem('user');
    setUser(null);
  };

  return { user, login, logout };
}