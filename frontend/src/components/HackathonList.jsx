'use client';

import React, { useState, useMemo } from 'react';
import FilterBar from './FilterBar';
import HackathonCard from './HackathonCard';

const HackathonList = ({ initialHackathons }) => {
    const [activeFilter, setActiveFilter] = useState('all');
    const [showUrgency, setShowUrgency] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredHackathons = useMemo(() => {
        if (!initialHackathons) return [];

        return initialHackathons.filter((hackathon) => {
            // 1. Filter by Platform/Type
            if (activeFilter !== 'all') {
                const platformMatch = hackathon.source?.toLowerCase() === activeFilter.toLowerCase();
                const modeMatch = hackathon.mode?.toLowerCase() === activeFilter.toLowerCase();

                if (!platformMatch && !modeMatch) return false;
            }

            // 2. Filter by Urgency (Closing soon - e.g., within 7 days)
            if (showUrgency) {
                if (!hackathon.reg_end_date) return false;
                const daysLeft = (new Date(hackathon.reg_end_date) - new Date()) / (1000 * 60 * 60 * 24);
                if (daysLeft < 0 || daysLeft > 7) return false;
            }

            // 3. Search Query
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const titleMatch = hackathon.title?.toLowerCase().includes(query);
                const descMatch = hackathon.description?.toLowerCase().includes(query);
                const themesMatch = hackathon.themes?.toLowerCase().includes(query);
                if (!titleMatch && !descMatch && !themesMatch) return false;
            }

            return true;
        });
    }, [initialHackathons, activeFilter, showUrgency, searchQuery]);

    return (
        <div className="min-h-screen bg-[#0f172a]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">

                <FilterBar
                    activeFilter={activeFilter}
                    onFilterChange={setActiveFilter}
                    showUrgency={showUrgency}
                    onUrgencyChange={setShowUrgency}
                />

                {(!filteredHackathons || filteredHackathons.length === 0) ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center text-slate-400">
                        <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mb-6">
                            <span className="text-4xl">🔭</span>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">No hackathons found</h3>
                        <p className="max-w-sm">
                            We couldn't find any events matching your filters. Try adjusting them.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredHackathons.map((hackathon) => (
                            <HackathonCard key={hackathon.id} hackathon={hackathon} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default HackathonList;
