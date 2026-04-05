import React from 'react';

const FilterBar = ({ activeFilter = 'All', onFilterChange, count = 0 }) => {
    const filters = ['All', 'Online', 'In-person', 'Hybrid', 'Closing Soon'];

    return (
        <div className="w-full flex flex-col gap-3">
            <div className="flex overflow-x-auto scrollbar-hide gap-2 pb-1 -mx-6 px-6 sm:mx-0 sm:px-0">
                {filters.map((filter) => {
                    const isActive = activeFilter === filter;
                    return (
                        <button
                            key={filter}
                            onClick={() => onFilterChange?.(filter)}
                            className={`
                                whitespace-nowrap rounded-full px-4 py-1.5 text-[14px] transition-all
                                ${isActive 
                                    ? 'bg-[var(--brand-blue-light)] text-[var(--brand-blue)] border border-[#B5D4F4] font-medium' 
                                    : 'bg-gray-100 text-gray-600 border border-transparent hover:bg-gray-200'
                                }
                            `}
                        >
                            {filter}
                        </button>
                    );
                })}
            </div>
            
            <div className="text-[12px] text-[var(--text-muted)]">
                Showing {count} hackathon{count !== 1 ? 's' : ''}
            </div>
        </div>
    );
};

export default FilterBar;
