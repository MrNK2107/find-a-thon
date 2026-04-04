'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import ProtectedPage from '@/components/ProtectedPage';
import TeamListingCard from '@/components/TeamListingCard';
import TeamListingForm from '@/components/TeamListingForm';
import { supabase } from '@/lib/supabaseClient';

export default function TeamPage() {
  return (
    <ProtectedPage title="Team Finder">
      {(user) => <TeamContent user={user} />}
    </ProtectedPage>
  );
}

function TeamContent({ user }) {
  const searchParams = useSearchParams();
  const [listings, setListings] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [skillFilter, setSkillFilter] = useState('');
  const [hackathonFilter, setHackathonFilter] = useState(searchParams.get('hackathon') || '');
  const [availableSpotsFilter, setAvailableSpotsFilter] = useState('all');

  async function loadData() {
    const [{ data: listingRows }, { data: profileRows }] = await Promise.all([
      supabase.from('team_listings').select('*').eq('is_open', true).order('created_at', { ascending: false }),
      supabase.from('profiles').select('id,name,skills,experience_level'),
    ]);

    setListings(listingRows || []);
    setProfiles(profileRows || []);
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredListings = useMemo(() => {
    return listings.filter((listing) => {
      const skillMatch = !skillFilter || (listing.looking_for_skills || []).some((skill) => skill.toLowerCase().includes(skillFilter.toLowerCase()));
      const hackathonMatch = !hackathonFilter || (listing.hackathon_title || '').toLowerCase().includes(hackathonFilter.toLowerCase());
      const spotsAvailable = (listing.team_size_max || 0) - (listing.team_size_current || 0);
      const spotsMatch =
        availableSpotsFilter === 'all' ||
        (availableSpotsFilter === '1+' && spotsAvailable >= 1) ||
        (availableSpotsFilter === '2+' && spotsAvailable >= 2);
      return skillMatch && hackathonMatch && spotsMatch;
    });
  }, [listings, skillFilter, hackathonFilter, availableSpotsFilter]);

  const myListings = useMemo(() => listings.filter((listing) => listing.user_id === user.id), [listings, user.id]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <input value={skillFilter} onChange={(event) => setSkillFilter(event.target.value)} placeholder="Filter by skill" className="rounded-lg border border-slate-300 px-3 py-2" />
        <input value={hackathonFilter} onChange={(event) => setHackathonFilter(event.target.value)} placeholder="Filter by hackathon" className="rounded-lg border border-slate-300 px-3 py-2" />
        <select value={availableSpotsFilter} onChange={(event) => setAvailableSpotsFilter(event.target.value)} className="rounded-lg border border-slate-300 px-3 py-2">
          <option value="all">All availability</option>
          <option value="1+">At least 1 spot</option>
          <option value="2+">At least 2 spots</option>
        </select>
      </div>

      <TeamListingForm userId={user.id} onCreated={loadData} />

      <section>
        <h2 className="text-lg font-semibold text-slate-900 mb-3">Open listings</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredListings.map((listing) => (
            <TeamListingCard
              key={listing.id}
              hackathonName={listing.hackathon_title || 'General Team'}
              status={listing.is_open ? 'Open' : 'Closed'}
              leader={{ 
                name: profiles.find((p) => p.id === listing.user_id)?.name || 'Unknown User', 
                initials: (profiles.find((p) => p.id === listing.user_id)?.name || 'U').substring(0, 2).toUpperCase(), 
                level: profiles.find((p) => p.id === listing.user_id)?.experience_level || 'Beginner', 
                colorTheme: ['primary', 'secondary', 'tertiary'][listing.id % 3] || 'primary' 
              }}
              lookingFor={listing.looking_for_skills || []}
              spots={{ filled: listing.team_size_current || 1, total: listing.team_size_max || 4 }}
              description={listing.description || ''}
              onExpressInterest={() => {}}
            />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900 mb-3">My listings</h2>
        <div className="space-y-3">
          {myListings.map((listing) => (
            <div key={listing.id} className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between">
              <p className="text-sm text-slate-700">{listing.hackathon_title || 'General listing'}</p>
              <button
                onClick={async () => {
                  await supabase.from('team_listings').update({ is_open: false }).eq('id', listing.id).eq('user_id', user.id);
                  loadData();
                }}
                className="text-sm text-red-700"
              >
                Close listing
              </button>
            </div>
          ))}
          {!myListings.length ? <p className="text-sm text-slate-500">You have no active listings.</p> : null}
        </div>
      </section>
    </div>
  );
}
