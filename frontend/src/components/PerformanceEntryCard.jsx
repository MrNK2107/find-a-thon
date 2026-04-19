import React from 'react';

export default function PerformanceEntryCard({
  title,
  eventName,
  date,
  teamSizeLabel,
  status = 'in-progress',
  tags = [],
  description,
  onEdit,
  repoUrl,
  projectUrl
}) {
  const getStatusStyles = () => {
    switch (status.toLowerCase()) {
      case 'won':
        return {
          accentBg: 'bg-green-500',
          badgeBg: 'bg-green-500/10',
          badgeText: 'text-green-700',
          badgeBorder: 'border-green-500/20',
          label: 'Won 🏆'
        };
      case 'runner-up':
        return {
          accentBg: 'bg-amber-500',
          badgeBg: 'bg-amber-500/10',
          badgeText: 'text-amber-700',
          badgeBorder: 'border-amber-500/20',
          label: 'Runner-up'
        };
      case 'in-progress':
      default:
        return {
          accentBg: 'bg-blue-400',
          badgeBg: 'bg-blue-500/10',
          badgeText: 'text-blue-700',
          badgeBorder: 'border-blue-500/20',
          label: 'In Progress'
        };
    }
  };

  const styles = getStatusStyles();

  return (
    <div className="flex glass-panel rounded-2xl overflow-hidden relative h-auto group transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/10">
      {/* Left Accent Bar */}
      <div className={`w-1.5 ${styles.accentBg} shadow-[0_0_8px_rgba(255,255,255,0.5)]`}></div>
      
      <div className="flex-1 p-5 relative z-10">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-3">
            <h5 className="text-[15px] font-bold text-slate-800 drop-shadow-sm">{title}</h5>
            <span className={`${styles.badgeBg} ${styles.badgeText} ${styles.badgeBorder} border text-[10px] font-bold px-2.5 py-0.5 rounded-lg uppercase tracking-wider backdrop-blur-md`}>
              {styles.label}
            </span>
          </div>
          <span className="text-[12px] font-medium text-slate-500">{date}</span>
        </div>
        
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-medium text-slate-600">{eventName}</span>
            <span className="text-slate-300">•</span>
            <span className="text-[13px] font-medium text-slate-600">{teamSizeLabel}</span>
          </div>
        </div>
        
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {tags.map((tag, idx) => (
              <span key={idx} className="glass-panel text-[11px] font-medium text-slate-700 px-2.5 py-1 rounded-md border-transparent text-center">
                {tag}
              </span>
            ))}
          </div>
        )}
        
        {description && (
          <p className="text-[13px] text-slate-500 italic leading-relaxed mb-4 line-clamp-2">
            &quot;{description}&quot;
          </p>
        )}
        
        <div className="flex justify-between items-center pt-4 border-t border-white/30">
          <div className="flex gap-4">
            {repoUrl && (
              <a href={repoUrl} target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-blue-600 transition-colors">
                <span className="material-symbols-outlined text-[20px]">code</span>
              </a>
            )}
            {projectUrl && (
              <a href={projectUrl} target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-blue-600 transition-colors">
                <span className="material-symbols-outlined text-[20px]">open_in_new</span>
              </a>
            )}
          </div>
          <button 
            onClick={onEdit} 
            className="text-[12px] font-bold text-blue-600 hover:text-blue-800 transition-colors px-3 py-1.5 rounded-lg hover:bg-blue-500/10"
          >
            Edit
          </button>
        </div>
      </div>
    </div>
  );
}
