import React from 'react';

const FilterBar = ({ filters = { modes: [], platforms: [], closingSoon: false, sort: 'deadline' }, onFilterChange, count = 0 }) => {
    const modes = ['Online', 'In-person', 'Hybrid'];
    const platforms = ['Devpost', 'Devfolio', 'Unstop', 'HackerEarth'];
    const sortOptions = [
        { label: 'Deadline', value: 'deadline' },
        { label: 'Newest', value: 'newest' },
        { label: 'A-Z', value: 'title' }
    ];

    const toggleMode = (mode) => {
        const newModes = filters.modes.includes(mode)
            ? filters.modes.filter(m => m !== mode)
            : [...filters.modes, mode];
        onFilterChange({ ...filters, modes: newModes });
    };

    const togglePlatform = (platform) => {
        const newPlatforms = filters.platforms.includes(platform)
            ? filters.platforms.filter(p => p !== platform)
            : [...filters.platforms, platform];
        onFilterChange({ ...filters, platforms: newPlatforms });
    };

    const toggleClosingSoon = () => {
        onFilterChange({ ...filters, closingSoon: !filters.closingSoon });
    };

    const setSort = (sort) => {
        onFilterChange({ ...filters, sort });
    };

    const clearFilters = () => {
        onFilterChange({ modes: [], platforms: [], closingSoon: false, sort: 'deadline' });
    };

    const hasActiveFilters =
        filters.modes.length > 0 ||
        filters.platforms.length > 0 ||
        filters.closingSoon ||
        (filters.sort && filters.sort !== 'deadline');

    const Pill = ({ label, active, onClick }) => (
        <button
            onClick={onClick}
            aria-pressed={active}
            className={`
                whitespace-nowrap rounded-full px-3.5 py-1.5 text-[13px] transition-all duration-200 font-medium
                border
                ${active 
                    ? 'bg-accent text-accent-foreground border-accent shadow-sm' 
                    : 'bg-background text-foreground border-border hover:bg-muted/60 active:bg-muted'
                }
            `}
        >
            {label}
        </button>
    );

    const GroupLabel = ({ children }) => (
        <span className="text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">
            {children}
        </span>
    );

    return (
        <div className="w-full rounded-2xl border border-border bg-card/60 p-4 backdrop-blur-sm">
            <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center gap-2 md:gap-3">
                    <GroupLabel>Modes</GroupLabel>
                    {modes.map((mode) => (
                        <Pill key={mode} label={mode} active={filters.modes.includes(mode)} onClick={() => toggleMode(mode)} />
                    ))}
                </div>

                <div className="flex flex-wrap items-center gap-2 md:gap-3">
                    <GroupLabel>Platforms</GroupLabel>
                    {platforms.map((platform) => (
                        <Pill key={platform} label={platform} active={filters.platforms.includes(platform)} onClick={() => togglePlatform(platform)} />
                    ))}
                    <Pill label="Closing Soon" active={filters.closingSoon} onClick={toggleClosingSoon} />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <div className="flex flex-wrap items-center gap-2 md:gap-3">
                        <GroupLabel>Sort</GroupLabel>
                        {sortOptions.map((option) => (
                            <Pill
                                key={option.value}
                                label={option.label}
                                active={(filters.sort || 'deadline') === option.value}
                                onClick={() => setSort(option.value)}
                            />
                        ))}
                    </div>

                    <button
                        type="button"
                        onClick={clearFilters}
                        disabled={!hasActiveFilters}
                        className="rounded-lg px-3 py-1.5 text-[13px] font-medium text-foreground border border-border hover:bg-muted/60 active:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Clear filters
                    </button>
                </div>
            </div>
            
            <div className="mt-3 text-[13px] text-muted-foreground font-medium">
                Showing {count} hackathon{count !== 1 ? 's' : ''}
            </div>
        </div>
    );
};

export default FilterBar;
