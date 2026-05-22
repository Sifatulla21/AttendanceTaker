
export interface Student {
  id: string;
  roll: number;
}

export interface ClassSession {
  id: string;
  name: string;
  userId: string;
}

export interface AttendanceRecord {
  date: string; // YYYY-MM-DD
  status: 'Present' | 'Absent';
}

export interface DayConfig {
  date: string; // YYYY-MM-DD
  isOnDay: boolean;
}

export interface AppSettings {
  vibration: boolean;
  fineRate: number;
}
