import React from 'react';

const Navbar = ({ searchQuery = '', onSearchChange, liveCount = 0 }) => {
    return (
        <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/85 backdrop-blur-xl">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-18 py-3 gap-4">
                    <div className="flex items-center gap-3 shrink-0">
                        <div className="h-10 w-10 rounded-2xl bg-[#185FA5] flex items-center justify-center shadow-lg shadow-blue-200">
                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                            </svg>
                        </div>
                        <div className="flex flex-col leading-tight">
                            <span className="text-slate-900 font-semibold text-lg">Find-a-thon</span>
                            <span className="text-slate-500 text-xs">Discover, save, track</span>
                        </div>
                    </div>

                    <div className="hidden md:flex flex-1 max-w-2xl mx-4">
                        <div className="relative w-full group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-slate-400 group-focus-within:text-[#185FA5] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(event) => onSearchChange?.(event.target.value)}
                                className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-2xl leading-5 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#185FA5]/20 focus:border-[#185FA5] sm:text-sm transition-all shadow-sm"
                                placeholder="Search by stack, theme, or name"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                        <div className="hidden sm:flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                            <span className="text-emerald-700 text-xs font-medium">{liveCount} live now</span>
                        </div>

                        <button className="text-slate-500 hover:text-slate-900 transition-colors relative">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                            <span className="absolute top-0 right-0 block h-2 w-2 rounded-full ring-2 ring-white bg-red-500"></span>
                        </button>

                        <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-[#185FA5] to-[#7db4e8] p-[2px]">
                            <div className="h-full w-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                                <svg className="w-5 h-5 text-[#185FA5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
