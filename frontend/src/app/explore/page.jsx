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
      <div className="min-h-screen flex items-center justify-center bg-[#0f172a]">
        <div className="text-center p-8 max-w-md bg-slate-800 rounded-2xl shadow-xl border border-red-900/50">
          <h2 className="text-xl font-bold text-white mb-2">Connection Error</h2>
          <p className="text-slate-400 mb-4">Failed to load hackathon data.</p>
          <code className="block p-3 bg-slate-900/50 rounded-lg text-xs text-red-400 font-mono break-all border border-slate-700">
            {error}
          </code>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#0f172a] text-slate-100 font-sans selection:bg-blue-500/30">
      <Navbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        liveCount={hackathons.filter((hackathon) => !hackathon.is_closed).length}
      />
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-6">
        <div className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr] items-start">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm text-slate-900">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-[#185FA5]">
              Live hackathon discovery
            </div>
            <h1 className="mt-4 text-4xl md:text-5xl font-semibold tracking-tight text-slate-900">
              Find the next hackathon, then save it, apply to it, and log the outcome.
            </h1>
            <p className="mt-4 max-w-2xl text-slate-600 text-base md:text-lg">
              Browse active events, filter by platform or urgency, and jump directly into the tracker, deadlines, or team finder once you sign in.
            </p>

            <div className="mt-6 flex flex-wrap gap-3 text-sm">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">Search in real time</span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">Saved hackathons</span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">Deadline urgency</span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">Tracker + dashboard</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-slate-500">Open now</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{loading ? '...' : hackathons.filter((hackathon) => !hackathon.is_closed).length}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-slate-500">Closed</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{loading ? '...' : hackathons.filter((hackathon) => hackathon.is_closed).length}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm col-span-2">
              <p className="text-xs uppercase tracking-wide text-slate-500">Today&apos;s focus</p>
              <p className="mt-2 text-sm text-slate-600">Use bookmarks to collect events and the tracker to capture results after you submit.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-slate-500 shadow-sm">Loading hackathons...</div>
        ) : (
          <HackathonList initialHackathons={hackathons} searchQuery={searchQuery} showBookmark />
        )}
      </section>
    </main>
  );
}
