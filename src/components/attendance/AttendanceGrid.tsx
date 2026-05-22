"use client"

import React, { useMemo, useState, useEffect } from 'react';
import { useApp } from '@/lib/store';
import { format, eachDayOfInterval, startOfMonth, endOfMonth, isSameDay, setMonth, setYear } from 'date-fns';
import { Check, X, ChevronLeft, ChevronRight, UserPlus, Trash2, Edit2, Plus, Search, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 11 }, (_, i) => (currentYear - 5 + i).toString());

export function AttendanceGrid() {
  const { state, selectClass, addClass, addStudent, deleteStudent, toggleOnDay, markAttendance, updateClass, deleteClass } = useApp();
  const [currentDate, setCurrentDate] = useState<Date | null>(null);
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [newRoll, setNewRoll] = useState('');
  const [isEditClassOpen, setIsEditClassOpen] = useState(false);
  const [editingClassName, setEditingClassName] = useState('');
  const [newClassName, setNewClassName] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  
  const [searchRoll, setSearchRoll] = useState('');
  const [searchedStudent, setSearchedStudent] = useState<any>(null);

  useEffect(() => {
    setIsMounted(true);
    setCurrentDate(new Date());
  }, []);

  const selectedClass = state.classes.find(c => c.id === state.selectedClassId);

  const daysInMonth = useMemo(() => {
    if (!currentDate) return [];
    return eachDayOfInterval({
      start: startOfMonth(currentDate),
      end: endOfMonth(currentDate)
    });
  }, [currentDate]);

  const handleCreateClass = () => {
    if (newClassName.trim()) {
      addClass(newClassName.trim());
      setNewClassName('');
    }
  };

  const handleSearch = () => {
    if (!selectedClass) return;
    const student = selectedClass.students.find(s => s.roll.toString() === searchRoll);
    setSearchedStudent(student || null);
  };

  if (!isMounted || !currentDate) return null;

  if (state.classes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center bg-card rounded-2xl shadow-inner border border-dashed border-primary/30">
        <div className="p-4 bg-primary/10 rounded-full mb-4">
          <Plus className="w-12 h-12 text-primary" />
        </div>
        <h3 className="text-xl font-headline font-bold mb-2 text-primary">Ready to start?</h3>
        <p className="text-muted-foreground mb-6">Create your first class to begin tracking attendance.</p>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button className="rounded-full px-8 bg-primary hover:bg-primary/90 shadow-lg gap-2">
              <Plus className="h-4 w-4" /> Create First Class
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Class</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Input 
                placeholder="Class Name" 
                value={newClassName}
                onChange={(e) => setNewClassName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateClass()}
              />
            </div>
            <DialogFooter>
              <Button onClick={handleCreateClass} disabled={!newClassName.trim()}>
                Create Class
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  const prevMonth = () => setCurrentDate(prev => prev ? new Date(prev.getFullYear(), prev.getMonth() - 1, 1) : null);
  const nextMonth = () => setCurrentDate(prev => prev ? new Date(prev.getFullYear(), prev.getMonth() + 1, 1) : null);

  const handleMonthChange = (monthName: string) => {
    const monthIndex = months.indexOf(monthName);
    setCurrentDate(prev => prev ? setMonth(prev, monthIndex) : null);
  };

  const handleYearChange = (year: string) => {
    setCurrentDate(prev => prev ? setYear(prev, parseInt(year)) : null);
  };

  const handleAddStudent = () => {
    const rollNum = parseInt(newRoll);
    if (!isNaN(rollNum)) {
      addStudent(rollNum);
      setNewRoll('');
      setIsAddStudentOpen(false);
    }
  };

  const handleRenameClass = () => {
    if (editingClassName && state.selectedClassId) {
      updateClass(state.selectedClassId, editingClassName);
      setIsEditClassOpen(false);
    }
  };

  const handleDeleteClass = () => {
    if (state.selectedClassId) {
      deleteClass(state.selectedClassId);
    }
  };

  const totalPresentByDay = daysInMonth.map(day => {
    const dateStr = format(day, 'yyyy-MM-dd');
    if (!selectedClass?.onDays.includes(dateStr)) return null;
    return selectedClass.students.reduce((acc, student) => {
      return acc + (selectedClass.attendance[student.id]?.[dateStr] === 'present' ? 1 : 0);
    }, 0);
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-muted-foreground px-1 uppercase tracking-wider">Select Class</label>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {state.classes.map(c => (
              <button
                key={c.id}
                onClick={() => {
                  selectClass(c.id);
                  setSearchedStudent(null);
                  setSearchRoll('');
                }}
                className={cn(
                  "whitespace-nowrap px-6 py-2 rounded-full font-medium transition-all duration-300 border",
                  state.selectedClassId === c.id 
                    ? "bg-primary text-primary-foreground border-primary shadow-lg scale-105" 
                    : "bg-secondary text-secondary-foreground border-transparent hover:bg-secondary/80"
                )}
              >
                {c.name}
              </button>
            ))}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="rounded-full border-primary text-primary hover:bg-primary/10 px-6 h-10">
                  <Plus className="h-4 w-4 mr-1" /> Class
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Create New Class</DialogTitle></DialogHeader>
                <div className="py-4">
                  <Input 
                    placeholder="Class Name" 
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                  />
                </div>
                <DialogFooter>
                  <Button onClick={handleCreateClass} disabled={!newClassName.trim()}>Create</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-muted-foreground px-1 uppercase tracking-wider">Search Roll Number</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Enter roll..." 
                className="pl-9 h-10 rounded-full bg-card" 
                value={searchRoll}
                onChange={(e) => setSearchRoll(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch} className="rounded-full px-6 h-10">Search</Button>
          </div>
        </div>
      </div>

      {searchedStudent && selectedClass && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-300">
          <Card className="border-primary/20 shadow-xl overflow-hidden">
            <CardHeader className="bg-primary/5 flex flex-row items-center justify-between py-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => setSearchedStudent(null)} className="h-8 w-8 rounded-full">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                Individual Record: Roll {searchedStudent.roll}
              </CardTitle>
              <span className="text-sm font-medium text-muted-foreground">
                {months[currentDate.getMonth()]} {currentDate.getFullYear()}
              </span>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    {daysInMonth.map(day => {
                      const isOn = selectedClass.onDays.includes(format(day, 'yyyy-MM-dd'));
                      if (!isOn) return null;
                      return (
                        <th key={day.toISOString()} className="p-3 text-[10px] font-bold uppercase text-center min-w-[50px] border-r">
                          {format(day, 'd')}<br/>{format(day, 'EEE')}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {daysInMonth.map(day => {
                      const dateStr = format(day, 'yyyy-MM-dd');
                      const isOn = selectedClass.onDays.includes(dateStr);
                      if (!isOn) return null;
                      const status = selectedClass.attendance[searchedStudent.id]?.[dateStr];
                      return (
                        <td key={dateStr} className={cn(
                          "p-4 text-center border-r h-16",
                          status === 'present' ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"
                        )}>
                          {status === 'present' ? <Check className="h-6 w-6 mx-auto" /> : <X className="h-6 w-6 mx-auto" />}
                          <span className="text-[10px] font-bold block mt-1 uppercase">{status || 'absent'}</span>
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}

      {selectedClass && !searchedStudent && (
        <div className="bg-card rounded-2xl shadow-xl overflow-hidden border">
          <div className="p-4 bg-muted/30 border-b flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={prevMonth} className="rounded-full border-primary/30 h-8 w-8">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="flex gap-2">
                <Select value={months[currentDate.getMonth()]} onValueChange={handleMonthChange}>
                  <SelectTrigger className="w-[130px] h-8 rounded-full border-primary/30 font-bold bg-background">
                    <SelectValue placeholder="Month" />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map(m => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={currentDate.getFullYear().toString()} onValueChange={handleYearChange}>
                  <SelectTrigger className="w-[100px] h-8 rounded-full border-primary/30 font-bold bg-background">
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map(y => (
                      <SelectItem key={y} value={y}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button variant="outline" size="icon" onClick={nextMonth} className="rounded-full border-primary/30 h-8 w-8">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Dialog open={isEditClassOpen} onOpenChange={(open) => {
                setIsEditClassOpen(open);
                if(open) setEditingClassName(selectedClass.name);
              }}>
                <DialogTrigger asChild>
                  <Button variant="secondary" size="sm" className="bg-[#F7C358] hover:bg-[#F7C358]/80 text-black gap-1 h-8 rounded-full">
                    <Edit2 className="h-3 w-3" /> Edit
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Rename Class</DialogTitle></DialogHeader>
                  <Input value={editingClassName} onChange={(e) => setEditingClassName(e.target.value)} />
                  <DialogFooter><Button onClick={handleRenameClass}>Update</Button></DialogFooter>
                </DialogContent>
              </Dialog>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="secondary" size="sm" className="bg-destructive hover:bg-destructive/80 text-white gap-1 h-8 rounded-full">
                    <Trash2 className="h-3 w-3" /> Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the class "{selectedClass.name}" and all records.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteClass} className="bg-destructive text-white hover:bg-destructive/90">
                      Delete Class
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <Dialog open={isAddStudentOpen} onOpenChange={setIsAddStudentOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-[#007D8A] hover:bg-[#007D8A]/80 text-white gap-1 h-8 rounded-full shadow-md">
                    <UserPlus className="h-3 w-3" /> Student
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Add New Student</DialogTitle></DialogHeader>
                  <Input 
                    placeholder="Enter Roll Number" 
                    type="number" 
                    value={newRoll} 
                    onChange={(e) => setNewRoll(e.target.value)} 
                    onKeyDown={(e) => e.key === 'Enter' && handleAddStudent()}
                  />
                  <DialogFooter><Button onClick={handleAddStudent}>Add</Button></DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="attendance-grid-container relative">
            <table className="w-full border-collapse table-fixed md:table-auto">
              <thead>
                <tr className="bg-muted/80">
                  <th className="sticky-both p-3 text-sm font-bold border min-w-32 bg-card">Roll</th>
                  {daysInMonth.map(day => {
                    const isToday = isSameDay(day, new Date());
                    return (
                      <th key={day.toISOString()} className={cn(
                        "sticky-row p-2 text-xs border min-w-14 text-center",
                        isToday && "bg-primary/20 ring-2 ring-primary ring-inset z-30",
                        !isToday && "bg-muted/30"
                      )}>
                        <div className="flex flex-col font-bold">
                          <span>{format(day, 'd')}</span>
                          <span className="text-[10px] opacity-60 uppercase">{format(day, 'EEE')}</span>
                        </div>
                      </th>
                    );
                  })}
                </tr>
                <tr className="bg-muted/40">
                  <th className="sticky-col p-2 text-xs font-bold border text-muted-foreground bg-card">On Day</th>
                  {daysInMonth.map(day => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const isOn = selectedClass.onDays.includes(dateStr);
                    return (
                      <th key={`on-${dateStr}`} className="p-2 border text-center">
                        <div 
                          onClick={() => toggleOnDay(dateStr)}
                          className={cn(
                            "w-6 h-6 rounded-full mx-auto cursor-pointer flex items-center justify-center transition-all",
                            isOn ? "bg-primary text-white" : "border-2 border-muted-foreground/30"
                          )}
                        >
                          {isOn && <Check className="h-3 w-3" />}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {selectedClass.students.map(student => (
                  <tr key={student.id} className="hover:bg-muted/10 transition-colors">
                    <td className="sticky-col p-3 border font-bold text-sm group flex items-center justify-between gap-2 bg-card">
                      <span>{student.roll}</span>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                        <button onClick={() => deleteStudent(student.id)} className="text-destructive hover:scale-110"><X className="h-3 w-3"/></button>
                      </div>
                    </td>
                    {daysInMonth.map(day => {
                      const dateStr = format(day, 'yyyy-MM-dd');
                      const isOn = selectedClass.onDays.includes(dateStr);
                      const status = selectedClass.attendance[student.id]?.[dateStr];
                      
                      return (
                        <td 
                          key={`${student.id}-${dateStr}`}
                          onClick={() => {
                            if (!isOn) return;
                            const nextStatus = status === 'present' ? 'absent' : 'present';
                            markAttendance(student.id, dateStr, nextStatus);
                          }}
                          className={cn(
                            "p-2 border text-center cursor-pointer transition-all h-12",
                            !isOn ? "cell-off-day" : 
                            status === 'present' ? "cell-present hover:brightness-110" : "cell-absent hover:brightness-110"
                          )}
                        >
                          {isOn && (status === 'present' ? <Check className="h-4 w-4 mx-auto" /> : <X className="h-4 w-4 mx-auto" />)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
              <tfoot className="sticky bottom-0 z-20">
                <tr className="bg-muted font-bold">
                  <td className="sticky-col p-3 border bg-card">Total Present</td>
                  {totalPresentByDay.map((count, idx) => (
                    <td key={`sum-${idx}`} className="p-2 border text-center text-primary bg-card">
                      {count !== null ? count : '-'}
                    </td>
                  ))}
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
