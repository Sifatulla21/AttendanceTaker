
'use client';

import { useState, useEffect } from 'react';
import { useFirebase } from '@/firebase';
import { useUser } from '@/firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  setDoc,
} from 'firebase/firestore';
import { ClassSession, Student } from '@/lib/types';

export function useAttendance() {
  const { firestore } = useFirebase();
  const { user, loading: authLoading } = useUser();
  const [classes, setClasses] = useState<ClassSession[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Record<string, Record<string, 'Present' | 'Absent'>>>({});
  const [dayConfigs, setDayConfigs] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }

    const q = query(collection(firestore, 'classes'), where('userId', '==', user.uid));
    const unsub = onSnapshot(q, (snapshot) => {
      const classList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClassSession));
      setClasses(classList);
      if (classList.length > 0 && !selectedClassId) {
        setSelectedClassId(classList[0].id);
      }
      setLoading(false);
    });

    return () => unsub();
  }, [user, authLoading, firestore, selectedClassId]);

  useEffect(() => {
    if (!selectedClassId || !user) {
      setStudents([]);
      return;
    }

    const q = query(collection(firestore, `classes/${selectedClassId}/students`));
    const unsub = onSnapshot(q, (snapshot) => {
      const studentList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student));
      setStudents(studentList.sort((a, b) => a.roll - b.roll));
    });

    const attendanceRef = collection(firestore, `classes/${selectedClassId}/attendance`);
    const unsubAtt = onSnapshot(attendanceRef, (snapshot) => {
      const attData: Record<string, Record<string, 'Present' | 'Absent'>> = {};
      const configData: Record<string, boolean> = {};
      
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        attData[doc.id] = data.records || {};
        configData[doc.id] = data.isOnDay || false;
      });
      
      setAttendance(attData);
      setDayConfigs(configData);
    });

    return () => {
      unsub();
      unsubAtt();
    };
  }, [selectedClassId, user, firestore]);

  const addClass = async (name: string) => {
    if (!user) return;
    addDoc(collection(firestore, 'classes'), { name, userId: user.uid });
  };

  const updateClass = async (classId: string, name: string) => {
    updateDoc(doc(firestore, 'classes', classId), { name });
  };

  const deleteClass = async (classId: string) => {
    deleteDoc(doc(firestore, 'classes', classId));
    if (selectedClassId === classId) setSelectedClassId(null);
  };

  const addStudent = async (roll: number) => {
    if (!selectedClassId) return;
    addDoc(collection(firestore, `classes/${selectedClassId}/students`), { roll });
  };

  const deleteStudent = async (studentId: string) => {
    if (!selectedClassId) return;
    deleteDoc(doc(firestore, `classes/${selectedClassId}/students`, studentId));
  };

  const updateStudentRoll = async (studentId: string, roll: number) => {
    if (!selectedClassId) return;
    updateDoc(doc(firestore, `classes/${selectedClassId}/students`, studentId), { roll });
  };

  const toggleOnDay = async (date: string, isOnDay: boolean) => {
    if (!selectedClassId) return;
    const docRef = doc(firestore, `classes/${selectedClassId}/attendance`, date);
    setDoc(docRef, { isOnDay }, { merge: true });
  };

  const markAttendance = async (date: string, roll: number, status: 'Present' | 'Absent') => {
    if (!selectedClassId) return;
    const docRef = doc(firestore, `classes/${selectedClassId}/attendance`, date);
    const existing = attendance[date] || {};
    setDoc(docRef, { 
      records: { ...existing, [roll.toString()]: status }
    }, { merge: true });
  };

  return {
    classes,
    selectedClassId,
    setSelectedClassId,
    students,
    attendance,
    dayConfigs,
    loading: loading || authLoading,
    addClass,
    updateClass,
    deleteClass,
    addStudent,
    deleteStudent,
    updateStudentRoll,
    toggleOnDay,
    markAttendance
  };
}
