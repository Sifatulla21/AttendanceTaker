
"use client";

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { AuthProvider } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Info, FileJson, Download, Upload, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAttendance } from '@/hooks/use-attendance';

function SettingsPage() {
  const [vibration, setVibration] = useState(true);
  const { toast } = useToast();
  const { classes, students, attendance, dayConfigs } = useAttendance();

  useEffect(() => {
    const settings = localStorage.getItem('flux_settings');
    if (settings) {
      const { vibration: savedVibration } = JSON.parse(settings);
      setVibration(savedVibration !== false);
    }
  }, []);

  const handleVibrationToggle = (checked: boolean) => {
    setVibration(checked);
    const settings = JSON.parse(localStorage.getItem('flux_settings') || '{}');
    localStorage.setItem('flux_settings', JSON.stringify({ ...settings, vibration: checked }));
  };

  const handleBackup = () => {
    const backupData = {
      classes,
      attendance,
      dayConfigs,
      exportDate: new Date().toISOString(),
      version: "1.0"
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AttendanceFlux_Backup_${format(new Date(), 'yyyyMMdd_HHmm')}.json`;
    a.click();
    toast({ title: "Backup compiled and downloaded" });
  };

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.classes && data.attendance) {
          // In a real app, we'd batch write these to Firestore
          toast({ title: "Restore parsed successfully", description: "In production, this would overwrite your cloud data." });
        } else {
          throw new Error("Invalid format");
        }
      } catch (err) {
        toast({ variant: "destructive", title: "Invalid backup file" });
      }
    };
    reader.readAsText(file);
  };

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8">
        <h2 className="text-3xl font-bold tracking-tight text-teal">Settings</h2>

        {/* Preferences Section */}
        <Card className="bg-card border-border rounded-2xl overflow-hidden shadow-lg">
          <CardHeader>
            <CardTitle>Attendance Feedback</CardTitle>
            <CardDescription>Configure how the app responds to your interactions.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base font-bold">Vibration</Label>
                <p className="text-sm text-muted-foreground">Vibrate device on mark (Haptic Feedback)</p>
              </div>
              <Switch checked={vibration} onCheckedChange={handleVibrationToggle} />
            </div>

            <div className="bg-teal/5 p-4 rounded-xl flex gap-3 border border-teal/10">
              <Info className="w-5 h-5 text-teal shrink-0" />
              <p className="text-xs text-muted-foreground">
                When enabled, the app will trigger a haptic pulse if a student was marked absent on their immediate preceding active day.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Backup Section */}
        <Card className="bg-card border-border rounded-2xl overflow-hidden shadow-lg">
          <CardHeader>
            <CardTitle className="uppercase text-xs tracking-widest text-muted-foreground font-black">LOCAL STORAGE (ANDROID/WEB BACKUP)</CardTitle>
            <CardDescription>Your data is secured in the cloud. Use these options to compile external local backups or restore files manually.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-amber/10 p-4 rounded-xl flex gap-3 border border-amber/20">
              <AlertTriangle className="w-5 h-5 text-amber shrink-0" />
              <p className="text-sm text-amber-foreground">
                Restoring from a file will overwrite current cloud records for this user.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button onClick={handleBackup} className="flex-1 h-12 bg-secondary text-foreground hover:bg-muted border font-bold rounded-xl gap-2">
                <Download className="w-4 h-4" /> Backup to File
              </Button>
              <div className="flex-1 relative">
                <input 
                  type="file" 
                  accept=".json" 
                  onChange={handleRestore}
                  className="absolute inset-0 opacity-0 cursor-pointer z-10"
                />
                <Button className="w-full h-12 bg-teal text-white hover:bg-teal/90 font-bold rounded-xl gap-2 pointer-events-none">
                  <Upload className="w-4 h-4" /> Restore from File
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Info Block */}
        <div className="text-center py-8 space-y-2 opacity-50">
          <p className="text-sm font-bold">Attendance Flux v1.0.4</p>
          <p className="text-xs">Secure. Isolated. Real-time.</p>
        </div>
      </div>
    </AppShell>
  );
}

export default function SettingsWrapper() {
  return (
    <AuthProvider>
      <SettingsPage />
    </AuthProvider>
  );
}

// Minimal polyfill for format if not imported properly
const format = (date: Date, str: string) => {
  const pad = (n: number) => n.toString().padStart(2, '0');
  if (str === 'yyyyMMdd_HHmm') {
    return `${date.getFullYear()}${pad(date.getMonth()+1)}${pad(date.getDate())}_${pad(date.getHours())}${pad(date.getMinutes())}`;
  }
  return date.toISOString();
}
