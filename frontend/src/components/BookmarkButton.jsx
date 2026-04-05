'use client';
import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import { supabase } from '@/lib/supabaseClient';

export default function BookmarkButton({ hackathonId }) {
  const [isSaved, setIsSaved] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState(null);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(u => setFirebaseUser(u));
    return unsub;
  }, []);

  useEffect(() => {
    if (!firebaseUser || !hackathonId) return;
    supabase
      .from('saved_hackathons')
      .select('id')
      .eq('user_id', firebaseUser.uid)
      .eq('hackathon_id', hackathonId)
      .maybeSingle()
      .then(({ data }) => setIsSaved(Boolean(data)));
  }, [firebaseUser, hackathonId]);

  async function toggleSaved(e) {
    e.preventDefault(); e.stopPropagation();
    if (!firebaseUser) { window.location.href = '/auth'; return; }
    const token = await firebaseUser.getIdToken();
    const res = await fetch('/api/bookmarks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ hackathonId }),
    });
    if (res.ok) {
      const payload = await res.json();
      setIsSaved(Boolean(payload.saved));
    }
  }

  // SVG bookmark icon — no Material Symbols dependency
  return (
    <button
      onClick={toggleSaved}
      aria-label="Toggle bookmark"
      className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-colors ${
        isSaved
          ? 'bg-[#EEEDFE] border-[#AFA9EC] text-[#534AB7]'
          : 'bg-white border-[#E2E3E1] text-[#9B9B98] hover:border-[#C2C6D2]'
      }`}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill={isSaved ? 'currentColor' : 'none'}
           stroke="currentColor" strokeWidth="2">
        <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
      </svg>
    </button>
  );
}
