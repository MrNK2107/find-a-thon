'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import ProtectedPage from '@/components/ProtectedPage';
import PerformanceEntryCard from '@/components/PerformanceEntryCard';
import { supabase } from '@/lib/supabaseClient';

export default function TrackerPage() {
  return (
    <ProtectedPage title="Performance Tracker">
      {(user) => <TrackerContent user={user} />}
    </ProtectedPage>
  );
}

function TrackerContent({ user }) {
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    let mounted = true;
    async function loadEntries() {
      const { data } = await supabase
        .from('hackathon_entries')
        .select('*')
        .eq('user_id', user.uid)
        .order('started_at', { ascending: false, nullsFirst: false });
      if (mounted) setEntries(data || []);
    }
    loadEntries();
    return () => {
      mounted = false;
    };
  }, [user.uid]);

  return (
    <section className="space-y-4">
      <div className="flex justify-end">
        <Link href="/tracker/new" className="rounded-lg bg-accent text-white px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity">Add Entry</Link>
      </div>
      <div className="space-y-4">
        {entries.map((entry) => (
          <PerformanceEntryCard
            key={entry.id}
            title={entry.project_name}
            eventName={entry.hackathon_title}
            date={entry.submitted_at ? new Date(entry.submitted_at).toLocaleDateString() : 'N/A'}
            teamSizeLabel={`Team of ${entry.team_size || 1}`}
            status={entry.result ? entry.result.replace('_', '-') : entry.status}
            tags={entry.tech_stack || []}
            description={entry.project_description || ''}
            repoUrl={entry.repo_url}
            projectUrl={entry.demo_url}
          />
        ))}
      </div>
      {!entries.length ? <p className="text-sm text-foreground/65">No entries yet. Add your first hackathon entry.</p> : null}
    </section>
  );
}
