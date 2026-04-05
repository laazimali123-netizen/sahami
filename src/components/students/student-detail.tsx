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
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft, User, BookOpen, ClipboardCheck, DollarSign,
  Mail, Phone, MapPin, Calendar, Users,
} from 'lucide-react';

export default function StudentDetail() {
  const store = useStore();
  const studentId = store.viewParams.id;
  const [student, setStudent] = useState<any>(null);
  const [grades, setGrades] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [sRes, gRes, aRes] = await Promise.all([
          fetch(`/api/students/${studentId}`),
          fetch(`/api/grades?studentId=${studentId}`),
          fetch(`/api/attendance?studentId=${studentId}`),
        ]);
        const sData = await sRes.json();
        const gData = await gRes.json();
        const aData = await aRes.json();
        setStudent(sData.student || sData);
        setGrades(gData.grades || []);
        setAttendance(aData.attendance || []);
      } catch { /* empty */ } finally {
        setLoading(false);
      }
    }
    if (studentId) load();
  }, [studentId]);

  if (loading) {
    return <div className="space-y-4"><Skeleton className="h-40 w-full" /><Skeleton className="h-64 w-full" /></div>;
  }

  if (!student) {
    return (
      <div className="text-center py-16">
        <User className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-30" />
        <p className="text-muted-foreground">Student not found</p>
        <Button variant="outline" className="mt-4" onClick={() => store.navigate('students')}>Back to Students</Button>
      </div>
    );
  }

  const fullName = `${student.firstName} ${student.lastName}`;
  const initials = `${student.firstName[0]}${student.lastName[0]}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => store.navigate('students')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-lg font-bold">
              {initials}
            </div>
            <div>
              <h2 className="text-xl font-semibold">{fullName}</h2>
              <p className="text-sm text-muted-foreground">ID: {student.studentId}</p>
            </div>
            <Badge
              className={
                student.status === 'ACTIVE'
                  ? 'bg-emerald-100 text-emerald-700'
                  : student.status === 'INACTIVE'
                    ? 'bg-red-100 text-red-700'
                    : ''
              }
            >
              {student.status}
            </Badge>
          </div>
        </div>
        <Button variant="outline" onClick={() => {
          store.setSelectedStudentId(student.id);
          store.navigate('student-form', { id: student.id });
        }}>
          Edit
        </Button>
      </div>

      <Tabs defaultValue="info" className="space-y-4">
        <TabsList>
          <TabsTrigger value="info"><User className="h-4 w-4 mr-2" />Info</TabsTrigger>
          <TabsTrigger value="grades"><BookOpen className="h-4 w-4 mr-2" />Grades</TabsTrigger>
          <TabsTrigger value="attendance"><ClipboardCheck className="h-4 w-4 mr-2" />Attendance</TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-base">Personal Info</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">DOB:</span>
                  <span>{student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : 'Not set'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">Gender:</span>
                  <span className="capitalize">{student.gender}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">Email:</span>
                  <span>{student.email || 'Not set'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">Phone:</span>
                  <span>{student.phone || 'Not set'}</span>
                </div>
                <Separator />
                <div className="flex items-start gap-3 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">Address:</span>
                  <span>{student.address || 'Not set'}</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Guardian Info</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <User className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">Name:</span>
                  <span>{student.guardianName || 'Not set'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">Phone:</span>
                  <span>{student.guardianPhone || 'Not set'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">Relation:</span>
                  <span>{student.guardianRelation || 'Not set'}</span>
                </div>
                <Separator />
                <div className="text-sm">
                  <span className="text-muted-foreground">Enrolled: </span>
                  <span>{student.enrollDate ? new Date(student.enrollDate).toLocaleDateString() : 'Unknown'}</span>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Class: </span>
                  <span>{student.enrollments?.map((e: any) => e.class.name).join(', ') || 'None'}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="grades">
          <Card>
            <CardHeader><CardTitle className="text-base">Academic Grades</CardTitle></CardHeader>
            <CardContent className="p-0">
              {grades.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">No grades recorded yet</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead className="hidden sm:table-cell">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {grades.map((g: any) => {
                      const pct = Math.round((g.score / g.maxScore) * 100);
                      const letter = pct >= 90 ? 'A' : pct >= 80 ? 'B' : pct >= 70 ? 'C' : pct >= 60 ? 'D' : 'F';
                      return (
                        <TableRow key={g.id}>
                          <TableCell>{g.subject?.name || g.subjectId}</TableCell>
                          <TableCell>{g.type}</TableCell>
                          <TableCell>{g.score}/{g.maxScore}</TableCell>
                          <TableCell>
                            <Badge variant={letter === 'A' ? 'default' : letter === 'F' ? 'destructive' : 'secondary'}>
                              {letter}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">{new Date(g.date).toLocaleDateString()}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance">
          <Card>
            <CardHeader><CardTitle className="text-base">Attendance Records</CardTitle></CardHeader>
            <CardContent className="p-0">
              {attendance.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">No attendance records</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden sm:table-cell">Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendance.map((a: any) => (
                      <TableRow key={a.id}>
                        <TableCell>{new Date(a.date).toLocaleDateString()}</TableCell>
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
                        <TableCell className="hidden sm:table-cell text-muted-foreground">{a.notes || '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
