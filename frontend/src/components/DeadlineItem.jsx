'use client';

import { supabase } from '@/lib/supabaseClient';

function getUrgencyClass(dateValue) {
  if (!dateValue) return 'bg-slate-100 text-slate-700';
  const daysLeft = (new Date(dateValue).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  if (daysLeft <= 3) return 'bg-red-100 text-red-800';
  if (daysLeft <= 7) return 'bg-amber-100 text-amber-800';
  return 'bg-emerald-100 text-emerald-800';
}

export default function DeadlineItem({ hackathon, userId, reminder }) {
  async function toggleReminder() {
    if (reminder?.id) {
      await supabase.from('reminders').update({ is_active: !reminder.is_active }).eq('id', reminder.id).eq('user_id', userId);
      return;
    }

    await supabase.from('reminders').insert({
      user_id: userId,
      hackathon_id: hackathon.id,
      remind_days_before: 3,
      is_active: true,
    });
  }

  return (
    <article className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between gap-3">
      <div>
        <h3 className="font-semibold text-slate-900">{hackathon.title}</h3>
        <p className="text-sm text-slate-500">
          Deadline: {hackathon.reg_end_date ? new Date(hackathon.reg_end_date).toLocaleDateString() : 'TBA'}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <span className={`rounded-full px-2 py-1 text-xs font-medium ${getUrgencyClass(hackathon.reg_end_date)}`}>
          Urgency
        </span>
        <button type="button" onClick={toggleReminder} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm">
          {reminder?.is_active ? 'Disable reminder' : 'Remind me'}
        </button>
      </div>
    </article>
  );
}
