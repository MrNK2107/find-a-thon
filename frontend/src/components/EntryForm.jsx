'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

const statusOptions = ['planning', 'building', 'submitted'];
const resultOptions = ['', 'won', 'runner_up', 'top_n', 'did_not_place'];
const steps = [
  { id: 1, title: 'Basic Info', subtitle: 'Choose your hackathon and outcome stage' },
  { id: 2, title: 'Timeline', subtitle: 'Set key journey dates' },
  { id: 3, title: 'Project Details', subtitle: 'Capture outcomes and reflection' },
];

const inputClassName =
  'mt-2 h-11 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground placeholder:text-foreground/45 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20';
const textareaClassName =
  'mt-2 w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-foreground/45 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20';
const selectClassName = inputClassName;

export default function EntryForm({ userId, initialValues = {}, hackathons = [], onSaved }) {
  const today = new Date().toISOString().slice(0, 10);
  const [step, setStep] = useState(1);
  const [dateError, setDateError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');
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
    started_at: initialValues.started_at || today,
    submitted_at: initialValues.submitted_at || '',
    result_at: initialValues.result_at || '',
  });

  const visibleStatusOptions = statusOptions.includes(form.status)
    ? statusOptions
    : [form.status, ...statusOptions];

  function updateField(key, value) {
    if (key === 'started_at' || key === 'result_at') {
      setDateError('');
    }
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaveError('');
    setSaveSuccess('');

    if (form.started_at && form.result_at && form.result_at < form.started_at) {
      setDateError('End Date must be the same as or after Start Date.');
      setStep(2);
      return;
    }

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

    setIsSaving(true);
    try {
      const query = initialValues.id
        ? supabase
            .from('hackathon_entries')
            .update(payload)
            .eq('id', initialValues.id)
            .eq('user_id', userId)
        : supabase
            .from('hackathon_entries')
            .insert({ ...payload, created_at: new Date().toISOString() });

      const { error } = await query;
      if (error) {
        throw error;
      }

      setSaveSuccess(initialValues.id ? 'Entry updated successfully.' : 'Entry saved successfully.');
      window.setTimeout(() => {
        onSaved?.();
      }, 700);
    } catch (error) {
      setSaveError(error?.message || 'Something went wrong while saving. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto flex w-full max-w-4xl flex-col gap-8">
      <div className="rounded-2xl border border-border bg-card/70 p-4 shadow-[0_12px_24px_rgba(89,104,151,0.08)] backdrop-blur-xl sm:p-5">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {steps.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setStep(item.id)}
              className={`w-full rounded-xl border px-4 py-3 text-left transition-colors ${
                step === item.id
                  ? 'border-accent bg-accent/10 text-foreground shadow-[0_0_0_1px_rgba(122,139,248,0.5)]'
                  : 'border-border bg-card text-foreground/75 hover:bg-muted/60'
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                    step === item.id ? 'bg-accent text-white' : 'bg-muted text-foreground/80'
                  }`}
                >
                  {item.id}
                </span>
                <span className="text-sm font-semibold">{item.title}</span>
              </div>
              <p className="mt-1 text-xs text-foreground/65">{item.subtitle}</p>
            </button>
          ))}
        </div>
      </div>

      {step === 1 ? (
        <section className="rounded-2xl border border-border bg-card/80 p-6 shadow-[0_14px_28px_rgba(89,104,151,0.08)] backdrop-blur-md">
          <div className="mb-5">
            <h2 className="text-lg font-bold text-foreground">Basic Info</h2>
            <p className="mt-1 text-sm text-foreground/65">Add the core details of this hackathon entry.</p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label htmlFor="hackathonSelect" className="text-sm font-semibold text-foreground">
                Hackathon Name (Select)
              </label>
              <select
                id="hackathonSelect"
                value={form.hackathon_id}
                onChange={(event) => {
                  const selectedId = event.target.value;
                  const selected = hackathons.find((hackathon) => String(hackathon.id) === selectedId);
                  updateField('hackathon_id', selectedId);
                  if (selected?.title) {
                    updateField('hackathon_title', selected.title);
                  }
                  if (!form.submitted_at && selected?.reg_end_date) {
                    updateField('submitted_at', selected.reg_end_date);
                  }
                }}
                className={selectClassName}
              >
                <option value="">Select an existing hackathon</option>
                {hackathons.map((hackathon) => (
                  <option key={hackathon.id} value={hackathon.id}>
                    {hackathon.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="hackathonTitle" className="text-sm font-semibold text-foreground">
                Hackathon Name (Manual)
              </label>
              <input
                id="hackathonTitle"
                placeholder="Type hackathon name if not listed"
                value={form.hackathon_title}
                onChange={(event) => updateField('hackathon_title', event.target.value)}
                className={inputClassName}
              />
            </div>

            <div>
              <label htmlFor="status" className="text-sm font-semibold text-foreground">
                Status
              </label>
              <select
                id="status"
                value={form.status}
                onChange={(event) => updateField('status', event.target.value)}
                className={selectClassName}
              >
                {visibleStatusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="result" className="text-sm font-semibold text-foreground">
                Result
              </label>
              <select
                id="result"
                value={form.result}
                onChange={(event) => updateField('result', event.target.value)}
                className={selectClassName}
              >
                {resultOptions.map((result) => (
                  <option key={result} value={result}>
                    {result ? result.replaceAll('_', ' ') : 'No result yet'}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>
      ) : null}

      {step === 2 ? (
        <section className="rounded-2xl border border-border bg-card/80 p-6 shadow-[0_14px_28px_rgba(89,104,151,0.08)] backdrop-blur-md">
          <div className="mb-5">
            <h2 className="text-lg font-bold text-foreground">Timeline</h2>
            <p className="mt-1 text-sm text-foreground/65">Map your timeline from kickoff to final submission.</p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            <div>
              <label htmlFor="started_at" className="text-sm font-semibold text-foreground">
                Start Date
              </label>
              <input
                id="started_at"
                type="date"
                value={form.started_at}
                onChange={(event) => updateField('started_at', event.target.value)}
                className={inputClassName}
              />
            </div>

            <div>
              <label htmlFor="result_at" className="text-sm font-semibold text-foreground">
                End Date
              </label>
              <input
                id="result_at"
                type="date"
                value={form.result_at}
                min={form.started_at || undefined}
                onChange={(event) => updateField('result_at', event.target.value)}
                className={inputClassName}
              />
            </div>

            <div>
              <label htmlFor="submitted_at" className="text-sm font-semibold text-foreground">
                Submission Deadline
              </label>
              <input
                id="submitted_at"
                type="date"
                value={form.submitted_at}
                onChange={(event) => updateField('submitted_at', event.target.value)}
                className={inputClassName}
              />
            </div>
          </div>

          {dateError ? <p className="mt-4 text-sm font-medium text-red-500">{dateError}</p> : null}
        </section>
      ) : null}

      {step === 3 ? (
        <section className="rounded-2xl border border-border bg-card/80 p-6 shadow-[0_14px_28px_rgba(89,104,151,0.08)] backdrop-blur-md">
          <div className="mb-5">
            <h2 className="text-lg font-bold text-foreground">Project Details</h2>
            <p className="mt-1 text-sm text-foreground/65">
              Capture what you built, what happened, and what you learned.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label htmlFor="project_name" className="text-sm font-semibold text-foreground">
                Project Name
              </label>
              <input
                id="project_name"
                required
                placeholder="Enter your project name"
                value={form.project_name}
                onChange={(event) => updateField('project_name', event.target.value)}
                className={inputClassName}
              />
            </div>

            <div>
              <label htmlFor="prize_won" className="text-sm font-semibold text-foreground">
                Prize Won
              </label>
              <input
                id="prize_won"
                placeholder="Example: 1st Place, Best AI Hack"
                value={form.prize_won}
                onChange={(event) => updateField('prize_won', event.target.value)}
                className={inputClassName}
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="project_description" className="text-sm font-semibold text-foreground">
                Project Description
              </label>
              <textarea
                id="project_description"
                rows={3}
                placeholder="What problem did your project solve?"
                value={form.project_description}
                onChange={(event) => updateField('project_description', event.target.value)}
                className={textareaClassName}
              />
            </div>

            <div>
              <label htmlFor="repo_url" className="text-sm font-semibold text-foreground">
                Repository URL
              </label>
              <input
                id="repo_url"
                placeholder="https://github.com/you/project"
                value={form.repo_url}
                onChange={(event) => updateField('repo_url', event.target.value)}
                className={inputClassName}
              />
            </div>

            <div>
              <label htmlFor="demo_url" className="text-sm font-semibold text-foreground">
                Demo URL
              </label>
              <input
                id="demo_url"
                placeholder="https://demo-link.com"
                value={form.demo_url}
                onChange={(event) => updateField('demo_url', event.target.value)}
                className={inputClassName}
              />
            </div>

            <div>
              <label htmlFor="tech_stack" className="text-sm font-semibold text-foreground">
                Tech Stack
              </label>
              <input
                id="tech_stack"
                placeholder="React, Supabase, Tailwind"
                value={form.tech_stack}
                onChange={(event) => updateField('tech_stack', event.target.value)}
                className={inputClassName}
              />
            </div>

            <div className="grid grid-cols-[1fr_auto] items-end gap-3">
              <div>
                <label htmlFor="team_size" className="text-sm font-semibold text-foreground">
                  Team Size
                </label>
                <input
                  id="team_size"
                  type="number"
                  min="1"
                  placeholder="1"
                  value={form.team_size}
                  onChange={(event) => updateField('team_size', event.target.value)}
                  className={inputClassName}
                />
              </div>
              <label className="mb-2 flex h-11 items-center gap-2 rounded-xl border border-border bg-card px-3 text-sm font-medium text-foreground">
                <input
                  type="checkbox"
                  checked={form.was_solo}
                  onChange={(event) => updateField('was_solo', event.target.checked)}
                />
                Solo
              </label>
            </div>

            <div className="md:col-span-2">
              <label htmlFor="judges_feedback" className="text-sm font-semibold text-foreground">
                Judge Feedback
              </label>
              <textarea
                id="judges_feedback"
                rows={3}
                placeholder="What feedback did judges share?"
                value={form.judges_feedback}
                onChange={(event) => updateField('judges_feedback', event.target.value)}
                className={textareaClassName}
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="my_reflection" className="text-sm font-semibold text-foreground">
                Reflection
              </label>
              <textarea
                id="my_reflection"
                rows={4}
                placeholder="What worked well, what would you change, and what did you learn?"
                value={form.my_reflection}
                onChange={(event) => updateField('my_reflection', event.target.value)}
                className={textareaClassName}
              />
            </div>
          </div>
        </section>
      ) : null}

      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card/80 p-4 shadow-[0_14px_28px_rgba(89,104,151,0.08)] backdrop-blur-md sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setStep((prev) => Math.max(1, prev - 1))}
            disabled={step === 1 || isSaving}
            className="h-11 rounded-xl border border-border bg-card px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted/60 disabled:cursor-not-allowed disabled:opacity-45"
          >
            Back
          </button>

          {step < steps.length ? (
            <button
              type="button"
              onClick={() => setStep((prev) => Math.min(steps.length, prev + 1))}
              disabled={isSaving}
              className="h-11 rounded-xl border border-border bg-card px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted/60 disabled:cursor-not-allowed disabled:opacity-45"
            >
              Next
            </button>
          ) : null}
        </div>

        <div className="flex flex-col items-start gap-2 sm:items-end">
          <button
            type="submit"
            disabled={isSaving}
            className="h-11 rounded-xl bg-accent px-6 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(122,139,248,0.35)] transition-all hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSaving ? 'Saving Entry...' : initialValues.id ? 'Update Entry' : 'Save Entry'}
          </button>

          {saveSuccess ? <p className="text-sm font-medium text-emerald-500">{saveSuccess}</p> : null}
          {saveError ? <p className="text-sm font-medium text-red-500">{saveError}</p> : null}
        </div>
      </div>
    </form>
  );
}
