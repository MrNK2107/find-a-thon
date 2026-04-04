import React from 'react';

export default function TeamListingCard({
  hackathonName,
  status = 'Open',
  leader = { name: 'Unknown', initials: 'UN', level: 'Beginner', colorTheme: 'primary' },
  lookingFor = [],
  spots = { filled: 0, total: 4 },
  description,
  contactIcon = 'mail',
  onExpressInterest
}) {
  const getLeaderColors = (theme) => {
    switch (theme) {
      case 'tertiary':
        return 'bg-tertiary-fixed text-tertiary';
      case 'secondary':
        return 'bg-secondary-fixed text-on-secondary-container';
      case 'primary':
      default:
        return 'bg-primary-fixed text-primary';
    }
  };

  const getTagColors = (tagType) => {
    // Basic mapping to keep the minimal stitch vibe
    switch (tagType?.toLowerCase()) {
      case 'ml':
      case 'cloud architect':
      case 'front-end':
        return 'bg-[#854f0b]/10 text-[#854f0b]';
      case 'ui design':
      case 'backend':
      case 'ux research':
        return 'bg-[#2d7a7a]/10 text-[#2d7a7a]';
      default:
        return 'bg-surface-variant text-on-surface-variant';
    }
  };

  const filledSpots = Array.from({ length: spots.filled });
  const emptySpots = Array.from({ length: spots.total - spots.filled });

  return (
    <div className="bg-surface-container-lowest rounded-xl p-[18px] border-[0.5px] border-black/10 flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <span className="text-[13px] font-bold text-on-surface truncate pr-2">{hackathonName}</span>
        {status && (
          <span className="bg-[#386a0d] text-on-tertiary px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase">
            {status}
          </span>
        )}
      </div>
      
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${getLeaderColors(leader.colorTheme)}`}>
          {leader.initials}
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-on-surface leading-none">{leader.name}</span>
          <span className="bg-primary/10 text-primary-container px-2 py-0.5 rounded-full text-[9px] font-bold mt-1 inline-block w-max">
            {leader.level}
          </span>
        </div>
      </div>
      
      <div>
        <p className="text-[10px] font-bold text-secondary uppercase tracking-wider mb-2">Looking For</p>
        <div className="flex flex-wrap gap-1.5">
          {lookingFor.map((role, idx) => (
            <span key={idx} className={`${getTagColors(role)} px-3 py-1 rounded-full text-[11px] font-medium`}>
              {role}
            </span>
          ))}
        </div>
      </div>
      
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <span className="text-[11px] text-secondary">{spots.filled} / {spots.total} spots filled</span>
          <div className="flex gap-1">
            {filledSpots.map((_, i) => (
              <div key={`filled-${i}`} className="w-2 h-2 rounded-full bg-primary"></div>
            ))}
            {emptySpots.map((_, i) => (
              <div key={`empty-${i}`} className="w-2 h-2 rounded-full border border-outline-variant"></div>
            ))}
          </div>
        </div>
      </div>
      
      <p className="text-xs text-secondary line-clamp-2 leading-relaxed">
        {description}
      </p>
      
      <div className="mt-auto pt-3 flex items-center justify-between">
        <div className="flex items-center text-secondary">
          <span className="material-symbols-outlined text-lg">{contactIcon}</span>
        </div>
        <button 
          onClick={onExpressInterest}
          className="border border-primary-container text-primary-container px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-primary-container hover:text-white transition-colors"
        >
          Express Interest
        </button>
      </div>
    </div>
  );
}
