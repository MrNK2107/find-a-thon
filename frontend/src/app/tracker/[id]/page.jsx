'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import ProtectedPage from '@/components/ProtectedPage';
import EntryForm from '@/components/EntryForm';
import StatusBadge from '@/components/StatusBadge';
import { supabase } from '@/lib/supabaseClient';

export default function TrackerDetailPage() {
  return (
    <ProtectedPage title="Entry Details">
      {(user) => <TrackerDetailContent user={user} />}
    </ProtectedPage>
  );
}

function TrackerDetailContent({ user }) {
  const params = useParams();
  const searchParams = useSearchParams();
  const editMode = searchParams.get('edit') === '1';
  const [entry, setEntry] = useState(null);
  const [hackathons, setHackathons] = useState([]);

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      const [{ data: entryRow }, { data: hackathonRows }] = await Promise.all([
        supabase.from('hackathon_entries').select('*').eq('id', params.id).eq('user_id', user.uid).maybeSingle(),
        supabase.from('hackathons').select('id,title').order('reg_end_date', { ascending: true }),
      ]);

      if (mounted) {
        setEntry(entryRow || null);
        setHackathons(hackathonRows || []);
      }
    }

    loadData();
    return () => {
      mounted = false;
    };
  }, [params.id, user.uid]);

  const reflection = useMemo(() => entry?.my_reflection || 'No reflection yet.', [entry]);

  if (!entry) {
    return <p className="text-sm text-slate-500">Entry not found.</p>;
  }

  if (editMode) {
    return (
      <EntryForm
        userId={user.uid}
        initialValues={entry}
        hackathons={hackathons}
        onSaved={() => (window.location.href = `/tracker/${entry.id}`)}
      />
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-900">{entry.project_name}</h2>
        <a href={`?edit=1`} className="text-sm text-[#185FA5]">Edit Entry</a>
      </div>

      <p className="text-sm text-slate-500">{entry.hackathon_title || 'Unknown hackathon'}</p>
      <div className="flex gap-2">
        <StatusBadge value={entry.status} />
        {entry.result ? <StatusBadge value={entry.result} type="result" /> : null}
      </div>

      <p className="text-sm text-slate-700">{entry.project_description || 'No project description provided.'}</p>
      <p className="text-sm text-slate-700">{reflection}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-slate-600">
        <p>Repo: {entry.repo_url || 'N/A'}</p>
        <p>Demo: {entry.demo_url || 'N/A'}</p>
        <p>Team size: {entry.team_size || 1}</p>
        <p>Solo: {entry.was_solo ? 'Yes' : 'No'}</p>
        <p>Started at: {entry.started_at ? new Date(entry.started_at).toLocaleDateString() : 'N/A'}</p>
        <p>Submitted at: {entry.submitted_at ? new Date(entry.submitted_at).toLocaleDateString() : 'N/A'}</p>
      </div>
    </div>
  );
}
