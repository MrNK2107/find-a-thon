import { supabase } from '@/lib/supabaseClient';
import HackathonCard from '@/components/HackathonCard';

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
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="text-center p-6 max-w-md bg-white rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Connection Error</h2>
          <p className="text-gray-700">Failed to load hackathon data from Supabase.</p>
          <code className="block mt-4 p-2 bg-gray-100 rounded text-xs text-red-800">
            {error.message}
          </code>
        </div>
      </div>
    );
  }

  // 3. Render Page
  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl tracking-tight">
            Upcoming Hackathons
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Find your next challenge from our curated list.
          </p>
        </header>

        {(!hackathons || hackathons.length === 0) ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-xl">No upcoming hackathons found right now.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {hackathons.map((hackathon) => (
              <HackathonCard key={hackathon.id} hackathon={hackathon} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}