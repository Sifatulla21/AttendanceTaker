"use client"

import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '@/lib/store';
import { format, isSameMonth, parseISO, setMonth, setYear, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { Search, Download, Wallet, ChevronLeft, ChevronRight, GraduationCap, CalendarDays, CalendarRange } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 11 }, (_, i) => (currentYear - 5 + i).toString());

export function HistoryView() {
  const { state, updateSettings, selectClass } = useApp();
  const { toast } = useToast();
  const [searchRoll, setSearchRoll] = useState('');
  const [startDate, setStartDate] = useState<Date>(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date>(startOfMonth(new Date()));
  const [isRangeMode, setIsRangeMode] = useState(false);
  const [newFineRate, setNewFineRate] = useState(state.settings.fineRate.toString());
  const [isFineDialogOpen, setIsFineDialogOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    setNewFineRate(state.settings.fineRate.toString());
  }, [state.settings.fineRate]);

  const selectedClass = state.classes.find(c => c.id === state.selectedClassId);

  const stats = useMemo(() => {
    if (!selectedClass) return { totalOnDays: 0, studentStats: [], totalClassFine: 0, totalClassAbsences: 0 };
    
    const rangeStart = startOfMonth(startDate);
    const rangeEnd = isRangeMode ? endOfMonth(endDate) : endOfMonth(startDate);

    const onDaysInRange = selectedClass.onDays.filter(d => {
      try {
        const dayDate = parseISO(d);
        return isWithinInterval(dayDate, { start: rangeStart, end: rangeEnd });
      } catch (e) {
        return false;
      }
    });

    let totalClassFine = 0;
    let totalClassAbsences = 0;

    const studentStats = selectedClass.students.map(s => {
      const absences = onDaysInRange.filter(d => selectedClass.attendance[s.id]?.[d] !== 'present').length;
      const fine = absences * state.settings.fineRate;
      
      totalClassAbsences += absences;
      totalClassFine += fine;

      return {
        ...s,
        absences,
        fine
      };
    });

    return { totalOnDays: onDaysInRange.length, studentStats, totalClassFine, totalClassAbsences };
  }, [selectedClass, startDate, endDate, isRangeMode, state.settings.fineRate]);

  const downloadPdfReport = () => {
    if (!selectedClass) return;
    try {
      const doc = new jsPDF();
      
      doc.setFontSize(20);
      doc.text(`Attendify Pro Report`, 14, 15);
      doc.setFontSize(12);
      doc.text(`Class: ${selectedClass.name}`, 14, 25);
      
      const dateRangeText = isRangeMode 
        ? `${format(startDate, 'MMM yyyy')} - ${format(endDate, 'MMM yyyy')}`
        : format(startDate, 'MMMM yyyy');
        
      doc.text(`Period: ${dateRangeText}`, 14, 32);
      doc.text(`Total On-Days: ${stats.totalOnDays}`, 14, 39);
      doc.text(`Total Class Fine: ${stats.totalClassFine} BDT`, 14, 46);

      const tableData = stats.studentStats.map(s => [s.roll, s.absences, `${s.fine} BDT`]);
      
      autoTable(doc, {
        head: [['Roll Number', 'Total Absences', 'Total Fine']],
        body: tableData,
        startY: 55,
        theme: 'grid',
        headStyles: { fillColor: [0, 125, 138], textColor: [255, 255, 255], fontStyle: 'bold' }
      });

      const fileName = isRangeMode 
        ? `Attendance_Report_${selectedClass.name}_${format(startDate, 'MMM')}_to_${format(endDate, 'MMM_yyyy')}.pdf`
        : `Attendance_Report_${selectedClass.name}_${format(startDate, 'MMM_yyyy')}.pdf`;

      doc.save(fileName);
      toast({ title: "Export Success", description: "Report downloaded as PDF." });
    } catch (e) {
      toast({ variant: "destructive", title: "Export Error", description: "Could not generate PDF." });
    }
  };

  const handleUpdateFine = () => {
    const num = parseFloat(newFineRate);
    if (!isNaN(num)) {
      updateSettings({ fineRate: num });
      setIsFineDialogOpen(false);
      toast({ title: "Rate Updated", description: `Fine rate set to ${num} BDT.` });
    }
  };

  const handleMonthChange = (monthName: string, type: 'start' | 'end') => {
    const monthIndex = months.indexOf(monthName);
    if (type === 'start') {
      setStartDate(prev => setMonth(prev, monthIndex));
    } else {
      setEndDate(prev => setMonth(prev, monthIndex));
    }
  };

  const handleYearChange = (year: string, type: 'start' | 'end') => {
    if (type === 'start') {
      setStartDate(prev => setYear(prev, parseInt(year)));
    } else {
      setEndDate(prev => setYear(prev, parseInt(year)));
    }
  };

  if (!isMounted) return null;

  return (
    <div className="space-y-6 pb-20">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] px-1">Select Class</label>
          <Select value={state.selectedClassId || ""} onValueChange={(val) => selectClass(val)}>
            <SelectTrigger className="w-full h-11 rounded-xl border-primary/20 bg-card font-bold text-primary shadow-sm">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 opacity-50" />
                <SelectValue placeholder="Choose a class" />
              </div>
            </SelectTrigger>
            <SelectContent>
              {state.classes.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between px-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Range Mode</label>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-medium text-muted-foreground">{isRangeMode ? "On" : "Off"}</span>
              <Switch checked={isRangeMode} onCheckedChange={setIsRangeMode} className="scale-75 origin-right" />
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2 bg-card p-1 rounded-xl border border-primary/20 shadow-sm">
              <span className="text-[9px] font-black text-primary/40 uppercase pl-2 w-8">{isRangeMode ? "From" : "Date"}</span>
              <Select value={months[startDate.getMonth()]} onValueChange={(v) => handleMonthChange(v, 'start')}>
                <SelectTrigger className="flex-1 h-9 rounded-lg border-none font-bold bg-transparent text-primary focus:ring-0">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  {months.map(m => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={startDate.getFullYear().toString()} onValueChange={(v) => handleYearChange(v, 'start')}>
                <SelectTrigger className="w-[85px] h-9 rounded-lg border-none font-bold bg-transparent text-primary focus:ring-0">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  {years.map(y => (
                    <SelectItem key={y} value={y}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isRangeMode && (
              <div className="flex items-center gap-2 bg-card p-1 rounded-xl border border-primary/20 shadow-sm animate-in slide-in-from-top-1 duration-200">
                <span className="text-[9px] font-black text-primary/40 uppercase pl-2 w-8">To</span>
                <Select value={months[endDate.getMonth()]} onValueChange={(v) => handleMonthChange(v, 'end')}>
                  <SelectTrigger className="flex-1 h-9 rounded-lg border-none font-bold bg-transparent text-primary focus:ring-0">
                    <SelectValue placeholder="Month" />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map(m => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={endDate.getFullYear().toString()} onValueChange={(v) => handleYearChange(v, 'end')}>
                  <SelectTrigger className="w-[85px] h-9 rounded-lg border-none font-bold bg-transparent text-primary focus:ring-0">
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map(y => (
                      <SelectItem key={y} value={y}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] px-1">Settings</label>
          <Dialog open={isFineDialogOpen} onOpenChange={setIsFineDialogOpen}>
            <DialogTrigger asChild>
              <div className="bg-[#F7C358] h-11 px-6 rounded-xl flex justify-between items-center cursor-pointer shadow-lg hover:brightness-105 transition-all group">
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-black/60 uppercase tracking-widest leading-none mb-1">Fine Rate</span>
                  <span className="text-sm font-bold text-black">{state.settings.fineRate} BDT / Absence</span>
                </div>
                <Wallet className="h-5 w-5 text-black/70" />
              </div>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Update Fine Rate</DialogTitle></DialogHeader>
              <div className="py-4">
                <label className="text-sm font-medium mb-2 block">Rate per Absence (BDT)</label>
                <Input 
                  type="number" 
                  value={newFineRate} 
                  onChange={(e) => setNewFineRate(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleUpdateFine()}
                />
              </div>
              <DialogFooter>
                <Button onClick={handleUpdateFine}>Update Rate</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
        <Input 
          className="pl-11 h-12 bg-card rounded-xl shadow-sm border-primary/20 focus:border-primary transition-all"
          placeholder="Search by Roll Number..."
          value={searchRoll}
          onChange={(e) => setSearchRoll(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card className="rounded-2xl shadow-xl overflow-hidden border-primary/10">
          <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/20 py-4 px-6">
            <div className="flex flex-col">
              <CardTitle className="font-headline text-lg">
                {isRangeMode 
                  ? `${format(startDate, 'MMM yy')} - ${format(endDate, 'MMM yy')}`
                  : format(startDate, 'MMMM yyyy')}
              </CardTitle>
              {selectedClass && (
                <div className="flex items-center gap-1.5 mt-1 text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full w-fit">
                  <CalendarDays className="h-3 w-3" />
                  <span>Total class: {stats.totalOnDays}</span>
                </div>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={downloadPdfReport} className="text-primary font-bold hover:bg-primary/10 rounded-lg">
              <Download className="h-4 w-4 mr-2" /> Export PDF
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[60vh] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-card border-b z-10">
                  <tr className="bg-muted/30">
                    <th className="p-4 text-left font-bold text-[10px] uppercase tracking-widest text-muted-foreground">Roll No.</th>
                    <th className="p-4 text-center font-bold text-[10px] uppercase tracking-widest text-muted-foreground">Absences</th>
                    <th className="p-4 text-right font-bold text-[10px] uppercase tracking-widest text-muted-foreground">Fine Amt.</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.studentStats
                    .filter(s => searchRoll ? s.roll.toString().includes(searchRoll) : true)
                    .map(s => (
                      <tr key={s.id} className="border-b hover:bg-muted/5 transition-colors">
                        <td className="p-4 font-bold text-primary">{s.roll}</td>
                        <td className="p-4 text-center">
                          <span className={cn(
                            "px-3 py-1 rounded-full text-xs font-black",
                            s.absences > 5 ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"
                          )}>
                            {s.absences}
                          </span>
                        </td>
                        <td className="p-4 text-right font-black text-primary">{s.fine} ৳</td>
                      </tr>
                    ))}
                  {stats.studentStats.length === 0 && (
                    <tr>
                      <td colSpan={3} className="p-12 text-center text-muted-foreground italic">
                        {selectedClass ? "No attendance data for this period." : "Please select a class above."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
