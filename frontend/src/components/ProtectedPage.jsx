'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import WorkspaceLoader from '@/components/WorkspaceLoader';

export default function ProtectedPage({ title, children, hideDefaultHeader = false }) {
  const { user, authLoading } = useAuth();
  const router = useRouter();
  const hasRedirectedRef = useRef(false);

  useEffect(() => {
    if (authLoading || user) {
      hasRedirectedRef.current = false;
      return;
    }

    if (!hasRedirectedRef.current) {
      hasRedirectedRef.current = true;
      router.replace('/auth');
    }
  }, [authLoading, user, router]);

  if (authLoading) {
    return <WorkspaceLoader />;
  }

  if (!user) {
    return <WorkspaceLoader />;
  }

  return (
    <Sidebar>
      {!hideDefaultHeader ? (
        <header className="relative z-10 mb-6 rounded-2xl border border-border bg-card/70 p-6 backdrop-blur-xl transition-colors duration-300">
          <h1 className="bg-gradient-to-r from-accent to-cyan-400 bg-clip-text text-3xl font-bold text-transparent drop-shadow-sm">{title}</h1>
          <p className="mt-2 text-sm font-medium text-foreground/70">Signed in as <span className="text-accent">{user.email}</span></p>
        </header>
      ) : null}
      <div className={`relative z-10 ${hideDefaultHeader ? '' : 'min-h-[60vh] rounded-2xl border border-border bg-card/70 p-6 backdrop-blur-xl transition-colors duration-300'}`}>
        {children(user)}
      </div>
    </Sidebar>
  );
}
