'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import HackathonList from '@/components/HackathonList';
import { supabase } from '@/lib/supabaseClient';

export const dynamic = 'force-dynamic';

export default function ExplorePage() {
  const [hackathons, setHackathons] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadHackathons() {
      setLoading(true);
      const { data, error: queryError } = await supabase
        .from('hackathons')
        .select('*')
        .order('reg_end_date', { ascending: true });

      if (!isMounted) {
        return;
      }

      if (queryError) {
        setError(queryError.message);
        setHackathons([]);
      } else {
        setError(null);
        setHackathons(data || []);
      }
      setLoading(false);
    }

    loadHackathons();
    return () => {
      isMounted = false;
    };
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center p-8 max-w-md bg-error-container rounded-2xl shadow-sm border border-error/20">
          <h2 className="text-xl font-bold text-on-error-container mb-2">Connection Error</h2>
          <p className="text-on-error-container/80 mb-4">Failed to load hackathon data.</p>
          <code className="block p-3 bg-white/50 rounded-lg text-xs text-error font-mono break-all border border-error/10">
            {error}
          </code>
        </div>
      </div>
    );
  }

  const liveCount = hackathons.filter((hackathon) => !hackathon.is_closed).length;
  const closedCount = hackathons.filter((hackathon) => hackathon.is_closed).length;

  return (
    <main className="flex-1 flex flex-col min-w-0 bg-background overflow-y-auto font-sans text-on-background selection:bg-primary/20">
      <Navbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        liveCount={liveCount}
      />
      
      <section className="p-8 max-w-6xl mx-auto w-full pt-10">
        <header className="mb-10">
          <h2 className="text-3xl font-extrabold tracking-tight text-on-surface mb-2">Discover Hackathons</h2>
          <p className="text-secondary max-w-lg">Curated high-performance coordination workspaces for the world's most innovative builders.</p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr] items-start mb-8">
          <div className="rounded-2xl border border-on-background/[0.12] bg-surface-container-lowest p-6 shadow-sm text-on-surface">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary-container px-3 py-1 text-xs font-semibold text-white">
              Live hackathon discovery
            </div>
            <h1 className="mt-4 text-3xl md:text-4xl font-bold tracking-tight text-on-surface leading-tight">
              Find the next hackathon, then save it, apply to it, and log the outcome.
            </h1>
            <p className="mt-4 max-w-2xl text-secondary text-base">
              Browse active events, filter by platform or urgency, and jump directly into the tracker, deadlines, or team finder once you sign in.
            </p>

            <div className="mt-6 flex flex-wrap gap-2 text-sm font-medium">
              <span className="rounded-full bg-surface-variant px-3 py-1 text-on-surface-variant">Search in real time</span>
              <span className="rounded-full bg-surface-variant px-3 py-1 text-on-surface-variant">Saved hackathons</span>
              <span className="rounded-full bg-surface-variant px-3 py-1 text-on-surface-variant">Deadline urgency</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-on-background/[0.12] bg-surface-container-lowest p-5 shadow-sm">
              <p className="text-xs uppercase font-bold tracking-widest text-secondary">Open now</p>
              <p className="mt-2 text-4xl font-black text-on-surface tracking-tighter">{loading ? '...' : liveCount}</p>
            </div>
            <div className="rounded-2xl border border-on-background/[0.12] bg-surface-container-lowest p-5 shadow-sm">
              <p className="text-xs uppercase font-bold tracking-widest text-secondary">Closed</p>
              <p className="mt-2 text-4xl font-black text-on-surface tracking-tighter">{loading ? '...' : closedCount}</p>
            </div>
            <div className="rounded-2xl border border-on-background/[0.12] bg-surface-container-lowest p-5 shadow-sm col-span-2">
              <p className="text-xs uppercase font-bold tracking-widest text-secondary">Today&apos;s focus</p>
              <p className="mt-2 text-sm text-secondary font-medium">Use bookmarks to collect events and the tracker to capture results after you submit.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-8 w-full pb-12">
        {loading ? (
          <div className="rounded-2xl border border-on-background/[0.12] bg-surface-container-lowest p-8 text-secondary font-medium shadow-sm flex items-center justify-center gap-4">
            <svg className="animate-spin h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading ecosystem...
          </div>
        ) : (
          <HackathonList initialHackathons={hackathons} searchQuery={searchQuery} showBookmark />
        )}
      </section>

      {/* Bento Grid Section for Platform Highlights */}
      <section className="p-8 max-w-6xl mx-auto w-full mb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-surface-container-low p-8 rounded-2xl flex flex-col justify-end min-h-[320px] relative overflow-hidden">
            <img 
              alt="Team collaborating" 
              className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-multiply" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCfGwyhfBv-eDMS7EQHGoQabFyIKUv6OvWwSk5PULUfhgG-H18cX7P-ciDTyNYEInDywiXb1XN-fUmDymUjKRndb-TeCKuFNp0ZolVYPZc_4HbhfpMnYi4Xe7EJ5vbId1RoMZaIwdlqPYtlQq1oIi-ixjQ4zLEw_CW0PX79HTGrZhgr5aEKap3xDBk2JN5p5DKIpzV3uwxAAdZxcReEYCkG-vXBGYgkZIrvOrl304ZHPvBbW6i04A1kz0KJKQfygjKxOvrZPD4wYYA"
            />
            <div className="relative z-10">
              <span className="bg-primary-container text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">New Feature</span>
              <h3 className="text-2xl font-bold mt-4 mb-2 text-on-surface">Integrated Workspace</h3>
              <p className="text-secondary max-w-md font-medium text-[15px]">Manage your entire hackathon lifecycle from team formation to final submission in one unified, high-performance environment.</p>
            </div>
          </div>
          <div className="bg-primary p-8 rounded-2xl flex flex-col justify-between text-white shadow-md">
            <span className="material-symbols-outlined !text-4xl" style={{fontVariationSettings: "'FILL' 1"}}>verified_user</span>
            <div>
              <h3 className="text-xl font-bold mb-2">Verified Teams</h3>
              <p className="text-primary-fixed-dim text-[13px] font-medium leading-relaxed">Every participant is vetted through our trust protocol to ensure elite coordination.</p>
            </div>
          </div>
        </div>
      </section>

    </main>
  );
}
