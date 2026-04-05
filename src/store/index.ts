// ═══════════════════════════════════════════════════════════
// SAHAMI - Global Application Store (Zustand)
// Central state management for the entire SPA
// ═══════════════════════════════════════════════════════════

import { create } from 'zustand';

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

export type UserRole = 'SUPER_ADMIN' | 'OWNER' | 'MANAGER' | 'TEACHER' | 'FINANCE';
export type SubscriptionPlan = 'BASIC' | 'PRO';
export type AppView =
  | 'landing'
  | 'login'
  | 'register'
  | 'dashboard'
  | 'students'
  | 'student-detail'
  | 'student-form'
  | 'teachers'
  | 'teacher-detail'
  | 'teacher-form'
  | 'classes'
  | 'class-detail'
  | 'class-form'
  | 'subjects'
  | 'attendance'
  | 'attendance-mark'
  | 'grades'
  | 'gradebook'
  | 'timetable'
  | 'announcements'
  | 'announcement-form'
  | 'messages'
  | 'message-compose'
  | 'fees'
  | 'fee-form'
  | 'reports'
  | 'settings'
  | 'subscription'
  | 'admin-dashboard'
  | 'admin-schools'
  | 'admin-school-create'
  | 'admin-school-detail'
  | 'admin-employees';

export interface SessionData {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  schoolId: string | null;
  schoolName: string | null;
  schoolPlan: SubscriptionPlan | null;
}

export interface Student {
  id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string | null;
  gender: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  guardianName: string | null;
  guardianPhone: string | null;
  guardianRelation: string | null;
  avatar: string | null;
  status: string;
  schoolId: string;
  enrollDate: string;
  createdAt: string;
  enrollments?: { classId: string; class: SchoolClass }[];
}

export interface SchoolClass {
  id: string;
  name: string;
  gradeLevel: string;
  section: string;
  room: string | null;
  capacity: number;
  schoolId: string;
  createdAt: string;
  _count?: { enrollments: number; teachers: number };
}

export interface Teacher {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  avatar: string | null;
  role: string;
  schoolId: string | null;
  isActive: boolean;
  createdAt: string;
  classAssignments?: { classId: string; class: SchoolClass }[];
  _count?: { classAssignments: number; grades: number };
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  description: string | null;
  schoolId: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  classId: string;
  date: string;
  status: string;
  markedBy: string;
  notes: string | null;
  student?: { firstName: string; lastName: string; studentId: string };
}

export interface Grade {
  id: string;
  studentId: string;
  subjectId: string;
  classId: string;
  teacherId: string;
  term: string;
  type: string;
  title: string;
  score: number;
  maxScore: number;
  date: string;
  comments: string | null;
  student?: { firstName: string; lastName: string; studentId: string };
  subject?: { name: string; code: string };
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: string;
  schoolId: string;
  authorId: string;
  createdAt: string;
}

export interface TimetableSlot {
  id: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  schoolId: string;
  subject?: { name: string; code: string };
  teacher?: { name: string };
  class?: { name: string };
}

export interface FeeRecord {
  id: string;
  studentId: string;
  title: string;
  amount: number;
  dueDate: string | null;
  status: string;
  schoolId: string;
  createdAt: string;
  student?: { firstName: string; lastName: string; studentId: string };
  _sum?: { amount: number };
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  subject: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  sender?: { name: string; avatar: string | null };
  receiver?: { name: string; avatar: string | null };
}

export interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  totalSubjects: number;
  attendanceRate: number;
  averageGrade: number;
  pendingFees: number;
  unreadMessages: number;
  recentEnrollments: Student[];
  attendanceTrend: { date: string; present: number; absent: number }[];
  gradeDistribution: { range: string; count: number }[];
}

// ─────────────────────────────────────────────────────────────
// STORE INTERFACE
// ─────────────────────────────────────────────────────────────

interface SahamiStore {
  // Auth state
  session: SessionData | null;
  isAuthenticated: boolean;

  // Navigation state
  currentView: AppView;
  viewParams: Record<string, string>;

  // Data caches
  students: Student[];
  teachers: Teacher[];
  classes: SchoolClass[];
  subjects: Subject[];
  attendance: AttendanceRecord[];
  grades: Grade[];
  announcements: Announcement[];
  timetableSlots: TimetableSlot[];
  feeRecords: FeeRecord[];
  messages: Message[];
  dashboardStats: DashboardStats | null;

  // UI state
  sidebarOpen: boolean;
  isLoading: boolean;
  selectedClassId: string | null;
  selectedStudentId: string | null;
  selectedTeacherId: string | null;

  // Auth actions
  setSession: (session: SessionData | null) => void;
  logout: () => void;

