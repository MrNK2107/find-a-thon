'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

const statusOptions = ['planning', 'applied', 'participating', 'submitted', 'won', 'lost'];
const resultOptions = ['', 'won', 'runner_up', 'top_n', 'did_not_place'];

export default function EntryForm({ userId, initialValues = {}, hackathons = [], onSaved }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    hackathon_id: initialValues.hackathon_id || '',
    hackathon_title: initialValues.hackathon_title || '',
    project_name: initialValues.project_name || '',
    project_description: initialValues.project_description || '',
    repo_url: initialValues.repo_url || '',
    demo_url: initialValues.demo_url || '',
    tech_stack: initialValues.tech_stack?.join(', ') || '',
    team_size: initialValues.team_size || 1,
    was_solo: initialValues.was_solo ?? true,
    status: initialValues.status || 'planning',
    result: initialValues.result || '',
    prize_won: initialValues.prize_won || '',
    judges_feedback: initialValues.judges_feedback || '',
    my_reflection: initialValues.my_reflection || '',
    started_at: initialValues.started_at || '',
    submitted_at: initialValues.submitted_at || '',
    result_at: initialValues.result_at || '',
  });

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const payload = {
      user_id: userId,
      hackathon_id: form.hackathon_id ? Number(form.hackathon_id) : null,
      hackathon_title: form.hackathon_title || null,
      project_name: form.project_name,
      project_description: form.project_description || null,
      repo_url: form.repo_url || null,
      demo_url: form.demo_url || null,
      tech_stack: form.tech_stack
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean),
      team_size: Number(form.team_size) || 1,
      was_solo: Boolean(form.was_solo),
      status: form.status,
      result: form.result || null,
      prize_won: form.prize_won || null,
      judges_feedback: form.judges_feedback || null,
      my_reflection: form.my_reflection || null,
      started_at: form.started_at || null,
      submitted_at: form.submitted_at || null,
      result_at: form.result_at || null,
      updated_at: new Date().toISOString(),
    };

    if (initialValues.id) {
      await supabase.from('hackathon_entries').update(payload).eq('id', initialValues.id).eq('user_id', userId);
    } else {
      await supabase.from('hackathon_entries').insert({ ...payload, created_at: new Date().toISOString() });
    }

    onSaved?.();
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-4 space-y-4">
      <div className="flex gap-2 text-xs">
        {[1, 2, 3].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setStep(value)}
            className={`px-3 py-1 rounded-full ${step === value ? 'bg-[#185FA5] text-white' : 'bg-slate-100 text-slate-700'}`}
          >
            Step {value}
          </button>
        ))}
      </div>

      {step === 1 ? (
        <div className="space-y-3">
          <label className="block text-sm">Link to existing hackathon</label>
          <select
            value={form.hackathon_id}
            onChange={(event) => {
              const selectedId = event.target.value;
              const selected = hackathons.find((hackathon) => String(hackathon.id) === selectedId);
              updateField('hackathon_id', selectedId);
              if (selected?.title) {
                updateField('hackathon_title', selected.title);
              }
            }}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          >
            <option value="">Select from DB</option>
            {hackathons.map((hackathon) => (
              <option key={hackathon.id} value={hackathon.id}>
                {hackathon.title}
              </option>
            ))}
          </select>

          <input
            placeholder="Or enter hackathon title manually"
            value={form.hackathon_title}
            onChange={(event) => updateField('hackathon_title', event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </div>
      ) : null}

      {step === 2 ? (
        <div className="space-y-3">
          <input
            required
            placeholder="Project name"
            value={form.project_name}
            onChange={(event) => updateField('project_name', event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
          <textarea
            placeholder="Project description"
            value={form.project_description}
            onChange={(event) => updateField('project_description', event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
          <input
            placeholder="Repository URL"
            value={form.repo_url}
            onChange={(event) => updateField('repo_url', event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
          <input
            placeholder="Demo URL"
            value={form.demo_url}
            onChange={(event) => updateField('demo_url', event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
          <input
            placeholder="Tech stack (comma-separated)"
            value={form.tech_stack}
            onChange={(event) => updateField('tech_stack', event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              min="1"
              placeholder="Team size"
              value={form.team_size}
              onChange={(event) => updateField('team_size', event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.was_solo}
                onChange={(event) => updateField('was_solo', event.target.checked)}
              />
              Solo project
            </label>
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <select value={form.status} onChange={(event) => updateField('status', event.target.value)} className="rounded-lg border border-slate-300 px-3 py-2">
              {statusOptions.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
            <select value={form.result} onChange={(event) => updateField('result', event.target.value)} className="rounded-lg border border-slate-300 px-3 py-2">
              {resultOptions.map((result) => (
                <option key={result} value={result}>{result || 'No result yet'}</option>
              ))}
            </select>
          </div>

          <input placeholder="Prize won" value={form.prize_won} onChange={(event) => updateField('prize_won', event.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
          <textarea placeholder="Judges feedback" value={form.judges_feedback} onChange={(event) => updateField('judges_feedback', event.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
          <textarea placeholder="My reflection" value={form.my_reflection} onChange={(event) => updateField('my_reflection', event.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input type="date" value={form.started_at} onChange={(event) => updateField('started_at', event.target.value)} className="rounded-lg border border-slate-300 px-3 py-2" />
            <input type="date" value={form.submitted_at} onChange={(event) => updateField('submitted_at', event.target.value)} className="rounded-lg border border-slate-300 px-3 py-2" />
            <input type="date" value={form.result_at} onChange={(event) => updateField('result_at', event.target.value)} className="rounded-lg border border-slate-300 px-3 py-2" />
          </div>
        </div>
      ) : null}

      <button type="submit" className="bg-[#185FA5] text-white rounded-lg px-4 py-2 font-medium">
        {initialValues.id ? 'Update Entry' : 'Save Entry'}
      </button>
    </form>
  );
}
