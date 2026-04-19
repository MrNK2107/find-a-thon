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
  const [savedNotes, setSavedNotes] = useState([]);

  useEffect(() => {
    let mounted = true;

    async function loadSaved() {
      const token = await user.getIdToken();
      const bookmarkRes = await fetch('/api/bookmarks', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!bookmarkRes.ok) {
        if (mounted) {
          setSavedHackathons([]);
          setSavedNotes([]);
        }
        return;
      }

      const bookmarkPayload = await bookmarkRes.json();
      const ids = (bookmarkPayload.savedHackathonIds || []).filter(Boolean);
      if (!ids.length) {
        if (mounted) {
          setSavedHackathons([]);
          setSavedNotes([]);
        }
        return;
      }

      const [{ data: hackathonsData }, { data: entryRows }] = await Promise.all([
        supabase.from('hackathons').select('*').in('id', ids).order('reg_end_date', { ascending: true }),
        supabase
          .from('hackathon_entries')
          .select('id,hackathon_id,hackathon_title,project_name,my_reflection,project_description,updated_at')
          .eq('user_id', user.uid)
          .in('hackathon_id', ids)
          .order('updated_at', { ascending: false }),
      ]);

      if (mounted) {
        setSavedHackathons(hackathonsData || []);
        setSavedNotes(
          (entryRows || []).filter(
            (row) =>
              (row.my_reflection && String(row.my_reflection).trim()) ||
              (row.project_description && String(row.project_description).trim())
          )
        );
      }
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
      <HackathonList hackathons={savedHackathons} searchQuery={searchQuery} showBookmark />

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground/85">My Notes</h2>
        {!savedNotes.length ? (
          <p className="text-sm text-foreground/65">No notes yet for saved hackathons.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {savedNotes.map((note) => (
              <a
                key={note.id}
                href={`/tracker/${note.id}`}
                className="rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted/40"
              >
                <p className="text-sm font-semibold text-foreground">{note.hackathon_title || 'Saved hackathon note'}</p>
                {note.project_name ? <p className="mt-1 text-xs text-foreground/65">{note.project_name}</p> : null}
                <p className="mt-2 text-sm text-foreground/80 line-clamp-3">
                  {note.my_reflection || note.project_description}
                </p>
              </a>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
