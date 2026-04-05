import React from 'react';
import Link from 'next/link';

export default function HackathonCard({ hackathon, onBookmarkClick, isSaved = false }) {
  const formattedDate = hackathon.reg_end_date
    ? new Date(hackathon.reg_end_date).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    })
    : 'TBA';

  const isClosed = hackathon.is_closed;
  
  const daysLeft = hackathon.reg_end_date ? Math.floor((new Date(hackathon.reg_end_date) - new Date()) / (1000 * 60 * 60 * 24)) : null;
  const isUrgent = !isClosed && daysLeft !== null && daysLeft >= 0 && daysLeft <= 5;

  // Theme logic for the logo icon initials
  const initials = hackathon.title?.substring(0, 2).toUpperCase() || 'HC';
  const prizeStr = hackathon.prize || 'Prizes Config Auth';

  return (
    <article className="bg-surface-container-lowest rounded-xl border border-on-background/[0.12] p-[16px] flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
      <div className="flex justify-between items-start">
        {/* Top-left: Logo */}
        <div className={`w-[36px] h-[36px] rounded-lg flex items-center justify-center ${isUrgent ? 'bg-error/10' : isSaved ? 'bg-tertiary/10' : 'bg-primary/10'}`}>
          <span className={`font-bold text-xs uppercase ${isUrgent ? 'text-error' : isSaved ? 'text-tertiary' : 'text-primary'}`}>{initials}</span>
        </div>
        
        {/* Top-right: Status badges */}
        <div className="flex gap-2">
          <span className="px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container text-[10px] font-bold uppercase tracking-wider">
            {isClosed ? 'Closed' : (hackathon.mode || 'Online')}
          </span>
          {isUrgent && (
            <span className="px-3 py-1 rounded-full bg-[#A32D2D]/10 text-[#A32D2D] text-[10px] font-bold uppercase tracking-wider">
              {daysLeft} days left
            </span>
          )}
        </div>
      </div>

      <div className="space-y-1">
        <h3 className="text-[15px] font-medium text-[#185FA5] leading-tight line-clamp-1">{hackathon.title}</h3>
        <p className="text-[12px] text-[#5F5E5A] line-clamp-1">{hackathon.source ? `Organized by ${hackathon.source}` : 'Organized by Cognitive Labs'}</p>
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap items-center gap-4 text-[12px] text-secondary/70">
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined !text-[14px]">calendar_today</span>
          {formattedDate}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined !text-[14px]">groups</span>
          Solo or Teams
        </div>
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined !text-[14px]">location_on</span>
          {hackathon.mode === 'Offline' ? 'In-person' : 'Global'}
        </div>
      </div>

      {/* Footer */}
      <div className="pt-4 mt-auto border-t border-on-background/[0.08] flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[#185FA5] font-bold text-[14px]">{prizeStr}</span>
          <span className={`text-[11px] ${isUrgent ? 'text-[#A32D2D] font-medium' : 'text-secondary'}`}>
            Ends {formattedDate}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={(e) => {
              e.preventDefault();
              if (onBookmarkClick) onBookmarkClick(hackathon);
            }} 
            className={`${isSaved ? 'text-[#6A5ACD]' : 'text-secondary hover:text-primary'} transition-colors disabled:opacity-50`}
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: isSaved ? "'FILL' 1" : "'FILL' 0" }}>
              bookmark
            </span>
          </button>
          
          <a href={hackathon.link} target="_blank" rel="noopener noreferrer" className="bg-[#185FA5] text-white text-[12px] font-bold px-4 py-1.5 rounded-lg active:scale-95 transition-transform hover:bg-[#004782]">
            Apply →
          </a>
        </div>
      </div>
    </article>
  );
}
