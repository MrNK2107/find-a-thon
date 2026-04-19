import React from 'react';

export default function ExploreHeader({ liveCount = 0, closingCount = 0, sourceCount = 0 }) {
  const stats = [
    { label: 'open now', value: liveCount },
    { label: 'closing this week', value: closingCount },
    { label: 'sources', value: sourceCount },
  ];

  return (
    <section className="w-full rounded-3xl border border-border bg-card/60 p-6 md:p-10 text-center backdrop-blur-sm">
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
        Discover hackathons worth your time
      </h1>
      <p className="mt-3 text-base text-muted-foreground">
        Scraped fresh from Devpost, Devfolio, Unstop, HackerEarth and more.
      </p>

      <div className="mt-7 flex flex-wrap justify-center gap-3 md:gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-border bg-background/70 px-4 py-2.5"
          >
            <div className="text-lg font-semibold text-foreground">{stat.value}</div>
            <div className="text-sm text-muted-foreground">{stat.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
