'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function AuthPage() {
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  async function handleEmailAuth(event) {
    event.preventDefault();
    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({ email, password });
      setMessage(error ? error.message : 'Check your email for confirmation link.');
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setMessage(error.message);
      return;
    }
    window.location.href = '/dashboard';
  }

  async function handleGoogleAuth() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
  }

  return (
    <main className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-xl border border-slate-200 p-6 space-y-4">
        <h1 className="text-2xl font-semibold text-slate-900">Find-a-thon Auth</h1>
        <p className="text-sm text-slate-500">Sign in to access tracker, saved events, team finder, and dashboard.</p>

        <div className="flex gap-2">
          <button onClick={() => setMode('signin')} className={`px-3 py-1.5 rounded-lg text-sm ${mode === 'signin' ? 'bg-[#185FA5] text-white' : 'bg-slate-100 text-slate-700'}`}>Log in</button>
          <button onClick={() => setMode('signup')} className={`px-3 py-1.5 rounded-lg text-sm ${mode === 'signup' ? 'bg-[#185FA5] text-white' : 'bg-slate-100 text-slate-700'}`}>Sign up</button>
        </div>

        <form onSubmit={handleEmailAuth} className="space-y-3">
          <input type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
          <input type="password" required placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
          <button type="submit" className="w-full rounded-lg bg-[#185FA5] text-white px-4 py-2">{mode === 'signup' ? 'Create account' : 'Log in'}</button>
        </form>

        <button onClick={handleGoogleAuth} className="w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-50">Continue with Google</button>

        {message ? <p className="text-sm text-slate-600">{message}</p> : null}
      </div>
    </main>
  );
}
