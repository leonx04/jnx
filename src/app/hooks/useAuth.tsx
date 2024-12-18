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
          if (user.email === email) {
            // Compare the provided password with the stored hashed password
            const passwordMatch = await bcrypt.compare(password, user.password);
            if (passwordMatch) {
              console.log('User found:', user);
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              const { password: _, ...userWithoutPassword } = user;
              const userWithId = { ...userWithoutPassword, id: userId };
              sessionStorage.setItem('user', JSON.stringify(userWithId));
              setUser(userWithId);
              return userWithId;
            }
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

  const updateUser = async (updatedUser: User) => {
    if (user && user.id) {
      const db = getDatabase(app);
      const userRef = ref(db, `user/${user.id}`);
      await set(userRef, updatedUser);
      setUser(updatedUser);
      sessionStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  return { user, login, logout, updateUser };
}

