'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { ClipboardCheck, Search, Download } from 'lucide-react';
import { exportToCSV } from '@/lib/csv-export';

export default function AttendanceList() {
  const store = useStore();
  const [loading, setLoading] = useState(true);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [filterClass, setFilterClass] = useState('all');
  const [filterDate, setFilterDate] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const [aRes, cRes] = await Promise.all([
          fetch('/api/attendance'),
          fetch('/api/classes'),
        ]);
        const aData = await aRes.json();
        const cData = await cRes.json();
        setAttendance(aData.attendance || []);
        if (cData.classes) store.setClasses(cData.classes);
      } catch { /* empty */ } finally {
        setLoading(false);
      }
    }
    load();
  }, [store]);

  const filtered = attendance.filter((a) => {
    const matchClass = filterClass === 'all' || a.classId === filterClass;
    const matchDate = !filterDate || a.date.startsWith(filterDate);
    return matchClass && matchDate;
  });

  if (loading) {
    return <div className="space-y-4"><Skeleton className="h-10 w-full max-w-sm" /><Card><CardContent className="p-6"><Skeleton className="h-64 w-full" /></CardContent></Card></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 w-full sm:w-auto">
          <Select value={filterClass} onValueChange={setFilterClass}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Classes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              {store.classes.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input type="date" className="w-40" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={() => exportToCSV(
            filtered.map(a => ({
              'Date': a.date,
              'Student': `${a.student?.firstName || ''} ${a.student?.lastName || ''}`,
              'Status': a.status,
              'Notes': a.notes || '',
            })),
            'attendance'
          )}>
            <Download className="h-4 w-4 mr-1" /> CSV
          </Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700 shrink-0" onClick={() => store.navigate('attendance-mark')}>
            <ClipboardCheck className="h-4 w-4 mr-2" /> Mark Attendance
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <ClipboardCheck className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No attendance records found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden sm:table-cell">Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="text-sm">{new Date(a.date).toLocaleDateString()}</TableCell>
                      <TableCell className="font-medium">
                        {a.student?.firstName} {a.student?.lastName}
                      </TableCell>
                      <TableCell>
                        <Badge className={
                          a.status === 'PRESENT' ? 'bg-emerald-100 text-emerald-700' :
                          a.status === 'ABSENT' ? 'bg-red-100 text-red-700' :
                          a.status === 'LATE' ? 'bg-amber-100 text-amber-700' :
                          'bg-violet-100 text-violet-700'
                        }>
                          {a.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">{a.notes || '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      <p className="text-sm text-muted-foreground text-right">{filtered.length} record(s)</p>
    </div>
  );
}
