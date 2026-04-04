export default function StatusBadge({ value, type = 'status' }) {
  const normalized = String(value || '').toLowerCase();
  const palette = {
    planning: 'bg-slate-100 text-slate-700',
    applied: 'bg-blue-100 text-blue-800',
    participating: 'bg-amber-100 text-amber-800',
    submitted: 'bg-indigo-100 text-indigo-800',
    won: 'bg-emerald-100 text-emerald-800',
    runner_up: 'bg-green-100 text-green-800',
    top_n: 'bg-lime-100 text-lime-800',
    did_not_place: 'bg-rose-100 text-rose-800',
    lost: 'bg-red-100 text-red-800',
  };

  const className = palette[normalized] || 'bg-slate-100 text-slate-700';
  const label = normalized ? normalized.replaceAll('_', ' ') : type;

  return <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${className}`}>{label}</span>;
}
