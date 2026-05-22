
"use client"

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { AppState, AppSettings, Student, ClassData } from './types';
import { useToast } from '@/hooks/use-toast';
import { 
  useUser, 
  useFirestore, 
  useAuth, 
  useCollection, 
  useDoc 
} from '@/firebase';
import { 
  doc, 
  setDoc, 
  collection, 
  addDoc, 
  deleteDoc, 
  updateDoc
} from 'firebase/firestore';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut 
} from 'firebase/auth';

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
  user: any;
  login: () => void;
  backup: () => void;
  restore: (data: string) => void;
}

const defaultSettings: AppSettings = {
  vibration: true,
  fineRate: 10,
  theme: 'dark'
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: userLoading } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const { toast } = useToast();

  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

  const settingsRef = useMemo(() => user && db ? doc(db, 'users', user.uid, 'settings', 'prefs') : null, [user, db]);
  const { data: remoteSettings } = useDoc<AppSettings>(settingsRef);

  const classesRef = useMemo(() => user && db ? collection(db, 'users', user.uid, 'classes') : null, [user, db]);
  const { data: remoteClasses } = useCollection<any>(classesRef);

  const studentsRef = useMemo(() => 
    user && db && selectedClassId ? collection(db, 'users', user.uid, 'classes', selectedClassId, 'students') : null, 
    [user, db, selectedClassId]
  );
  const { data: remoteStudents } = useCollection<any>(studentsRef);

  useEffect(() => {
    if (remoteClasses && remoteClasses.length > 0 && !selectedClassId) {
      setSelectedClassId(remoteClasses[0].id);
    }
  }, [remoteClasses, selectedClassId]);

  const state = useMemo((): AppState => {
    const classes = (remoteClasses || []).map(c => {
      const isSelected = c.id === selectedClassId;
      const students: Student[] = isSelected ? (remoteStudents || []).map(s => ({
        id: s.id,
        roll: s.roll
      })) : [];

      const attendance: Record<string, Record<string, 'present' | 'absent'>> = {};
      if (isSelected && remoteStudents) {
        remoteStudents.forEach(s => {
          attendance[s.id] = s.attendance || {};
        });
      }

      return {
        id: c.id,
        name: c.name,
        onDays: c.onDays || [],
        students,
        attendance
      };
    });

    return {
      classes,
      selectedClassId,
      settings: remoteSettings || defaultSettings
    };
  }, [remoteClasses, remoteSettings, selectedClassId, remoteStudents]);

  const login = async () => {
    if (!auth) return;
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
      toast({ title: "Welcome!", description: "Signed in with Google" });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Login Failed", description: e.message });
    }
  };

  const logout = async () => {
    if (!auth) return;
    await signOut(auth);
    toast({ title: "Logged out", description: "Session ended safely." });
  };

  const addClass = (name: string) => {
    if (!user || !db) return;
    const ref = collection(db, 'users', user.uid, 'classes');
    addDoc(ref, {
      name,
      onDays: []
    }).then(docRef => {
      setSelectedClassId(docRef.id);
      toast({ title: "Class Created", description: `Added ${name}.` });
    });
  };

  const deleteClass = async (id: string) => {
    if (!user || !db) return;
    const ref = doc(db, 'users', user.uid, 'classes', id);
    await deleteDoc(ref);
    if (selectedClassId === id) setSelectedClassId(null);
    toast({ title: "Class Deleted" });
  };

  const updateClass = (id: string, name: string) => {
    if (!user || !db) return;
    const ref = doc(db, 'users', user.uid, 'classes', id);
    updateDoc(ref, { name });
  };

  const addStudent = (roll: number) => {
    if (!user || !db || !selectedClassId) return;
    const ref = collection(db, 'users', user.uid, 'classes', selectedClassId, 'students');
    addDoc(ref, {
      roll,
      attendance: {}
    });
    toast({ title: "Student Added", description: `Roll ${roll} registered.` });
  };

  const deleteStudent = (studentId: string) => {
    if (!user || !db || !selectedClassId) return;
    const ref = doc(db, 'users', user.uid, 'classes', selectedClassId, 'students', studentId);
    deleteDoc(ref);
  };

  const toggleOnDay = (date: string) => {
    if (!user || !db || !selectedClassId) return;
    const cls = remoteClasses?.find(c => c.id === selectedClassId);
    if (!cls) return;

    const onDays = cls.onDays || [];
    const newOnDays = onDays.includes(date)
      ? onDays.filter((d: string) => d !== date)
      : [...onDays, date];

    const ref = doc(db, 'users', user.uid, 'classes', selectedClassId);
    updateDoc(ref, { onDays: newOnDays });
  };

  const markAttendance = (studentId: string, date: string, status: 'present' | 'absent') => {
    if (!user || !db || !selectedClassId) return;
    
    if (state.settings.vibration && status === 'present') {
      const cls = state.classes.find(c => c.id === selectedClassId);
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

    const student = remoteStudents?.find(s => s.id === studentId);
    if (!student) return;

    const ref = doc(db, 'users', user.uid, 'classes', selectedClassId, 'students', studentId);
    updateDoc(ref, {
      [`attendance.${date}`]: status
    });
  };

  const updateSettings = (settings: Partial<AppSettings>) => {
    if (!user || !db) return;
    const ref = doc(db, 'users', user.uid, 'settings', 'prefs');
    setDoc(ref, { ...state.settings, ...settings }, { merge: true });
  };

  const backup = () => {
    const dataStr = JSON.stringify(state);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `attendify_backup_${new Date().toISOString().slice(0, 10)}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    toast({ title: "Backup Complete" });
  };

  const restore = async (dataStr: string) => {
    if (!user || !db) return;
    try {
      const backupData = JSON.parse(dataStr) as AppState;
      if (!backupData.classes || !Array.isArray(backupData.classes)) {
        throw new Error("Invalid backup format: missing classes array.");
      }

      toast({ title: "Restoring...", description: "Updating your database records." });

      // 1. Restore Settings
      const sRef = doc(db, 'users', user.uid, 'settings', 'prefs');
      await setDoc(sRef, backupData.settings || defaultSettings, { merge: true });

      // 2. Restore Classes and their nested Students
      for (const cls of backupData.classes) {
        const cRef = doc(db, 'users', user.uid, 'classes', cls.id || Math.random().toString(36).substr(2, 9));
        await setDoc(cRef, {
          name: cls.name,
          onDays: cls.onDays || []
        }, { merge: true });

        if (cls.students && Array.isArray(cls.students)) {
          for (const student of cls.students) {
            const stRef = doc(db, 'users', user.uid, 'classes', cRef.id, 'students', student.id || Math.random().toString(36).substr(2, 9));
            const attendance = (cls.attendance && cls.attendance[student.id]) ? cls.attendance[student.id] : {};
            await setDoc(stRef, {
              roll: student.roll,
              attendance: attendance
            }, { merge: true });
          }
        }
      }

      toast({ title: "Restore Successful", description: "All data has been synced with the cloud." });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Restore Failed", description: e.message });
    }
  };

  return (
    <AppContext.Provider value={{
      state,
      addClass,
      deleteClass,
      updateClass,
      selectClass: setSelectedClassId,
      addStudent,
      deleteStudent,
      toggleOnDay,
      markAttendance,
      updateSettings,
      logout,
      isAuthenticated: !!user,
      user,
      login,
      backup,
      restore
    }}>
      {!userLoading && children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
