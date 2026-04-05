'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { ArrowLeft, School, Users, GraduationCap, Calendar } from 'lucide-react';

export default function ClassDetail() {
  const store = useStore();
  const classId = store.viewParams.id;
  const [cls, setCls] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [timetable, setTimetable] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [cRes, sRes, tRes] = await Promise.all([
          fetch(`/api/classes/${classId}`),
          fetch(`/api/students?classId=${classId}`),
          fetch(`/api/timetable?classId=${classId}`),
        ]);
        const cData = await cRes.json();
        const sData = await sRes.json();
        const tData = await tRes.json();
        setCls(cData.class || cData);
        setStudents(sData.students || []);
        setTimetable(tData.slots || tData.timetable || []);
      } catch { /* empty */ } finally {
        setLoading(false);
      }
    }
    if (classId) load();
  }, [classId]);

  if (loading) return <div className="space-y-4"><Skeleton className="h-40 w-full" /><Skeleton className="h-64 w-full" /></div>;
  if (!cls) {
    return (
      <div className="text-center py-16">
        <School className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-30" />
        <p className="text-muted-foreground">Class not found</p>
        <Button variant="outline" className="mt-4" onClick={() => store.navigate('classes')}>Back</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => store.navigate('classes')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">{cls.name}</h2>
            <p className="text-sm text-muted-foreground">Grade {cls.gradeLevel} • Section {cls.section} {cls.room ? `• Room ${cls.room}` : ''}</p>
          </div>
        </div>
        <Button variant="outline" className="ml-auto" onClick={() => { store.setSelectedClassId(cls.id); store.navigate('class-form', { id: cls.id }); }}>
          Edit
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600">{students.length}</p>
          <p className="text-xs text-muted-foreground">Students</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-teal-600">{cls._count?.teachers || 0}</p>
          <p className="text-xs text-muted-foreground">Teachers</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{cls.capacity}</p>
          <p className="text-xs text-muted-foreground">Capacity</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-violet-600">{timetable.length}</p>
          <p className="text-xs text-muted-foreground">Slots/Week</p>
        </CardContent></Card>
      </div>

      <Tabs defaultValue="students">
        <TabsList>
          <TabsTrigger value="students"><Users className="h-4 w-4 mr-2" />Students</TabsTrigger>
          <TabsTrigger value="timetable"><Calendar className="h-4 w-4 mr-2" />Timetable</TabsTrigger>
        </TabsList>
        <TabsContent value="students">
          <Card>
            <CardHeader><CardTitle className="text-base">Enrolled Students</CardTitle></CardHeader>
            <CardContent className="p-0">
              {students.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">No students enrolled</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead className="hidden sm:table-cell">Gender</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((s: any) => (
                      <TableRow key={s.id} className="cursor-pointer" onClick={() => { store.setSelectedStudentId(s.id); store.navigate('student-detail', { id: s.id }); }}>
                        <TableCell className="font-mono text-sm">{s.studentId}</TableCell>
                        <TableCell className="font-medium">{s.firstName} {s.lastName}</TableCell>
                        <TableCell className="hidden sm:table-cell capitalize">{s.gender}</TableCell>
                        <TableCell><Badge variant={s.status === 'ACTIVE' ? 'default' : 'secondary'}>{s.status}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="timetable">
          <Card>
            <CardHeader><CardTitle className="text-base">Weekly Timetable</CardTitle></CardHeader>
            <CardContent>
              {timetable.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">No timetable slots configured</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Day</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead className="hidden sm:table-cell">Teacher</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {timetable.map((t: any) => (
                        <TableRow key={t.id}>
                          <TableCell><Badge variant="outline">{t.dayOfWeek}</Badge></TableCell>
                          <TableCell className="text-sm">{t.startTime} - {t.endTime}</TableCell>
                          <TableCell className="font-medium">{t.subject?.name || t.subjectId}</TableCell>
                          <TableCell className="hidden sm:table-cell text-muted-foreground">{t.teacher?.name || '—'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
