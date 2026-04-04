'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Sidebar from '@/components/Sidebar';

export default function ProtectedPage({ title, children }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function checkAuth() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!mounted) return;
      if (!user) {
        window.location.href = '/auth';
        return;
      }

      await supabase.from('profiles').upsert(
        {
          id: user.id,
          name: user.user_metadata?.full_name || user.email?.split('@')[0] || null,
          avatar_url: user.user_metadata?.avatar_url || null,
          joined_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );

      setUser(user);
      setLoading(false);
    }

    checkAuth();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return <div className="min-h-screen bg-slate-100 flex items-center justify-center">Checking session...</div>;
  }

  return (
    <Sidebar>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
        <p className="text-sm text-slate-500">Signed in as {user.email}</p>
      </header>
      {children(user)}
    </Sidebar>
  );
}
