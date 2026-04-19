'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const hasResolvedInitialAuth = useRef(false);

  useEffect(() => {
    let isMounted = true;

    const resolveAuth = (nextUser) => {
      if (!isMounted) return;

      setUser(nextUser ?? null);

      if (!hasResolvedInitialAuth.current) {
        hasResolvedInitialAuth.current = true;
        setAuthLoading(false);
      }
    };

    const unsubscribe = onAuthStateChanged(
      auth,
      (nextUser) => {
        resolveAuth(nextUser);
      },
      () => {
        resolveAuth(null);
      }
    );

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const signup = (email, password) => {
    return createUserWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, authLoading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
