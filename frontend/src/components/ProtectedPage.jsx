'use client';

import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

export default function ProtectedPage({ title, children }) {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/auth');
    }
  }, [user, router]);

  if (!user) {
    return null; // Don't render protected content while redirecting
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
