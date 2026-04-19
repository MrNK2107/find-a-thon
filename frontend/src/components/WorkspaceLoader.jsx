'use client';

import { useEffect, useMemo, useState } from 'react';

const MESSAGES = [
  'Preparing your workspace...',
  'Fetching latest hackathons...',
  'Syncing your data...',
];

function SkeletonBlock({ className = '' }) {
  return <div className={`workspace-shimmer rounded-xl bg-muted/70 ${className}`}></div>;
}

export default function WorkspaceLoader() {
  const [messageIndex, setMessageIndex] = useState(0);
  const [progress, setProgress] = useState(6);

  useEffect(() => {
    const messageTimer = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % MESSAGES.length);
    }, 1800);

    return () => clearInterval(messageTimer);
  }, []);

  useEffect(() => {
    const progressTimer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 5;
        const next = prev + Math.floor(Math.random() * 8) + 4;
        return next > 100 ? 100 : next;
      });
    }, 220);

    return () => clearInterval(progressTimer);
  }, []);

  const progressLabel = useMemo(() => `${Math.round(progress)}%`, [progress]);

  return (
    <div className="min-h-screen w-full bg-background px-4 py-8 text-foreground transition-opacity duration-500">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 rounded-3xl border border-border bg-card/70 p-5 shadow-xl backdrop-blur-xl md:p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/60">Workspace</p>
            <p aria-live="polite" className="mt-1 text-lg font-semibold text-foreground transition-all duration-300">
              {MESSAGES[messageIndex]}
            </p>
          </div>
          <div className="hidden h-11 w-11 rounded-full border border-border bg-gradient-to-br from-accent/35 to-cyan-400/30 p-1 md:block">
            <div className="h-full w-full animate-pulse rounded-full bg-card/85"></div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="h-2 overflow-hidden rounded-full bg-muted/90">
            <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-300" style={{ width: `${progress}%` }}></div>
          </div>
          <p className="text-xs font-medium text-foreground/60">Booting modules {progressLabel}</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="rounded-2xl border border-border bg-card/80 p-4 shadow-md">
              <div className="mb-4 flex items-center justify-between">
                <SkeletonBlock className="h-3 w-24" />
                <SkeletonBlock className="h-9 w-9 rounded-lg" />
              </div>
              <SkeletonBlock className="h-8 w-20" />
              <SkeletonBlock className="mt-2 h-3 w-28" />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div key={item} className="rounded-2xl border border-border bg-card/80 p-4 shadow-md">
              <SkeletonBlock className="h-4 w-36" />
              <SkeletonBlock className="mt-2 h-3 w-48" />
              <SkeletonBlock className="mt-4 h-52 w-full rounded-2xl" />
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-border bg-card/80 p-4 shadow-md">
          <SkeletonBlock className="h-4 w-40" />
          <div className="mt-4 space-y-3">
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
                <SkeletonBlock className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <SkeletonBlock className="h-3 w-48" />
                  <SkeletonBlock className="h-3 w-28" />
                </div>
                <SkeletonBlock className="h-6 w-20 rounded-md" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
