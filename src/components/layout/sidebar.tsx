'use client';

import { useStore, type AppView } from '@/store';
import {
  LayoutDashboard, GraduationCap, Users, School, BookOpen,
  ClipboardCheck, BarChart3, Calendar, Megaphone,
  MessageSquare, DollarSign, PieChart, Settings, LogOut,
  ChevronLeft, ChevronRight, X, ShieldCheck, Sparkles,
  Building2, UserCog, Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
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

// Navigation for school users (MANAGER, TEACHER)
const schoolNav: NavItem[] = [
  { view: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { view: 'students', label: 'Students', icon: GraduationCap },
  { view: 'teachers', label: 'Teachers', icon: Users },
  { view: 'classes', label: 'Classes', icon: School },
  { view: 'subjects', label: 'Subjects', icon: BookOpen },
  { view: 'attendance', label: 'Attendance', icon: ClipboardCheck },
  { view: 'grades', label: 'Grades', icon: BarChart3 },
  { view: 'timetable', label: 'Schedule', icon: Calendar },
  { view: 'announcements', label: 'Announcements', icon: Megaphone },
  { view: 'messages', label: 'Messages', icon: MessageSquare, pro: true },
  { view: 'fees', label: 'Finance', icon: DollarSign, pro: true },
  { view: 'reports', label: 'Reports', icon: PieChart, pro: true },
];

// Navigation for SUPER_ADMIN (platform admin)
const adminNav: NavItem[] = [
  { view: 'admin-dashboard', label: 'Overview', icon: LayoutDashboard },
  { view: 'admin-schools', label: 'Schools', icon: Building2 },
  { view: 'admin-employees', label: 'Employees', icon: UserCog },
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
  const isPro = session?.schoolPlan === 'PRO';
  const initials = session?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';

  // Pick the right nav based on role
  const navItems = isAdmin ? adminNav : schoolNav;

  const handleNav = (item: NavItem) => {
    if (item.pro && !isPro) return;
    navigate(item.view);
    // Close sidebar on mobile
    if (window.innerWidth < 1024) {
      toggleSidebar();
    }
  };

  const isActive = (view: AppView) => {
    if (currentView === view) return true;
    // Sub-view matches for school nav
    const subViewMap: Record<string, AppView[]> = {
      'students': ['student-detail', 'student-form'],
      'teachers': ['teacher-detail', 'teacher-form'],
      'classes': ['class-detail', 'class-form'],
      'attendance': ['attendance-mark'],
      'grades': ['gradebook'],
      'announcements': ['announcement-form'],
      'messages': ['message-compose'],
      'fees': ['fee-form'],
      'admin-schools': ['admin-school-create', 'admin-school-detail'],
    };
    return subViewMap[view]?.includes(currentView) || false;
  };

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

        {/* Navigation */}
        <ScrollArea className="flex-1 sidebar-scroll px-2 py-3">
          <nav className="space-y-1">
            {navItems.map((item) => {
              const active = isActive(item.view);
              const isLocked = item.pro && !isPro;

              const button = (
                <button
                  key={item.view}
                  onClick={() => handleNav(item)}
                  className={cn(
                    'w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                    active && !isLocked
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : isLocked
                        ? 'text-sidebar-foreground/30 cursor-not-allowed'
                        : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground',
                  )}
                >
                  <item.icon className={cn('h-5 w-5 shrink-0', active && !isLocked && 'text-emerald-400')} />
                  {sidebarOpen && (
                    <span className="flex-1 text-left truncate">{item.label}</span>
                  )}
                  {sidebarOpen && isAdmin && (
                    <Shield className="h-3 w-3 text-amber-400 opacity-60" />
                  )}
                  {sidebarOpen && item.pro && (
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
                      {isLocked && <ShieldCheck className="h-3 w-3 text-amber-400" />}
                    </TooltipContent>
                  </Tooltip>
                );
              }
              return button;
            })}
          </nav>
        </ScrollArea>

        <Separator className="bg-sidebar-border" />

        {/* Settings & User */}
        <div className="shrink-0 px-2 py-3 space-y-1">
          {!isAdmin && (
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

          {sidebarOpen && session && (
            <div className="mx-2 mt-2 p-3 rounded-lg bg-sidebar-accent/30">
              <div className="flex items-center gap-3">
                <div className={cn(
                  'h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0',
                  isAdmin ? 'bg-amber-600' : 'bg-emerald-600',
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
                  : 'bg-emerald-500/20 text-emerald-300',
              )}>
                {isAdmin ? (
                  <><Shield className="h-3 w-3 mr-1" /> SUPER ADMIN</>
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
