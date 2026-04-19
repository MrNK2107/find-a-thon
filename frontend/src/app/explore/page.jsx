'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import HackathonList from '@/components/HackathonList';
import FilterBar from '@/components/FilterBar';
import ExploreHeader from '@/components/ExploreHeader';
import { supabase } from '@/lib/supabaseClient';

export const dynamic = 'force-dynamic';

export default function ExplorePage() {
  const [hackathons, setHackathons] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({ modes: [], platforms: [], closingSoon: false, sort: 'deadline' });
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
        <div className="max-w-md rounded-2xl border border-red-300/40 bg-red-500/8 p-8 text-center shadow-sm">
          <h2 className="text-xl font-bold text-red-800 mb-2">Connection Error</h2>
          <p className="text-red-600 mb-4">Failed to load hackathon data.</p>
          <code className="block rounded-lg border border-red-300/40 bg-card/60 p-3 text-xs font-mono break-all text-red-700">
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
  
  const sourceCount = new Set(hackathons.map((h) => (h.source || '').toLowerCase()).filter(Boolean)).size;

  return (
    <main className="min-h-screen pt-24 pb-12">
      <Navbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        hackathonCount={liveCount}
      />
      <div className="max-w-7xl mx-auto px-6 w-full flex flex-col gap-8">
        <ExploreHeader
          liveCount={liveCount}
          closingCount={closingCount}
          sourceCount={sourceCount}
        />

        <section>
          <FilterBar filters={filters} onFilterChange={setFilters} count={hackathons.length} />
        </section>

        <section>
        <HackathonList
          hackathons={hackathons}
          searchQuery={searchQuery}
          showBookmark
          loading={loading}
          filters={filters}
          onClearFilters={() => setFilters({ modes: [], platforms: [], closingSoon: false, sort: 'deadline' })}
        />
        </section>
      </div>

    </main>
  );
}
