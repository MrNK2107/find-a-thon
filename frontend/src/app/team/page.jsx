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
    const [{ data: listingRows }, profileResult] = await Promise.all([
      supabase.from('team_listings').select('*').eq('is_open', true).order('created_at', { ascending: false }),
      supabase.from('profiles').select('id,name,skills,experience_level'),
    ]);

    let profileRows = profileResult?.data || [];
    if (profileResult?.error) {
      const fallbackProfiles = await supabase.from('profiles').select('user_id,name,skills,experience_level');
      if (!fallbackProfiles.error) {
        profileRows = (fallbackProfiles.data || []).map((row) => ({
          id: row.user_id,
          name: row.name,
          skills: row.skills,
          experience_level: row.experience_level,
        }));
      }
    }

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

  const myListings = useMemo(() => listings.filter((listing) => listing.user_id === user.uid), [listings, user.uid]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <input value={skillFilter} onChange={(event) => setSkillFilter(event.target.value)} placeholder="Filter by skill" className="rounded-lg border border-border bg-card px-3 py-2 text-foreground" />
        <input value={hackathonFilter} onChange={(event) => setHackathonFilter(event.target.value)} placeholder="Filter by hackathon" className="rounded-lg border border-border bg-card px-3 py-2 text-foreground" />
        <select value={availableSpotsFilter} onChange={(event) => setAvailableSpotsFilter(event.target.value)} className="rounded-lg border border-border bg-card px-3 py-2 text-foreground">
          <option value="all">All availability</option>
          <option value="1+">At least 1 spot</option>
          <option value="2+">At least 2 spots</option>
        </select>
      </div>

      <TeamListingForm userId={user.uid} onCreated={loadData} />

      <section>
        <h2 className="mb-3 text-lg font-semibold text-foreground">Open listings</h2>
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
        <h2 className="mb-3 text-lg font-semibold text-foreground">My listings</h2>
        <div className="space-y-3">
          {myListings.map((listing) => (
            <div key={listing.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-3">
              <p className="text-sm text-foreground/80">{listing.hackathon_title || 'General listing'}</p>
              <button
                onClick={async () => {
                  await supabase.from('team_listings').update({ is_open: false }).eq('id', listing.id).eq('user_id', user.uid);
                  loadData();
                }}
                className="text-sm text-red-700"
              >
                Close listing
              </button>
            </div>
          ))}
          {!myListings.length ? <p className="text-sm text-foreground/65">You have no active listings.</p> : null}
        </div>
      </section>
    </div>
  );
}
