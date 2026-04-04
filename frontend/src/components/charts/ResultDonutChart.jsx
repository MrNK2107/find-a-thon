'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['#16a34a', '#84cc16', '#f59e0b', '#dc2626'];

export default function ResultDonutChart({ data }) {
  return (
    <div className="h-72 bg-white border border-slate-200 rounded-xl p-4">
      <h3 className="font-semibold text-slate-900 mb-3">Results breakdown</h3>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90}>
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
