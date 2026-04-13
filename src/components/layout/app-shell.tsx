'use client';

import { useEffect, useState, useCallback } from 'react';
import { useStore } from '@/store';
import Sidebar from './sidebar';
import { Bell, Menu, Search, Moon, Sun, Check, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

const viewTitles: Record<string, string> = {
  dashboard: 'Dashboard',
  students: 'Students',
  'student-detail': 'Student Details',
  'student-form': 'Student Form',
  teachers: 'Teachers',
  'teacher-detail': 'Teacher Details',
  'teacher-form': 'Teacher Form',
  classes: 'Classes',
  'class-detail': 'Class Details',
  'class-form': 'Class Form',
  subjects: 'Subjects',
  attendance: 'Attendance',
  'attendance-mark': 'Mark Attendance',
  grades: 'Grades',
  gradebook: 'Gradebook',
  timetable: 'Timetable',
  events: 'Events',
  exams: 'Exams',
  homework: 'Homework',
  behavior: 'Behavior',
  announcements: 'Announcements',
  'announcement-form': 'Create Announcement',
  messages: 'Messages',
  'message-compose': 'Compose Message',
  fees: 'Finance',
  'fee-form': 'Add Fee',
  reports: 'Reports',
  settings: 'Settings',
  subscription: 'Subscription',
  upgrade: 'Upgrade Plan',
  staff: 'Staff',
  'staff-create': 'Add Staff Member',
  'admin-dashboard': 'Admin Overview',
  'admin-schools': 'Manage Schools',
  'admin-school-create': 'Create School',
  'admin-school-detail': 'School Details',
  'admin-employees': 'Manage Employees',
  'admin-broadcast': 'Broadcasts',
  'admin-payments': 'Payment Proofs',
};

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const session = useStore((s) => s.session);
  const currentView = useStore((s) => s.currentView);
  const sidebarOpen = useStore((s) => s.sidebarOpen);
  const toggleSidebar = useStore((s) => s.toggleSidebar);
  const logout = useStore((s) => s.logout);
  const darkMode = useStore((s) => s.darkMode);
  const toggleDarkMode = useStore((s) => s.toggleDarkMode);
  const notifications = useStore((s) => s.notifications);
  const setNotifications = useStore((s) => s.setNotifications);

  const title = viewTitles[currentView] || 'Dashboard';
  const initials = session?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!session?.userId) return;
    try {
      const res = await fetch('/api/notifications?limit=10');
      const data = await res.json();
      if (data.notifications) setNotifications(data.notifications);
    } catch { /* empty */ }
  }, [session?.userId, setNotifications]);

  useEffect(() => {
    fetchNotifications();
    // Poll every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Initialize dark mode from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('sahami_dark');
      if (stored === 'true') {
        document.documentElement.classList.add('dark');
      }
    }
  }, []);

  const handleMarkRead = async (id: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markRead: true, notificationId: id }),
      });
      setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch { /* empty */ }
  };

  const handleMarkAllRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: true }),
      });
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      toast.success('All notifications marked as read');
    } catch { /* empty */ }
  };

  const notifTypeColor: Record<string, string> = {
    INFO: 'bg-blue-100 text-blue-700',
    WARNING: 'bg-amber-100 text-amber-700',
    SUCCESS: 'bg-emerald-100 text-emerald-700',
    ERROR: 'bg-red-100 text-red-700',
  };

  const formatTimeAgo = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <Sidebar />

      <div
        className={`transition-all duration-300 ${
          sidebarOpen ? 'lg:ml-64' : 'lg:ml-16'
        }`}
      >
        {/* Top Header */}
        <header className="sticky top-0 z-30 h-16 bg-background/80 backdrop-blur-md border-b flex items-center px-4 lg:px-6 gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={toggleSidebar}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <h1 className="text-lg font-semibold hidden sm:block">{title}</h1>

          <div className="flex-1" />

          <div className="hidden md:flex items-center relative max-w-xs">
            <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              className="pl-9 h-9 bg-muted/50 border-0 focus-visible:ring-1"
            />
          </div>

          {/* Dark Mode Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleDarkMode}
            className="hidden sm:flex"
            title={darkMode ? 'Light mode' : 'Dark mode'}
          >
            {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[10px] bg-emerald-500 text-white border-0">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel className="flex items-center justify-between">
                <span>Notifications</span>
                {unreadCount > 0 && (
                  <Button variant="ghost" size="sm" className="h-6 text-xs text-emerald-600 hover:text-emerald-700" onClick={handleMarkAllRead}>
                    <CheckCheck className="h-3 w-3 mr-1" /> Mark all read
                  </Button>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No notifications yet
                </div>
              ) : (
                <div className="max-h-80 overflow-y-auto">
                  {notifications.map((n) => (
                    <DropdownMenuItem
                      key={n.id}
                      className={`flex flex-col items-start gap-1 p-3 cursor-pointer ${!n.isRead ? 'bg-muted/50' : ''}`}
                      onClick={() => !n.isRead && handleMarkRead(n.id)}
                    >
                      <div className="flex items-center gap-2 w-full">
                        <span className="text-sm font-medium flex-1 truncate">{n.title}</span>
                        {!n.isRead && <div className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />}
                      </div>
                      <span className="text-xs text-muted-foreground line-clamp-2">{n.message}</span>
                      <div className="flex items-center gap-2 w-full">
                        <span className="text-[10px] text-muted-foreground">{formatTimeAgo(n.createdAt)}</span>
                        <Badge className={`${notifTypeColor[n.type] || notifTypeColor.INFO} text-[10px] px-1.5 py-0 border-0`}>
                          {n.type}
                        </Badge>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 px-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden sm:block text-sm font-medium max-w-32 truncate">{session?.name}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span>{session?.name}</span>
                  <span className="text-xs font-normal text-muted-foreground">{session?.email}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => useStore.getState().navigate('settings')}>
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-red-600 focus:text-red-600">
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* Main Content */}
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
