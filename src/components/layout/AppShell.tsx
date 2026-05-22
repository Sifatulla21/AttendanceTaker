
'use client';

import React, { useState, useEffect } from 'react';
import { useUser, useFirebase } from '@/firebase';
import { signOut } from 'firebase/auth';
import { Sun, Moon, LogOut, Home, History, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export function AppShell({ children }: { children: React.ReactNode }) {
  const { auth } = useFirebase();
  const { user, loading } = useUser();
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const initialTheme = savedTheme || 'dark';
    setTheme(initialTheme);
    document.documentElement.classList.toggle('dark', initialTheme === 'dark');
  }, []);

  useEffect(() => {
    if (!loading && !user && pathname !== '/login') {
      router.replace('/login');
    }
  }, [user, loading, pathname, router]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-12 h-12 border-4 border-teal border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (!user && pathname !== '/login') {
    return null;
  }

  if (pathname === '/login') return <>{children}</>;

  const navItems = [
    { label: 'Home', icon: Home, href: '/' },
    { label: 'History', icon: History, href: '/history' },
    { label: 'Settings', icon: Settings, href: '/settings' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background transition-colors duration-300">
      <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md border-b border-border px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold text-teal flex items-center gap-2 tracking-tight">
          Attendance <span className="text-amber">Flux</span>
        </h1>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full">
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={handleLogout} className="rounded-full text-coral hover:text-coral hover:bg-coral/10">
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <main className="flex-1 pb-20 pt-2 overflow-x-hidden">
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t border-border flex items-center justify-around py-3 px-2 sm:hidden">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} className="flex flex-col items-center">
              <div className={cn(
                "p-2 rounded-xl transition-all duration-200",
                isActive ? "bg-teal text-white" : "text-muted-foreground"
              )}>
                <item.icon className="w-6 h-6" />
              </div>
              <span className={cn("text-[10px] mt-1 font-medium", isActive ? "text-teal" : "text-muted-foreground")}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="fixed left-6 top-1/2 -translate-y-1/2 hidden sm:flex flex-col gap-4 z-50">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <div className={cn(
                "p-3 rounded-2xl shadow-lg transition-all duration-300 hover:scale-110",
                isActive ? "bg-teal text-white shadow-teal/20" : "bg-card text-muted-foreground hover:text-foreground"
              )}>
                <item.icon className="w-6 h-6" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
