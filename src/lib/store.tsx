"use client"

import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppState, ClassData, AppSettings, Student } from './types';
import { useToast } from '@/hooks/use-toast';

interface AppContextType {
  state: AppState;
  addClass: (name: string) => void;
  deleteClass: (id: string) => void;
  updateClass: (id: string, name: string) => void;
  selectClass: (id: string) => void;
  addStudent: (roll: number) => void;
  deleteStudent: (studentId: string) => void;
  toggleOnDay: (date: string) => void;
  markAttendance: (studentId: string, date: string, status: 'present' | 'absent') => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  logout: () => void;
  isAuthenticated: boolean;
  login: () => void;
  backup: () => void;
  restore: (data: string) => void;
}

const STORAGE_KEY = 'attendify_pro_data';

const defaultSettings: AppSettings = {
  vibration: true,
  fineRate: 10,
  theme: 'dark'
};

const initialState: AppState = {
  classes: [],
  selectedClassId: null,
  settings: defaultSettings,
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(initialState);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const auth = localStorage.getItem('attendify_auth');
    if (saved) {
      try {
        setState(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved state", e);
      }
    }
    if (auth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const login = () => {
    setIsAuthenticated(true);
    localStorage.setItem('attendify_auth', 'true');
    toast({ title: "Welcome back!", description: "Signed in with Google" });
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('attendify_auth');
    toast({ title: "Logged out", description: "Session ended safely." });
  };

  const addClass = (name: string) => {
    const newClass: ClassData = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      students: [],
      onDays: [],
      attendance: {}
    };
    setState(prev => ({
      ...prev,
      classes: [...prev.classes, newClass],
      selectedClassId: prev.selectedClassId || newClass.id
    }));
    toast({ title: "Class Created", description: `Added ${name} to your dashboard.` });
  };

  const deleteClass = (id: string) => {
    setState(prev => {
      const filteredClasses = prev.classes.filter(c => c.id !== id);
      return {
        ...prev,
        classes: filteredClasses,
        selectedClassId: prev.selectedClassId === id 
          ? (filteredClasses[0]?.id || null) 
          : prev.selectedClassId
      };
    });
    toast({ title: "Class Deleted", description: "The class and its data were removed." });
  };

  const updateClass = (id: string, name: string) => {
    setState(prev => ({
      ...prev,
      classes: prev.classes.map(c => c.id === id ? { ...c, name } : c)
    }));
  };

  const selectClass = (id: string) => {
    setState(prev => ({ ...prev, selectedClassId: id }));
  };

  const addStudent = (roll: number) => {
    if (!state.selectedClassId) return;
    const newStudent: Student = {
      id: Math.random().toString(36).substr(2, 9),
      roll,
    };
    setState(prev => ({
      ...prev,
      classes: prev.classes.map(c => {
        if (c.id === prev.selectedClassId) {
          return {
            ...c,
            students: [...c.students, newStudent].sort((a, b) => a.roll - b.roll)
          };
        }
        return c;
      })
    }));
    toast({ title: "Student Added", description: `Roll ${roll} registered.` });
  };

  const deleteStudent = (studentId: string) => {
    setState(prev => ({
      ...prev,
      classes: prev.classes.map(c => {
        if (c.id === prev.selectedClassId) {
          return {
            ...c,
            students: c.students.filter(s => s.id !== studentId)
          };
        }
        return c;
      })
    }));
  };

  const toggleOnDay = (date: string) => {
    if (!state.selectedClassId) return;
    setState(prev => ({
      ...prev,
      classes: prev.classes.map(c => {
        if (c.id === prev.selectedClassId) {
          const onDays = c.onDays.includes(date)
            ? c.onDays.filter(d => d !== date)
            : [...c.onDays, date];
          return { ...c, onDays };
        }
        return c;
      })
    }));
  };

  const markAttendance = (studentId: string, date: string, status: 'present' | 'absent') => {
    if (!state.selectedClassId) return;
    
    // Haptic Feedback Logic
    if (state.settings.vibration && status === 'present') {
      const cls = state.classes.find(c => c.id === state.selectedClassId);
      if (cls) {
        const sortedOnDays = [...cls.onDays].sort();
        const currentIndex = sortedOnDays.indexOf(date);
        if (currentIndex > 0) {
          const prevDate = sortedOnDays[currentIndex - 1];
          const prevStatus = cls.attendance[studentId]?.[prevDate];
          if (prevStatus === 'absent') {
            if (typeof window !== 'undefined' && window.navigator.vibrate) {
              window.navigator.vibrate(200);
            }
          }
        }
      }
    }

    setState(prev => ({
      ...prev,
      classes: prev.classes.map(c => {
        if (c.id === prev.selectedClassId) {
          const attendance = { ...c.attendance };
          if (!attendance[studentId]) attendance[studentId] = {};
          attendance[studentId][date] = status;
          return { ...c, attendance };
        }
        return c;
      })
    }));
  };

  const updateSettings = (settings: Partial<AppSettings>) => {
    setState(prev => ({ ...prev, settings: { ...prev.settings, ...settings } }));
  };

  const backup = () => {
    const dataStr = JSON.stringify(state);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `attendify_backup_${new Date().toISOString().slice(0, 10)}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    toast({ title: "Backup Complete", description: "Settings and history saved to file." });
  };

  const restore = (data: string) => {
    try {
      const parsed = JSON.parse(data);
      if (parsed.classes && parsed.settings) {
        setState(parsed);
        toast({ title: "Restore Successful", description: "Data has been updated from backup." });
      } else {
        throw new Error("Invalid structure");
      }
    } catch (e) {
      toast({ variant: "destructive", title: "Restore Failed", description: "Invalid backup file selected." });
    }
  };

  return (
    <AppContext.Provider value={{
      state,
      addClass,
      deleteClass,
      updateClass,
      selectClass,
      addStudent,
      deleteStudent,
      toggleOnDay,
      markAttendance,
      updateSettings,
      logout,
      isAuthenticated,
      login,
      backup,
      restore
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
