import { useState, useEffect } from 'react';
import { getDatabase, ref, get } from 'firebase/database';
import { app } from '@/firebaseConfig';

export function useAuth() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = sessionStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = async (email: string, password: string) => {
    console.log(`Attempting login with email: ${email}`);
    const db = getDatabase(app);
    const usersRef = ref(db, 'user');
    try {
      const snapshot = await get(usersRef);
      console.log('Firebase snapshot received:', snapshot.val());

      if (snapshot.exists()) {
        const users = snapshot.val();
        for (let userId in users) {
          const user = users[userId];
          if (user.email === email && String(user.password) === password) {
            console.log('User found:', user);
            sessionStorage.setItem('user', JSON.stringify(user));
            setUser(user);
            return user;
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

