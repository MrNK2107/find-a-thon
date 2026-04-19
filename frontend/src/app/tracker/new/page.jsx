'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import ProtectedPage from '@/components/ProtectedPage';
import EntryForm from '@/components/EntryForm';
import { supabase } from '@/lib/supabaseClient';

export default function NewTrackerEntryPage() {
  return (
    <ProtectedPage title="Add Tracker Entry">
      {(user) => <NewEntryContent user={user} />}
    </ProtectedPage>
  );
}

function NewEntryContent({ user }) {
  const searchParams = useSearchParams();
  const [hackathons, setHackathons] = useState([]);
  const [prefill, setPrefill] = useState({});

  useEffect(() => {
    let mounted = true;
    async function loadHackathons() {
      const { data } = await supabase.from('hackathons').select('id,title,reg_end_date').order('reg_end_date', { ascending: true });
      if (mounted) {
        const rows = data || [];
        setHackathons(rows);
        const hackathonId = searchParams.get('hackathonId');
        if (hackathonId) {
          const selected = rows.find((row) => String(row.id) === String(hackathonId));
          setPrefill({
            hackathon_id: selected?.id || null,
            hackathon_title: selected?.title || '',
          });
        }
      }
    }
    loadHackathons();
    return () => {
      mounted = false;
    };
  }, [searchParams]);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div className="rounded-2xl border border-border bg-card/70 p-6 backdrop-blur-xl">
        <h2 className="text-xl font-bold text-foreground">Build Your Tracker Entry</h2>
        <p className="mt-2 text-sm text-foreground/70">This helps you track your hackathon journey.</p>
      </div>

      <EntryForm userId={user.uid} initialValues={prefill} hackathons={hackathons} onSaved={() => (window.location.href = '/tracker')} />
    </div>
  );
}
