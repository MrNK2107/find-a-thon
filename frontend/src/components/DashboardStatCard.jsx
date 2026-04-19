import React from 'react';

export default function DashboardStatCard({
  label,
  value,
  subtext,
  footerText,
  variant = 'neutral',
  icon,
  progress,
}) {
  const getColors = () => {
    switch (variant) {
      case 'success':
        return {
          value: 'text-emerald-600',
          icon: 'text-amber-400',
        };
      case 'primary':
        return {
          value: 'text-indigo-600',
          icon: 'text-indigo-300',
        };
      case 'amber':
        return {
          value: 'text-amber-500',
          icon: 'text-amber-400',
        };
      case 'neutral':
      default:
        return {
          value: 'text-foreground',
          icon: 'text-sky-400',
        };
    }
  };

  const colors = getColors();

  return (
    <div className="flex min-h-[132px] flex-col justify-between rounded-2xl border border-border bg-card/80 p-4 shadow-[0_14px_28px_rgba(89,104,151,0.08)] backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-card">
      <div className="flex flex-col gap-1">
        <span className="text-[12px] font-extrabold uppercase tracking-[0.12em] text-foreground/60">
          {label}
        </span>
        <div className="space-y-1">
          <span className={`block text-[42px] font-extrabold leading-none ${colors.value}`}>
            {value}
          </span>
          {subtext && (
            <span className="text-sm font-medium text-foreground/65">
              {subtext}
            </span>
          )}
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="text-[12px] font-semibold text-foreground/65">{footerText}</span>

        {progress !== undefined && (
          <div className="h-1.5 flex-1 overflow-hidden rounded-full border border-border bg-muted/55">
            <div className="h-full rounded-full bg-[#7a8bf8]" style={{ width: `${progress}%` }}></div>
          </div>
        )}

        {icon && (
          <span className={`text-[34px] leading-none ${colors.icon}`}>
            {icon}
          </span>
        )}
      </div>
    </div>
  );
}
