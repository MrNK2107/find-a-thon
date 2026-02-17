import { supabase } from '@/lib/supabaseClient';
import Navbar from '@/components/Navbar';
import HackathonList from '@/components/HackathonList';

// Force dynamic rendering so we see new DB entries on refresh without rebuilding
export const dynamic = 'force-dynamic';

export default async function Home() {
  // 1. Fetch data from Supabase
  const { data: hackathons, error } = await supabase
    .from('hackathons')
    .select('*')
    .order('reg_end_date', { ascending: true });

  // 2. Handle Errors
  if (error) {
    console.error("Error fetching hackathons:", error);
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f172a]">
        <div className="text-center p-8 max-w-md bg-slate-800 rounded-2xl shadow-xl border border-red-900/50">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-900/20 mb-4">
            <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Connection Error</h2>
          <p className="text-slate-400 mb-4">Failed to load hackathon data. Please try again later.</p>
          <code className="block p-3 bg-slate-900/50 rounded-lg text-xs text-red-400 font-mono break-all border border-slate-700">
            {error.message}
          </code>
        </div>
      </div>
    );
  }

  // 3. Render Page
  return (
    <main className="min-h-screen bg-[#0f172a] text-slate-100 font-sans selection:bg-blue-500/30">
      <Navbar />
      <HackathonList initialHackathons={hackathons || []} />
    </main>
  );
}