'use client';

import { useEffect, useMemo, useState } from 'react';
import ProtectedPage from '@/components/ProtectedPage';
import HackathonList from '@/components/HackathonList';
import { supabase } from '@/lib/supabaseClient';

export default function SavedPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [savedHackathons, setSavedHackathons] = useState([]);

  return (
    <ProtectedPage title="Saved Hackathons">
      {(user) => <SavedContent user={user} searchQuery={searchQuery} setSearchQuery={setSearchQuery} savedHackathons={savedHackathons} setSavedHackathons={setSavedHackathons} />}
    </ProtectedPage>
  );
}

function SavedContent({ user, searchQuery, setSearchQuery, savedHackathons, setSavedHackathons }) {
  useEffect(() => {
    let mounted = true;

    async function loadSaved() {
      const { data: savedRows } = await supabase
        .from('saved_hackathons')
        .select('hackathon_id')
        .eq('user_id', user.uid);

      const ids = (savedRows || []).map((row) => row.hackathon_id).filter(Boolean);
      if (!ids.length) {
        if (mounted) setSavedHackathons([]);
        return;
      }

      const { data } = await supabase.from('hackathons').select('*').in('id', ids).order('reg_end_date', { ascending: true });
      if (mounted) setSavedHackathons(data || []);
    }

    loadSaved();
    return () => {
      mounted = false;
    };
  }, [user.uid, setSavedHackathons]);

  const heading = useMemo(() => `${savedHackathons.length} saved`, [savedHackathons.length]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-slate-500">{heading}</p>
        <input
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search saved hackathons"
          className="w-full max-w-sm rounded-lg border border-slate-300 px-3 py-2"
        />
      </div>
      <HackathonList initialHackathons={savedHackathons} searchQuery={searchQuery} showBookmark />
    </div>
  );
}
