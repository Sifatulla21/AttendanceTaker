
"use client"

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { AppProvider, useApp } from '@/lib/store';
import { AppHeader } from '@/components/layout/AppHeader';
import { BottomNav } from '@/components/layout/BottomNav';
import { AttendanceGrid } from '@/components/attendance/AttendanceGrid';
import { HistoryView } from '@/components/history/HistoryView';
import { SettingsView } from '@/components/settings/SettingsView';
import { ShieldCheck, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';

function AppContent() {
  const { isAuthenticated, login } = useApp();
  const [activeTab, setActiveTab] = useState<'home' | 'history' | 'settings'>('home');

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#0A0E0F]">
        <div className="max-w-md w-full bg-card p-10 rounded-3xl shadow-2xl border border-white/5 space-y-8 animate-in fade-in zoom-in duration-500">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="bg-primary p-4 rounded-2xl shadow-[0_0_40px_rgba(0,125,138,0.3)]">
              <ShieldCheck className="h-12 w-12 text-primary-foreground" />
            </div>
            <h1 className="text-4xl font-headline font-bold text-primary tracking-tight">Attendify Pro</h1>
            <p className="text-muted-foreground">Secure, cloud-synced student attendance management system.</p>
          </div>

          <div className="space-y-4">
            <Button 
              onClick={login}
              className="w-full h-14 rounded-xl text-lg font-bold bg-[#007D8A] hover:bg-[#007D8A]/90 shadow-lg gap-3 transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <LogIn className="h-5 w-5" />
              Sign in with Google
            </Button>
            <p className="text-[10px] text-center text-muted-foreground uppercase tracking-widest font-medium opacity-50">
              Encrypted Profile Synchronization
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground transition-colors duration-300">
      <AppHeader />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-5xl">
        {activeTab === 'home' && <AttendanceGrid />}
        {activeTab === 'history' && <HistoryView />}
        {activeTab === 'settings' && <SettingsView />}
      </main>
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}

export default function Home() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
