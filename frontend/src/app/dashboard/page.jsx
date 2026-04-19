'use client';

import { useEffect, useMemo, useState } from 'react';
import { Award, BarChart3, Flame, Trophy } from 'lucide-react';
import ProtectedPage from '@/components/ProtectedPage';
import { supabase } from '@/lib/supabaseClient';
import StatsCard from '@/components/dashboard/StatsCard';
import ChartSection from '@/components/dashboard/ChartSection';
import ActivityFeed from '@/components/dashboard/ActivityFeed';

function parsePrizeAmount(prize) {
  if (!prize) return 0;
  const match = String(prize).replaceAll(',', '').match(/(\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : 0;
}

function getBestResultScore(result) {
  if (result === 'won') return 4;
  if (result === 'runner_up') return 3;
  if (result === 'top_n') return 2;
  if (result === 'did_not_place') return 1;
  return 0;
}

function getBestResultLabel(result) {
  if (result === 'won') return 'WON';
  if (result === 'runner_up') return 'RUNNER-UP';
  if (result === 'top_n') return 'TOP N';
  if (result === 'did_not_place') return 'PARTICIPATED';
  return 'N/A';
}

export default function DashboardPage() {
  return (
    <ProtectedPage title="Performance Dashboard" hideDefaultHeader>
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

    const bestResult = entries.reduce((best, entry) => {
      return getBestResultScore(entry.result) > getBestResultScore(best) ? entry.result : best;
    }, '');

    const submittedDates = entries
      .filter((entry) => entry.submitted_at)
      .map((entry) => new Date(entry.submitted_at))
      .sort((a, b) => a - b);

    let longestStreak = 0;
    let currentStreak = 0;

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
      wins,
      winRate,
      rankedTech,
      bestResult: bestResult || 'N/A',
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

      data.push({
        month: monthDate.toLocaleString(undefined, { month: 'short' }),
        count,
      });
    }

    return data;
  }, [entries]);

  const resultChartData = useMemo(() => {
    const groups = ['won', 'runner_up', 'top_n', 'did_not_place'];
    const labels = {
      won: 'Won',
      runner_up: 'Runner-up',
      top_n: 'Top N',
      did_not_place: 'Participated',
    };

    return groups.map((name) => ({
      name,
      label: labels[name],
      value: entries.filter((entry) => entry.result === name).length,
    }));
  }, [entries]);

  const skillChartData = useMemo(() => stats.rankedTech.slice(0, 8), [stats.rankedTech]);
  const recentEntries = useMemo(() => entries.slice(0, 5), [entries]);

  const bestMetric = useMemo(() => {
    if (!stats.total) {
      return {
        title: 'No activity yet',
        message: 'Start by adding a hackathon to unlock personalized insights.',
      };
    }

    const candidates = [
      { key: 'winRate', score: stats.winRate, title: 'Win Rate', message: `You are winning ${stats.winRate}% of tracked hackathons.` },
      { key: 'streak', score: stats.longestStreak * 12, title: 'Streak', message: `Your longest streak is ${stats.longestStreak} consecutive monthly submissions.` },
      { key: 'prize', score: Math.min(100, stats.totalPrize > 0 ? 60 : 0), title: 'Prize', message: `You have earned $${stats.totalPrize.toLocaleString()} in total prizes.` },
      { key: 'volume', score: stats.total * 8, title: 'Consistency', message: `You have tracked ${stats.total} hackathons so far.` },
    ];

    return candidates.sort((a, b) => b.score - a.score)[0];
  }, [stats]);

  const topSkillInsight = useMemo(() => {
    const topSkill = stats.rankedTech[0]?.name;
    if (!topSkill) return 'No skill signal yet. Add entries to see your strongest domain.';
    return `You are most active with ${topSkill} projects right now.`;
  }, [stats.rankedTech]);

  return (
    <div className="space-y-6 rounded-[28px] border border-border bg-card/70 p-4 shadow-[0_24px_60px_rgba(52,78,124,0.16)] backdrop-blur-xl transition-colors duration-300 md:p-6">
      <header className="rounded-2xl border border-border bg-card/80 p-6 shadow-md transition-colors duration-300">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-foreground/60">Overview</p>
        <div className="mt-2 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Performance Dashboard</h1>
            <p className="mt-1 text-sm text-foreground/65">Signed in as {user.email}</p>
          </div>
          <div className="rounded-xl border border-accent/35 bg-accent/12 px-4 py-3 text-sm text-foreground">
            <p className="font-semibold">{bestMetric.title}</p>
            <p className="mt-1">{bestMetric.message}</p>
          </div>
        </div>
      </header>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-foreground/60">Overview Metrics</h2>
          <p className="text-sm text-foreground/65">{stats.total ? topSkillInsight : 'You have not tracked any entries yet.'}</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatsCard
            title="Total Hackathons"
            value={stats.total}
            subtext={stats.total ? `+${stats.total} entries tracked` : 'No activity yet'}
            icon={BarChart3}
            tone="blue"
          />
          <StatsCard
            title="Best Result"
            value={getBestResultLabel(stats.bestResult)}
            subtext={stats.wins ? `${stats.wins} wins recorded` : 'No podium finish yet'}
            icon={Award}
            tone="emerald"
          />
          <StatsCard
            title="Longest Streak"
            value={stats.longestStreak}
            subtext={stats.longestStreak ? `+${stats.longestStreak} month momentum` : 'No streak yet'}
            icon={Flame}
            tone="violet"
          />
          <StatsCard
            title="Total Prize"
            value={`$${stats.totalPrize.toLocaleString()}`}
            subtext={stats.totalPrize ? 'Cumulative prize value' : 'No prize tracked'}
            icon={Trophy}
            tone="amber"
          />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-foreground/60">Analytics</h2>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <ChartSection
            title="Hackathons per month"
            description="Submission activity trend over the last 6 months"
            type="line"
            data={monthChartData}
          />
          <ChartSection
            title="Results breakdown"
            description="How your outcomes are distributed"
            type="donut"
            data={resultChartData}
          />
          <ChartSection
            title="Skills used"
            description="Most frequent technologies in your entries"
            type="skills"
            data={skillChartData}
          />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-foreground/60">Activity</h2>
        <ActivityFeed entries={recentEntries} />
      </section>
    </div>
  );
}
