'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FirebaseError } from 'firebase/app';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { signup } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== passwordConfirm) {
      return setError('Passwords do not match');
    }
    
    setError('');
    setLoading(true);
    try {
      await signup(email, password);
      router.push('/dashboard');
    } catch (err) {
      if (err instanceof FirebaseError) {
        setError(err.message);
      } else {
        setError('Failed to create an account');
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
          <h1 className="text-2xl font-bold tracking-tight text-on-surface">Create an Account</h1>
          <p className="text-secondary text-sm mt-1">Start tracking your hackathon journey.</p>
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
              minLength={6}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-1.5" htmlFor="password-confirm">
              Confirm Password
            </label>
            <input
              id="password-confirm"
              type="password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              className="w-full px-3 py-2 bg-transparent border-b border-outline-variant/30 focus:border-primary focus:outline-none transition-colors"
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 mt-4 bg-cta-gradient text-white rounded-md font-medium text-sm transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-outline-variant/10 text-center">
          <p className="text-sm text-secondary">
            Already have an account?{' '}
            <Link href="/login" className="text-primary font-medium hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
