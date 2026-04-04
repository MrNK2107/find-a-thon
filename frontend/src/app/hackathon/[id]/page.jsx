'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import BookmarkButton from '@/components/BookmarkButton';
import { supabase } from '@/lib/supabaseClient';

export default function HackathonDetailPage() {
  const params = useParams();
  const [hackathon, setHackathon] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function loadData() {
      const [{ data: hackathonRow }, { data: userData }] = await Promise.all([
        supabase.from('hackathons').select('*').eq('id', params.id).maybeSingle(),
        supabase.auth.getUser(),
      ]);
      if (mounted) {
        setHackathon(hackathonRow || null);
        setUser(userData?.user || null);
      }
    }
    loadData();
    return () => {
      mounted = false;
    };
  }, [params.id]);

  const formattedDate = useMemo(() => {
    if (!hackathon?.reg_end_date) return 'TBA';
    return new Date(hackathon.reg_end_date).toLocaleDateString();
  }, [hackathon?.reg_end_date]);

  if (!hackathon) {
    return <div className="min-h-screen bg-slate-100 p-6">Hackathon not found.</div>;
  }

  async function markApplied() {
    if (!user?.id) {
      window.location.href = '/auth';
      return;
    }

    await supabase.from('hackathon_entries').upsert(
      {
        user_id: user.id,
        hackathon_id: hackathon.id,
        hackathon_title: hackathon.title,
        status: 'applied',
        project_name: `${hackathon.title} entry`,
        team_size: 1,
        was_solo: true,
        started_at: new Date().toISOString().slice(0, 10),
      },
      { onConflict: 'user_id,hackathon_id' }
    );

    window.open(hackathon.link, '_blank', 'noopener,noreferrer');
  }

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-8">
      <article className="max-w-4xl mx-auto bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">{hackathon.title}</h1>
            <p className="text-sm text-slate-500">{hackathon.organizer || 'Unknown organizer'}</p>
          </div>
          <BookmarkButton hackathonId={hackathon.id} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-slate-700">
          <p><span className="text-slate-500">Mode:</span> {hackathon.mode || 'Online'}</p>
          <p><span className="text-slate-500">Location:</span> {hackathon.location || 'Remote'}</p>
          <p><span className="text-slate-500">Deadline:</span> {formattedDate}</p>
          <p><span className="text-slate-500">Source:</span> {hackathon.source || 'N/A'}</p>
          <p><span className="text-slate-500">Prize:</span> {hackathon.prize || 'N/A'}</p>
          <p><span className="text-slate-500">Status:</span> {hackathon.is_closed ? 'Closed' : 'Live'}</p>
        </div>

        <p className="text-slate-700">{hackathon.description || 'No description available yet.'}</p>

        {(hackathon.themes || []).length ? (
          <div className="flex flex-wrap gap-2">
            {(hackathon.themes || []).map((theme) => (
              <span key={theme} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">{theme}</span>
            ))}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <button onClick={markApplied} className="rounded-lg bg-[#185FA5] text-white px-4 py-2 text-sm font-medium">Apply Now</button>
          <Link href={`/team?hackathon=${encodeURIComponent(hackathon.title)}`} className="rounded-lg border border-slate-300 px-4 py-2 text-sm">Find teammates</Link>
          <Link href={`/tracker/new?hackathonId=${hackathon.id}`} className="rounded-lg border border-slate-300 px-4 py-2 text-sm">Log this entry</Link>
          <a href={hackathon.link} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-slate-300 px-4 py-2 text-sm">Open source page</a>
        </div>
      </article>
    </main>
  );
}
