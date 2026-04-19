'use client';

import React from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Bar,
  BarChart,
} from 'recharts';

const donutColors = ['#60a5fa', '#34d399', '#fbbf24', '#f87171'];

function EmptyChart({ message }) {
  return (
    <div className="grid h-full place-items-center rounded-xl border border-dashed border-border bg-muted/35 text-center">
      <p className="max-w-[220px] text-sm font-medium text-foreground/65">{message}</p>
    </div>
  );
}

export default function ChartSection({ title, description, type, data }) {
  const hasData = data.some((item) => (item.value ?? item.count ?? 0) > 0);

  return (
    <section className="rounded-2xl border border-border bg-card/80 p-5 shadow-md backdrop-blur-xl transition-colors duration-300">
      <header className="mb-4">
        <h3 className="text-base font-bold text-foreground">{title}</h3>
        <p className="mt-1 text-sm text-foreground/65">{description}</p>
      </header>

      <div className="h-[280px]">
        {!hasData ? <EmptyChart message="No data yet. Start tracking hackathons to unlock analytics." /> : null}

        {hasData && type === 'line' ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 6, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.04} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
              <Tooltip
                formatter={(value) => [`${value}`, 'Hackathons']}
                contentStyle={{ borderRadius: '12px', border: '1px solid #dbeafe', background: 'rgba(255,255,255,0.96)' }}
              />
              <Legend />
              <Area
                dataKey="count"
                name="Hackathons"
                type="monotone"
                stroke="#3b82f6"
                fill="url(#lineGradient)"
                strokeWidth={2.5}
                isAnimationActive
                animationDuration={750}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : null}

        {hasData && type === 'donut' ? (
          <div className="relative h-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="label"
                  innerRadius={62}
                  outerRadius={86}
                  paddingAngle={2}
                  isAnimationActive
                  animationDuration={850}
                >
                  {data.map((entry, idx) => (
                    <Cell key={`${entry.name}-${idx}`} fill={donutColors[idx % donutColors.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [value, name]}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #dbeafe', background: 'rgba(255,255,255,0.96)' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : null}

        {hasData && type === 'skills' ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
              <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
              <YAxis
                type="category"
                dataKey="name"
                width={92}
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#64748b', fontSize: 12 }}
              />
              <Tooltip
                formatter={(value) => [`${value}`, 'Used']}
                contentStyle={{ borderRadius: '12px', border: '1px solid #dbeafe', background: 'rgba(255,255,255,0.96)' }}
              />
              <Legend />
              <Bar
                dataKey="count"
                name="Usage"
                fill="#8b5cf6"
                radius={[0, 8, 8, 0]}
                isAnimationActive
                animationDuration={800}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : null}
      </div>
    </section>
  );
}
