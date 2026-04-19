'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

export default function ThemeToggle({ className = '' }) {
  const { theme, mounted, toggleTheme } = useTheme();

  if (!mounted) {
    return (
      <button
        type="button"
        aria-hidden="true"
        tabIndex={-1}
        className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card/80 text-foreground opacity-0 ${className}`}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle dark mode"
      aria-pressed={theme === 'dark'}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card/80 text-foreground transition-all duration-300 hover:bg-accent/15 ${className}`}
    >
      {mounted && theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  );
}
