'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['#f2bb65', '#83d6a4', '#9db2fb', '#f28ab2'];

export default function ResultDonutChart({ data }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="h-72 rounded-2xl border border-border bg-card/80 p-4 shadow-[0_10px_22px_rgba(95,111,152,0.08)] backdrop-blur-md transition-colors duration-300">
      <h3 className="mb-3 text-[30px] font-bold leading-none text-foreground">Results Breakdown</h3>
      <div className="relative grid h-[82%] grid-cols-2 gap-2">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="label" innerRadius={48} outerRadius={68} paddingAngle={2}>
              {data.map((entry, index) => (
                <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name, payload) => [value, payload?.payload?.label || name]}
              contentStyle={{
                borderRadius: '12px',
                border: '1px solid #dce5ff',
                background: 'rgba(255,255,255,0.95)',
                color: '#5f6d9a',
                boxShadow: '0 8px 20px rgba(107,124,180,0.18)',
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        <div className="flex flex-col justify-center gap-2 text-sm">
          {data.map((item, index) => (
            <div key={item.name} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                <span className="font-semibold text-foreground/75">{item.label}</span>
              </div>
              <span className="font-bold text-foreground/80">{item.value}</span>
            </div>
          ))}
        </div>

        <div className="pointer-events-none absolute left-[18%] top-[55%] -translate-x-1/2 -translate-y-1/2 text-center">
          <p className="text-4xl font-extrabold leading-none text-foreground/85">{total}</p>
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-foreground/55">Entries</p>
        </div>
      </div>
    </div>
  );
}
