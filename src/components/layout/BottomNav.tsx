"use client"

import { Home, History, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BottomNavProps {
  activeTab: 'home' | 'history' | 'settings';
  onTabChange: (tab: 'home' | 'history' | 'settings') => void;
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const navItems = [
    { id: 'home', label: 'Attendance', icon: Home },
    { id: 'history', label: 'History', icon: History },
    { id: 'settings', label: 'Settings', icon: Settings },
  ] as const;

  return (
    <nav className="fixed bottom-0 left-0 z-50 w-full h-16 bg-card border-t shadow-2xl md:h-20">
      <div className="grid h-full max-w-lg grid-cols-3 mx-auto font-medium">
        {navItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={cn(
              "inline-flex flex-col items-center justify-center px-5 group transition-all duration-300",
              activeTab === id 
                ? "text-primary scale-110" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className={cn(
              "w-6 h-6 mb-1",
              activeTab === id && "animate-pulse"
            )} />
            <span className="text-xs">{label}</span>
            {activeTab === id && (
              <div className="absolute top-0 w-12 h-1 bg-primary rounded-full transition-all duration-500" />
            )}
          </button>
        ))}
      </div>
    </nav>
  );
}
