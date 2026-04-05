'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ArrowLeft, Loader2, Users } from 'lucide-react';
import { toast } from 'sonner';

export default function AttendanceMark() {
  const store = useStore();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedClass, setSelectedClass] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [records, setRecords] = useState<Record<string, string>>({});
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    async function loadClasses() {
      try {
        const res = await fetch('/api/classes');
        const data = await res.json();
        if (data.classes) store.setClasses(data.classes);
      } catch { /* empty */ } finally {
        setLoading(false);
      }
    }
    if (store.classes.length === 0) loadClasses();
    else setLoading(false);
  }, [store]);

  useEffect(() => {
    async function loadStudents() {
      if (!selectedClass) return;
      try {
        const res = await fetch(`/api/students?classId=${selectedClass}`);
        const data = await res.json();
        const list = data.students || [];
        setStudents(list);
        setRecords(Object.fromEntries(list.map((s: any) => [s.id, 'PRESENT'])));
      } catch { /* empty */ }
    }
    loadStudents();
  }, [selectedClass]);

  const handleSubmit = async () => {
    if (!selectedClass || students.length === 0) {
      toast.error('Please select a class with students');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classId: selectedClass, date, records }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to save attendance');
        return;
      }
      toast.success('Attendance saved successfully');
      store.navigate('attendance');
    } catch {
      toast.error('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Skeleton className="h-64 w-full" />;

  const statusOptions = [
    { value: 'PRESENT', label: 'Present', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    { value: 'ABSENT', label: 'Absent', color: 'bg-red-100 text-red-700 border-red-200' },
    { value: 'LATE', label: 'Late', color: 'bg-amber-100 text-amber-700 border-amber-200' },
    { value: 'EXCUSED', label: 'Excused', color: 'bg-violet-100 text-violet-700 border-violet-200' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => store.navigate('attendance')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-xl font-semibold">Mark Attendance</h2>
          <p className="text-sm text-muted-foreground">Select a class and mark each student&apos;s attendance</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Select Class & Date</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="space-y-2 flex-1">
              <Label>Class</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a class" />
                </SelectTrigger>
                <SelectContent>
                  {store.classes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name} ({c.gradeLevel}-{c.section})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedClass && students.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Students ({students.length})</CardTitle>
              <div className="flex gap-2">
                {statusOptions.map((opt) => (
                  <Badge key={opt.value} variant="outline" className={`${opt.color} text-xs`}>{opt.label}</Badge>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold shrink-0">
                          {s.firstName[0]}{s.lastName[0]}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{s.firstName} {s.lastName}</p>
                          <p className="text-xs text-muted-foreground">{s.studentId}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <RadioGroup
                        value={records[s.id]}
                        onValueChange={(v) => setRecords({ ...records, [s.id]: v })}
                        className="flex items-center justify-center gap-2"
                      >
                        {statusOptions.map((opt) => (
                          <Label
                            key={opt.value}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs cursor-pointer border transition-colors ${records[s.id] === opt.value ? opt.color : 'bg-muted/50 text-muted-foreground border-transparent hover:bg-muted'}`}
                          >
                            <RadioGroupItem value={opt.value} className="sr-only" />
                            {opt.label}
                          </Label>
                        ))}
                      </RadioGroup>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {selectedClass && students.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No students enrolled in this class</p>
        </div>
      )}

      {selectedClass && students.length > 0 && (
        <div className="flex justify-end">
          <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleSubmit} disabled={submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Attendance
          </Button>
        </div>
      )}
    </div>
  );
}
