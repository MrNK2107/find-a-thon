import React from 'react';
import Link from 'next/link';

function formatTimeAgo(dateString) {
  if (!dateString) return 'No date';
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const hours = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60)));
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

function getResultBadge(result) {
  if (result === 'won') return { label: '1st Place', className: 'bg-amber-500/15 text-amber-500' };
  if (result === 'runner_up') return { label: 'Runner-up', className: 'bg-violet-500/15 text-violet-500' };
  if (result === 'top_n') return { label: 'Top N', className: 'bg-sky-500/15 text-sky-500' };
  return { label: 'Participated', className: 'bg-emerald-500/15 text-emerald-500' };
}

export default function ActivityFeed({ entries }) {
  return (
    <section className="rounded-2xl border border-border bg-card/80 p-5 shadow-md backdrop-blur-xl transition-colors duration-300">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-foreground">Recent Activity</h3>
          <p className="mt-1 text-sm text-foreground/65">Track your latest submissions and outcomes</p>
        </div>
        <Link
          href="/tracker"
          className="rounded-lg border border-border px-3 py-1.5 text-sm font-semibold text-foreground/80 transition-colors hover:bg-muted/55"
        >
          View all
        </Link>
      </header>

      {entries.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/35 p-6 text-center">
          <p className="text-base font-semibold text-foreground">No activity yet</p>
          <p className="mt-2 text-sm text-foreground/65">
            You have not joined any hackathons yet. Explore opportunities and log your first entry.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <Link
              href="/explore"
              className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Explore now
            </Link>
            <Link
              href="/tracker/new"
              className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground/80 transition-colors hover:bg-muted/55"
            >
              Add a hackathon
            </Link>
          </div>
        </div>
      ) : (
        <ol className="space-y-4">
          {entries.map((entry) => {
            const status = entry.submitted_at ? 'Completed' : 'Ongoing';
            const badge = getResultBadge(entry.result);
            return (
              <li key={entry.id} className="relative rounded-xl border border-border bg-card/85 p-4 pl-10">
                <span className="absolute left-4 top-5 h-2.5 w-2.5 rounded-full bg-blue-500"></span>
                <span className="absolute left-[19px] top-8 h-[calc(100%-24px)] w-px bg-border"></span>

                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-foreground">{entry.project_name || entry.hackathon_title}</p>
                    <p className="truncate text-sm text-foreground/65">{entry.hackathon_title || 'Hackathon entry'}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="rounded-md bg-muted/75 px-2 py-1 font-semibold text-foreground/80">
                      {status}
                    </span>
                    <span className={`rounded-md px-2 py-1 font-semibold ${badge.className}`}>{badge.label}</span>
                    <span className="font-medium text-foreground/60">{formatTimeAgo(entry.submitted_at || entry.created_at)}</span>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
