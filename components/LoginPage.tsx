import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { GoogleIcon } from './icons/GoogleIcon';
import { SparklesIcon } from './icons/SparklesIcon';

type AuthMode = 'signin' | 'signup';

export const LoginPage: React.FC = () => {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let result;
      if (mode === 'signin') {
        result = await signInWithEmail(email, password);
      } else {
        result = await signUpWithEmail(email, password);
      }
      if (result.error) {
        setError(result.error.message);
      }
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleGoogleSignIn = async () => {
    const { error } = await signInWithGoogle();
    if(error) {
      setError(error.message);
    }
  }

  const toggleMode = () => {
    setMode(prev => prev === 'signin' ? 'signup' : 'signin');
    setError(null);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-light dark:bg-dark-bg p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
            <div className="inline-block p-4 bg-primary/10 rounded-full mb-4">
            <SparklesIcon className="w-12 h-12 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-dark dark:text-dark-text">Dev Toolbox AI</h1>
            <p className="mt-2 text-md text-gray-600 dark:text-dark-text-secondary">
             {mode === 'signin' ? 'Sign in to continue' : 'Create an account to get started'}
            </p>
        </div>

        <form onSubmit={handleAuthAction} className="space-y-4">
           {error && <p className="text-sm text-red-500 bg-red-100 dark:bg-red-900/20 p-3 rounded-md">{error}</p>}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary">Email address</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-white dark:bg-dark-surface border border-gray-300 dark:border-dark-border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="password"  className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-white dark:bg-dark-surface border border-gray-300 dark:border-dark-border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:bg-indigo-400"
          >
            {loading ? 'Processing...' : (mode === 'signin' ? 'Sign In' : 'Sign Up')}
          </button>
        </form>

         <div className="mt-4 text-center text-sm">
            <button onClick={toggleMode} className="font-medium text-primary hover:text-indigo-500">
                {mode === 'signin' ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
            </button>
        </div>

        <div className="mt-6 relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-dark-border" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-light dark:bg-dark-bg text-gray-500 dark:text-dark-text-secondary">OR</span>
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={handleGoogleSignIn}
            className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg shadow-sm bg-white dark:bg-dark-surface text-gray-700 dark:text-dark-text hover:bg-gray-50 dark:hover:bg-dark-border focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
          >
            <GoogleIcon className="w-5 h-5 mr-3" />
            <span className="font-semibold">Sign in with Google</span>
          </button>
        </div>
      </div>
    </div>
  );
};