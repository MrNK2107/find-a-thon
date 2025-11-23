import React from 'react';

const HackathonCard = ({ hackathon }) => {
  // Format the date cleanly
  const formattedDate = hackathon.reg_end_date
    ? new Date(hackathon.reg_end_date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'TBA';

  return (
    <a
      href={hackathon.link}
      target="_blank"
      rel="noopener noreferrer"
      className="group block h-full overflow-hidden rounded-xl bg-white border border-gray-200 shadow-sm transition-all hover:shadow-md hover:border-blue-300"
    >
      {hackathon.image_url && (
        <div className="h-40 w-full overflow-hidden bg-gray-100 relative">
          <img
            src={hackathon.image_url}
            alt={hackathon.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          {hackathon.is_closed && (
            <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
              CLOSED
            </div>
          )}
        </div>
      )}
      
      <div className="p-5 flex flex-col h-full justify-between">
        <div>
          <div className="flex justify-between items-start mb-2">
            <span className="inline-block px-2 py-1 text-xs font-semibold tracking-wide text-blue-600 bg-blue-50 rounded-full uppercase">
              {hackathon.mode || 'Hybrid'}
            </span>
            <span className="text-xs text-gray-400">{hackathon.source}</span>
          </div>
          
          <h2 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
            {hackathon.title}
          </h2>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center text-sm text-gray-600">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>Reg. ends: <span className="font-medium">{formattedDate}</span></span>
        </div>
      </div>
    </a>
  );
};

export default HackathonCard;