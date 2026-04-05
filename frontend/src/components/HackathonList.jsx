'use client';

import React, { useMemo } from 'react';
import HackathonCard from './HackathonCard';

const HackathonList = ({ hackathons, activeFilter = 'All', searchQuery = '', onClearFilters }) => {
    
    const filteredHackathons = useMemo(() => {
        if (!hackathons) return null; // null means loading

        return hackathons.filter((item) => {
            // 1. Filter Logic
            if (activeFilter === 'Online' && item?.mode !== 'Online') return false;
            if (activeFilter === 'In-person' && item?.mode !== 'Offline') return false;
            if (activeFilter === 'Hybrid' && item?.mode !== 'Hybrid') return false;
            
            if (activeFilter === 'Closing Soon') {
                if (!item?.reg_end_date) return false;
                const deadline = new Date(item.reg_end_date + 'T00:00:00');
                const today = new Date();
                today.setHours(0,0,0,0);
                const daysLeft = Math.ceil((deadline - today) / 86400000);
                if (daysLeft < 0 || daysLeft > 7) return false; // >0 and <=7
            }

            // 2. Search Query Logic
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                const titleMatch = (item?.title || '').toLowerCase().includes(q);
                const descMatch = (item?.description || '').toLowerCase().includes(q);
                
                const themeArray = Array.isArray(item?.themes) 
                    ? item.themes 
                    : (typeof item?.themes === 'string' ? item.themes.split(',') : []);
                
                const themesMatch = themeArray.join(' ').toLowerCase().includes(q);

                if (!titleMatch && !descMatch && !themesMatch) return false;
            }

            return true;
        });
    }, [hackathons, activeFilter, searchQuery]);

    // Loading State
    if (filteredHackathons === null) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {[...Array(6)].map((_, i) => (
                    <div key={`skel-${i}`} className="bg-[var(--surface)] p-5 rounded-xl border border-[var(--border)] animate-pulse flex flex-col gap-5 h-[240px]">
                        <div className="flex justify-between items-start">
                            <div className="w-10 h-10 rounded-lg bg-gray-200"></div>
                            <div className="w-20 h-6 rounded-full bg-gray-200"></div>
                        </div>
                        <div className="space-y-2 mt-2">
                            <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        </div>
                        <div className="mt-auto border-t border-[var(--border)] pt-4 flex justify-between">
                            <div className="w-24 h-5 bg-gray-200 rounded"></div>
                            <div className="w-20 h-8 bg-gray-200 rounded-lg"></div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    // Empty State
    if (filteredHackathons.length === 0) {
        return (
            <div className="w-full h-[200px] flex flex-col items-center justify-center bg-[var(--surface)] border border-[var(--border)] rounded-xl text-center px-4">
                <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <h3 className="text-[16px] font-semibold text-[var(--text-primary)]">No hackathons found</h3>
                <p className="text-[14px] text-[var(--text-muted)] mt-1 max-w-sm">
                    Try adjusting your filters or search query to find what you're looking for.
                </p>
                <button 
                    onClick={onClearFilters}
                    className="mt-5 text-[14px] font-medium text-[var(--brand-blue)] hover:underline"
                >
                    Clear filters
                </button>
            </div>
        );
    }

    // Bug 5 Fix: Multi-column grid layout
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredHackathons.map((hackathon) => (
                <HackathonCard 
                    key={hackathon.id || Math.random().toString()} 
                    hackathon={hackathon} 
                />
            ))}
        </div>
    );
};

export default HackathonList;
