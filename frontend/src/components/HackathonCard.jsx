import React from 'react';
import BookmarkButton from './BookmarkButton';

export default function HackathonCard({ hackathon, showBookmark }) {
    const title = hackathon?.title ?? 'Untitled';
    const source = hackathon?.source ?? '';
    const organizer = hackathon?.organizer ? hackathon.organizer : `via ${source}`;
    const mode = hackathon?.mode ?? 'Online';
    const isClosedParam = hackathon?.is_closed ?? false;
    const themes = hackathon?.themes ?? [];
    const prize = hackathon?.prize ?? null;
    const teamSize = hackathon?.team_size ?? null; // We don't have this, prompt says "Solo or team" anyway

    // Date calculations
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let daysLeft = null;
    let formattedDate = null;
    let isSameYear = true;

    if (hackathon?.reg_end_date) {
        const deadline = new Date(hackathon.reg_end_date + 'T00:00:00');
        daysLeft = Math.ceil((deadline - today) / 86400000);
        isSameYear = deadline.getFullYear() === today.getFullYear();
        formattedDate = deadline.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: isSameYear ? undefined : 'numeric'
        });
    }

    const isClosed = isClosedParam || (daysLeft !== null && daysLeft <= 0);

    // Logos
    let logoInitials = title.substring(0, 2).toUpperCase();
    let logoClass = 'bg-[#EEEEEC] text-[#5F5E5A]';
    const srcLower = source.toLowerCase();

    if (srcLower.includes('devfolio')) {
        logoInitials = 'DF';
        logoClass = 'bg-[#E6F1FB] text-[#185FA5]';
    } else if (srcLower.includes('devpost')) {
        logoInitials = 'DP';
        logoClass = 'bg-[#EAF3DE] text-[#3B6D11]';
    } else if (srcLower.includes('unstop')) {
        logoInitials = 'US';
        logoClass = 'bg-[#FAEEDA] text-[#854F0B]';
    } else if (srcLower.includes('hackerearth')) {
        logoInitials = 'HE';
        logoClass = 'bg-[#EEEDFE] text-[#534AB7]';
    } else if (srcLower.includes('knowafest')) {
        logoInitials = 'KF';
        logoClass = 'bg-[#FAECE7] text-[#993C1D]';
    } else if (srcLower.includes('campuskarma')) {
        logoInitials = 'CK';
        logoClass = 'bg-[#E1F5EE] text-[#0F6E56]';
    }

    // Badges
    let modeClass = 'bg-[#EAF3DE] text-[#3B6D11]';
    let modeLabel = 'Online';
    if (mode.toLowerCase() === 'offline') {
        modeClass = 'bg-[#E6F1FB] text-[#185FA5]';
        modeLabel = 'In-person';
    } else if (mode.toLowerCase() === 'hybrid') {
        modeClass = 'bg-[#FAEEDA] text-[#854F0B]';
        modeLabel = 'Hybrid';
    }

    const displayThemes = themes.slice(0, 3);
    const extraThemes = themes.length - 3;

    return (
        <article className={`bg-white p-5 rounded-xl border border-[#E2E3E1] flex flex-col gap-4 ${isClosed ? 'opacity-60' : ''}`}>
            
            <div className="flex justify-between items-start">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-[14px] ${logoClass}`}>
                    {logoInitials}
                </div>
                
                <div className="flex gap-2 items-center">
                    <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-medium tracking-wide ${modeClass}`}>
                        {modeLabel}
                    </span>
                    {daysLeft !== null && daysLeft <= 7 && !isClosed && (
                        <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-medium tracking-wide ${
                            daysLeft <= 3 ? 'bg-[#FCEBEB] text-[#A32D2D]' : 'bg-[#FAEEDA] text-[#854F0B]'
                        }`}>
                            {daysLeft <= 3 ? `${daysLeft} days left` : 'This week'}
                        </span>
                    )}
                    {isClosed && (
                        <span className="px-2.5 py-0.5 rounded-md text-[11px] font-medium tracking-wide bg-gray-100 text-gray-500">
                            Closed
                        </span>
                    )}
                </div>
            </div>

            <div>
                <h3 className="text-[15px] font-medium text-[#1a1c1b] leading-snug line-clamp-2">
                    {title}
                </h3>
                <p className="text-[12px] text-[#5f5e5a] line-clamp-1 mt-1">
                    {organizer}
                </p>
                
                <div className="mt-3 flex gap-4 text-[12px] text-[#9B9B98] flex-wrap">
                    {formattedDate && (
                        <div className="flex items-center gap-1.5">
                            <svg className="w-[14px] h-[14px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            {formattedDate}
                        </div>
                    )}
                    <div className="flex items-center gap-1.5">
                        <svg className="w-[14px] h-[14px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        {mode.toLowerCase() === 'offline' ? (hackathon?.location || 'Worldwide') : mode.toLowerCase() === 'online' ? 'Online' : 'Worldwide'}
                    </div>
                    <div className="flex items-center gap-1.5">
                        <svg className="w-[14px] h-[14px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                        Solo or team
                    </div>
                </div>

                {displayThemes.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                        {displayThemes.map((theme, i) => (
                            <span key={i} className="bg-[#EEEEEC] text-[#5F5E5A] text-[11px] rounded-full px-2 py-0.5 whitespace-nowrap">
                                {String(theme).trim()}
                            </span>
                        ))}
                        {extraThemes > 0 && (
                            <span className="bg-[#EEEEEC] text-[#5F5E5A] text-[11px] rounded-full px-2 py-0.5">
                                +{extraThemes} more
                            </span>
                        )}
                    </div>
                )}
            </div>

            <div className="mt-auto pt-4 border-t border-[#E2E3E1] flex justify-between items-center">
                <div className="flex flex-col">
                    {prize && (
                        <div className="text-[14px] font-semibold text-[#185FA5]">
                            {prize}
                        </div>
                    )}
                    <span className={`text-[12px] ${
                        isClosed ? 'text-[#A32D2D]' :
                        (daysLeft !== null && daysLeft > 7) ? 'text-[#5f5e5a]' :
                        (daysLeft !== null && daysLeft >= 1) ? 'text-[#854F0B] font-medium' :
                        'text-[#9B9B98]'
                    }`}>
                        {isClosed ? 'Closed' : formattedDate ? `Closes ${formattedDate}` : 'Deadline TBA'}
                    </span>
                </div>
                
                <div className="flex items-center gap-3">
                    {showBookmark && <BookmarkButton hackathonId={hackathon.id} />}
                    
                    {!isClosed ? (
                        <a 
                            href={hackathon?.link || '#'} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="bg-[#185FA5] hover:bg-[#0C447C] text-white text-[12px] font-medium px-4 py-1.5 rounded-lg transition-colors"
                        >
                            Apply →
                        </a>
                    ) : (
                        <span className="text-[12px] text-[#9B9B98] px-4 py-1.5">Closed</span>
                    )}
                </div>
            </div>
        </article>
    );
}
