'use client';

import { useEffect, useState, useMemo } from 'react';
import Navbar from '@/components/Navbar';
import HackathonList from '@/components/HackathonList';
import FilterBar from '@/components/FilterBar';
import { supabase } from '@/lib/supabaseClient';

export const dynamic = 'force-dynamic';

export default function ExplorePage() {
  const [hackathons, setHackathons] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
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
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center p-8 max-w-md bg-red-50 rounded-2xl shadow-sm border border-red-200">
          <h2 className="text-xl font-bold text-red-800 mb-2">Connection Error</h2>
          <p className="text-red-600 mb-4">Failed to load hackathon data.</p>
          <code className="block p-3 bg-white/50 rounded-lg text-xs text-red-700 font-mono break-all border border-red-200">
            {error}
          </code>
        </div>
      </div>
    );
  }

  const liveCount = hackathons.filter((hackathon) => !hackathon.is_closed).length;
  const closingCount = hackathons.filter((h) => {
    if (h.is_closed) return false;
    if (!h.reg_end_date) return false;
    const deadline = new Date(h.reg_end_date + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysLeft = Math.ceil((deadline - today) / 86400000);
    return daysLeft <= 7 && daysLeft >= 0;
  }).length;
  
  // Count distinct sources dynamically could be done, but instruction says "7 sources"
  const SOURCES = "7";

  return (
    <main className="min-h-screen bg-white">
      <Navbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        hackathonCount={liveCount}
      />
      
      {/* HERO */}
      <section className="bg-white border-b border-[#E2E3E1] pt-12 pb-8 px-8 mt-14">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-[28px] font-bold tracking-tight text-[#1a1c1b]">
            Discover hackathons worth your time
          </h1>
          <p className="text-[14px] text-[#5f5e5a] mt-1">
            Scraped fresh from Devpost, Devfolio, Unstop, HackerEarth and more.
          </p>

          <div className="mt-5 flex gap-6 flex-wrap items-center">
            <div className="flex items-center gap-1.5">
              <span className="text-[#185FA5] font-bold">{liveCount}</span>
              <span className="text-[#5f5e5a] text-[13px]">open now</span>
            </div>
            <span className="text-[#E2E3E1]">·</span>
            <div className="flex items-center gap-1.5">
              <span className="text-[#185FA5] font-bold">{closingCount}</span>
              <span className="text-[#5f5e5a] text-[13px]">closing this week</span>
            </div>
            <span className="text-[#E2E3E1]">·</span>
            <div className="flex items-center gap-1.5">
              <span className="text-[#185FA5] font-bold">{SOURCES}</span>
              <span className="text-[#5f5e5a] text-[13px]">sources</span>
            </div>
            <span className="text-[#E2E3E1]">·</span>
            <div className="flex items-center gap-1.5">
              <span className="text-[#5f5e5a] text-[13px]">Updated daily</span>
            </div>
          </div>
        </div>
      </section>

      {/* FILTER BAR */}
      <div className="sticky top-14 z-40 bg-white border-b border-[#E2E3E1] px-8 py-3">
        <div className="max-w-6xl mx-auto">
          {/* HackathonList will handle the actual count being rendered later, but it expects FilterBar state inside HackathonList, or passed down */}
          {/* Wait, the FilterBar requires count, which comes from HackathonList which does the filtering. We will pull the filtering logic here or put FilterBar IN HackathonList, but instructions say to rebuild FilterBar and that explore page embeds it... Actually HackathonList embeds it! The prompt instructed to completely redesign HackathonList and explore. It seems HackathonList is where FilterBar is rendered. So I will move FilterBar rendering OUT of here or just pass the activeFilter to HackathonList. I'll just put HackathonList here. */}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 w-full">
         <HackathonList initialHackathons={hackathons} searchQuery={searchQuery} showBookmark loading={loading} />
      </div>

    </main>
  );
}
