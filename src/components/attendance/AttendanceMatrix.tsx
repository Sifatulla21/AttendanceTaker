
"use client";

import React, { useMemo } from 'react';
import { format, eachDayOfInterval, startOfMonth, endOfMonth, isToday } from 'date-fns';
import { Check, X, Edit, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAttendance } from '@/hooks/use-attendance';

interface AttendanceMatrixProps {
  currentDate: Date;
  onEditStudent: (id: string, roll: number) => void;
  onDeleteStudent: (id: string) => void;
  vibrationEnabled: boolean;
}

export function AttendanceMatrix({ currentDate, onEditStudent, onDeleteStudent, vibrationEnabled }: AttendanceMatrixProps) {
  const { 
    students, 
    dayConfigs, 
    attendance, 
    toggleOnDay, 
    markAttendance 
  } = useAttendance();

  const daysInMonth = useMemo(() => {
    return eachDayOfInterval({
      start: startOfMonth(currentDate),
      end: endOfMonth(currentDate),
    });
  }, [currentDate]);

  const handleToggleCell = (date: string, roll: number, currentStatus?: 'Present' | 'Absent') => {
    const isOnDay = dayConfigs[date];
    if (!isOnDay) return;

    const newStatus = currentStatus === 'Present' ? 'Absent' : 'Present';
    
    // Haptic Feedback Logic
    if (vibrationEnabled && newStatus === 'Present') {
      const sortedOnDays = daysInMonth
        .map(d => format(d, 'yyyy-MM-dd'))
        .filter(d => dayConfigs[d] && d < date)
        .sort((a, b) => b.localeCompare(a));
      
      const prevDate = sortedOnDays[0];
      if (prevDate && attendance[prevDate]?.[roll.toString()] === 'Absent') {
        window.navigator.vibrate?.(200);
      }
    }

    markAttendance(date, roll, newStatus);
  };

  const getDayAttendanceSum = (date: string) => {
    const dayAttendance = attendance[date] || {};
    return Object.values(dayAttendance).filter(s => s === 'Present').length;
  };

  return (
    <div className="attendance-matrix-container border rounded-xl shadow-inner bg-card">
      <table className="w-full border-collapse">
        <thead>
          <tr className="sticky-row">
            <th className="sticky-row-col p-4 text-sm font-bold border-b border-r min-w-[120px]">
              Roll No
            </th>
            {daysInMonth.map((day) => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const isSelectedToday = isToday(day);
              return (
                <th key={dateStr} className={cn(
                  "p-2 text-center border-b border-r min-w-[60px]",
                  isSelectedToday && "bg-teal/10"
                )}>
                  <div className="text-[10px] text-muted-foreground uppercase">{format(day, 'EEE')}</div>
                  <div className="text-sm font-bold">{format(day, 'd')}</div>
                </th>
              );
            })}
          </tr>
          {/* On Day Row */}
          <tr className="bg-secondary/50">
            <td className="sticky-col p-2 text-[10px] font-semibold text-center uppercase border-b border-r bg-secondary/80">
              On Day
            </td>
            {daysInMonth.map((day) => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const isOn = dayConfigs[dateStr] || false;
              return (
                <td key={`on-${dateStr}`} className="p-2 border-b border-r text-center">
                  <button
                    onClick={() => toggleOnDay(dateStr, !isOn)}
                    className={cn(
                      "w-6 h-6 rounded-full border-2 transition-all flex items-center justify-center mx-auto",
                      isOn ? "bg-teal border-teal text-white shadow-lg" : "border-muted-foreground/30 hover:border-teal/50"
                    )}
                  >
                    {isOn && <Check className="w-3 h-3" />}
                  </button>
                </td>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {students.map((student) => (
            <tr key={student.id} className="hover:bg-muted/30">
              <td className="sticky-col p-3 border-b border-r font-medium flex items-center justify-between gap-2 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                <span className="text-base">{student.roll}</span>
                <div className="flex gap-1">
                  <button onClick={() => onEditStudent(student.id, student.roll)} className="text-amber p-1 hover:bg-amber/10 rounded">
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => onDeleteStudent(student.id)} className="text-coral p-1 hover:bg-coral/10 rounded">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </td>
              {daysInMonth.map((day) => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const isOn = dayConfigs[dateStr];
                const status = attendance[dateStr]?.[student.roll.toString()];
                
                return (
                  <td 
                    key={`${student.id}-${dateStr}`} 
                    onClick={() => handleToggleCell(dateStr, student.roll, status)}
                    className={cn(
                      "p-0 border-b border-r text-center transition-all cursor-pointer",
                      !isOn && "bg-destructive/10 cursor-not-allowed",
                      isOn && status === 'Present' && "bg-emerald",
                      isOn && status === 'Absent' && "bg-destructive",
                      isOn && !status && "hover:bg-teal/5"
                    )}
                  >
                    <div className="h-10 flex items-center justify-center">
                      {isOn && status === 'Present' && <Check className="w-5 h-5 text-white" />}
                      {isOn && status === 'Absent' && <X className="w-5 h-5 text-white" />}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
          {/* Summary Row */}
          <tr className="bg-secondary/50 font-bold">
            <td className="sticky-col p-3 border-r border-t bg-secondary/80 text-right text-xs uppercase text-muted-foreground">
              Present Sum
            </td>
            {daysInMonth.map((day) => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const sum = getDayAttendanceSum(dateStr);
              return (
                <td key={`sum-${dateStr}`} className="p-2 border-r border-t text-center text-teal">
                  {dayConfigs[dateStr] ? sum : '-'}
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
