'use client';

import { useEffect, useMemo, useState } from 'react';
import ProtectedPage from '@/components/ProtectedPage';
import { supabase } from '@/lib/supabaseClient';
import ActivityBarChart from '@/components/charts/ActivityBarChart';
import ResultDonutChart from '@/components/charts/ResultDonutChart';
import TechStackChart from '@/components/charts/TechStackChart';
import DashboardStatCard from '@/components/DashboardStatCard';
import PerformanceEntryCard from '@/components/PerformanceEntryCard';

function parsePrizeAmount(prize) {
  if (!prize) return 0;
  const match = String(prize).replaceAll(',', '').match(/(\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : 0;
}

export default function DashboardPage() {
  return (
    <ProtectedPage title="Performance Dashboard">
      {(user) => <DashboardContent user={user} />}
    </ProtectedPage>
  );
}

function DashboardContent({ user }) {
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    let mounted = true;
    async function loadEntries() {
      const { data } = await supabase
        .from('hackathon_entries')
        .select('*')
        .eq('user_id', user.uid)
        .order('created_at', { ascending: false });
      if (mounted) setEntries(data || []);
    }
    loadEntries();
    return () => {
      mounted = false;
    };
  }, [user.uid]);

  const stats = useMemo(() => {
    const total = entries.length;
    const wins = entries.filter((entry) => entry.result === 'won').length;
    const winRate = total ? Math.round((wins / total) * 100) : 0;
    const techCount = {};

    entries.forEach((entry) => {
      (entry.tech_stack || []).forEach((tech) => {
        techCount[tech] = (techCount[tech] || 0) + 1;
      });
    });

    const rankedTech = Object.entries(techCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    const avgTeamSize = total ? (entries.reduce((sum, entry) => sum + (entry.team_size || 0), 0) / total).toFixed(1) : '0.0';
    const bestResultOrder = ['won', 'runner_up', 'top_n', 'did_not_place'];
    const bestResult = bestResultOrder.find((result) => entries.some((entry) => entry.result === result)) || 'N/A';

    const submittedDates = entries
      .filter((entry) => entry.submitted_at)
      .map((entry) => new Date(entry.submitted_at))
      .sort((a, b) => a - b);

    let currentStreak = 0;
    let longestStreak = 0;
    for (let index = 0; index < submittedDates.length; index += 1) {
      if (index === 0) {
        currentStreak = 1;
      } else {
        const prev = submittedDates[index - 1];
        const curr = submittedDates[index];
        const dayDiff = Math.round((curr - prev) / (1000 * 60 * 60 * 24));
        currentStreak = dayDiff <= 31 ? currentStreak + 1 : 1;
      }
      longestStreak = Math.max(longestStreak, currentStreak);
    }

    const totalPrize = entries.reduce((sum, entry) => sum + parsePrizeAmount(entry.prize_won), 0);

    return {
      total,
      winRate,
      rankedTech,
      avgTeamSize,
      bestResult,
      longestStreak,
      totalPrize,
    };
  }, [entries]);

  const monthChartData = useMemo(() => {
    const data = [];
    const now = new Date();
    for (let i = 5; i >= 0; i -= 1) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${monthDate.getFullYear()}-${monthDate.getMonth()}`;
      const count = entries.filter((entry) => {
        if (!entry.started_at) return false;
        const date = new Date(entry.started_at);
        return `${date.getFullYear()}-${date.getMonth()}` === monthKey;
      }).length;
      data.push({ month: monthDate.toLocaleString(undefined, { month: 'short' }), count });
    }
    return data;
  }, [entries]);

  const resultChartData = useMemo(() => {
    const groups = ['won', 'runner_up', 'top_n', 'did_not_place'];
    return groups.map((name) => ({ name, value: entries.filter((entry) => entry.result === name).length }));
  }, [entries]);

  const techChartData = useMemo(() => stats.rankedTech.slice(0, 8), [stats.rankedTech]);
  const recentEntries = useMemo(() => entries.slice(0, 3), [entries]);

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardStatCard 
          label="Total Entered" 
          value={stats.total} 
          subtext={`Win Rate: ${stats.winRate}%`}
          variant="neutral"
        />
        <DashboardStatCard 
          label="Best Result" 
          value={stats.bestResult.replace('_', ' ').toUpperCase()} 
          icon="emoji_events"
          variant="success"
        />
        <DashboardStatCard 
          label="Longest Streak" 
          value={stats.longestStreak} 
          icon="local_fire_department"
          variant="primary"
        />
        <DashboardStatCard 
          label="Total Prize" 
          value={`$${stats.totalPrize.toLocaleString()}`} 
          footerText="Cumulative"
          icon="workspace_premium"
          variant="amber"
        />
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <ActivityBarChart data={monthChartData} />
        <ResultDonutChart data={resultChartData} />
        <TechStackChart data={techChartData} />
      </section>

      <section className="bg-surface-container-lowest border border-on-background/[0.12] rounded-xl p-6">
        <h2 className="text-sm font-bold text-secondary tracking-tight mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-lg">history</span>
          RECENT ACTIVITY
        </h2>
        <div className="space-y-4">
          {recentEntries.map((entry) => (
            <PerformanceEntryCard
              key={entry.id}
              title={entry.project_name}
              eventName={entry.hackathon_title}
              date={entry.submitted_at ? new Date(entry.submitted_at).toLocaleDateString() : 'N/A'}
              teamSizeLabel={`Team of ${entry.team_size || 1}`}
              status={entry.result?.replace('_', '-') ?? 'in-progress'}
              tags={entry.tech_stack || []}
              description={entry.project_description || ''}
              repoUrl={entry.repo_url}
              projectUrl={entry.demo_url}
            />
          ))}
          {!recentEntries.length ? <p className="text-sm text-slate-500">No activity yet.</p> : null}
        </div>
      </section>
    </div>
  );
}

