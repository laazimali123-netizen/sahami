'use client';

import { useStore, type AppView } from '@/store';
import AppShell from '@/components/layout/app-shell';
import LandingPage from '@/components/auth/landing-page';
import LoginPage from '@/components/auth/login-page';
import RegisterPage from '@/components/auth/register-page';
import DashboardView from '@/components/dashboard/dashboard-view';
import StudentList from '@/components/students/student-list';
import StudentForm from '@/components/students/student-form';
import StudentDetail from '@/components/students/student-detail';
import TeacherList from '@/components/teachers/teacher-list';
import TeacherForm from '@/components/teachers/teacher-form';
import TeacherDetail from '@/components/teachers/teacher-detail';
import ClassList from '@/components/classes/class-list';
import ClassForm from '@/components/classes/class-form';
import ClassDetail from '@/components/classes/class-detail';
import SubjectList from '@/components/subjects/subject-list';
import AttendanceList from '@/components/attendance/attendance-list';
import AttendanceMark from '@/components/attendance/attendance-mark';
import GradeList from '@/components/grades/grade-list';
import TimetableView from '@/components/timetable/timetable-view';
import AnnouncementList from '@/components/announcements/announcement-list';
import AnnouncementForm from '@/components/announcements/announcement-form';
import MessageList from '@/components/messages/message-list';
import MessageCompose from '@/components/messages/message-compose';
import FeeList from '@/components/fees/fee-list';
import FeeForm from '@/components/fees/fee-form';
import SettingsView from '@/components/settings/settings-view';
import ReportsView from '@/components/reports/reports-view';
import { GraduationCap } from 'lucide-react';
import { useEffect } from 'react';

// Lazy wrapper for PRO-only features
function ProGuard({ children, view }: { children: React.ReactNode; view: string }) {
  const session = useStore((s) => s.session);
  const navigate = useStore((s) => s.navigate);
  const isPro = session?.schoolPlan === 'PRO';

  if (!isPro) {
    return <ReportsView />; // ReportsView already has the PRO guard
  }

  return <>{children}</>;
}

export default function Home() {
  const currentView = useStore((s) => s.currentView);
  const isAuthenticated = useStore((s) => s.isAuthenticated);
  const session = useStore((s) => s.session);

  // On mount, check if we have a stored session but no dashboard data loaded
  useEffect(() => {
    if (isAuthenticated && currentView === 'landing') {
      useStore.getState().navigate('dashboard');
    }
  }, [isAuthenticated, currentView]);

  // Auth pages (no app shell)
  if (!isAuthenticated || !session) {
    switch (currentView) {
      case 'login':
        return <LoginPage />;
      case 'register':
        return <RegisterPage />;
      case 'landing':
      default:
        return <LandingPage />;
    }
  }

  // Authenticated app views
  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView />;
      case 'students':
        return <StudentList />;
      case 'student-form':
        return <StudentForm />;
      case 'student-detail':
        return <StudentDetail />;
      case 'teachers':
        return <TeacherList />;
      case 'teacher-form':
        return <TeacherForm />;
      case 'teacher-detail':
        return <TeacherDetail />;
      case 'classes':
        return <ClassList />;
      case 'class-form':
        return <ClassForm />;
      case 'class-detail':
        return <ClassDetail />;
      case 'subjects':
        return <SubjectList />;
      case 'attendance':
        return <AttendanceList />;
      case 'attendance-mark':
        return <AttendanceMark />;
      case 'grades':
        return <GradeList />;
      case 'timetable':
        return <TimetableView />;
      case 'announcements':
        return <AnnouncementList />;
      case 'announcement-form':
        return <AnnouncementForm />;
      case 'messages':
        return <ProGuard view="messages"><MessageList /></ProGuard>;
      case 'message-compose':
        return <ProGuard view="messages"><MessageCompose /></ProGuard>;
      case 'fees':
        return <ProGuard view="fees"><FeeList /></ProGuard>;
      case 'fee-form':
        return <ProGuard view="fees"><FeeForm /></ProGuard>;
      case 'reports':
        return <ReportsView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return <AppShell>{renderView()}</AppShell>;
}