  // Navigation actions
  navigate: (view: AppView, params?: Record<string, string>) => void;
  goBack: () => void;

  // Data actions
  setStudents: (students: Student[]) => void;
  setTeachers: (teachers: Teacher[]) => void;
  setClasses: (classes: SchoolClass[]) => void;
  setSubjects: (subjects: Subject[]) => void;
  setAttendance: (records: AttendanceRecord[]) => void;
  setGrades: (grades: Grade[]) => void;
  setAnnouncements: (announcements: Announcement[]) => void;
  setTimetableSlots: (slots: TimetableSlot[]) => void;
  setFeeRecords: (records: FeeRecord[]) => void;
  setMessages: (messages: Message[]) => void;
  setDashboardStats: (stats: DashboardStats) => void;

  // UI actions
  toggleSidebar: () => void;
  setLoading: (loading: boolean) => void;
  setSelectedClassId: (id: string | null) => void;
  setSelectedStudentId: (id: string | null) => void;
  setSelectedTeacherId: (id: string | null) => void;
}

// ─────────────────────────────────────────────────────────────
// STORE IMPLEMENTATION
// ─────────────────────────────────────────────────────────────

export const useStore = create<SahamiStore>((set, get) => ({
  // Auth state - check localStorage on init
  session: (() => {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem('sahami_session');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  })(),
  isAuthenticated: (() => {
    if (typeof window === 'undefined') return false;
    try {
      return !!localStorage.getItem('sahami_session');
    } catch {
      return false;
    }
  })(),

  // Navigation
  currentView: 'landing',
  viewParams: {},

  // Data caches
  students: [],
  teachers: [],
  classes: [],
  subjects: [],
  attendance: [],
  grades: [],
  announcements: [],
  timetableSlots: [],
  feeRecords: [],
  messages: [],
  dashboardStats: null,

  // UI state
  sidebarOpen: true,
  isLoading: false,
  selectedClassId: null,
  selectedStudentId: null,
  selectedTeacherId: null,

  // Auth actions
  setSession: (session) => {
    if (typeof window !== 'undefined') {
      if (session) {
        localStorage.setItem('sahami_session', JSON.stringify(session));
      } else {
        localStorage.removeItem('sahami_session');
      }
    }
    // Navigate based on role
    let targetView: AppView = 'dashboard';
    if (session) {
      if (session.role === 'SUPER_ADMIN') {
        targetView = 'admin-dashboard';
      } else if (session.role === 'FINANCE') {
        targetView = 'fees';
      } else {
        targetView = 'dashboard';
      }
    } else {
      targetView = 'landing';
    }
    set({
      session,
      isAuthenticated: !!session,
      currentView: targetView,
    });
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('sahami_session');
    }
    set({
      session: null,
      isAuthenticated: false,
      currentView: 'landing',
      students: [],
      teachers: [],
      classes: [],
      subjects: [],
      attendance: [],
      grades: [],
      announcements: [],
      timetableSlots: [],
      feeRecords: [],
      messages: [],
      dashboardStats: null,
    });
  },

  // Navigation actions
  navigate: (view, params = {}) => {
    set({ currentView: view, viewParams: params });
  },

  goBack: () => {
    const { currentView } = get();
    const backMap: Partial<Record<AppView, AppView>> = {
      'student-detail': 'students',
      'student-form': 'students',
      'teacher-detail': 'teachers',
      'teacher-form': 'teachers',
      'class-detail': 'classes',
      'class-form': 'classes',
      'attendance-mark': 'attendance',
      'gradebook': 'grades',
      'announcement-form': 'announcements',
      'message-compose': 'messages',
      'fee-form': 'fees',
      'subscription': 'settings',
    };
    set({ currentView: backMap[currentView] || 'dashboard', viewParams: {} });
  },

  // Data actions
  setStudents: (students) => set({ students }),
  setTeachers: (teachers) => set({ teachers }),
  setClasses: (classes) => set({ classes }),
  setSubjects: (subjects) => set({ subjects }),
  setAttendance: (records) => set({ attendance: records }),
  setGrades: (grades) => set({ grades }),
  setAnnouncements: (announcements) => set({ announcements }),
  setTimetableSlots: (slots) => set({ timetableSlots: slots }),
  setFeeRecords: (records) => set({ feeRecords: records }),
  setMessages: (messages) => set({ messages }),
  setDashboardStats: (stats) => set({ dashboardStats: stats }),

  // UI actions
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setLoading: (isLoading) => set({ isLoading }),
  setSelectedClassId: (id) => set({ selectedClassId: id }),
  setSelectedStudentId: (id) => set({ selectedStudentId: id }),
  setSelectedTeacherId: (id) => set({ selectedTeacherId: id }),
}));
