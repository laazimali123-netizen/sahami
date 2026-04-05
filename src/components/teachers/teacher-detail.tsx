'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, User, Mail, Phone, School, BookOpen } from 'lucide-react';

export default function TeacherDetail() {
  const store = useStore();
  const teacherId = store.viewParams.id;
  const [teacher, setTeacher] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/teachers/${teacherId}`);
        const data = await res.json();
        setTeacher(data.teacher || data);
      } catch { /* empty */ } finally {
        setLoading(false);
      }
    }
    if (teacherId) load();
  }, [teacherId]);

  if (loading) return <div className="space-y-4"><Skeleton className="h-40 w-full" /><Skeleton className="h-64 w-full" /></div>;

  if (!teacher) {
    return (
      <div className="text-center py-16">
        <User className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-30" />
        <p className="text-muted-foreground">Teacher not found</p>
        <Button variant="outline" className="mt-4" onClick={() => store.navigate('teachers')}>Back</Button>
      </div>
    );
  }

  const initials = teacher.name.split(' ').map((n: string) => n[0]).join('').toUpperCase();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => store.navigate('teachers')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-3 flex-1">
          <div className="h-12 w-12 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-lg font-bold">
            {initials}
          </div>
          <div>
            <h2 className="text-xl font-semibold">{teacher.name}</h2>
            <p className="text-sm text-muted-foreground">{teacher.role}</p>
          </div>
          <Badge className={teacher.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}>
            {teacher.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>
        <Button variant="outline" onClick={() => { store.setSelectedTeacherId(teacher.id); store.navigate('teacher-form', { id: teacher.id }); }}>
          Edit
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Contact Information</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">Email:</span>
              <span>{teacher.email}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">Phone:</span>
              <span>{teacher.phone || 'Not set'}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Assigned Classes</CardTitle></CardHeader>
          <CardContent>
            {teacher.classAssignments && teacher.classAssignments.length > 0 ? (
              <div className="space-y-2">
                {teacher.classAssignments.map((ca: any) => (
                  <div key={ca.classId} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                    <School className="h-4 w-4 text-emerald-600" />
                    <span className="text-sm font-medium">{ca.class.name}</span>
                    <Badge variant="outline" className="text-xs ml-auto">{ca.class.gradeLevel}-{ca.class.section}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No classes assigned</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
