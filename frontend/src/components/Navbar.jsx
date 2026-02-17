import React from 'react';

const Navbar = () => {
    return (
        <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo Section */}
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-600 p-2 rounded-lg">
                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                            </svg>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-white font-bold text-lg leading-none">Find-a-thon</span>
                            <span className="text-slate-400 text-xs">Discover & Build</span>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="hidden md:flex flex-1 max-w-xl mx-8">
                        <div className="relative w-full group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-slate-500 group-focus-within:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                className="block w-full pl-10 pr-3 py-2 border border-slate-700 rounded-lg leading-5 bg-slate-800 text-slate-300 placeholder-slate-500 focus:outline-none focus:bg-slate-900 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all"
                                placeholder="Search by stack, theme, or name (e.g. 'Web3', 'AI', 'Global')..."
                            />
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                {/* Cmd+K removed */}
                            </div>
                        </div>
                    </div>

                    {/* Right Section */}
                    <div className="flex items-center gap-4">
                        <div className="hidden sm:flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-full">
                            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                            <span className="text-blue-400 text-xs font-medium">142 Live</span>
                        </div>

                        <button className="text-slate-400 hover:text-white transition-colors relative">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                            <span className="absolute top-0 right-0 block h-2 w-2 rounded-full ring-2 ring-slate-900 bg-red-500"></span>
                        </button>

                        <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 p-[2px]">
                            <div className="h-full w-full rounded-full bg-slate-900 flex items-center justify-center overflow-hidden">
                                <svg className="w-5 h-5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
