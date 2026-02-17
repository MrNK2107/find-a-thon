import React from 'react';

const HackathonCard = ({ hackathon }) => {
  // Format the date cleanly
  const formattedDate = hackathon.reg_end_date
    ? new Date(hackathon.reg_end_date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
    : 'TBA';

  const isClosed = hackathon.is_closed;

  // Badge Color Logic
  const getSourceBadgeColor = (source) => {
    switch (source?.toLowerCase()) {
      case 'devpost': return 'bg-blue-500 text-white';
      case 'devfolio': return 'bg-indigo-500 text-white';
      case 'mlh': return 'bg-yellow-500 text-black';
      case 'unstop': return 'bg-purple-500 text-white';
      default: return 'bg-slate-700 text-slate-300';
    }
  };

  return (
    <a
      href={hackathon.link}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col h-full bg-slate-800 rounded-3xl shadow-lg hover:shadow-2xl hover:shadow-blue-900/20 transition-all duration-300 border border-slate-700 overflow-hidden transform hover:-translate-y-1"
    >
      {/* Image Section */}
      <div className="relative h-48 w-full overflow-hidden bg-slate-900 flex items-center justify-center">
        {hackathon.image_url ? (
          <>
            <div
              className="absolute inset-0 bg-cover bg-center opacity-30 blur-xl scale-110"
              style={{ backgroundImage: `url(${hackathon.image_url})` }}
            ></div>
            <img
              src={hackathon.image_url}
              alt={hackathon.title}
              className="relative h-full w-full object-contain p-2 transition-transform duration-500 hover:scale-105"
            />
          </>
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 w-full">
            <span className="text-slate-700 text-6xl">👾</span>
          </div>
        )}

        {/* Source Badge (Top Right) */}
        <div className="absolute top-3 right-3 z-10">
          <span className={`text-[10px] font-bold px-3 py-1 rounded-full shadow-sm uppercase tracking-wider backdrop-blur-md ${getSourceBadgeColor(hackathon.source)}`}>
            {hackathon.source || 'Unknown'}
          </span>
        </div>

        {/* Live / Status Badge (Top Left) */}
        <div className="absolute top-3 left-3 flex gap-2 z-10">
          {isClosed ? (
            <span className="bg-red-500/90 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-md shadow-sm uppercase tracking-widest">
              Closed
            </span>
          ) : (
            <span className="bg-emerald-500/90 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-md shadow-sm uppercase tracking-widest flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
              Live
            </span>
          )}
        </div>
      </div>

      {/* Content Section */}
      <div className="flex flex-col flex-grow p-5 relative">
        <div className="flex gap-2 mb-3">
          <span className="bg-slate-700/50 border border-slate-600/50 text-slate-300 text-[10px] font-medium px-2 py-0.5 rounded">
            {hackathon.mode || 'Online'}
          </span>
          {/* Placeholder for tags if we scrape them later */}
          {hackathon.themes && (
            <span className="bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[10px] font-medium px-2 py-0.5 rounded">
              {hackathon.themes}
            </span>
          )}
        </div>

        <h3 className="text-xl font-bold text-white leading-tight mb-3 group-hover:text-blue-400 transition-colors line-clamp-2">
          {hackathon.title}
        </h3>

        <p className="text-slate-400 text-sm line-clamp-2 mb-4">
          {hackathon.description || "Build the next generation of apps. Connect with top developers and win prizes."}
        </p>

        <div className="mt-auto pt-6 border-t border-slate-700/50 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="uppercase text-[10px] tracking-wider text-slate-600 font-bold mb-0.5">Registration Ends</span>
              <div className="flex items-center gap-1.5 text-slate-300">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-mono font-medium">{formattedDate}</span>
              </div>
            </div>
          </div>

          <button className="w-full bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2">
            <span>View Challenge</span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>
      </div>
    </a>
  );
};

export default HackathonCard;
