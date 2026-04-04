import React from 'react';

export default function DashboardStatCard({
  label,
  value,
  subtext,
  footerText,
  variant = 'neutral',
  icon,
  progress, // number 0-100 for a progress bar
}) {
  const getColors = () => {
    switch (variant) {
      case 'success':
        return {
          text: 'text-[#3B6D11]',
          icon: 'text-[#3B6D11]',
        };
      case 'primary':
        return {
          text: 'text-[#185FA5]',
          icon: 'text-[#185FA5]',
        };
      case 'amber':
        return {
          text: 'text-[#854F0B]',
          icon: 'text-[#854F0B]',
        };
      case 'neutral':
      default:
        return {
          text: 'text-on-surface',
          icon: 'text-secondary',
        };
    }
  };

  const colors = getColors();

  return (
    <div className="bg-surface-container-lowest border border-on-background/[0.12] rounded-xl p-[18px] flex flex-col justify-between min-h-[140px] hover:bg-surface-container-low transition-colors duration-300">
      <div className="flex flex-col gap-1">
        <span className="text-[11px] font-bold uppercase tracking-widest text-secondary">
          {label}
        </span>
        <div className="flex items-baseline gap-2">
          <span className={`text-[24px] font-medium ${colors.text}`}>
            {value}
          </span>
          {subtext && (
            <span className="text-xs text-on-surface-variant/60 font-medium">
              {subtext}
            </span>
          )}
        </div>
      </div>
      
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] text-secondary">{footerText}</span>
        
        {progress !== undefined && (
          <div className="h-1 flex-1 bg-surface-container rounded-full overflow-hidden">
            <div className="h-full bg-secondary-fixed-dim" style={{ width: `${progress}%` }}></div>
          </div>
        )}

        {icon && (
          <span 
            className={`material-symbols-outlined text-sm ${colors.icon}`} 
            style={variant === 'amber' ? { fontVariationSettings: "'FILL' 1" } : {}}
          >
            {icon}
          </span>
        )}
      </div>
    </div>
  );
}
