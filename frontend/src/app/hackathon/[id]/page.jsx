'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import BookmarkButton from '@/components/BookmarkButton';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';

export default function HackathonDetailPage() {
  const params = useParams();
  const { user } = useAuth();
  const [hackathon, setHackathon] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function loadData() {
      const { data: hackathonRow } = await supabase
        .from('hackathons')
        .select('*')
        .eq('id', params.id)
        .maybeSingle();

      if (mounted) {
        setHackathon(hackathonRow || null);
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
    return <div className="min-h-screen bg-background p-6 text-foreground">Hackathon not found.</div>;
  }

  async function markApplied() {
    if (!user?.uid) {
      window.location.href = '/auth';
      return;
    }

    await supabase.from('hackathon_entries').upsert(
      {
        user_id: user.uid,
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
    <main className="min-h-screen bg-background p-4 text-foreground transition-colors duration-300 md:p-8">
      <article className="mx-auto max-w-4xl space-y-4 rounded-xl border border-border bg-card p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">{hackathon.title}</h1>
            <p className="text-sm text-foreground/65">{hackathon.organizer || 'Unknown organizer'}</p>
          </div>
          <BookmarkButton hackathonId={hackathon.id} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-foreground/80">
          <p><span className="text-foreground/60">Mode:</span> {hackathon.mode || 'Online'}</p>
          <p><span className="text-foreground/60">Location:</span> {hackathon.location || 'Remote'}</p>
          <p><span className="text-foreground/60">Deadline:</span> {formattedDate}</p>
          <p><span className="text-foreground/60">Source:</span> {hackathon.source || 'N/A'}</p>
          <p><span className="text-foreground/60">Prize:</span> {hackathon.prize || 'N/A'}</p>
          <p><span className="text-foreground/60">Status:</span> {hackathon.is_closed ? 'Closed' : 'Live'}</p>
        </div>

        <p className="text-foreground/80">{hackathon.description || 'No description available yet.'}</p>

        {(hackathon.themes || []).length ? (
          <div className="flex flex-wrap gap-2">
            {(hackathon.themes || []).map((theme) => (
              <span key={theme} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">{theme}</span>
            ))}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <button onClick={markApplied} className="rounded-lg bg-accent text-white px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity">Apply Now</button>
          <Link href={`/team?hackathon=${encodeURIComponent(hackathon.title)}`} className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted/45">Find teammates</Link>
          <Link href={`/tracker/new?hackathonId=${hackathon.id}`} className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted/45">Log this entry</Link>
          <a href={hackathon.link} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted/45">Open source page</a>
        </div>
      </article>
    </main>
  );
}
