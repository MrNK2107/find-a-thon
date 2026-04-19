'use client';

import React, { useState, useMemo } from 'react';
import Navbar from '../components/Navbar';
import FilterBar from '../components/FilterBar';
import HackathonList from '../components/HackathonList';
import useDebounce from '../hooks/useDebounce';

export default function ExploreClient({ initialHackathons }) {
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearchQuery = useDebounce(searchQuery, 300);
    const [filters, setFilters] = useState({ modes: [], platforms: [], closingSoon: false });

    // Stats calculations
    const stats = useMemo(() => {
        if (!initialHackathons) return { open: 0, closingThisWeek: 0, sources: 0 };
        
        let closing = 0;
        const sourceSet = new Set();
        
        initialHackathons.forEach(h => {
            if (h.source) sourceSet.add(h.source);
            
            if (h.reg_end_date) {
                const deadline = new Date(h.reg_end_date + 'T00:00:00');
                const today = new Date();
                today.setHours(0,0,0,0);
                const daysLeft = Math.ceil((deadline - today) / 86400000);
                if (daysLeft >= 0 && daysLeft <= 7) closing++;
            }
        });
        
        return {
            open: initialHackathons.length,
            closingThisWeek: closing,
            sources: sourceSet.size || 3 // Fallback to 3 if sources aren't populated cleanly
        };
    }, [initialHackathons]);

    return (
        <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
            <Navbar 
                searchQuery={searchQuery} 
                onSearchChange={setSearchQuery} 
                hackathonCount={stats.open} 
            />

            {/* Hero Section */}
            <section className="border-b border-border bg-card/65 px-6 pb-10 pt-24 text-center backdrop-blur-xl transition-colors duration-300">
                <h1 className="font-bold text-3xl text-foreground tracking-tight">
                    Discover hackathons worth your time
                </h1>
                <p className="mt-2 text-base text-foreground/70">
                    Scraped fresh from Devpost, Devfolio, Unstop and more. Updated daily.
                </p>
                <div className="mt-6 flex justify-center flex-wrap gap-8">
                    <div className="text-[14px]">
                        <span className="font-bold text-accent">{stats.open}</span>
                        <span className="ml-1 text-foreground/70">open now</span>
                    </div>
                    <div className="text-[14px]">
                        <span className="font-bold text-accent">{stats.closingThisWeek}</span>
                        <span className="ml-1 text-foreground/70">closing this week</span>
                    </div>
                    <div className="text-[14px]">
                        <span className="font-bold text-accent">{stats.sources}</span>
                        <span className="ml-1 text-foreground/70">sources</span>
                    </div>
                </div>
            </section>

            {/* Sticky Filter Bar */}
            <div className="sticky top-14 z-10 border-b border-border bg-card/70 px-6 py-3 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto">
                    <FilterBar 
                        filters={filters} 
                        onFilterChange={setFilters} 
                        count={stats.open} 
                    />
                </div>
            </div>

            {/* Card Grid */}
            <main className="px-6 py-8 max-w-7xl mx-auto">
                <HackathonList 
                    hackathons={initialHackathons} 
                    filters={filters} 
                    searchQuery={debouncedSearchQuery} 
                    onClearFilters={() => {
                        setFilters({ modes: [], platforms: [], closingSoon: false });
                        setSearchQuery('');
                    }}
                />
            </main>

            {/* Footer */}
            <footer className="border-t border-border/70 py-8 text-center text-[12px] text-foreground/70">
                Find-a-thon · Data scraped from public sources · Not affiliated with any platform
            </footer>
        </div>
    );
}
