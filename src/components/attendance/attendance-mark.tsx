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
import { ArrowLeft, Loader2, Users, CheckCircle2, UserX } from 'lucide-react';
import { toast } from 'sonner';

export default function AttendanceMark() {
  const store = useStore();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedClass, setSelectedClass] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [records, setRecords] = useState<Record<string, string>>({});
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [showAbsentOnly, setShowAbsentOnly] = useState(false);

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
        // Default all to PRESENT
        setRecords(Object.fromEntries(list.map((s: any) => [s.id, 'PRESENT'])));
      } catch { /* empty */ }
    }
    loadStudents();
  }, [selectedClass]);

  const handleMarkAllPresent = () => {
    setRecords(Object.fromEntries(students.map((s: any) => [s.id, 'PRESENT'])));
    toast.success('All students marked as Present');
  };

  const handleMarkAllAbsent = () => {
    setRecords(Object.fromEntries(students.map((s: any) => [s.id, 'ABSENT'])));
    toast.success('All students marked as Absent');
  };

  const handleSave = async () => {
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

  const presentCount = Object.values(records).filter(v => v === 'PRESENT').length;
  const absentCount = Object.values(records).filter(v => v === 'ABSENT').length;
  const lateCount = Object.values(records).filter(v => v === 'LATE').length;
  const excusedCount = Object.values(records).filter(v => v === 'EXCUSED').length;
  const markedCount = presentCount + absentCount + lateCount + excusedCount;

  const filteredStudents = showAbsentOnly
    ? students.filter((s) => records[s.id] && records[s.id] !== 'PRESENT')
    : students;

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
        <>
          {/* Stats Bar */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex flex-wrap gap-3">
                  <Badge className="bg-muted px-3 py-1">
                    Total: {students.length}
                  </Badge>
                  <Badge className="bg-emerald-100 text-emerald-700 border-0 px-3 py-1">
                    <CheckCircle2 className="h-3 w-3 mr-1" /> Present: {presentCount}
                  </Badge>
                  <Badge className="bg-red-100 text-red-700 border-0 px-3 py-1">
                    <UserX className="h-3 w-3 mr-1" /> Absent: {absentCount}
                  </Badge>
                  <Badge className="bg-amber-100 text-amber-700 border-0 px-3 py-1">
                    Late: {lateCount}
                  </Badge>
                  <Badge className="bg-violet-100 text-violet-700 border-0 px-3 py-1">
                    Excused: {excusedCount}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={handleMarkAllPresent} className="text-emerald-600 border-emerald-200 hover:bg-emerald-50">
                    <CheckCircle2 className="h-4 w-4 mr-1" /> All Present
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleMarkAllAbsent} className="text-red-600 border-red-200 hover:bg-red-50">
                    <UserX className="h-4 w-4 mr-1" /> All Absent
                  </Button>
                  <Button
                    size="sm"
                    variant={showAbsentOnly ? 'default' : 'outline'}
                    onClick={() => setShowAbsentOnly(!showAbsentOnly)}
                    className={showAbsentOnly ? 'bg-amber-500 hover:bg-amber-600 text-white' : ''}
                  >
                    {showAbsentOnly ? 'Show All' : 'Only Absent/Late'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Student List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  Students
                  {showAbsentOnly && ` (Absent/Late only: ${filteredStudents.length})`}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {filteredStudents.length === 0 && showAbsentOnly ? (
                <div className="text-center py-12 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-emerald-300" />
                  <p className="text-sm font-medium">All students are present!</p>
                  <p className="text-xs mt-1">No absent, late, or excused students.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.map((s, idx) => (
                      <TableRow key={s.id}>
                        <TableCell className="text-muted-foreground text-sm">{idx + 1}</TableCell>
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
                            className="flex items-center justify-center gap-1"
                          >
                            {statusOptions.map((opt) => (
                              <Label
                                key={opt.value}
                                className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs cursor-pointer border transition-colors ${records[s.id] === opt.value ? opt.color : 'bg-muted/50 text-muted-foreground border-transparent hover:bg-muted'}`}
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
              )}
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleSave} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Attendance ({markedCount} students)
            </Button>
          </div>
        </>
      )}

      {selectedClass && students.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No students enrolled in this class</p>
        </div>
      )}
    </div>
  );
}
