'use client';

import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push('/explore');
    }
  }, [user, router]);

  if (user) return null;

  return (
    <main className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Decorative Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-[128px] opacity-60 animate-blob"></div>
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-[128px] opacity-60 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-pink-400 rounded-full mix-blend-multiply filter blur-[128px] opacity-60 animate-blob animation-delay-4000"></div>

      <div className="glass-panel p-12 rounded-3xl max-w-2xl text-center relative z-10 mx-6">
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1.5 text-sm font-medium text-foreground/80 backdrop-blur-md shadow-sm">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
          Discover your next hackathon
        </div>
        
        <h1 className="mb-6 text-5xl font-bold tracking-tight text-foreground drop-shadow-sm md:text-6xl">
          Build the future with <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Find-a-thon</span>
        </h1>
        
        <p className="mx-auto mb-10 max-w-lg text-lg font-medium text-foreground/80">
          The ultimate workspace to discover, track, and win hackathons globally. Scraped fresh daily.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link 
            href="/auth" 
            className="w-full sm:w-auto px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
          >
            Sign In
          </Link>
          <Link 
            href="/auth" 
            className="glass-button w-full sm:w-auto px-8 py-3 rounded-xl border border-white/80"
          >
            Create Account
          </Link>
        </div>
      </div>
    </main>
  );
}
