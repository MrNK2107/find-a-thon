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
      const { data } = await supabase.from('hackathons').select('id,title').order('reg_end_date', { ascending: true });
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

  return <EntryForm userId={user.id} initialValues={prefill} hackathons={hackathons} onSaved={() => (window.location.href = '/tracker')} />;
}
