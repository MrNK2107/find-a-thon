import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import ThemeToggle from '@/components/ThemeToggle';

const Navbar = ({ searchQuery = '', onSearchChange, hackathonCount = 0 }) => {
    const router = useRouter();
    const { user } = useAuth();
    const [isNavigatingToAuth, setIsNavigatingToAuth] = useState(false);

    const handleSignInClick = () => {
        if (isNavigatingToAuth) return;
        setIsNavigatingToAuth(true);
        router.push('/auth');
    };

    return (
        <div className="fixed top-0 w-full z-50 px-6 pt-4 pointer-events-none flex justify-center">
            <nav className="glass-panel w-full max-w-6xl rounded-2xl h-14 flex items-center justify-between px-6 pointer-events-auto">
                {/* Left: Logo */}
                <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></span>
                    <span className="font-[var(--font-inter)] text-[16px] font-bold text-foreground tracking-tight">
                        Find·a·thon
                    </span>
                </div>

                {/* Center: Search Input */}
                <div className="absolute left-1/2 transform -translate-x-1/2 w-[320px] hidden md:block">
                    <div className="relative w-full text-foreground/60 focus-within:text-accent">
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
                            className="glass-input w-full rounded-xl py-1.5 pl-9 pr-3 text-[14px] text-foreground placeholder:text-foreground/50"
                        />
                    </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-4">
                    <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-card/70 border border-border text-foreground/75 shadow-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                        <span className="text-[11px] font-medium tracking-wide">{hackathonCount} open</span>
                    </div>

                    <ThemeToggle />
                    
                    {user ? (
                        <Link href="/dashboard" className="text-[14px] font-medium text-foreground/80 hover:text-accent transition-colors">
                            Dashboard
                        </Link>
                    ) : (
                        <button
                            type="button"
                            onClick={handleSignInClick}
                            disabled={isNavigatingToAuth}
                            aria-label="Sign in"
                            aria-busy={isNavigatingToAuth}
                            className="rounded-lg px-2 py-1 text-[14px] font-medium text-foreground hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 disabled:cursor-not-allowed disabled:opacity-60 transition-colors"
                        >
                            {isNavigatingToAuth ? 'Opening...' : 'Sign in'}
                        </button>
                    )}
                </div>
            </nav>
        </div>
    );
};

export default Navbar;


