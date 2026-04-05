'use client';

import React, { useState, useMemo } from 'react';
import Navbar from '../components/Navbar';
import FilterBar from '../components/FilterBar';
import HackathonList from '../components/HackathonList';

export default function ExploreClient({ initialHackathons }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('All');

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
        <div className="min-h-screen bg-[var(--bg)]">
            <Navbar 
                searchQuery={searchQuery} 
                onSearchChange={setSearchQuery} 
                hackathonCount={stats.open} 
            />

            {/* Hero Section */}
            <section className="pt-24 pb-10 text-center bg-[var(--surface)] border-b border-[var(--border)] px-6">
                <h1 className="font-bold text-3xl text-[var(--text-primary)] tracking-tight">
                    Discover hackathons worth your time
                </h1>
                <p className="text-[var(--text-muted)] text-base mt-2">
                    Scraped fresh from Devpost, Devfolio, Unstop and more. Updated daily.
                </p>
                <div className="mt-6 flex justify-center flex-wrap gap-8">
                    <div className="text-[14px]">
                        <span className="font-bold text-[var(--brand-blue)]">{stats.open}</span>
                        <span className="text-[var(--text-muted)] ml-1">open now</span>
                    </div>
                    <div className="text-[14px]">
                        <span className="font-bold text-[var(--brand-blue)]">{stats.closingThisWeek}</span>
                        <span className="text-[var(--text-muted)] ml-1">closing this week</span>
                    </div>
                    <div className="text-[14px]">
                        <span className="font-bold text-[var(--brand-blue)]">{stats.sources}</span>
                        <span className="text-[var(--text-muted)] ml-1">sources</span>
                    </div>
                </div>
            </section>

            {/* Sticky Filter Bar */}
            <div className="sticky top-14 z-10 bg-[var(--surface)] border-b border-[var(--border)] px-6 py-3">
                <div className="max-w-7xl mx-auto">
                    <FilterBar 
                        activeFilter={activeFilter} 
                        onFilterChange={setActiveFilter} 
                        count={stats.open} 
                    />
                </div>
            </div>

            {/* Card Grid */}
            <main className="px-6 py-8 max-w-7xl mx-auto">
                <HackathonList 
                    hackathons={initialHackathons} 
                    activeFilter={activeFilter} 
                    searchQuery={searchQuery} 
                    onClearFilters={() => {
                        setActiveFilter('All');
                        setSearchQuery('');
                    }}
                />
            </main>

            {/* Footer */}
            <footer className="border-t border-[var(--border)] border-opacity-50 py-8 text-center text-[12px] text-[var(--text-muted)]">
                Find-a-thon · Data scraped from public sources · Not affiliated with any platform
            </footer>
        </div>
    );
}
