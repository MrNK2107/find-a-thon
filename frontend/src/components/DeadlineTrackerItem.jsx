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
    <div className="flex items-center px-6 md:px-10 py-5 bg-white hover:bg-surface-container-lowest transition-colors border-b border-[#c2c6d2]/40 group">
      {/* Urgency Dot */}
      <div className="w-8 flex justify-center">
        <div className={`w-2 h-2 rounded-full ${styles.dotBg} ${styles.dotShadow}`}></div>
      </div>
      
      {/* Main Info */}
      <div className="flex flex-col ml-4 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-medium text-on-surface truncate">{hackathonName}</span>
          {source && (
            <span className="hidden sm:inline-block text-[10px] font-medium px-1.5 py-0.5 rounded bg-surface-container-high text-secondary">
              {source}
            </span>
          )}
        </div>
      </div>
      
      {/* Deadline Info & Actions */}
      <div className="flex items-center gap-4 md:gap-6">
        <div className="text-right flex flex-col sm:flex-row sm:items-center sm:gap-1.5">
          <span className="text-[13px] font-medium text-on-surface">{deadlineDate}</span>
          <span className={`text-[12px] sm:text-[13px] font-semibold ${styles.timeText}`}>
            ({deadlineTimeText})
          </span>
        </div>
        <button 
          onClick={onBookmarkClick}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors"
        >
          <span 
            className={`material-symbols-outlined text-[20px] ${isBookmarked ? 'text-primary' : 'text-outline'}`}
            style={isBookmarked ? { fontVariationSettings: "'FILL' 1" } : {}}
          >
            bookmark
          </span>
        </button>
      </div>
    </div>
  );
}
