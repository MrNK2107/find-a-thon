import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-on-surface">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary-container flex items-center justify-center text-white font-bold">F</div>
          <span className="font-bold text-lg tracking-tight">Find-a-thon</span>
        </div>
        <div className="flex items-center gap-6 text-sm font-medium">
          <Link href="/login" className="text-secondary hover:text-primary transition-colors">
            Log In
          </Link>
          <Link 
            href="/signup" 
            className="px-4 py-2 bg-cta-gradient text-white rounded-md transition-opacity hover:opacity-90 shadow-ambient"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-8 pt-24 pb-32 max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-16">
        <div className="flex-1 space-y-6 z-10 relative">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-surface-container border border-outline-variant/30 text-xs font-semibold text-primary uppercase tracking-widest mb-2">
            The Digital Atelier
          </div>
          <h1 className="text-5xl md:text-6xl font-black tracking-[-0.02em] leading-[1.1] text-on-surface">
            High-performance hackathon coordination.
          </h1>
          <p className="text-lg text-secondary max-w-xl leading-relaxed">
            Move beyond messy spreadsheets and chaotic group chats. Find-a-thon is the premium workspace to discover events, organize your team, and track your competitive performance out in the wild.
          </p>
          <div className="pt-4 flex gap-4">
            <Link 
              href="/signup" 
              className="px-6 py-3 bg-cta-gradient text-white rounded-md font-semibold transition-transform hover:-translate-y-0.5 shadow-ambient inline-flex items-center gap-2"
            >
              Start tracking
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </Link>
            <Link 
              href="/explore" 
              className="px-6 py-3 bg-transparent border border-outline-variant/15 text-primary rounded-md font-semibold transition-colors hover:bg-surface-container-low"
            >
              Discover Hackathons
            </Link>
          </div>
        </div>

        {/* Hero Visual Mockup */}
        <div className="flex-1 relative w-full aspect-square md:aspect-auto md:h-[500px]">
          {/* Abstract Tonal Layering representation */}
          <div className="absolute inset-0 bg-surface-container-low rounded-xl border border-outline-variant/10 shadow-ambient transform rotate-3 scale-105" />
          <div className="absolute inset-4 bg-surface-container rounded-xl border border-outline-variant/10 shadow-ambient transform -rotate-1" />
          <div className="absolute inset-8 bg-surface-container-lowest rounded-xl border border-outline-variant/15 shadow-ambient p-6 flex flex-col gap-4">
            <div className="flex justify-between items-center pb-4 border-b border-outline-variant/15">
              <div className="h-4 w-32 bg-surface-container-high rounded" />
              <div className="h-6 w-20 bg-tertiary-container/10 rounded-full" />
            </div>
            <div className="flex gap-4">
               <div className="w-12 h-12 bg-surface-container-high rounded-md" />
               <div className="flex-1 space-y-2 py-1">
                 <div className="h-4 w-3/4 bg-surface-container-high rounded" />
                 <div className="h-3 w-1/2 bg-surface-container rounded" />
               </div>
            </div>
            <div className="mt-auto h-24 bg-surface-container-low rounded-md border border-outline-variant/10" />
            <div className="h-10 bg-primary/10 rounded-md" />
          </div>
        </div>
      </section>
      
      {/* Footer minimal */}
      <footer className="border-t border-outline-variant/10 py-12 text-center">
        <p className="text-secondary text-sm">© {new Date().getFullYear()} Find-a-thon Workspace. All rights reserved.</p>
      </footer>
    </div>
  );
}