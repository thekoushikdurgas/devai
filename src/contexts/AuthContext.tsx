import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { auth, googleProvider } from '../services/firebase';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  User
} from 'firebase/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<{ error: any }>;
  signOutUser: () => Promise<{ error: any }>;
  signInWithEmail: (email: string, pass: string) => Promise<{ error: any }>;
  signUpWithEmail: (email: string, pass: string) => Promise<{ error: any }>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      return { error: null };
    } catch (error) {
      console.error('Google Sign In Error:', error);
      return { error };
    }
  };
  
  const signUpWithEmail = async (email: string, pass: string) => {
    try {
      await createUserWithEmailAndPassword(auth, email, pass);
      return { error: null };
    } catch (error) {
      console.error('Sign Up Error:', error);
      return { error };
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      return { error: null };
    } catch (error) {
      console.error('Sign In Error:', error);
      return { error };
    }
  };

  const signOutUser = async () => {
    try {
      await signOut(auth);
      return { error: null };
    } catch (error) {
      console.error('Sign Out Error:', error);
      return { error };
    }
  };

  const value = {
    user,
    loading,
    signInWithGoogle,
    signOutUser,
    signUpWithEmail,
    signInWithEmail
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
