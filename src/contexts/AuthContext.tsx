import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../services/supabase';
import type { AuthError, Session, User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<{ error: AuthError | null }>;
  signOutUser: () => Promise<{ error: AuthError | null }>;
  signInWithEmail: (email: string, pass: string) => Promise<{ error: AuthError | null }>;
  signUpWithEmail: (email: string, pass: string) => Promise<{ error: AuthError | null }>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
        setLoading(false);
    }
    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
    return { error };
  };
  
  const signUpWithEmail = async (email: string, pass:string) => {
    const { error } = await supabase.auth.signUp({ email, password: pass });
    return { error };
  }

  const signInWithEmail = async (email: string, pass: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    return { error };
  }

  const signOutUser = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
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