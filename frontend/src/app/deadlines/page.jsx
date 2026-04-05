'use client';

import { useEffect, useState } from 'react';
import ProtectedPage from '@/components/ProtectedPage';
import DeadlineTrackerItem from '@/components/DeadlineTrackerItem';
import { supabase } from '@/lib/supabaseClient';

export default function DeadlinesPage() {
  return (
    <ProtectedPage title="Deadline Tracker">
      {(user) => <DeadlinesContent user={user} />}
    </ProtectedPage>
  );
}

function DeadlinesContent({ user }) {
  const [hackathons, setHackathons] = useState([]);
  const [reminders, setReminders] = useState([]);

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      const [{ data: savedRows }, { data: appliedRows }, { data: reminderRows }] = await Promise.all([
        supabase.from('saved_hackathons').select('hackathon_id').eq('user_id', user.uid),
        supabase.from('hackathon_entries').select('hackathon_id').eq('user_id', user.uid).eq('status', 'applied'),
        supabase.from('reminders').select('*').eq('user_id', user.uid),
      ]);

      const ids = new Set();
      (savedRows || []).forEach((row) => row.hackathon_id && ids.add(row.hackathon_id));
      (appliedRows || []).forEach((row) => row.hackathon_id && ids.add(row.hackathon_id));

      if (!ids.size) {
        if (mounted) {
          setHackathons([]);
          setReminders(reminderRows || []);
        }
        return;
      }

      const { data: hackathonRows } = await supabase
        .from('hackathons')
        .select('*')
        .in('id', Array.from(ids))
        .order('reg_end_date', { ascending: true });

      if (mounted) {
        setHackathons(hackathonRows || []);
        setReminders(reminderRows || []);
      }
    }

    loadData();
    return () => {
      mounted = false;
    };
  }, [user.uid]);

  const getUrgency = (hackathon) => {
    if (!hackathon.reg_end_date) return 'comfortable';
    const deadline = new Date(hackathon.reg_end_date + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const days = Math.round((deadline - today) / (1000 * 60 * 60 * 24));
    if (days <= 3) return 'urgent';
    if (days <= 10) return 'soon';
    return 'comfortable';
  };

  const getTimeText = (hackathon) => {
    if (!hackathon.reg_end_date) return 'TBA';
    const deadline = new Date(hackathon.reg_end_date + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const days = Math.round((deadline - today) / (1000 * 60 * 60 * 24));
    if (days < 0) return 'Ended';
    if (days === 0) return 'Today';
    return `${days} ${days === 1 ? 'day' : 'days'}`;
  };

  return (
    <div className="bg-surface-container-lowest rounded-xl overflow-hidden mt-6 pb-20">
      <div className="flex flex-col">
        {/* Header for Context */}
        <div className="flex items-center px-10 py-4 bg-surface-container-low/30 border-b border-[#c2c6d2]/40">
          <span className="text-[10px] font-bold tracking-widest text-secondary uppercase w-8 flex justify-center">Status</span>
          <span className="text-[10px] font-bold tracking-widest text-secondary uppercase ml-4 flex-1">Hackathon &amp; Source</span>
          <span className="text-[10px] font-bold tracking-widest text-secondary uppercase text-right mr-16">Deadline</span>
        </div>
        {hackathons.map((hackathon) => (
          <DeadlineTrackerItem
            key={hackathon.id}
            hackathonName={hackathon.title}
            source="Find-a-thon"
            deadlineDate={hackathon.reg_end_date ? new Date(hackathon.reg_end_date + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Unknown'}
            deadlineTimeText={getTimeText(hackathon)}
            urgency={getUrgency(hackathon)}
            isBookmarked={true}
            onBookmarkClick={() => {}}
          />
        ))}
        {!hackathons.length ? <p className="text-sm text-slate-500 p-8">No saved/applied hackathons yet.</p> : null}
      </div>
    </div>
  );
}
