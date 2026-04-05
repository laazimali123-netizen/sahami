'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { PieChart, Lock, Sparkles, Download, TrendingUp, Users, GraduationCap, DollarSign } from 'lucide-react';
import {
  PieChart as RPieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { exportToCSV } from '@/lib/csv-export';

export default function ReportsView() {
  const store = useStore();
  const session = store.session;
  const isPro = session?.schoolPlan === 'PRO';
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/reports');
        const result = await res.json();
        setData(result);
      } catch { /* empty */ } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full max-w-sm" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80 w-full" />
          <Skeleton className="h-80 w-full" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!isPro) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="h-20 w-20 rounded-2xl bg-amber-100 flex items-center justify-center mb-6">
          <Lock className="h-10 w-10 text-amber-600" />
        </div>
        <h2 className="text-2xl font-bold mb-2">PRO Feature</h2>
        <p className="text-muted-foreground text-center max-w-md mb-6">
          Advanced reports and analytics are available on the PRO plan. Upgrade to access detailed financial reports, academic analytics, and exportable data.
        </p>
        <Button className="bg-amber-500 hover:bg-amber-600 text-white">
          <Sparkles className="h-4 w-4 mr-2" /> Upgrade to PRO
        </Button>
      </div>
    );
  }

  const attendanceData = [
    { name: 'Present', value: data?.attendance?.present || 0, color: '#10b981' },
    { name: 'Absent', value: data?.attendance?.absent || 0, color: '#ef4444' },
    { name: 'Late', value: data?.attendance?.late || 0, color: '#f59e0b' },
    { name: 'Excused', value: data?.attendance?.excused || 0, color: '#8b5cf6' },
  ];

  const gradeDist = data?.gradeDistribution || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Reports & Analytics</h2>
          <p className="text-sm text-muted-foreground">Comprehensive insights into your school&apos;s performance</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-600">{data?.attendance?.rate || 0}%</p>
                <p className="text-xs text-muted-foreground">Attendance Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-teal-100 flex items-center justify-center">
                <GraduationCap className="h-5 w-5 text-teal-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-teal-600">{data?.enrollment?.active || 0}</p>
                <p className="text-xs text-muted-foreground">Active Students</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{data?.totalGrades || 0}</p>
                <p className="text-xs text-muted-foreground">Total Grades</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-600">
                  {data?.feeStats?.totalExpected > 0
                    ? Math.round(((data.feeStats.totalCollected / data.feeStats.totalExpected) * 100))
                    : 0}%
                </p>
                <p className="text-xs text-muted-foreground">Fee Collection</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Attendance Overview</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.attendance?.total > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <RPieChart>
                  <Pie
                    data={attendanceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {attendanceData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </RPieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[280px] text-muted-foreground text-sm">
                No attendance data
              </div>
            )}
          </CardContent>
        </Card>

        {/* Grade Distribution Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Grade Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {gradeDist.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={gradeDist}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="range" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {gradeDist.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[280px] text-muted-foreground text-sm">
                No grade data
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Fee Collection Summary (PRO) */}
      {session.schoolPlan === 'PRO' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Fee Collection Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <p className="text-xl font-bold">${(data?.feeStats?.totalExpected || 0).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Expected</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-emerald-50">
                <p className="text-xl font-bold text-emerald-600">${(data?.feeStats?.totalCollected || 0).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Collected</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-amber-50">
                <p className="text-xl font-bold text-amber-600">${(data?.feeStats?.pending || 0).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-red-50">
                <p className="text-xl font-bold text-red-600">${(data?.feeStats?.overdue || 0).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Overdue</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Performing Students */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Top Performing Students</CardTitle>
          {(data?.topStudents?.length || 0) > 0 && (
            <Button variant="outline" size="sm" onClick={() => exportToCSV(
              (data.topStudents || []).map((s: any) => ({
                'Name': `${s.firstName || ''} ${s.lastName || ''}`,
                'Student ID': s.studentId || '',
                'Class': s.enrollments?.map((e: any) => e.class.name).join(', ') || '',
                'Average Score': s.averageScore || 0,
              })),
              'top-students'
            )}>
              <Download className="h-3 w-3 mr-1" /> CSV
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {(data?.topStudents?.length || 0) === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">No data available</div>
          ) : (
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">#</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead className="hidden sm:table-cell">Student ID</TableHead>
                    <TableHead className="hidden md:table-cell">Class</TableHead>
                    <TableHead>Average</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.topStudents.map((s: any, i: number) => (
                    <TableRow key={s.id}>
                      <TableCell>
                        <Badge variant={i < 3 ? 'default' : 'secondary'} className={i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-gray-100 text-gray-700' : i === 2 ? 'bg-orange-100 text-orange-700' : ''}>
                          {i + 1}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{s.firstName} {s.lastName}</TableCell>
                      <TableCell className="hidden sm:table-cell font-mono text-sm">{s.studentId}</TableCell>
                      <TableCell className="hidden md:table-cell">{s.enrollments?.map((e: any) => e.class.name).join(', ') || '—'}</TableCell>
                      <TableCell>
                        <Badge className={s.averageScore >= 90 ? 'bg-emerald-100 text-emerald-700' : s.averageScore >= 80 ? 'bg-teal-100 text-teal-700' : s.averageScore >= 70 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}>
                          {s.averageScore}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
