export interface Student {
  id: string;
  roll: number;
  name?: string;
}

export interface AttendanceRecord {
  date: string; // YYYY-MM-DD
  status: 'present' | 'absent';
}

export interface ClassData {
  id: string;
  name: string;
  students: Student[];
  onDays: string[]; // List of dates that are "On Days"
  attendance: Record<string, Record<string, 'present' | 'absent'>>; // studentId -> date -> status
}

export interface AppSettings {
  vibration: boolean;
  fineRate: number;
  theme: 'light' | 'dark';
}

export interface AppState {
  classes: ClassData[];
  selectedClassId: string | null;
  settings: AppSettings;
}
