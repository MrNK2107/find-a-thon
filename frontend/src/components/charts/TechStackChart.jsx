'use client';

export default function TechStackChart({ data }) {
  const palette = ['#8bdcd2', '#6ba8ec', '#7f9af8', '#9f87d4', '#aacb9f', '#9ca3d8', '#84b4ff'];

  const words = data.slice(0, 9).map((item, index) => {
    const count = item.count || 0;
    const size = Math.max(20, 14 + count * 4);
    const left = [14, 50, 26, 62, 10, 46, 68, 20, 56][index] || 30;
    const top = [22, 18, 42, 48, 64, 68, 32, 78, 82][index] || 50;
    return {
      ...item,
      size,
      left,
      top,
      color: palette[index % palette.length],
    };
  });

  return (
    <div className="h-72 rounded-2xl border border-border bg-card/80 p-4 shadow-[0_10px_22px_rgba(95,111,152,0.08)] backdrop-blur-md transition-colors duration-300">
      <h3 className="mb-3 text-[30px] font-bold leading-none text-foreground">Skills Used</h3>
      <div className="relative h-[82%] rounded-xl bg-[radial-gradient(circle_at_35%_25%,hsl(var(--card)/0.95),hsl(var(--muted)/0.35)_70%)]">
        {words.map((word) => (
          <span
            key={word.name}
            className="absolute -translate-x-1/2 -translate-y-1/2 font-semibold"
            style={{
              left: `${word.left}%`,
              top: `${word.top}%`,
              fontSize: `${word.size}px`,
              color: word.color,
              opacity: 0.92,
            }}
          >
            {word.name}
          </span>
        ))}

        {!words.length ? (
          <div className="grid h-full place-items-center text-sm font-medium text-foreground/65">No skills logged yet</div>
        ) : null}
      </div>
    </div>
  );
}
