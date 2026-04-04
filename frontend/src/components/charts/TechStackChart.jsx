'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function TechStackChart({ data }) {
  return (
    <div className="h-72 bg-white border border-slate-200 rounded-xl p-4">
      <h3 className="font-semibold text-slate-900 mb-3">Tech stack frequency</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
          <XAxis type="number" stroke="#64748b" />
          <YAxis dataKey="name" type="category" stroke="#64748b" width={80} />
          <Tooltip />
          <Bar dataKey="count" fill="#2563eb" radius={[0, 8, 8, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
