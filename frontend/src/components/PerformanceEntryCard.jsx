import React from 'react';

export default function PerformanceEntryCard({
  title,
  eventName,
  date,
  teamSizeLabel,
  status = 'in-progress', // 'won', 'runner-up', 'in-progress', 'archived'
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
          accentBg: 'bg-[#3B6D11]',
          badgeBg: 'bg-[#386a0d]/10',
          badgeText: 'text-[#386a0d]',
          label: 'Won 🏆'
        };
      case 'runner-up':
        return {
          accentBg: 'bg-[#854F0B]',
          badgeBg: 'bg-amber-100',
          badgeText: 'text-[#854F0B]',
          label: 'Runner-up'
        };
      case 'in-progress':
      default:
        return {
          accentBg: 'bg-neutral-300',
          badgeBg: 'bg-surface-container',
          badgeText: 'text-secondary',
          label: 'In Progress'
        };
    }
  };

  const styles = getStatusStyles();

  return (
    <div className="flex bg-surface-container-lowest rounded-xl overflow-hidden border border-on-background/[0.12] relative h-auto">
      {/* Left Accent Bar */}
      <div className={`w-1 ${styles.accentBg}`}></div>
      
      <div className="flex-1 p-[16px] md:p-[18px]">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-3">
            <h5 className="text-[14px] font-bold text-on-surface">{title}</h5>
            <span className={`${styles.badgeBg} ${styles.badgeText} text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider`}>
              {styles.label}
            </span>
          </div>
          <span className="text-[12px] text-secondary">{date}</span>
        </div>
        
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-secondary">{eventName}</span>
            <span className="text-neutral-300">•</span>
            <span className="text-[12px] text-secondary">{teamSizeLabel}</span>
          </div>
        </div>
        
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {tags.map((tag, idx) => (
              <span key={idx} className="bg-[#F5F5F3] dark:bg-surface-container text-[11px] font-medium text-secondary px-2 py-1 rounded">
                {tag}
              </span>
            ))}
          </div>
        )}
        
        {description && (
          <p className="text-[13px] text-neutral-400 italic leading-relaxed mb-4 line-clamp-2">
            &quot;{description}&quot;
          </p>
        )}
        
        <div className="flex justify-between items-center pt-3 border-t border-neutral-100 dark:border-neutral-800">
          <div className="flex gap-4">
            {repoUrl && (
              <a href={repoUrl} target="_blank" rel="noopener noreferrer" className="text-secondary hover:text-primary flex items-center gap-1 transition-colors">
                <span className="material-symbols-outlined text-[18px]">code</span>
              </a>
            )}
            {projectUrl && (
              <a href={projectUrl} target="_blank" rel="noopener noreferrer" className="text-secondary hover:text-primary flex items-center gap-1 transition-colors">
                <span className="material-symbols-outlined text-[18px]">open_in_new</span>
              </a>
            )}
          </div>
          <button 
            onClick={onEdit} 
            className="text-[12px] font-semibold text-primary hover:underline"
          >
            Edit
          </button>
        </div>
      </div>
    </div>
  );
}
