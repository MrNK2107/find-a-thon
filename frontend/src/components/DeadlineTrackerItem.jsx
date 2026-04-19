import React from 'react';

export default function DeadlineTrackerItem({
  hackathonName,
  source,
  deadlineDate,
  deadlineTimeText,
  urgency = 'comfortable', // 'urgent', 'soon', 'comfortable'
  isBookmarked = false,
  onBookmarkClick,
}) {
  const getStyles = () => {
    switch (urgency) {
      case 'urgent':
        return {
          dotBg: 'bg-[#A32D2D]',
          dotShadow: 'shadow-[0_0_8px_rgba(163,45,45,0.4)]',
          timeText: 'text-[#A32D2D]',
        };
      case 'soon':
        return {
          dotBg: 'bg-[#854F0B]',
          dotShadow: '',
          timeText: 'text-secondary',
        };
      case 'comfortable':
      default:
        return {
          dotBg: 'bg-[#3B6D11]',
          dotShadow: '',
          timeText: 'text-secondary',
        };
    }
  };

  const styles = getStyles();

  return (
    <div className="group flex items-center border-b border-border/60 bg-card px-6 py-5 transition-colors hover:bg-muted/35 md:px-10">
      {/* Urgency Dot */}
      <div className="w-8 flex justify-center">
        <div className={`w-2 h-2 rounded-full ${styles.dotBg} ${styles.dotShadow}`}></div>
      </div>
      
      {/* Main Info */}
      <div className="flex flex-col ml-4 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-[13px] font-medium text-foreground">{hackathonName}</span>
          {source && (
            <span className="hidden rounded bg-muted/70 px-1.5 py-0.5 text-[10px] font-medium text-foreground/70 sm:inline-block">
              {source}
            </span>
          )}
        </div>
      </div>
      
      {/* Deadline Info & Actions */}
      <div className="flex items-center gap-4 md:gap-6">
        <div className="text-right flex flex-col sm:flex-row sm:items-center sm:gap-1.5">
          <span className="text-[13px] font-medium text-foreground">{deadlineDate}</span>
          <span className={`text-[12px] sm:text-[13px] font-semibold ${styles.timeText}`}>
            ({deadlineTimeText})
          </span>
        </div>
        <button 
          onClick={onBookmarkClick}
          className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-muted/65"
        >
          <span 
            className={`material-symbols-outlined text-[20px] ${isBookmarked ? 'text-accent' : 'text-foreground/45'}`}
            style={isBookmarked ? { fontVariationSettings: "'FILL' 1" } : {}}
          >
            bookmark
          </span>
        </button>
      </div>
    </div>
  );
}
