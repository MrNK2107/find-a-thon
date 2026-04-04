'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function ActivityBarChart({ data }) {
  return (
    <div className="h-72 bg-white border border-slate-200 rounded-xl p-4">
      <h3 className="font-semibold text-slate-900 mb-3">Hackathons per month</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis dataKey="month" stroke="#64748b" />
          <YAxis stroke="#64748b" />
          <Tooltip />
          <Bar dataKey="count" fill="#185FA5" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
