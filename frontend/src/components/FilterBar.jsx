import React from 'react';

const FilterBar = ({ activeFilter = 'All', onFilterChange, count = 0 }) => {
    const filters = ['All', 'Online', 'In-person', 'Hybrid', 'Closing Soon', 'Devpost', 'Devfolio', 'Unstop', 'HackerEarth'];

    return (
        <div className="w-full flex flex-col gap-3">
            <div className="flex overflow-x-auto scrollbar-hide gap-2 pb-1">
                {filters.map((filter) => {
                    const isActive = activeFilter === filter;
                    return (
                        <button
                            key={filter}
                            onClick={() => onFilterChange?.(filter)}
                            className={`
                                whitespace-nowrap rounded-full px-4 py-1.5 text-[14px] transition-all
                                ${isActive 
                                    ? 'bg-[#E6F1FB] text-[#185FA5] border border-[#B5D4F4] font-medium' 
                                    : 'bg-[#F4F4F2] text-[#5F5E5A] border border-transparent font-normal'
                                }
                            `}
                        >
                            {filter}
                        </button>
                    );
                })}
            </div>
            
            <div className="text-[12px] text-[#5f5e5a]">
                Showing {count} hackathon{count !== 1 ? 's' : ''}
            </div>
        </div>
    );
};

export default FilterBar;
