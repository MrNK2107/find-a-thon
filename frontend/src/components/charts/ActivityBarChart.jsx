'use client';

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export default function ActivityBarChart({ data }) {
  return (
    <div className="h-72 rounded-2xl border border-border bg-card/80 p-4 shadow-[0_10px_22px_rgba(95,111,152,0.08)] backdrop-blur-md transition-colors duration-300">
      <h3 className="mb-3 text-[28px] font-bold leading-none text-foreground">Hackathons Entered Per Month</h3>
      <ResponsiveContainer width="100%" height="82%">
        <AreaChart data={data} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id="monthlyArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7dc4ff" stopOpacity={0.45} />
              <stop offset="100%" stopColor="#7dc4ff" stopOpacity={0.03} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="#d5def2" strokeDasharray="4 4" />
          <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: '#7d89b0', fontSize: 12 }} />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: '#7d89b0', fontSize: 12 }} />
          <Tooltip
            cursor={{ stroke: '#9aa9e8', strokeWidth: 1 }}
            contentStyle={{
              borderRadius: '12px',
              border: '1px solid #dce5ff',
              background: 'rgba(255,255,255,0.95)',
              color: '#5f6d9a',
              boxShadow: '0 8px 20px rgba(107,124,180,0.18)',
            }}
          />
          <Area
            type="monotone"
            dataKey="count"
            stroke="#67a8ee"
            strokeWidth={3}
            fill="url(#monthlyArea)"
            dot={{ r: 4, strokeWidth: 2, stroke: '#67a8ee', fill: '#edf5ff' }}
            activeDot={{ r: 6, fill: '#67a8ee', stroke: '#ffffff', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
