import React from 'react';

const FilterBar = ({ activeFilter, onFilterChange, showUrgency, onUrgencyChange }) => {
    const filters = [
        { id: 'all', label: 'All Events' },
        { id: 'Devpost', label: 'Devpost' },
        { id: 'Devfolio', label: 'Devfolio' },
        { id: 'MLH', label: 'MLH' },
        { id: 'Unstop', label: 'Unstop' },
        { id: 'Online', label: 'Online', icon: 'wifi' },
        { id: 'Offline', label: 'In-Person', icon: 'map-pin' },
    ];

    return (
        <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white/90 backdrop-blur-sm p-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
                {filters.map((filter) => (
                    <button
                        key={filter.id}
                        onClick={() => onFilterChange(filter.id)}
                        className={`
              relative px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border
              ${activeFilter === filter.id
                                ? 'bg-[#185FA5] text-white border-[#185FA5] shadow-lg shadow-blue-200'
                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                            }
            `}
                    >
                        {filter.icon && (
                            <span className="mr-2 opacity-70">
                                {filter.icon === 'wifi' ? (
                                    <svg className="w-3 h-3 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                                    </svg>
                                ) : (
                                    <svg className="w-3 h-3 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                )}
                            </span>
                        )}
                        {filter.label}
                    </button>
                ))}
            </div>

            <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 md:max-w-xs md:ml-auto">
                <span className={`text-xs font-semibold px-2 ${showUrgency ? 'text-[#b45309]' : 'text-slate-500'}`}>
                    Urgency
                </span>
                <button
                    onClick={() => onUrgencyChange(!showUrgency)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#185FA5]/30 focus:ring-offset-2 focus:ring-offset-white ${showUrgency ? 'bg-amber-500' : 'bg-slate-300'
                        }`}
                >
                    <span
                        className={`${showUrgency ? 'translate-x-6' : 'translate-x-1'
                            } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                    />
                </button>
            </div>
        </div>
    );
};

export default FilterBar;
