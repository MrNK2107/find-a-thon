import { supabase } from '../lib/supabaseClient';
import ExploreClient from './ExploreClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: "Find-a-thon — Discover Hackathons",
};

export default async function Home() {
    // Determine today string (e.g. "2026-04-05") for filtering expired items
    const todayStr = new Date().toISOString().split('T')[0];

    const { data: hackathons, error } = await supabase
        .from('hackathons')
        .select('*')
        .gte('reg_end_date', todayStr)
        .order('reg_end_date', { ascending: true });

    if (error) {
        console.error('Failed to fetch hackathons from Supabase:', error);
    }

    return <ExploreClient initialHackathons={hackathons || []} />;
}