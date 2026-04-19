'use client';

import React, { useEffect, useMemo, useState } from 'react';
import HackathonCard from './HackathonCard';

const HackathonList = ({ hackathons, searchQuery = '', showBookmark, loading, filters, onClearFilters }) => {
    const [isFiltering, setIsFiltering] = useState(false);
    const [resultPulse, setResultPulse] = useState(false);

    const sourceQualityRank = (value) => {
        switch ((value || '').toLowerCase()) {
            case 'premium':
                return 0;
            case 'curated':
                return 1;
            case 'local':
                return 2;
            default:
                return 1;
        }
    };

    const filteredHackathons = useMemo(() => {
        if (!hackathons) return [];
        const visible = hackathons.filter((h) => {
            // Mode filter
            if (filters?.modes?.length > 0) {
                const mode = (h.mode ?? '').toLowerCase();
                // 'offline' maps to 'in-person'
                const displayMode = mode === 'offline' ? 'In-person' : (mode.charAt(0).toUpperCase() + mode.slice(1));
                if (!filters.modes.includes(displayMode)) return false;
            }

            // Platform filter
            if (filters?.platforms?.length > 0) {
                const src = h.source ?? '';
                if (!filters.platforms.some(p => src.toLowerCase() === p.toLowerCase())) return false;
            }

            // Closing Soon
            if (filters?.closingSoon) {
                if (!h.reg_end_date) return false;
                const today = new Date(); today.setHours(0,0,0,0);
                const d = new Date(h.reg_end_date + 'T00:00:00');
                const days = Math.ceil((d - today) / 86400000);
                if (days < 0 || days > 7) return false;
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

        const sortBy = filters?.sort || 'deadline';

        if (sortBy === 'title') {
            return [...visible].sort((a, b) => {
                const qualityDiff = sourceQualityRank(a?.source_quality) - sourceQualityRank(b?.source_quality);
                if (qualityDiff !== 0) return qualityDiff;
                return (a?.title || '').localeCompare(b?.title || '');
            });
        }

        if (sortBy === 'newest') {
            return [...visible].sort((a, b) => {
                const qualityDiff = sourceQualityRank(a?.source_quality) - sourceQualityRank(b?.source_quality);
                if (qualityDiff !== 0) return qualityDiff;
                const aDate = a?.created_at ? new Date(a.created_at).getTime() : 0;
                const bDate = b?.created_at ? new Date(b.created_at).getTime() : 0;
                return bDate - aDate;
            });
        }

        return [...visible].sort((a, b) => {
            const qualityDiff = sourceQualityRank(a?.source_quality) - sourceQualityRank(b?.source_quality);
            if (qualityDiff !== 0) return qualityDiff;
            const aTime = a?.reg_end_date ? new Date(a.reg_end_date + 'T00:00:00').getTime() : Number.MAX_SAFE_INTEGER;
            const bTime = b?.reg_end_date ? new Date(b.reg_end_date + 'T00:00:00').getTime() : Number.MAX_SAFE_INTEGER;
            return aTime - bTime;
        });
    }, [hackathons, filters, searchQuery]);

    useEffect(() => {
        setIsFiltering(true);
        const timer = setTimeout(() => setIsFiltering(false), 180);
        return () => clearTimeout(timer);
    }, [filters, searchQuery]);

    useEffect(() => {
        setResultPulse(true);
        const timer = setTimeout(() => setResultPulse(false), 260);
        return () => clearTimeout(timer);
    }, [filteredHackathons.length]);

    const handleClearFilters = () => {
        if (onClearFilters) onClearFilters();
    };

    return (
        <div className="flex flex-col gap-6 w-full pb-16">
            {!loading && (
                <div className={`text-sm text-muted-foreground font-medium transition-opacity duration-200 ${resultPulse ? 'results-pop' : ''}`}>
                    Showing {filteredHackathons.length} result{filteredHackathons.length !== 1 ? 's' : ''}
                </div>
            )}

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                        <div key={`skel-${i}`} className="rounded-2xl border border-border/40 bg-card p-5 md:p-6 flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <div className="workspace-shimmer h-6 w-24 rounded-full" />
                                <div className="workspace-shimmer h-6 w-16 rounded-full" />
                            </div>

                            <div className="space-y-2">
                                <div className="workspace-shimmer h-5 w-4/5 rounded" />
                                <div className="workspace-shimmer h-4 w-2/3 rounded" />
                                <div className="workspace-shimmer h-4 w-full rounded" />
                            </div>

                            <div className="flex gap-2">
                                <div className="workspace-shimmer h-7 w-20 rounded-full" />
                                <div className="workspace-shimmer h-7 w-16 rounded-full" />
                            </div>

                            <div className="mt-auto flex items-center justify-between pt-3 border-t border-border/30">
                                <div className="workspace-shimmer h-4 w-24 rounded" />
                                <div className="workspace-shimmer h-9 w-20 rounded-lg" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : filteredHackathons.length === 0 ? (
                <div className="w-full min-h-[300px] flex flex-col items-center justify-center bg-card border border-border rounded-2xl text-center px-4">
                    <svg className="w-12 h-12 text-muted-foreground mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <h3 className="text-[16px] font-semibold text-foreground">No hackathons found</h3>
                    <p className="text-[13px] text-muted-foreground mt-1 max-w-sm">
                        Try a different filter or search term.
                    </p>
                    <button 
                        onClick={handleClearFilters}
                        className="mt-4 px-4 py-2 rounded-lg text-[13px] font-medium border border-accent text-accent hover:bg-accent/10 active:scale-[0.98] transition"
                    >
                        Reset filters
                    </button>
                </div>
            ) : (
                <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 transition-all duration-200 ${isFiltering ? 'opacity-70 scale-[0.995]' : 'opacity-100 scale-100'}`}>
                    {filteredHackathons.map((hackathon, index) => (
                        <div
                            key={hackathon.id}
                            className="card-enter"
                            style={{ animationDelay: `${Math.min(index * 35, 210)}ms` }}
                        >
                            <HackathonCard 
                                hackathon={hackathon} 
                                showBookmark={showBookmark}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default HackathonList;
