"use client"

import React from 'react';
import { useApp } from '@/lib/store';
import { Switch } from '@/components/ui/switch';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Database, FileUp, Info, Activity } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

export function SettingsView() {
  const { state, updateSettings, backup, restore } = useApp();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        restore(content);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-24">
      <Card className="rounded-2xl border-none bg-card shadow-xl overflow-hidden">
        <CardHeader className="bg-primary/5 border-b">
          <CardTitle className="flex items-center gap-2 font-headline">
            <Activity className="h-5 w-5 text-primary" /> Attendance Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="text-base font-bold">Vibration Feedback</label>
              <p className="text-sm text-muted-foreground">Haptic feedback when marking presence for previously absent students.</p>
            </div>
            <Switch 
              checked={state.settings.vibration}
              onCheckedChange={(checked) => updateSettings({ vibration: checked })}
            />
          </div>
          
          <Alert variant="default" className="bg-muted/20 border-primary/20">
            <Info className="h-4 w-4" />
            <AlertTitle className="font-bold">Did you know?</AlertTitle>
            <AlertDescription className="text-xs">
              Attendify Pro automatically syncs your data with the cloud every time you make a change.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-none bg-card shadow-xl overflow-hidden">
        <CardHeader className="bg-destructive/5 border-b">
          <CardTitle className="flex items-center gap-2 font-headline">
            <Database className="h-5 w-5 text-destructive" /> Data Infrastructure
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Local Storage & Cloud Hybrid</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              While your data is secured in the cloud, you can use these options to compile external local backups or migrate files manually across accounts.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Button 
                onClick={backup} 
                variant="outline" 
                className="w-full h-14 border-primary/20 bg-primary/5 hover:bg-primary/10 gap-2 font-bold"
              >
                <Database className="h-4 w-4" /> Backup to File
              </Button>
              
              <div className="relative">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <Button 
                  variant="outline" 
                  className="w-full h-14 border-destructive/20 bg-destructive/5 hover:bg-destructive/10 gap-2 font-bold"
                >
                  <FileUp className="h-4 w-4" /> Restore from File
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-center text-xs text-muted-foreground pt-4">
        Attendify Pro v1.0.4 • Build 20240325
      </div>
    </div>
  );
}
