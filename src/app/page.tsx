
'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useAttendance } from '@/hooks/use-attendance';
import { Button } from '@/components/ui/button';
import { Plus, ChevronLeft, ChevronRight, RefreshCcw, UserPlus } from 'lucide-react';
import { format, addMonths, subMonths } from 'date-fns';
import { AttendanceMatrix } from '@/components/attendance/AttendanceMatrix';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function HomePage() {
  const { 
    classes, 
    selectedClassId, 
    setSelectedClassId, 
    addClass, 
    updateClass, 
    deleteClass,
    addStudent,
    deleteStudent,
    updateStudentRoll,
    loading 
  } = useAttendance();
  
  const [currentDate, setCurrentDate] = useState<Date | null>(null);
  const [isAddClassOpen, setIsAddClassOpen] = useState(false);
  const [isEditClassOpen, setIsEditClassOpen] = useState(false);
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [isEditStudentOpen, setIsEditStudentOpen] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newRoll, setNewRoll] = useState('');
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  
  const { toast } = useToast();

  useEffect(() => {
    setCurrentDate(new Date());
    const settings = localStorage.getItem('flux_settings');
    if (settings) {
      const { vibration } = JSON.parse(settings);
      setVibrationEnabled(vibration !== false);
    }
  }, []);

  const selectedClass = classes.find(c => c.id === selectedClassId);

  const handleAddClass = async () => {
    if (!newClassName.trim()) return;
    await addClass(newClassName);
    setNewClassName('');
    setIsAddClassOpen(false);
    toast({ title: "Class created successfully" });
  };

  const handleEditClass = async () => {
    if (!selectedClassId || !newClassName.trim()) return;
    await updateClass(selectedClassId, newClassName);
    setIsEditClassOpen(false);
    toast({ title: "Class updated" });
  };

  const handleAddStudent = async () => {
    const rollNum = parseInt(newRoll);
    if (isNaN(rollNum)) return;
    await addStudent(rollNum);
    setNewRoll('');
    setIsAddStudentOpen(false);
    toast({ title: `Roll ${rollNum} added` });
  };

  const handleUpdateStudent = async () => {
    if (!editingStudentId) return;
    const rollNum = parseInt(newRoll);
    if (isNaN(rollNum)) return;
    await updateStudentRoll(editingStudentId, rollNum);
    setIsEditStudentOpen(false);
    toast({ title: "Roll number updated" });
  };

  const openEditStudent = (id: string, roll: number) => {
    setEditingStudentId(id);
    setNewRoll(roll.toString());
    setIsEditStudentOpen(true);
  };

  return (
    <AppShell>
      {loading || !currentDate ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-teal border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="space-y-3">
            <Label className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Select Class</Label>
            <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {classes.map((cls) => (
                <button
                  key={cls.id}
                  onClick={() => setSelectedClassId(cls.id)}
                  className={cn(
                    "whitespace-nowrap px-6 py-2 rounded-full text-sm font-semibold transition-all duration-300",
                    selectedClassId === cls.id 
                      ? "bg-teal text-white shadow-lg shadow-teal/20 scale-105" 
                      : "bg-card text-muted-foreground hover:bg-muted"
                  )}
                >
                  {cls.name}
                </button>
              ))}
              <Button 
                variant="outline" 
                onClick={() => setIsAddClassOpen(true)}
                className="rounded-full px-4 border-dashed border-muted-foreground/50 hover:border-teal hover:text-teal"
              >
                <Plus className="w-4 h-4 mr-2" /> Add New Class
              </Button>
            </div>
          </div>

          {selectedClassId ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-card p-4 rounded-2xl shadow-sm border">
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="icon" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <div className="min-w-[120px] text-center font-bold text-lg">
                    {format(currentDate, 'MMMM yyyy')}
                  </div>
                  <Button variant="outline" size="icon" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setCurrentDate(new Date())} className="text-teal font-semibold">
                    <RefreshCcw className="w-3.5 h-3.5 mr-1" /> Today
                  </Button>
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                  <Button 
                    onClick={() => { setNewClassName(selectedClass?.name || ''); setIsEditClassOpen(true); }}
                    className="flex-1 sm:flex-none bg-amber hover:bg-amber/90 text-amber-foreground font-bold rounded-xl"
                  >
                    Edit Class
                  </Button>
                  <Button 
                    onClick={() => setIsAddStudentOpen(true)}
                    className="flex-1 sm:flex-none bg-teal hover:bg-teal/90 text-white font-bold rounded-xl"
                  >
                    <UserPlus className="w-4 h-4 mr-2" /> Add Student
                  </Button>
                  <Button 
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this class?')) {
                        deleteClass(selectedClassId);
                      }
                    }}
                    className="flex-1 sm:flex-none bg-coral hover:bg-coral/90 text-white font-bold rounded-xl"
                  >
                    Delete
                  </Button>
                </div>
              </div>

              <AttendanceMatrix 
                currentDate={currentDate} 
                onEditStudent={openEditStudent}
                onDeleteStudent={deleteStudent}
                vibrationEnabled={vibrationEnabled}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
              <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center">
                <Plus className="w-10 h-10 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-lg">No classes yet. Create one to get started!</p>
              <Button onClick={() => setIsAddClassOpen(true)} className="bg-teal hover:bg-teal/90 text-white rounded-xl px-8">
                Create First Class
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <Dialog open={isAddClassOpen} onOpenChange={setIsAddClassOpen}>
        <DialogContent className="bg-card text-foreground rounded-2xl">
          <DialogHeader><DialogTitle>New Class</DialogTitle></DialogHeader>
          <div className="py-4"><Input placeholder="Class Name" value={newClassName} onChange={(e) => setNewClassName(e.target.value)} /></div>
          <DialogFooter><Button onClick={handleAddClass} className="bg-teal">Create</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditClassOpen} onOpenChange={setIsEditClassOpen}>
        <DialogContent className="bg-card text-foreground rounded-2xl">
          <DialogHeader><DialogTitle>Rename Class</DialogTitle></DialogHeader>
          <div className="py-4"><Input value={newClassName} onChange={(e) => setNewClassName(e.target.value)} /></div>
          <DialogFooter><Button onClick={handleEditClass} className="bg-teal">Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddStudentOpen} onOpenChange={setIsAddStudentOpen}>
        <DialogContent className="bg-card text-foreground rounded-2xl">
          <DialogHeader><DialogTitle>Add Student</DialogTitle></DialogHeader>
          <div className="py-4"><Input type="number" placeholder="Roll Number" value={newRoll} onChange={(e) => setNewRoll(e.target.value)} /></div>
          <DialogFooter><Button onClick={handleAddStudent} className="bg-teal">Add</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditStudentOpen} onOpenChange={setIsEditStudentOpen}>
        <DialogContent className="bg-card text-foreground rounded-2xl">
          <DialogHeader><DialogTitle>Edit Student</DialogTitle></DialogHeader>
          <div className="py-4"><Input type="number" value={newRoll} onChange={(e) => setNewRoll(e.target.value)} /></div>
          <DialogFooter><Button onClick={handleUpdateStudent} className="bg-teal">Update</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
