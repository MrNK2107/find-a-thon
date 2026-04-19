export default function TeamCard({ listing, profile }) {
  return (
    <article className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div>
        <h3 className="font-semibold text-foreground">{listing.hackathon_title || 'General team listing'}</h3>
        <p className="text-sm text-foreground/65">Posted by {profile?.name || 'Anonymous'}</p>
      </div>

      <p className="text-sm text-foreground/80">{listing.description}</p>

      <div className="flex flex-wrap gap-2">
        {(listing.looking_for_skills || []).map((skill) => (
          <span key={skill} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
            {skill}
          </span>
        ))}
      </div>

      <div className="text-xs text-foreground/65">
        Team: {listing.team_size_current}/{listing.team_size_max}
      </div>

      <button
        type="button"
        onClick={() => navigator.clipboard.writeText(listing.contact_method || '')}
        className="rounded-lg border border-border px-3 py-1.5 text-sm text-foreground/80 hover:bg-muted/45"
      >
        Express Interest
      </button>
    </article>
  );
}
