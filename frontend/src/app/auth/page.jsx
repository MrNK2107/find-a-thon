'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function AuthPage() {
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { user, login, signup } = useAuth();
  const router = useRouter();

  // If already logged in, redirect to dashboard automatically
  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  async function handleEmailAuth(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage('');
    
    try {
      if (mode === 'signup') {
        await signup(email, password);
        router.push('/dashboard');
        return;
      }

      await login(email, password);
      router.push('/dashboard');
    } catch (error) {
      if (error.code === 'auth/invalid-credential') {
        setMessage('Invalid email or password.');
      } else if (error.code === 'auth/email-already-in-use') {
        setMessage('Account already exists with this email.');
      } else if (error.code === 'auth/weak-password') {
        setMessage('Password must be at least 6 characters.');
      } else {
        setMessage(error.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGoogleAuth() {
    setMessage('Google Auth is not implemented yet.');
  }

  // If we are evaluating the current user or already logged in, show a subtle loading state locally to prevent form flash
  if (user) return null;

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl border border-slate-200 shadow-sm p-8 space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Find-a-thon</h1>
          <p className="text-sm text-slate-500">
            {mode === 'signin' ? 'Welcome back! Sign in to continue.' : 'Create an account to get started.'}
          </p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button 
            type="button"
            onClick={() => { setMode('signin'); setMessage(''); }} 
            className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${mode === 'signin' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Log in
          </button>
          <button 
            type="button"
            onClick={() => { setMode('signup'); setMessage(''); }} 
            className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${mode === 'signup' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Sign up
          </button>
        </div>

        <form onSubmit={handleEmailAuth} className="space-y-4">
          <div className="space-y-3">
            <input 
              type="email" 
              required 
              placeholder="Email address" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              disabled={isSubmitting}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-[#185FA5] focus:ring-1 focus:ring-[#185FA5] disabled:opacity-50 transition-all font-medium" 
            />
            <input 
              type="password" 
              required 
              placeholder="Password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              disabled={isSubmitting}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-[#185FA5] focus:ring-1 focus:ring-[#185FA5] disabled:opacity-50 transition-all font-medium" 
            />
          </div>

          {message && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl font-medium">
              {message}
            </div>
          )}

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full rounded-xl bg-[#185FA5] hover:bg-[#144f8a] text-white px-4 py-2.5 font-medium transition-all focus:ring-4 focus:ring-[#185FA5]/20 disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {isSubmitting && (
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {mode === 'signup' ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-slate-500 font-medium tracking-wider">Or</span>
          </div>
        </div>

        <button 
          onClick={handleGoogleAuth} 
          disabled={isSubmitting}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-700 font-medium hover:bg-slate-50 transition-all disabled:opacity-50"
        >
          Continue with Google
        </button>
      </div>
    </main>
  );
}
