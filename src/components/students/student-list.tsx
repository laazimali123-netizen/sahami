'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserPlus, Search, MoreHorizontal, Eye, Pencil, GraduationCap, Download } from 'lucide-react';
import { exportToCSV } from '@/lib/csv-export';

export default function StudentList() {
  const store = useStore();
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    async function load() {
      try {
        const [studentsRes, classesRes] = await Promise.all([
          fetch('/api/students'),
          fetch('/api/classes'),
        ]);
        const studentsData = await studentsRes.json();
        const classesData = await classesRes.json();
        if (studentsData.students) store.setStudents(studentsData.students);
        if (classesData.classes) store.setClasses(classesData.classes);
      } catch { /* empty */ } finally {
        setLoading(false);
      }
    }
    load();
  }, [store]);

  const filtered = store.students.filter((s) => {
    const matchSearch = search === '' ||
      `${s.firstName} ${s.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      s.studentId.toLowerCase().includes(search.toLowerCase());
    const matchClass = filterClass === 'all' || s.enrollments?.some(e => e.classId === filterClass);
    const matchStatus = filterStatus === 'all' || s.status === filterStatus;
    return matchSearch && matchClass && matchStatus;
  });

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full max-w-sm" />
        <Card><CardContent className="p-6"><Skeleton className="h-64 w-full" /></CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 w-full sm:w-auto">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search students..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
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
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
              <SelectItem value="GRADUATED">Graduated</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={() => exportToCSV(
            filtered.map(s => ({
              'Student ID': s.studentId,
              'First Name': s.firstName,
              'Last Name': s.lastName,
              'Gender': s.gender,
              'Class': s.enrollments?.map(e => e.class.name).join(', ') || '',
              'Status': s.status,
              'Email': s.email || '',
              'Phone': s.phone || '',
              'Enroll Date': s.enrollDate,
            })),
            'students'
          )}>
            <Download className="h-4 w-4 mr-1" /> CSV
          </Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => store.navigate('student-form')}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Student
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <GraduationCap className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No students found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden sm:table-cell">Gender</TableHead>
                    <TableHead className="hidden md:table-cell">Class</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-12">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((student) => (
                    <TableRow key={student.id} className="cursor-pointer hover:bg-muted/50" onClick={() => {
                      store.setSelectedStudentId(student.id);
                      store.navigate('student-detail', { id: student.id });
                    }}>
                      <TableCell className="font-mono text-sm">{student.studentId}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold shrink-0">
                            {student.firstName[0]}{student.lastName[0]}
                          </div>
                          <span className="font-medium">{student.firstName} {student.lastName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell capitalize">{student.gender}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        {student.enrollments?.map(e => e.class.name).join(', ') || '—'}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={student.status === 'ACTIVE' ? 'default' : 'secondary'}
                          className={
                            student.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' :
                            student.status === 'INACTIVE' ? 'bg-red-100 text-red-700 hover:bg-red-100' : ''
                          }
                        >
                          {student.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {
                              store.setSelectedStudentId(student.id);
                              store.navigate('student-detail', { id: student.id });
                            }}>
                              <Eye className="h-4 w-4 mr-2" /> View
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              store.setSelectedStudentId(student.id);
                              store.navigate('student-form', { id: student.id });
                            }}>
                              <Pencil className="h-4 w-4 mr-2" /> Edit
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      <p className="text-sm text-muted-foreground text-right">{filtered.length} student(s) shown</p>
    </div>
  );
}
