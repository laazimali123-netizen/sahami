'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Building2, Users, GraduationCap, UserCog, TrendingUp,
  ArrowUpRight, ArrowDownRight, School, DollarSign, Activity,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';

const COLORS = ['#10b981', '#14b8a6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

interface SchoolSummary {
  id: string;
  name: string;
  plan: string;
  isActive: boolean;
  createdAt: string;
  _count: { students: number; users: number; classes: number };
}

interface AdminStats {
  totalSchools: number;
  totalStudents: number;
  totalTeachers: number;
  totalUsers: number;
  schools: SchoolSummary[];
}

export default function AdminDashboard() {
  const navigate = useStore((s) => s.navigate);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/dashboard');
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch { /* empty */ } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const activeSchools = stats?.schools?.filter(s => s.isActive) || [];
  const proSchools = activeSchools.filter(s => s.plan === 'PRO').length;
  const basicSchools = activeSchools.filter(s => s.plan === 'BASIC').length;

  const planData = [
    { name: 'BASIC', value: basicSchools, fill: '#10b981' },
    { name: 'PRO', value: proSchools, fill: '#f59e0b' },
  ];

  const schoolSizeData = activeSchools
    .slice(0, 8)
    .map(s => ({
      name: s.name.length > 15 ? s.name.substring(0, 15) + '...' : s.name,
      students: s._count.students,
    }))
    .sort((a, b) => b.students - a.students);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}><CardContent className="p-6"><Skeleton className="h-24 w-full" /></CardContent></Card>
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Platform Overview</h2>
          <p className="text-muted-foreground">Monitor all schools and platform metrics</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate('admin-school-create')} className="bg-emerald-600 hover:bg-emerald-700">
            <Building2 className="h-4 w-4 mr-2" />
            Add School
          </Button>
          <Button variant="outline" onClick={() => navigate('admin-employees')}>
            <UserCog className="h-4 w-4 mr-2" />
            Manage Employees
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            title: 'Total Schools',
            value: stats?.totalSchools ?? 0,
            icon: Building2,
            change: `${activeSchools.length} active`,
            up: true,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
          },
          {
            title: 'Total Students',
            value: stats?.totalStudents ?? 0,
            icon: GraduationCap,
            change: '+18% this month',
            up: true,
            color: 'text-teal-600',
            bg: 'bg-teal-50',
          },
          {
            title: 'Total Teachers',
            value: stats?.totalTeachers ?? 0,
            icon: Users,
            change: '+5% this month',
            up: true,
            color: 'text-amber-600',
            bg: 'bg-amber-50',
          },
          {
            title: 'Total Users',
            value: stats?.totalUsers ?? 0,
            icon: UserCog,
            change: 'All roles',
            up: true,
            color: 'text-violet-600',
            bg: 'bg-violet-50',
          },
        ].map((card) => (
          <Card key={card.title} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className={`h-10 w-10 rounded-lg ${card.bg} flex items-center justify-center`}>
                  <card.icon className={`h-5 w-5 ${card.color}`} />
                </div>
                <Badge variant="secondary" className={`text-xs font-medium text-emerald-600 bg-emerald-50`}>
                  {card.up ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
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
        {/* Plan Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Subscription Plans</CardTitle>
            <CardDescription>School distribution by plan type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="w-40 h-40 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={planData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={4} strokeWidth={0}>
                      {planData.map((entry, index) => (
                        <Cell key={index} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-4">
                {planData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.fill }} />
                      <span className="text-sm font-medium">{item.name}</span>
                    </div>
                    <span className="text-sm font-bold">{item.value} schools</span>
                  </div>
                ))}
                <div className="pt-2 border-t flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Monthly Revenue</span>
                  <span className="text-lg font-bold text-emerald-600">${proSchools * 29}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* School Size Comparison */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">School Size Comparison</CardTitle>
            <CardDescription>Students per school</CardDescription>
          </CardHeader>
          <CardContent>
            {schoolSizeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={schoolSizeData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis type="number" fontSize={11} tickLine={false} />
                  <YAxis dataKey="name" type="category" fontSize={10} tickLine={false} width={120} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--card)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="students" radius={[0, 4, 4, 0]}>
                    {schoolSizeData.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[220px] text-muted-foreground text-sm">
                No school data yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Schools Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">All Schools</CardTitle>
              <CardDescription>{stats?.totalSchools ?? 0} registered schools</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('admin-schools')}>
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-3 font-medium">School Name</th>
                  <th className="pb-3 font-medium">Plan</th>
                  <th className="pb-3 font-medium">Students</th>
                  <th className="pb-3 font-medium">Staff</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {stats?.schools?.slice(0, 5).map((school) => (
                  <tr
                    key={school.id}
                    className="border-b last:border-0 hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => navigate('admin-school-detail', { id: school.id })}
                  >
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold shrink-0">
                          <School className="h-4 w-4" />
                        </div>
                        <span className="font-medium">{school.name}</span>
                      </div>
                    </td>
                    <td className="py-3">
                      <Badge className={school.plan === 'PRO'
                        ? 'bg-amber-100 text-amber-700 border-amber-200'
                        : 'bg-emerald-100 text-emerald-700 border-emerald-200'
                      }>
                        {school.plan}
                      </Badge>
                    </td>
                    <td className="py-3">{school._count.students}</td>
                    <td className="py-3">{school._count.users}</td>
                    <td className="py-3">
                      <Badge variant={school.isActive ? 'default' : 'secondary'}>
                        {school.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="py-3 text-muted-foreground">
                      {new Date(school.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
