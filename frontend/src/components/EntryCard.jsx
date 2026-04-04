import Link from 'next/link';
import StatusBadge from '@/components/StatusBadge';

export default function EntryCard({ entry }) {
  return (
    <Link
      href={`/tracker/${entry.id}`}
      className="block bg-white border border-slate-200 rounded-xl p-4 hover:shadow-sm transition-shadow"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-slate-900">{entry.project_name || 'Untitled project'}</h3>
          <p className="text-sm text-slate-500">{entry.hackathon_title || 'Unknown hackathon'}</p>
        </div>
        <StatusBadge value={entry.status} />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {(entry.tech_stack || []).slice(0, 4).map((tech) => (
          <span key={tech} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
            {tech}
          </span>
        ))}
      </div>

      <div className="mt-4 text-sm text-slate-600 line-clamp-2">
        {entry.my_reflection || 'No reflection added yet.'}
      </div>

      <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
        <span>Team size: {entry.team_size || 1}</span>
        {entry.result ? <StatusBadge value={entry.result} type="result" /> : null}
      </div>
    </Link>
  );
}
