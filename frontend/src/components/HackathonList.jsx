'use client';

import React, { useMemo, useState } from 'react';
import HackathonCard from './HackathonCard';
import FilterBar from './FilterBar';

const HackathonList = ({ initialHackathons, searchQuery = '', showBookmark, loading }) => {
    const [activeFilter, setActiveFilter] = useState('All');

    const filteredHackathons = useMemo(() => {
        if (!initialHackathons) return [];
        return initialHackathons.filter((h) => {
            // Mode / Platform filter
            if (activeFilter !== 'All') {
                const src = (h.source ?? '').toLowerCase();
                const mode = (h.mode ?? '').toLowerCase();
                if (activeFilter === 'Online' && mode !== 'online') return false;
                if (activeFilter === 'In-person' && mode !== 'offline') return false;
                if (activeFilter === 'Hybrid' && mode !== 'hybrid') return false;
                if (activeFilter === 'Closing Soon') {
                    if (!h.reg_end_date) return false;
                    const today = new Date(); today.setHours(0,0,0,0);
                    const d = new Date(h.reg_end_date + 'T00:00:00');
                    const days = Math.ceil((d - today) / 86400000);
                    if (days < 0 || days > 7) return false;
                }
                const platformFilters = ['Devpost','Devfolio','Unstop','HackerEarth'];
                if (platformFilters.includes(activeFilter) && src !== activeFilter.toLowerCase())
                    return false;
            }

            // Search
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                const inTitle = (h.title ?? '').toLowerCase().includes(q);
                const inDesc = (h.description ?? '').toLowerCase().includes(q);
                const inThemes = (h.themes ?? []).join(' ').toLowerCase().includes(q);
                const inSource = (h.source ?? '').toLowerCase().includes(q);
                if (!inTitle && !inDesc && !inThemes && !inSource) return false;
            }

            return true;
        });
    }, [initialHackathons, activeFilter, searchQuery]);

    const handleClearFilters = () => {
        setActiveFilter('All');
    };

    return (
        <div className="flex flex-col gap-6 w-full pb-16">
            <div className="sticky top-14 z-40 bg-white border-b border-[#E2E3E1] px-0 py-3 -mx-8 px-8 mb-2">
                <FilterBar 
                    activeFilter={activeFilter} 
                    onFilterChange={setActiveFilter} 
                    count={filteredHackathons.length} 
                />
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {[...Array(6)].map((_, i) => (
                        <div key={`skel-${i}`} className="bg-[#F4F4F2] p-5 rounded-xl border border-transparent animate-pulse flex flex-col gap-5 h-[220px]">
                            {/* Skeleton UI items */}
                        </div>
                    ))}
                </div>
            ) : filteredHackathons.length === 0 ? (
                <div className="w-full min-h-[300px] flex flex-col items-center justify-center bg-white rounded-xl text-center px-4">
                    <svg className="w-12 h-12 text-[#9B9B98] mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <h3 className="text-[16px] font-medium text-[#1a1c1b]">No hackathons found</h3>
                    <p className="text-[13px] text-[#9B9B98] mt-1 max-w-sm">
                        Try a different filter or search term.
                    </p>
                    <button 
                        onClick={handleClearFilters}
                        className="mt-4 px-4 py-1.5 rounded-lg text-[13px] font-medium border border-[#185FA5] text-[#185FA5] hover:bg-[#E6F1FB] transition-colors"
                    >
                        Clear filters
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredHackathons.map((hackathon) => (
                        <HackathonCard 
                            key={hackathon.id} 
                            hackathon={hackathon} 
                            showBookmark={showBookmark}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default HackathonList;
