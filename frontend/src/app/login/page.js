'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FirebaseError } from 'firebase/app';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err) {
      if (err instanceof FirebaseError) {
        setError(err.message);
      } else {
        setError('Failed to log in');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-background items-center justify-center">
      <div className="w-full max-w-md p-8 bg-surface-container-lowest border border-outline-variant/20 rounded-[8px] shadow-ambient">
        <div className="mb-8">
          <div className="w-10 h-10 rounded-lg bg-primary-container flex items-center justify-center text-white font-bold mb-4">
            F
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-on-surface">Welcome back</h1>
          <p className="text-secondary text-sm mt-1">Log in to your workspace.</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-error-container text-on-error-container text-sm rounded-md border border-error/20">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-1.5" htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-transparent border-b border-outline-variant/30 focus:border-primary focus:outline-none transition-colors"
              placeholder="you@example.com"
              required
            />
          </div>
          
          <div>
            <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-1.5" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-transparent border-b border-outline-variant/30 focus:border-primary focus:outline-none transition-colors"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 mt-4 bg-cta-gradient text-white rounded-md font-medium text-sm transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-outline-variant/10 text-center">
          <p className="text-sm text-secondary">
            Don't have an account?{' '}
            <Link href="/signup" className="text-primary font-medium hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
