'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  BarChart3,
  Heart,
  Home,
  Leaf,
  LogOut,
  Settings,
  Wine,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/theme-toggle';

const navItems = [
  { href: '/', label: 'Home', icon: Home, accent: 'blue' as const },
  { href: '/recovery', label: 'Shoulder', icon: Heart, accent: 'blue' as const },
  { href: '/drinks', label: 'Drinks', icon: Wine, accent: 'blue' as const },
  { href: '/substances', label: 'Substances', icon: Leaf, accent: 'violet' as const },
  { href: '/insights', label: 'Insights', icon: BarChart3, accent: 'blue' as const },
];

const ACCENT_MOBILE = {
  blue: 'text-blue-600 dark:text-blue-400',
  violet: 'text-violet-600 dark:text-violet-400',
};

const ACCENT_DESKTOP = {
  blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400',
  violet: 'bg-violet-50 text-violet-600 dark:bg-violet-900/50 dark:text-violet-400',
};

export function MainNav() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile top header */}
      <header className="md:hidden fixed top-0 left-0 right-0 bg-white dark:bg-gray-900 border-b dark:border-gray-800 z-50 px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="font-bold dark:text-white">Kev&apos;s Health</span>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Link href="/settings">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Settings className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t dark:border-gray-800 z-50">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center gap-1 text-xs',
                  active ? ACCENT_MOBILE[item.accent] : 'text-gray-500 dark:text-gray-400'
                )}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col md:w-64 md:fixed md:inset-y-0 border-r bg-white dark:bg-gray-900 dark:border-gray-800">
        <div className="flex items-center justify-between px-6 py-4 border-b dark:border-gray-800">
          <span className="font-bold text-lg dark:text-white">Kev&apos;s Health</span>
          <ThemeToggle />
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  active
                    ? ACCENT_DESKTOP[item.accent]
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                )}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t dark:border-gray-800 space-y-1">
          <Link
            href="/settings"
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
              pathname === '/settings'
                ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400'
                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
            )}
          >
            <Settings className="w-5 h-5" />
            Settings
          </Link>
          <Button
            variant="ghost"
            className="w-full justify-start text-gray-600 dark:text-gray-400"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5 mr-3" />
            Log Out
          </Button>
        </div>
      </aside>
    </>
  );
}
