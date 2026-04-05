import React from 'react';

export default function HackathonCard({ hackathon, onBookmarkClick, isSaved = false }) {
    // BUG 3 Fix: Exhaustive null handling
    const title = hackathon?.title || 'Untitled Hackathon';
    const source = hackathon?.source || '';
    const description = hackathon?.description || '';
    const isClosed = hackathon?.is_closed ?? false;
    const mode = hackathon?.mode || 'Unknown';
    const themes = Array.isArray(hackathon?.themes) ? hackathon.themes : (typeof hackathon?.themes === 'string' ? hackathon.themes.split(',') : []);
    const prizeStr = hackathon?.prize;
    const teamSize = hackathon?.team_size || 'Open';
    
    // BUG 4 Fix: Deterministic Date Parsing
    let deadline = null;
    let daysLeft = null;
    let formattedDate = 'TBA';
    
    if (hackathon?.reg_end_date) {
        deadline = new Date(hackathon.reg_end_date + 'T00:00:00');
        const today = new Date();
        today.setHours(0,0,0,0);
        daysLeft = Math.ceil((deadline - today) / 86400000);
        
        const isSameYear = deadline.getFullYear() === today.getFullYear();
        formattedDate = deadline.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: isSameYear ? undefined : 'numeric'
        });
    }

    // Determine Urgency Badge State
    let uiUrgencyValue = isClosed ? 'closed' : '';
    let badgeStr = '';
    let badgeClass = '';
    
    if (isClosed || (daysLeft !== null && daysLeft <= 0)) {
        uiUrgencyValue = 'closed';
        badgeStr = 'Closed';
        badgeClass = 'bg-gray-100 text-gray-600';
    } else if (daysLeft !== null) {
        if (daysLeft <= 3) {
            uiUrgencyValue = 'red';
            badgeStr = `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`;
            badgeClass = 'bg-[var(--brand-red-light)] text-[var(--brand-red)]';
        } else if (daysLeft <= 7) {
            uiUrgencyValue = 'amber';
            badgeStr = 'This week';
            badgeClass = 'bg-[var(--brand-amber-light)] text-[var(--brand-amber)]';
        } else {
            uiUrgencyValue = 'green';
            badgeStr = formattedDate;
            badgeClass = 'bg-[var(--brand-green-light)] text-[var(--brand-green)]';
        }
    }

    // Logo Block Setup
    let logoInitials = title.substring(0, 2).toUpperCase();
    let logoClass = 'bg-gray-100 text-gray-500';
    
    if (source.toLowerCase().includes('devfolio')) {
        logoInitials = 'DF';
        logoClass = 'bg-[var(--brand-blue-light)] text-[var(--brand-blue)]';
    } else if (source.toLowerCase().includes('devpost')) {
        logoInitials = 'DP';
        logoClass = 'bg-[var(--brand-green-light)] text-[var(--brand-green)]';
    } else if (source.toLowerCase().includes('unstop')) {
        logoInitials = 'US';
        logoClass = 'bg-[var(--brand-amber-light)] text-[var(--brand-amber)]';
    } else if (source.toLowerCase().includes('hackerearth')) {
        logoInitials = 'HE';
        logoClass = 'bg-[#EEEDFE] text-[#534AB7]';
    }

    // Theme slice logic
    const displayThemes = themes.slice(0, 3);
    const extraThemes = themes.length - 3;
    
    const isEffectivelyClosed = uiUrgencyValue === 'closed';

    return (
        <article className={`bg-[var(--surface)] p-5 rounded-xl border border-[var(--border)] flex flex-col gap-5 transition-all ${isEffectivelyClosed ? 'opacity-60 grayscale-[20%]' : ''}`}>
            
            {/* Header: Logo + Badges */}
            <div className="flex justify-between items-start">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-[14px] ${logoClass}`}>
                    {logoInitials}
                </div>
                
                <div className="flex gap-2 items-center">
                    <span className="px-3 py-1 rounded-full text-[11px] font-medium tracking-wide bg-gray-100 text-gray-600">
                        {mode}
                    </span>
                    {badgeStr && (
                        <span className={`px-3 py-1 rounded-full text-[11px] font-medium tracking-wide ${badgeClass}`}>
                            {badgeStr}
                        </span>
                    )}
                </div>
            </div>

            {/* Body */}
            <div>
                <h3 className="text-[15px] font-medium text-[var(--text-primary)] leading-snug line-clamp-2">
                    {title}
                </h3>
                {source && (
                    <p className="text-[12px] text-[var(--text-muted)] line-clamp-1 mt-1">
                        Organized by {source}
                    </p>
                )}
                
                {/* Meta Row */}
                <div className="mt-3 flex gap-4 text-[12px] text-[var(--text-subtle)] flex-wrap">
                    {formattedDate !== 'TBA' && (
                        <div className="flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {formattedDate}
                        </div>
                    )}
                    <div className="flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {mode === 'Online' ? 'Online' : hackathon?.location || 'In-person'}
                    </div>
                    {teamSize && (
                        <div className="flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            {teamSize}
                        </div>
                    )}
                </div>

                {/* Themes Row */}
                {displayThemes.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                        {displayThemes.map((theme, i) => (
                            <span key={i} className="bg-gray-100 text-gray-600 text-[11px] rounded-full px-2 py-0.5 whitespace-nowrap">
                                {String(theme).trim()}
                            </span>
                        ))}
                        {extraThemes > 0 && (
                            <span className="bg-gray-100 text-gray-600 text-[11px] rounded-full px-2 py-0.5">
                                +{extraThemes} more
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="mt-auto pt-4 border-t border-[var(--border)] flex justify-between items-center">
                <div className="flex flex-col">
                    {prizeStr && (
                        <span className="text-[14px] font-medium text-[var(--brand-blue)]">
                            {prizeStr}
                        </span>
                    )}
                    <span className={`text-[12px] ${uiUrgencyValue === 'red' ? 'text-[var(--brand-red)]' : uiUrgencyValue === 'amber' ? 'text-[var(--brand-amber)]' : 'text-[var(--text-subtle)]'}`}>
                        {uiUrgencyValue === 'closed' ? 'Registrations closed' : `Ends ${formattedDate}`}
                    </span>
                </div>
                
                <div className="flex items-center gap-3">
                    <button 
                        onClick={(e) => {
                            e.preventDefault();
                            if (onBookmarkClick) onBookmarkClick(hackathon);
                        }}
                        className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-colors ${
                            isSaved 
                                ? 'border-[var(--brand-blue)] bg-[var(--brand-blue-light)] text-[var(--brand-blue)]' 
                                : 'border-[var(--border)] text-gray-400 hover:text-gray-600 bg-white'
                        }`}
                        title="Save for later"
                    >
                        <svg className="w-4 h-4" fill={isSaved ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={isSaved ? 0 : 2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                    </button>
                    
                    <a 
                        href={hackathon?.link || '#'} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className={`text-[12px] font-medium px-4 py-1.5 rounded-lg transition-colors ${
                            isEffectivelyClosed 
                                ? 'bg-gray-200 text-gray-500 cursor-not-allowed pointer-events-none' 
                                : 'bg-[var(--brand-blue)] text-white hover:bg-[#0C447C]'
                        }`}
                        onClick={(e) => isEffectivelyClosed && e.preventDefault()}
                    >
                        Apply →
                    </a>
                </div>
            </div>

        </article>
    );
}
