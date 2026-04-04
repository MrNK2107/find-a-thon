'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function TeamListingForm({ userId, onCreated }) {
  const [form, setForm] = useState({
    hackathon_title: '',
    looking_for_skills: '',
    team_size_current: 1,
    team_size_max: 4,
    description: '',
    contact_method: '',
  });

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    await supabase.from('team_listings').insert({
      user_id: userId,
      hackathon_title: form.hackathon_title,
      looking_for_skills: form.looking_for_skills.split(',').map((v) => v.trim()).filter(Boolean),
      team_size_current: Number(form.team_size_current),
      team_size_max: Number(form.team_size_max),
      description: form.description,
      contact_method: form.contact_method,
      is_open: true,
    });

    setForm({
      hackathon_title: '',
      looking_for_skills: '',
      team_size_current: 1,
      team_size_max: 4,
      description: '',
      contact_method: '',
    });

    onCreated?.();
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
      <h2 className="font-semibold text-slate-900">Post a listing</h2>
      <input placeholder="Hackathon title" value={form.hackathon_title} onChange={(e) => updateField('hackathon_title', e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
      <input placeholder="Skills needed (comma-separated)" value={form.looking_for_skills} onChange={(e) => updateField('looking_for_skills', e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
      <div className="grid grid-cols-2 gap-3">
        <input type="number" min="1" value={form.team_size_current} onChange={(e) => updateField('team_size_current', e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2" />
        <input type="number" min="1" value={form.team_size_max} onChange={(e) => updateField('team_size_max', e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2" />
      </div>
      <textarea placeholder="Describe your team and project idea" value={form.description} onChange={(e) => updateField('description', e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
      <input placeholder="Contact method (Discord/email/WhatsApp)" value={form.contact_method} onChange={(e) => updateField('contact_method', e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
      <button type="submit" className="rounded-lg bg-[#185FA5] text-white px-4 py-2">Create listing</button>
    </form>
  );
}
