import React from 'react';

const toneMap = {
  blue: {
    ring: 'ring-blue-500/25',
    iconBg: 'bg-blue-500/12',
    iconColor: 'text-blue-500',
    valueColor: 'text-foreground',
    subColor: 'text-blue-600',
  },
  emerald: {
    ring: 'ring-emerald-500/25',
    iconBg: 'bg-emerald-500/12',
    iconColor: 'text-emerald-500',
    valueColor: 'text-emerald-600',
    subColor: 'text-emerald-500',
  },
  amber: {
    ring: 'ring-amber-500/25',
    iconBg: 'bg-amber-500/12',
    iconColor: 'text-amber-500',
    valueColor: 'text-amber-500',
    subColor: 'text-amber-500',
  },
  violet: {
    ring: 'ring-violet-500/25',
    iconBg: 'bg-violet-500/12',
    iconColor: 'text-violet-500',
    valueColor: 'text-violet-500',
    subColor: 'text-violet-500',
  },
};

export default function StatsCard({ title, value, subtext, icon: Icon, tone = 'blue' }) {
  const palette = toneMap[tone] || toneMap.blue;

  return (
    <article
      className={`group rounded-2xl border border-border bg-card/80 p-5 shadow-md backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:ring-1 ${palette.ring}`}
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-foreground/60">{title}</p>
        </div>
        {Icon ? (
          <span className={`grid h-10 w-10 place-items-center rounded-xl ${palette.iconBg}`}>
            <Icon className={`h-5 w-5 ${palette.iconColor}`} />
          </span>
        ) : null}
      </div>

      <p className={`text-3xl font-bold tracking-tight ${palette.valueColor}`}>{value}</p>
      <p className={`mt-1 text-sm font-medium ${palette.subColor}`}>{subtext}</p>
    </article>
  );
}
