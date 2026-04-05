'use client';

import { useEffect, useState } from 'react';
import { useStore, type DashboardStats } from '@/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  GraduationCap, Users, School, TrendingUp, TrendingDown,
  UserPlus, ClipboardCheck, Megaphone, Activity,
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';

const COLORS = ['#10b981', '#14b8a6', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function DashboardView() {
  const store = useStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/dashboard');
        const data = await res.json();
        if (res.ok) {
          setStats(data);
          store.setDashboardStats(data);
        }
      } catch {
        // fallback empty
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [store]);

  const statCards = [
    {
      title: 'Total Students',
      value: stats?.totalStudents ?? 0,
      icon: GraduationCap,
      change: '+12%',
      up: true,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      title: 'Total Teachers',
      value: stats?.totalTeachers ?? 0,
      icon: Users,
      change: '+5%',
      up: true,
      color: 'text-teal-600',
      bg: 'bg-teal-50',
    },
    {
      title: 'Total Classes',
      value: stats?.totalClasses ?? 0,
      icon: School,
      change: '+2',
      up: true,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      title: 'Attendance Rate',
      value: stats?.attendanceRate ? `${stats.attendanceRate}%` : '—',
      icon: Activity,
      change: '-1.2%',
      up: false,
      color: 'text-violet-600',
      bg: 'bg-violet-50',
    },
  ];

  const attendanceData = stats?.attendanceTrend?.length
    ? stats.attendanceTrend
    : [
        { date: 'Mon', present: 45, absent: 5 },
        { date: 'Tue', present: 42, absent: 8 },
        { date: 'Wed', present: 47, absent: 3 },
        { date: 'Thu', present: 44, absent: 6 },
        { date: 'Fri', present: 40, absent: 10 },
        { date: 'Sat', present: 20, absent: 2 },
        { date: 'Sun', present: 0, absent: 0 },
      ];

  const gradeData = stats?.gradeDistribution?.length
    ? stats.gradeDistribution
    : [
        { range: 'A (90-100)', count: 15 },
        { range: 'B (80-89)', count: 25 },
        { range: 'C (70-79)', count: 20 },
        { range: 'D (60-69)', count: 8 },
        { range: 'F (<60)', count: 3 },
      ];

  const recentEnrollments = stats?.recentEnrollments?.length
    ? stats.recentEnrollments
    : [];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}><CardContent className="p-6"><Skeleton className="h-20 w-full" /></CardContent></Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card><CardContent className="p-6"><Skeleton className="h-64 w-full" /></CardContent></Card>
          <Card><CardContent className="p-6"><Skeleton className="h-64 w-full" /></CardContent></Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <Card key={card.title} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className={`h-10 w-10 rounded-lg ${card.bg} flex items-center justify-center`}>
                  <card.icon className={`h-5 w-5 ${card.color}`} />
                </div>
                <Badge variant="secondary" className={`text-xs font-medium ${card.up ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50'}`}>
                  {card.up ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                  {card.change}
                </Badge>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold">{card.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{card.title}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Trend */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Attendance Trend</CardTitle>
            <CardDescription>Weekly attendance overview</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={attendanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" fontSize={12} tickLine={false} />
                <YAxis fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Line type="monotone" dataKey="present" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="absent" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Grade Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Grade Distribution</CardTitle>
            <CardDescription>Student performance breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={gradeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="range" fontSize={10} tickLine={false} />
                <YAxis fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {gradeData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start gap-3" onClick={() => store.navigate('student-form')}>
              <UserPlus className="h-4 w-4 text-emerald-600" />
              Add New Student
            </Button>
            <Button variant="outline" className="w-full justify-start gap-3" onClick={() => store.navigate('attendance-mark')}>
              <ClipboardCheck className="h-4 w-4 text-teal-600" />
              Mark Attendance
            </Button>
            <Button variant="outline" className="w-full justify-start gap-3" onClick={() => store.navigate('announcement-form')}>
              <Megaphone className="h-4 w-4 text-amber-600" />
              Post Announcement
            </Button>
          </CardContent>
        </Card>

        {/* Recent Enrollments */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Recent Enrollments</CardTitle>
            <CardDescription>Latest student registrations</CardDescription>
          </CardHeader>
          <CardContent>
            {recentEnrollments.length > 0 ? (
              <div className="space-y-3">
                {recentEnrollments.slice(0, 5).map((s) => (
                  <div key={s.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">
                        {s.firstName[0]}{s.lastName[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{s.firstName} {s.lastName}</p>
                        <p className="text-xs text-muted-foreground">ID: {s.studentId}</p>
                      </div>
                    </div>
                    <Badge variant={s.status === 'ACTIVE' ? 'default' : 'secondary'} className="text-xs">
                      {s.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <GraduationCap className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p>No recent enrollments</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
