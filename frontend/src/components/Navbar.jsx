import React from 'react';
import Link from 'next/link';

const Navbar = ({ searchQuery = '', onSearchChange, hackathonCount = 0 }) => {
    return (
        <nav className="fixed top-0 w-full bg-[var(--surface)] border-b border-[var(--border)] h-14 z-50 flex items-center justify-between px-6">
            
            {/* Left: Logo */}
            <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[var(--brand-blue)]"></span>
                <span className="font-[var(--font-inter)] text-[16px] font-semibold text-[var(--text-primary)]">
                    Find·a·thon
                </span>
            </div>

            {/* Center: Search Input */}
            <div className="absolute left-1/2 transform -translate-x-1/2 w-[320px] hidden md:block">
                <div className="relative w-full text-[var(--text-muted)] focus-within:text-[var(--brand-blue)]">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        value={searchQuery}
                        aria-label="Search hackathons"
                        onChange={(e) => onSearchChange?.(e.target.value)}
                        placeholder="Search hackathons..."
                        className="w-full bg-[var(--bg)] border-transparent rounded-lg py-1.5 pl-9 pr-3 text-[14px] text-[var(--text-primary)] focus:bg-[var(--surface)] focus:border-[var(--brand-blue-light)] focus:ring-2 focus:ring-[var(--brand-blue-light)] transition-colors placeholder:text-[var(--text-subtle)] outline-none"
                    />
                </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-4">
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--brand-green-light)] text-[var(--brand-green)]">
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--brand-green)] animate-pulse"></div>
                    <span className="text-[11px] font-medium tracking-wide">{hackathonCount} open</span>
                </div>
                
                <Link href="/auth" className="text-[14px] font-medium text-[var(--text-muted)] hover:text-[var(--brand-blue)] transition-colors">
                    Sign in
                </Link>
            </div>
        </nav>
    );
};

export default Navbar;
