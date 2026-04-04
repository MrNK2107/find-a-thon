'use client';

import { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

export default function BookmarkButton({ hackathonId }) {
  const [isSaved, setIsSaved] = useState(false);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function loadState() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!mounted) return;
      setUserId(user?.id || null);

      if (!user?.id || !hackathonId) return;
      const { data } = await supabase
        .from('saved_hackathons')
        .select('id')
        .eq('user_id', user.id)
        .eq('hackathon_id', hackathonId)
        .maybeSingle();
      setIsSaved(Boolean(data));
    }

    loadState();
    return () => {
      mounted = false;
    };
  }, [hackathonId]);

  async function toggleSaved(event) {
    event.preventDefault();
    event.stopPropagation();

    if (!userId) {
      window.location.href = '/auth';
      return;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    const response = await fetch('/api/bookmarks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.access_token || ''}`,
      },
      body: JSON.stringify({ hackathonId }),
    });

    if (!response.ok) {
      return;
    }

    const payload = await response.json();
    setIsSaved(Boolean(payload.saved));
  }

  return (
    <button
      onClick={toggleSaved}
      className={`rounded-full p-2 border backdrop-blur-md ${
        isSaved ? 'bg-rose-500/90 border-rose-400 text-white' : 'bg-white/80 border-slate-200 text-slate-700'
      }`}
      aria-label="Toggle bookmark"
    >
      <Heart size={14} fill={isSaved ? 'currentColor' : 'none'} />
    </button>
  );
}
