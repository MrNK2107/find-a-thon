'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import WorkspaceLoader from '@/components/WorkspaceLoader';

export default function AuthPage() {
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasRedirectedRef = useRef(false);
  
  const { user, authLoading, login, signup } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (authLoading || !user) {
      hasRedirectedRef.current = false;
      return;
    }

    if (!hasRedirectedRef.current) {
      hasRedirectedRef.current = true;
      router.replace('/dashboard');
    }
  }, [authLoading, user, router]);

  async function handleEmailAuth(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage('');
    
    try {
      if (mode === 'signup') {
        await signup(email, password);
        return;
      }

      await login(email, password);
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

  if (authLoading) {
    return <WorkspaceLoader />;
  }

  if (user) return null;

  return (
    <main className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      {/* Decorative Orbs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-300 rounded-full mix-blend-multiply filter blur-[128px] opacity-60 animate-blob"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-300 rounded-full mix-blend-multiply filter blur-[128px] opacity-60 animate-blob animation-delay-2000"></div>

      <div className="w-full max-w-md glass-panel p-10 space-y-8 rounded-[2rem] relative z-10 mx-6">
        <div className="space-y-2 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-card/60 shadow-sm border border-border backdrop-blur-md mb-2">
            <span className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.8)] animate-pulse"></span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground drop-shadow-sm">Find-a-thon</h1>
          <p className="text-[15px] font-medium text-foreground/75">
            {mode === 'signin' ? 'Welcome back! Sign in to continue.' : 'Create an account to get started.'}
          </p>
        </div>

        <div className="flex bg-card/45 backdrop-blur-sm p-1.5 rounded-xl border border-border shadow-inner">
          <button 
            type="button"
            onClick={() => { setMode('signin'); setMessage(''); }} 
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all duration-300 ${mode === 'signin' ? 'bg-card shadow-md text-accent' : 'text-foreground/70 hover:text-foreground'}`}
          >
            Log in
          </button>
          <button 
            type="button"
            onClick={() => { setMode('signup'); setMessage(''); }} 
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all duration-300 ${mode === 'signup' ? 'bg-card shadow-md text-accent' : 'text-foreground/70 hover:text-foreground'}`}
          >
            Sign up
          </button>
        </div>

        <form onSubmit={handleEmailAuth} className="space-y-5">
          <div className="space-y-4">
            <input 
              type="email" 
              required 
              placeholder="Email address" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              disabled={isSubmitting}
              className="glass-input w-full rounded-xl px-4 py-3 text-[15px] font-medium disabled:opacity-50" 
            />
            <input 
              type="password" 
              required 
              placeholder="Password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              disabled={isSubmitting}
              className="glass-input w-full rounded-xl px-4 py-3 text-[15px] font-medium disabled:opacity-50" 
            />
          </div>

          {message && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-700 text-sm rounded-xl font-bold text-center backdrop-blur-sm">
              {message}
            </div>
          )}

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full rounded-xl bg-accent hover:opacity-90 text-white px-4 py-3 font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 focus:ring-4 focus:ring-accent/20 disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {isSubmitting && (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {mode === 'signup' ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div className="relative pt-2">
          <div className="absolute inset-0 flex items-center mt-2">
            <span className="w-full border-t border-border/70" />
          </div>
          <div className="relative flex justify-center text-xs uppercase pt-2">
            <span className="px-3 text-foreground/65 font-bold tracking-wider">Or</span>
          </div>
        </div>

        <button 
          onClick={handleGoogleAuth} 
          disabled={isSubmitting}
          className="glass-button w-full rounded-xl px-4 py-3 text-foreground/80 font-bold transition-all disabled:opacity-50"
        >
          Continue with Google
        </button>
      </div>
    </main>
  );
}
