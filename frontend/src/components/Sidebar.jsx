'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Bookmark, CalendarClock, Trophy, Users, BarChart3, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

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
      className={`flex items-center gap-3 rounded-xl px-3 py-2 text-[13px] transition-colors ${
        active ? 'bg-[#E6F1FB] text-[#185FA5] font-medium' : 'text-[#5f5e5a] hover:bg-[#F4F4F2] hover:text-[#1a1c1b]'
      }`}
    >
      <Icon size={16} />
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
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-64 border-r border-slate-200 bg-white p-4 flex-col">
        <div className="mb-6 px-3">
          <p className="text-xs uppercase tracking-wide text-slate-400">Find-a-thon</p>
          <h1 className="text-xl font-semibold text-[#185FA5]">My Workspace</h1>
        </div>

        <p className="text-[10px] font-semibold text-[#9B9B98] uppercase tracking-widest px-3 mb-1 mt-4">Discover</p>
        <div className="space-y-1 mb-6">
          {discoverLinks.map((item) => (
            <NavItem key={item.href} {...item} pathname={pathname} />
          ))}
        </div>

        <p className="text-[10px] font-semibold text-[#9B9B98] uppercase tracking-widest px-3 mb-1 mt-4">My Journey</p>
        <div className="space-y-1">
          {journeyLinks.map((item) => (
            <NavItem key={item.href} {...item} pathname={pathname} />
          ))}
        </div>

        <button
          onClick={logout}
          className="mt-auto flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-[13px] text-slate-600 hover:bg-[#E6F1FB] hover:text-[#185FA5] transition-colors"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </aside>

      <main className="md:ml-64 p-4 md:p-6 pb-24 md:pb-6">{children}</main>

      <nav className="md:hidden fixed bottom-0 inset-x-0 border-t border-slate-200 bg-white grid grid-cols-5">
        {mobileLinks.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`p-2 flex flex-col items-center justify-center text-[10px] ${
                active ? 'text-[#185FA5]' : 'text-[#9B9B98]'
              }`}
            >
              <Icon size={16} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
