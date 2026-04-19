import React from 'react';
import BookmarkButton from './BookmarkButton';

export default function HackathonCard({ hackathon, showBookmark }) {
    const title = hackathon?.title ?? 'Untitled';
    const source = hackathon?.source ?? '';
    const sourceQuality = (hackathon?.source_quality ?? 'curated').toLowerCase();
    const category = (hackathon?.category ?? 'practice').toLowerCase();
    const locationGroup = hackathon?.location_group ?? '';
    const organizer = hackathon?.organizer ? hackathon.organizer : `via ${source}`;
    const mode = hackathon?.mode ?? 'Online';
    const isClosedParam = hackathon?.is_closed ?? false;
    const fallbackTheme = [mode.toLowerCase() === 'online' ? 'Software' : 'Open Innovation'];
    const themes = (hackathon?.themes && hackathon.themes.length > 0) ? hackathon.themes : fallbackTheme;
    const defaultDesc = `Join this ${mode.toLowerCase()} hackathon organized by ${organizer}. Build projects, collaborate, and compete for prizes!`;
    const description = hackathon?.description || hackathon?.tagline || defaultDesc;
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

    // Badges
    let modeLabel = 'Online';
    if (mode.toLowerCase() === 'offline') {
        modeLabel = 'In-person';
    } else if (mode.toLowerCase() === 'hybrid') {
        modeLabel = 'Hybrid';
    }

    const displayThemes = themes.slice(0, 3);
    const extraThemes = themes.length - 3;
    const platformLabel = source ? source : 'Platform';
    const statusLabel = isClosed ? 'Closed' : 'Online';
    const deadlineLabel = isClosed
        ? 'Closed'
        : formattedDate
            ? `Closes ${formattedDate}`
            : 'Deadline TBA';

    const qualityStyles = {
        premium: 'border-amber-300/60 bg-gradient-to-br from-amber-50/90 via-card to-card shadow-[0_18px_40px_rgba(245,158,11,0.12)] dark:from-amber-500/10 dark:via-card dark:to-card',
        curated: 'border-sky-300/50 bg-card shadow-[0_14px_30px_rgba(59,130,246,0.08)]',
        local: 'border-emerald-300/45 bg-card/90 shadow-[0_12px_24px_rgba(16,185,129,0.06)] opacity-[0.96]',
    };

    const qualityBadgeStyles = {
        premium: 'border-amber-400/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
        curated: 'border-sky-400/25 bg-sky-500/10 text-sky-700 dark:text-sky-300',
        local: 'border-emerald-400/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    };

    const qualityLabel = {
        premium: 'Premium',
        curated: 'Curated',
        local: 'Local',
    }[sourceQuality] || 'Curated';

    const categoryLabel = {
        premium: 'Premium',
        local: 'Local',
        practice: 'Practice',
    }[category] || 'Practice';

    const categoryBadgeStyles = {
        premium: 'border-amber-400/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
        local: 'border-emerald-400/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
        practice: 'border-slate-400/25 bg-slate-500/10 text-slate-700 dark:text-slate-300',
    };

    return (
        <article className={`rounded-2xl border p-5 md:p-6 flex flex-col gap-4 transition duration-200 hover:shadow-lg hover:scale-[1.03] ${qualityStyles[sourceQuality] || qualityStyles.curated} ${isClosed ? 'opacity-75' : ''}`}>
            <div className="flex items-start justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                    <div className="inline-flex items-center rounded-full border border-border bg-background px-3 py-1 text-[11px] font-semibold text-muted-foreground">
                        {platformLabel}
                    </div>
                    <div className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold ${categoryBadgeStyles[category] || categoryBadgeStyles.practice}`}>
                        {categoryLabel}
                    </div>
                    <div className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold ${qualityBadgeStyles[sourceQuality] || qualityBadgeStyles.curated}`}>
                        {qualityLabel}
                    </div>
                </div>
                <div className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold ${isClosed ? 'bg-muted text-muted-foreground' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'}`}>
                    {statusLabel}
                </div>
            </div>

            <div className="space-y-2">
                <h3 className="text-lg md:text-xl font-semibold leading-snug line-clamp-2 text-foreground">
                    {title}
                </h3>
                <p className="text-[13px] text-muted-foreground line-clamp-1">
                    {organizer}
                </p>
                <p className="text-[14px] leading-relaxed text-muted-foreground line-clamp-2">
                    {description}
                </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-[12px] text-muted-foreground">
                {formattedDate && (
                    <div className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1">
                        <svg className="w-[14px] h-[14px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        {formattedDate}
                    </div>
                )}
                <div className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1">
                    <svg className="w-[14px] h-[14px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    {modeLabel}
                </div>

                {displayThemes.map((theme, i) => (
                    <span key={i} className="inline-flex items-center rounded-full border border-border bg-background px-2.5 py-1 text-[11px] text-foreground">
                        {String(theme).trim()}
                    </span>
                ))}
                {locationGroup ? (
                    <span className="inline-flex items-center rounded-full border border-border bg-background px-2.5 py-1 text-[11px] text-foreground">
                        {locationGroup}
                    </span>
                ) : null}
                {extraThemes > 0 && (
                    <span className="inline-flex items-center rounded-full border border-border bg-background px-2.5 py-1 text-[11px] text-foreground">
                        +{extraThemes}
                    </span>
                )}
            </div>

            <div className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-4">
                <p className={`text-[12px] font-medium ${isClosed ? 'text-muted-foreground' : daysLeft !== null && daysLeft <= 3 ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'}`}>
                    {deadlineLabel}
                </p>

                <div className="flex items-center gap-2">
                    {showBookmark && <BookmarkButton hackathonId={hackathon.id} />}

                    {!isClosed ? (
                        <a
                            href={hackathon?.link || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center rounded-lg bg-accent text-accent-foreground px-4 py-2 text-[13px] font-semibold shadow-sm hover:brightness-110 hover:shadow-[0_0_18px_rgba(59,130,246,0.35)] active:scale-[0.98] transition"
                        >
                            Apply
                        </a>
                    ) : (
                        <span className="inline-flex items-center rounded-lg border border-border px-3 py-1.5 text-[12px] text-muted-foreground">
                            Closed
                        </span>
                    )}
                </div>
            </div>
        </article>
    );
}
