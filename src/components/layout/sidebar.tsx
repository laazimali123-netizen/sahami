'use client';

import { useStore, type AppView } from '@/store';
import {
  LayoutDashboard, GraduationCap, Users, School, BookOpen,
  ClipboardCheck, BarChart3, Calendar, Megaphone,
  MessageSquare, DollarSign, PieChart, Settings, LogOut,
  ChevronLeft, ChevronRight, X, ShieldCheck, Sparkles,
  Building2, UserCog, Shield, UserPlus, Crown,
  CalendarDays, BookCopy, Award, FileCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface NavItem {
  view: AppView;
  label: string;
  icon: React.ElementType;
  pro?: boolean;
}

// Navigation for OWNER (full access to everything)
const ownerNav: NavItem[] = [
  { view: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { view: 'students', label: 'Students', icon: GraduationCap },
  { view: 'teachers', label: 'Teachers', icon: Users },
  { view: 'classes', label: 'Classes', icon: School, pro: true },
  { view: 'subjects', label: 'Subjects', icon: BookOpen, pro: true },
  { view: 'attendance', label: 'Attendance', icon: ClipboardCheck, pro: true },
  { view: 'grades', label: 'Grades', icon: BarChart3, pro: true },
  { view: 'timetable', label: 'Schedule', icon: Calendar, pro: true },
  { view: 'events', label: 'Events', icon: CalendarDays, pro: true },
  { view: 'exams', label: 'Exams', icon: FileCheck, pro: true },
  { view: 'homework', label: 'Homework', icon: BookCopy, pro: true },
  { view: 'behavior', label: 'Behavior', icon: Award, pro: true },
  { view: 'announcements', label: 'Announcements', icon: Megaphone, pro: true },
  { view: 'messages', label: 'Messages', icon: MessageSquare, pro: true },
  { view: 'fees', label: 'Finance', icon: DollarSign, pro: true },
  { view: 'reports', label: 'Reports', icon: PieChart, pro: true },
  { view: 'staff', label: 'Staff', icon: UserPlus, pro: true },
];

// Navigation for MANAGER (no fees, no settings, no staff)
const managerNav: NavItem[] = [
  { view: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { view: 'students', label: 'Students', icon: GraduationCap },
  { view: 'teachers', label: 'Teachers', icon: Users },
  { view: 'classes', label: 'Classes', icon: School, pro: true },
  { view: 'subjects', label: 'Subjects', icon: BookOpen, pro: true },
  { view: 'attendance', label: 'Attendance', icon: ClipboardCheck, pro: true },
  { view: 'grades', label: 'Grades', icon: BarChart3, pro: true },
  { view: 'timetable', label: 'Schedule', icon: Calendar, pro: true },
  { view: 'events', label: 'Events', icon: CalendarDays, pro: true },
  { view: 'exams', label: 'Exams', icon: FileCheck, pro: true },
  { view: 'homework', label: 'Homework', icon: BookCopy, pro: true },
  { view: 'behavior', label: 'Behavior', icon: Award, pro: true },
  { view: 'announcements', label: 'Announcements', icon: Megaphone, pro: true },
  { view: 'messages', label: 'Messages', icon: MessageSquare, pro: true },
  { view: 'reports', label: 'Reports', icon: PieChart, pro: true },
];

// Navigation for TEACHER (limited access)
const teacherNav: NavItem[] = [
  { view: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { view: 'classes', label: 'My Classes', icon: School, pro: true },
  { view: 'attendance', label: 'Attendance', icon: ClipboardCheck, pro: true },
  { view: 'grades', label: 'Grades', icon: BarChart3, pro: true },
  { view: 'timetable', label: 'Schedule', icon: Calendar, pro: true },
  { view: 'events', label: 'Events', icon: CalendarDays, pro: true },
  { view: 'exams', label: 'Exams', icon: FileCheck, pro: true },
  { view: 'homework', label: 'Homework', icon: BookCopy, pro: true },
  { view: 'behavior', label: 'Behavior', icon: Award, pro: true },
];

// Navigation for FINANCE role (limited to finance only)
const financeNav: NavItem[] = [
  { view: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { view: 'fees', label: 'Fee Management', icon: DollarSign },
  { view: 'reports', label: 'Reports', icon: PieChart },
];

// Navigation for SUPER_ADMIN (platform admin)
const adminNav: NavItem[] = [
  { view: 'admin-dashboard', label: 'Overview', icon: LayoutDashboard },
  { view: 'admin-schools', label: 'Schools', icon: Building2 },
  { view: 'admin-employees', label: 'Employees', icon: UserCog },
  { view: 'admin-broadcast', label: 'Broadcasts', icon: Megaphone },
  { view: 'admin-payments', label: 'Payment Proofs', icon: DollarSign },
  { view: 'admin-cms', label: 'Site Content', icon: Settings },
];

export default function Sidebar() {
  const session = useStore((s) => s.session);
  const currentView = useStore((s) => s.currentView);
  const sidebarOpen = useStore((s) => s.sidebarOpen);
  const toggleSidebar = useStore((s) => s.toggleSidebar);
  const navigate = useStore((s) => s.navigate);
  const logout = useStore((s) => s.logout);
  const unreadMessages = useStore((s) => s.messages.filter(m => !m.isRead).length);

  const isAdmin = session?.role === 'SUPER_ADMIN';
  const isOwner = session?.role === 'OWNER';
  const isManager = session?.role === 'MANAGER';
  const isTeacher = session?.role === 'TEACHER';
  const isFinance = session?.role === 'FINANCE';
  const isPro = session?.schoolPlan === 'PRO';
  const isTrialActive = session?.trialStart
    ? (Date.now() - new Date(session.trialStart).getTime()) / (1000 * 60 * 60 * 24) <= 30
    : false;
  const initials = session?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';

  // Pick the right nav based on role
  let navItems: NavItem[] = [];
  if (isAdmin) navItems = adminNav;
  else if (isOwner) navItems = ownerNav;
  else if (isManager) navItems = managerNav;
  else if (isTeacher) navItems = teacherNav;
  else if (isFinance) navItems = financeNav;
  else navItems = teacherNav; // fallback

  const handleNav = (item: NavItem) => {
    // FINANCE role has full access to finance regardless of pro
    // During trial period, PRO features are accessible
    if (item.pro && !isPro && !isFinance && !isTrialActive) return;
    navigate(item.view);
    // Close sidebar on mobile
    if (window.innerWidth < 1024) {
      toggleSidebar();
    }
  };

  const isActive = (view: AppView) => {
    if (currentView === view) return true;
    const subViewMap: Record<string, AppView[]> = {
      'students': ['student-detail', 'student-form'],
      'teachers': ['teacher-detail', 'teacher-form'],
      'classes': ['class-detail', 'class-form'],
      'attendance': ['attendance-mark'],
      'grades': ['gradebook'],
      'announcements': ['announcement-form'],
      'messages': ['message-compose'],
      'fees': ['fee-form'],
      'staff': ['staff-create'],
      'admin-schools': ['admin-school-create', 'admin-school-detail'],
    };
    return subViewMap[view]?.includes(currentView) || false;
  };

  const isLocked = (item: NavItem) => {
    if (isFinance && item.pro) return false;
    return item.pro && !isPro && !isTrialActive;
  };

  const canSeeSettings = isOwner || isManager || isTeacher || isFinance;

  return (
    <TooltipProvider delayDuration={0}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full bg-sidebar text-sidebar-foreground flex flex-col transition-all duration-300 ease-in-out',
          sidebarOpen ? 'w-64' : 'w-0 lg:w-16',
        )}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 h-16 shrink-0">
          <img src="/sahami-logo.png" alt="SAHAMI" className="h-8 w-8 rounded-lg shrink-0" />
          {sidebarOpen && (
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-bold tracking-tight truncate">SAHAMI</h2>
              <p className="text-xs text-sidebar-foreground/60 truncate">
                {isAdmin ? 'Platform Admin' : (session?.schoolName || 'School')}
              </p>
            </div>
          )}
          <button
            onClick={toggleSidebar}
            className="hidden lg:flex items-center justify-center h-7 w-7 rounded-md hover:bg-sidebar-accent text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors shrink-0"
          >
            {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
          <button
            onClick={toggleSidebar}
            className="flex lg:hidden items-center justify-center h-7 w-7 rounded-md hover:bg-sidebar-accent text-sidebar-foreground/60 shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <Separator className="bg-sidebar-border" />

        {/* Navigation - scrollable */}
        <div className="flex-1 overflow-y-auto sidebar-scroll px-2 py-3 min-h-0">
          <nav className="space-y-1">
            {navItems.map((item) => {
              const active = isActive(item.view);
              const locked = isLocked(item);

              const button = (
                <button
                  key={item.view}
                  onClick={() => handleNav(item)}
                  className={cn(
                    'w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                    active && !locked
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : locked
                        ? 'text-sidebar-foreground/30 cursor-not-allowed'
                        : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground',
                  )}
                >
                  <item.icon className={cn('h-5 w-5 shrink-0', active && !locked && 'text-emerald-400')} />
                  {sidebarOpen && (
                    <span className="flex-1 text-left truncate">{item.label}</span>
                  )}
                  {sidebarOpen && isAdmin && (
                    <Shield className="h-3 w-3 text-amber-400 opacity-60" />
                  )}
                  {sidebarOpen && isOwner && active && !locked && (
                    <Shield className="h-3 w-3 text-emerald-400 opacity-60" />
                  )}
                  {sidebarOpen && item.pro && !locked && (
                    <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-[10px] px-1.5 py-0">
                      PRO
                    </Badge>
                  )}
                  {sidebarOpen && item.view === 'messages' && unreadMessages > 0 && (
                    <span className="flex items-center justify-center h-5 min-w-5 px-1 rounded-full bg-emerald-500 text-white text-[10px] font-bold">
                      {unreadMessages}
                    </span>
                  )}
                </button>
              );

              if (!sidebarOpen) {
                return (
                  <Tooltip key={item.view}>
                    <TooltipTrigger asChild>
                      {button}
                    </TooltipTrigger>
                    <TooltipContent side="right" className="flex items-center gap-2">
                      {item.label}
                      {locked && <ShieldCheck className="h-3 w-3 text-amber-400" />}
                    </TooltipContent>
                  </Tooltip>
                );
              }
              return button;
            })}
          </nav>
        </div>

        <Separator className="bg-sidebar-border" />

        {/* Settings & User */}
        <div className="shrink-0 px-2 py-3 space-y-1">
          {canSeeSettings && (
            <button
              onClick={() => { navigate('settings'); if (window.innerWidth < 1024) toggleSidebar(); }}
              className={cn(
                'w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                currentView === 'settings'
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground',
              )}
            >
              <Settings className="h-5 w-5 shrink-0" />
              {sidebarOpen && <span>Settings</span>}
            </button>
          )}

          {(isOwner || isManager) && (
            <button
              onClick={() => { navigate('upgrade'); if (window.innerWidth < 1024) toggleSidebar(); }}
              className={cn(
                'w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                currentView === 'upgrade'
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground',
              )}
            >
              <Crown className="h-5 w-5 shrink-0" />
              {sidebarOpen && <span>Upgrade</span>}
              {sidebarOpen && !isPro && (
                <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-[10px] px-1.5 py-0">
                  PRO
                </Badge>
              )}
            </button>
          )}

          {sidebarOpen && session && (
            <div className="mx-2 mt-2 p-3 rounded-lg bg-sidebar-accent/30">
              <div className="flex items-center gap-3">
                <div className={cn(
                  'h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0',
                  isAdmin ? 'bg-amber-600' : isOwner ? 'bg-emerald-600' : isFinance ? 'bg-blue-600' : isManager ? 'bg-violet-600' : 'bg-teal-600',
                )}>
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{session.name}</p>
                  <p className="text-xs text-sidebar-foreground/50 truncate">{session.email}</p>
                </div>
              </div>
              <Badge className={cn(
                'mt-2 text-[10px] w-full justify-center border-0',
                isAdmin
                  ? 'bg-amber-500/20 text-amber-300'
                  : isOwner
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : isFinance
                      ? 'bg-blue-500/20 text-blue-300'
                      : isManager
                        ? 'bg-violet-500/20 text-violet-300'
                        : 'bg-teal-500/20 text-teal-300',
              )}>
                {isAdmin ? (
                  <><Shield className="h-3 w-3 mr-1" /> SUPER ADMIN</>
                ) : isOwner ? (
                  <><Shield className="h-3 w-3 mr-1" /> OWNER</>
                ) : isFinance ? (
                  <><DollarSign className="h-3 w-3 mr-1" /> FINANCE</>
                ) : isManager ? (
                  <><UserCog className="h-3 w-3 mr-1" /> MANAGER</>
                ) : session.schoolPlan ? (
                  <><Sparkles className="h-3 w-3 mr-1" /> {session.schoolPlan} Plan</>
                ) : null}
              </Badge>
            </div>
          )}

          <button
            onClick={logout}
            className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-400/70 hover:bg-red-500/10 hover:text-red-400 transition-colors"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {sidebarOpen && <span>Sign Out</span>}
          </button>
        </div>
      </aside>
    </TooltipProvider>
  );
}
