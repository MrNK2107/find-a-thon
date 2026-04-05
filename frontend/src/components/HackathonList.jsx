'use client';

import React, { useState, useMemo } from 'react';
import FilterBar from './FilterBar';
import HackathonCard from './HackathonCard';

const HackathonList = ({ initialHackathons, searchQuery = '', showBookmark = false }) => {
    const [activeFilter, setActiveFilter] = useState('all');
    const [showUrgency, setShowUrgency] = useState(false);

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
                const themeValues = Array.isArray(hackathon.themes)
                    ? hackathon.themes
                    : typeof hackathon.themes === 'string'
                        ? hackathon.themes.split(',')
                        : [];
                const themesMatch = themeValues.some((theme) => String(theme).toLowerCase().includes(query));
                if (!titleMatch && !descMatch && !themesMatch) return false;
            }

            return true;
        });
    }, [initialHackathons, activeFilter, showUrgency, searchQuery]);

    return (
        <div className="w-full">
            <div className="w-full">

                <FilterBar
                    activeFilter={activeFilter}
                    onFilterChange={setActiveFilter}
                    showUrgency={showUrgency}
                    onUrgencyChange={setShowUrgency}
                />

                {(!filteredHackathons || filteredHackathons.length === 0) ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center text-secondary border border-on-background/[0.08] bg-surface-container-low rounded-2xl mt-6">
                        <div className="w-20 h-20 bg-surface-variant/50 rounded-full flex items-center justify-center mb-6">
                            <span className="material-symbols-outlined !text-4xl text-outline-variant">telescope</span>
                        </div>
                        <h3 className="text-xl font-bold text-on-surface mb-2">No hackathons found</h3>
                        <p className="max-w-sm text-sm">
                            We couldn&apos;t find any events matching your filters. Try adjusting them.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                        {filteredHackathons.map((hackathon) => (
                            <HackathonCard key={hackathon.id} hackathon={hackathon} showBookmark={showBookmark} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default HackathonList;
