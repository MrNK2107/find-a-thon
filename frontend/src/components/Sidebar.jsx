'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Bookmark, CalendarClock, Trophy, Users, BarChart3, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import ThemeToggle from '@/components/ThemeToggle';

const discoverLinks = [
  { href: '/explore', label: 'Explore', icon: Home },
  { href: '/saved', label: 'Saved', icon: Bookmark },
  { href: '/deadlines', label: 'Deadlines', icon: CalendarClock },
];

const journeyLinks = [
  { href: '/tracker', label: 'Tracker', icon: Trophy },
  { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
  { href: '/team', label: 'Team Finder', icon: Users },
];

function NavItem({ href, label, icon: Icon, pathname }) {
  const active = pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] transition-all duration-200 ${
        active 
          ? 'border border-border bg-accent/15 font-semibold text-foreground shadow-sm'
          : 'border border-transparent text-foreground/75 hover:bg-muted/55 hover:text-foreground'
      }`}
    >
      <Icon size={18} className={active ? 'text-accent' : 'text-foreground/60'} />
      <span>{label}</span>
    </Link>
  );
}

export default function Sidebar({ children }) {
  const pathname = usePathname();
  const { logout } = useAuth();
  
  // Create mobile links by removing team finder
  const mobileLinks = [...discoverLinks, ...journeyLinks].filter(l => l.href !== '/team');

  return (
    <div className="relative min-h-screen bg-background text-foreground transition-colors duration-300">
      <aside className="fixed bottom-8 left-4 top-20 z-40 hidden w-64 flex-col rounded-3xl border border-border bg-card/80 p-5 shadow-[0_20px_45px_rgba(15,23,42,0.12)] backdrop-blur-xl md:flex">
        <div className="mb-6 flex items-start justify-between gap-2 px-2">
          <div>
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground/65">Find-a-thon</p>
            <h1 className="bg-gradient-to-r from-accent to-sky-500 bg-clip-text text-[32px] font-bold leading-none text-transparent">My Workspace</h1>
          </div>
          <ThemeToggle />
        </div>

        <p className="mb-2 mt-2 px-2 text-[10px] font-bold uppercase tracking-widest text-foreground/55">Discover</p>
        <div className="space-y-1.5 mb-6">
          {discoverLinks.map((item) => (
            <NavItem key={item.href} {...item} pathname={pathname} />
          ))}
        </div>

        <p className="mb-2 mt-4 px-2 text-[10px] font-bold uppercase tracking-widest text-foreground/55">My Journey</p>
        <div className="space-y-1.5">
          {journeyLinks.map((item) => (
            <NavItem key={item.href} {...item} pathname={pathname} />
          ))}
        </div>

        <button
          onClick={logout}
          className="mt-auto flex items-center gap-2 rounded-xl border border-border bg-card/85 px-3 py-2.5 text-[14px] text-foreground/85 shadow-sm transition-colors hover:bg-muted/50"
        >
          <LogOut size={18} className="text-red-500" />
          <span className="font-medium">Sign out</span>
        </button>
      </aside>

      <main className="md:ml-[280px] p-4 md:p-8 pt-20 pb-24 md:pb-8 min-h-screen relative z-10">{children}</main>

      <nav className="md:hidden fixed bottom-4 left-4 right-4 rounded-2xl glass-panel flex justify-around items-center p-2 z-50">
        {mobileLinks.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`p-2 flex flex-col items-center justify-center text-[10px] font-medium transition-colors rounded-xl ${
                active ? 'bg-accent/15 text-accent' : 'text-foreground/65 hover:bg-muted/55'
              }`}
            >
              <Icon size={18} className="mb-1" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
