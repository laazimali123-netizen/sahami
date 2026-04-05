'use client';

import { useStore } from '@/store';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PieChart, Lock, Sparkles } from 'lucide-react';
import {
  PieChart as RPieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
} from 'recharts';

export default function ReportsView() {
  const store = useStore();
  const session = store.session;
  const isPro = session?.schoolPlan === 'PRO';

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

  // Sample report data
  const gradeDistribution = [
    { name: 'A', value: 15, color: '#10b981' },
    { name: 'B', value: 25, color: '#14b8a6' },
    { name: 'C', value: 20, color: '#f59e0b' },
    { name: 'D', value: 8, color: '#f97316' },
    { name: 'F', value: 3, color: '#ef4444' },
  ];

  const attendanceOverview = [
    { name: 'Present', value: 85, color: '#10b981' },
    { name: 'Absent', value: 10, color: '#ef4444' },
    { name: 'Late', value: 5, color: '#f59e0b' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Reports & Analytics</h2>
          <p className="text-sm text-muted-foreground">Comprehensive insights into your school&apos;s performance</p>
        </div>
        <Button variant="outline">
          Export PDF
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-4">Grade Distribution</h3>
            <ResponsiveContainer width="100%" height={280}>
              <RPieChart>
                <Pie
                  data={gradeDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {gradeDistribution.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </RPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-4">Attendance Overview</h3>
            <ResponsiveContainer width="100%" height={280}>
              <RPieChart>
                <Pie
                  data={attendanceOverview}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {attendanceOverview.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </RPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-4">Quick Stats</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold text-emerald-600">92%</p>
              <p className="text-xs text-muted-foreground">Attendance Rate</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold text-teal-600">78%</p>
              <p className="text-xs text-muted-foreground">Pass Rate</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold text-amber-600">85%</p>
              <p className="text-xs text-muted-foreground">Fee Collection</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold text-violet-600">4.2</p>
              <p className="text-xs text-muted-foreground">Avg Grade</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
