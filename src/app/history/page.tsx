
"use client";

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { AuthProvider } from '@/hooks/use-auth';
import { useAttendance } from '@/hooks/use-attendance';
import { Button } from '@/components/ui/button';
import { Search, Download, FileText, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, subMonths, addMonths } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

function HistoryPage() {
  const { 
    classes, 
    selectedClassId, 
    setSelectedClassId, 
    students, 
    attendance, 
    dayConfigs 
  } = useAttendance();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [searchRoll, setSearchRoll] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [fineRate, setFineRate] = useState(10);
  const { toast } = useToast();

  useEffect(() => {
    const settings = localStorage.getItem('flux_settings');
    if (settings) {
      const { fineRate: savedRate } = JSON.parse(settings);
      if (savedRate) setFineRate(savedRate);
    }
  }, []);

  const selectedClass = classes.find(c => c.id === selectedClassId);

  const totalOnDays = Object.keys(dayConfigs).filter(k => {
    const d = new Date(k);
    return dayConfigs[k] && 
           d.getMonth() === currentDate.getMonth() && 
           d.getFullYear() === currentDate.getFullYear();
  }).length;

  const handleSearch = () => {
    if (!searchRoll) return;
    setIsSearchActive(true);
  };

  const handleFineUpdate = () => {
    const rate = prompt('Enter default global fine rate per absence:', fineRate.toString());
    if (rate && !isNaN(parseInt(rate))) {
      const newRate = parseInt(rate);
      setFineRate(newRate);
      const settings = JSON.parse(localStorage.getItem('flux_settings') || '{}');
      localStorage.setItem('flux_settings', JSON.stringify({ ...settings, fineRate: newRate }));
      toast({ title: `Fine rate set to ${newRate} BDT` });
    }
  };

  const exportCSV = () => {
    if (!students.length) return;
    
    let csv = "Roll,Total Absences,Fine (BDT)\n";
    students.forEach(s => {
      let absences = 0;
      Object.keys(dayConfigs).forEach(date => {
        if (dayConfigs[date] && attendance[date]?.[s.roll.toString()] === 'Absent') {
          absences++;
        }
      });
      csv += `${s.roll},${absences},${absences * fineRate}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `Attendance_Report_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast({ title: "Report downloaded" });
  };

  const searchedStudent = students.find(s => s.roll === parseInt(searchRoll));
  
  const getSearchedData = () => {
    if (!searchedStudent) return null;
    let absences = 0;
    Object.keys(dayConfigs).forEach(date => {
      if (dayConfigs[date] && attendance[date]?.[searchedStudent.roll.toString()] === 'Absent') {
        absences++;
      }
    });
    return { absences, fine: absences * fineRate };
  };

  const searchData = getSearchedData();

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-3">
            <Label className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Class</Label>
            <select 
              value={selectedClassId || ''} 
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="bg-card border rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-teal"
            >
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <Input 
              placeholder="Search by Roll" 
              value={searchRoll} 
              onChange={(e) => setSearchRoll(e.target.value)}
              className="flex-1 bg-card"
            />
            <Button onClick={handleSearch} className="bg-teal text-white">
              <Search className="w-4 h-4 mr-2" /> Search
            </Button>
          </div>
        </div>

        {isSearchActive && searchRoll && (
          <div className="bg-card border-2 border-teal/30 p-6 rounded-2xl animate-in zoom-in-95 duration-300 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2">
              <Button variant="ghost" size="icon" onClick={() => setIsSearchActive(false)}><X className="w-4 h-4" /></Button>
            </div>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="text-teal">Search Results:</span> Roll {searchRoll}
            </h2>
            {searchedStudent ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-secondary/50 p-4 rounded-xl text-center">
                  <div className="text-xs text-muted-foreground uppercase mb-1">Total Absences</div>
                  <div className="text-3xl font-bold text-coral">{searchData?.absences}</div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-secondary/50 p-4 rounded-xl text-center">
                    <div className="text-xs text-muted-foreground uppercase mb-1">Cumulative Fine</div>
                    <div className="text-3xl font-bold text-amber">{searchData?.fine} BDT</div>
                  </div>
                </div>
                <div className="bg-secondary/50 p-4 rounded-xl text-center">
                  <div className="text-xs text-muted-foreground uppercase mb-1">Status</div>
                  <div className="text-3xl font-bold text-teal">Active</div>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">No student found with this roll number.</p>
            )}
          </div>
        )}

        <div 
          onClick={handleFineUpdate}
          className="bg-amber p-4 rounded-2xl flex items-center justify-between cursor-pointer hover:scale-[1.01] transition-transform shadow-lg shadow-amber/10"
        >
          <div className="flex items-center gap-3 font-bold text-amber-foreground">
            <div className="bg-amber-foreground/10 p-2 rounded-lg"><Download className="w-5 h-5" /></div>
            <span>Fine: {fineRate} BDT</span>
          </div>
          <span className="text-xs uppercase font-bold text-amber-foreground/60">Click to change rate</span>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <h3 className="font-bold text-lg">{format(currentDate, 'MMMM yyyy')}</h3>
              <Button variant="ghost" size="icon" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex gap-2">
               <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="border-teal text-teal hover:bg-teal hover:text-white">
                    <FileText className="w-4 h-4 mr-2" /> Range Report
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md bg-card">
                  <DialogHeader><DialogTitle>Advanced Multi-Month Report</DialogTitle></DialogHeader>
                  <div className="space-y-4 py-4">
                    <p className="text-sm text-muted-foreground">Select range for detailed absence audit.</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div><Label>Start Date</Label><Input type="date" /></div>
                      <div><Label>End Date</Label><Input type="date" /></div>
                    </div>
                    <Button className="w-full bg-teal" onClick={exportCSV}>Generate & Download CSV</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="border rounded-2xl overflow-hidden bg-card">
            <Table>
              <TableHeader className="bg-secondary/50">
                <TableRow>
                  <TableHead className="w-[100px]">Roll</TableHead>
                  <TableHead>Total Present</TableHead>
                  <TableHead>Total Absent</TableHead>
                  <TableHead className="text-right">Est. Fine</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => {
                  let present = 0, absent = 0;
                  Object.keys(dayConfigs).forEach(date => {
                    const d = new Date(date);
                    if (dayConfigs[date] && d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear()) {
                      const st = attendance[date]?.[student.roll.toString()];
                      if (st === 'Present') present++;
                      else if (st === 'Absent') absent++;
                    }
                  });
                  return (
                    <TableRow key={student.id}>
                      <TableCell className="font-bold text-teal">{student.roll}</TableCell>
                      <TableCell className="text-emerald font-semibold">{present}</TableCell>
                      <TableCell className="text-coral font-semibold">{absent}</TableCell>
                      <TableCell className="text-right font-bold text-amber">{absent * fineRate} BDT</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <div className="text-sm font-medium text-muted-foreground text-center">
            Total On Days in {format(currentDate, 'MMMM')}: <span className="text-teal">{totalOnDays}</span>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

export default function HistoryWrapper() {
  return (
    <AuthProvider>
      <HistoryPage />
    </AuthProvider>
  );
}
