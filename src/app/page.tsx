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
import StaffList from '@/components/staff/staff-list';
import EventList from '@/components/events/event-list';
import HomeworkList from '@/components/homework/homework-list';
import BehaviorList from '@/components/behavior/behavior-list';
import ExamList from '@/components/exams/exam-list';
// Admin views
import AdminDashboard from '@/components/admin/admin-dashboard';
import AdminSchools from '@/components/admin/admin-schools';
import AdminSchoolCreate from '@/components/admin/admin-school-create';
import AdminSchoolDetail from '@/components/admin/admin-school-detail';
import AdminEmployees from '@/components/admin/admin-employees';
import AdminBroadcast from '@/components/admin/admin-broadcast';
import UpgradePage from '@/components/settings/upgrade-page';
import { useEffect } from 'react';

// Lazy wrapper for PRO-only features
function ProGuard({ children }: { children: React.ReactNode }) {
  const session = useStore((s) => s.session);
  const isPro = session?.schoolPlan === 'PRO';
  if (!isPro) return <ReportsView />;
  return <>{children}</>;
}

export default function Home() {
  const currentView = useStore((s) => s.currentView);
  const isAuthenticated = useStore((s) => s.isAuthenticated);
  const session = useStore((s) => s.session);

  // On mount, redirect authenticated users to the right dashboard
  useEffect(() => {
    if (isAuthenticated && session && currentView === 'landing') {
      if (session.role === 'SUPER_ADMIN') {
        useStore.getState().navigate('admin-dashboard');
      } else if (session.role === 'FINANCE') {
        useStore.getState().navigate('dashboard');
      } else {
        useStore.getState().navigate('dashboard');
      }
    }
  }, [isAuthenticated, currentView, session]);

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

  // SUPER_ADMIN gets admin views, school users get school views
  const isAdmin = session.role === 'SUPER_ADMIN';
  const isTeacher = session.role === 'TEACHER';
  const isFinance = session.role === 'FINANCE';
  const isManager = session.role === 'MANAGER';
  const isOwner = session.role === 'OWNER';

  const renderView = () => {
    if (isAdmin) {
      // Admin routing
      switch (currentView) {
        case 'admin-dashboard':
          return <AdminDashboard />;
        case 'admin-schools':
          return <AdminSchools />;
        case 'admin-school-create':
          return <AdminSchoolCreate />;
        case 'admin-school-detail':
          return <AdminSchoolDetail />;
        case 'admin-employees':
          return <AdminEmployees />;
        case 'admin-broadcast':
          return <AdminBroadcast />;
        default:
          return <AdminDashboard />;
      }
    }

    // School user routing — some views are role-restricted
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
      case 'events':
        return <EventList />;
      case 'homework':
        return <HomeworkList />;
      case 'behavior':
        return <BehaviorList />;
      case 'exams':
        return <ExamList />;
      case 'announcements':
        return <AnnouncementList />;
      case 'announcement-form':
        return <AnnouncementForm />;
      case 'messages':
        return <ProGuard><MessageList /></ProGuard>;
      case 'message-compose':
        return <ProGuard><MessageCompose /></ProGuard>;
      case 'fees':
        return <ProGuard><FeeList /></ProGuard>;
      case 'fee-form':
        return <ProGuard><FeeForm /></ProGuard>;
      case 'reports':
        return <ReportsView />;
      case 'staff':
        return <StaffList />;
      case 'settings':
        return <SettingsView />;
      case 'upgrade':
        return <UpgradePage />;
      default:
        return <DashboardView />;
    }
  };

  return <AppShell>{renderView()}</AppShell>;
}
