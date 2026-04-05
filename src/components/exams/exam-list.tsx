'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { FileCheck, Plus, Trash2, Clock, MapPin } from 'lucide-react';
import { toast } from 'sonner';

export default function ExamList() {
  const store = useStore();
  const [loading, setLoading] = useState(true);
  const [exams, setExams] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [form, setForm] = useState({ title: '', subjectId: '', classId: '', date: '', startTime: '', endTime: '', totalMarks: '100', room: '' });
  const [filterClass, setFilterClass] = useState('all');

  useEffect(() => {
    async function load() {
      try {
        const [eRes, cRes, sRes] = await Promise.all([
          fetch('/api/exams'),
          fetch('/api/classes'),
          fetch('/api/subjects'),
        ]);
        const eData = await eRes.json();
        const cData = await cRes.json();
        const sData = await sRes.json();
        setExams(eData.exams || []);
        if (cData.classes) store.setClasses(cData.classes);
        if (sData.subjects) store.setSubjects(sData.subjects);
      } catch { /* empty */ } finally {
        setLoading(false);
      }
    }
    load();
  }, [store]);

  const filtered = exams.filter(e => filterClass === 'all' || e.classId === filterClass);

  // Separate upcoming and past exams
  const today = new Date().toISOString().split('T')[0];
  const upcoming = filtered.filter(e => e.date >= today);
  const past = filtered.filter(e => e.date < today);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.subjectId || !form.classId || !form.date || !form.startTime || !form.endTime) {
      toast.error('All required fields must be filled');
      return;
    }
    setFormLoading(true);
    try {
      const res = await fetch('/api/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Failed'); return; }
      toast.success('Exam scheduled');
      setExams([data.exam, ...exams]);
      setForm({ title: '', subjectId: '', classId: '', date: '', startTime: '', endTime: '', totalMarks: '100', room: '' });
      setDialogOpen(false);
    } catch { toast.error('Network error'); } finally { setFormLoading(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/exams?id=${id}`, { method: 'DELETE' });
      toast.success('Exam deleted');
      setExams(exams.filter(e => e.id !== id));
    } catch { toast.error('Network error'); }
  };

  if (loading) return <div className="space-y-4"><Skeleton className="h-10 w-full max-w-sm" /><Card><CardContent className="p-6"><Skeleton className="h-64 w-full" /></CardContent></Card></div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Select value={filterClass} onValueChange={setFilterClass}>
            <SelectTrigger className="w-40"><SelectValue placeholder="All Classes" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              {store.classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">{upcoming.length} upcoming, {past.length} past</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="h-4 w-4 mr-2" /> Schedule Exam
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Schedule Exam</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required placeholder="Midterm Exam" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Class *</Label>
                  <Select value={form.classId} onValueChange={v => setForm({ ...form, classId: v })}>
                    <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                    <SelectContent>
                      {store.classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Subject *</Label>
                  <Select value={form.subjectId} onValueChange={v => setForm({ ...form, subjectId: v })}>
                    <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                    <SelectContent>
                      {store.subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Date *</Label>
                <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label>Start *</Label>
                  <Input type="time" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>End *</Label>
                  <Input type="time" value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Total Marks</Label>
                  <Input type="number" value={form.totalMarks} onChange={e => setForm({ ...form, totalMarks: e.target.value })} min={1} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Room</Label>
                <Input value={form.room} onChange={e => setForm({ ...form, room: e.target.value })} placeholder="Room 101" />
              </div>
              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={formLoading}>
                {formLoading ? 'Scheduling...' : 'Schedule Exam'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Upcoming Exams */}
      {upcoming.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Upcoming Exams</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcoming.map(exam => (
              <Card key={exam.id} className="relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{exam.title}</p>
                      <p className="text-sm text-muted-foreground">{exam.subject?.name}</p>
                      <p className="text-xs text-muted-foreground">{exam.class?.name}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-red-500 hover:text-red-600" onClick={() => handleDelete(exam.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="mt-3 space-y-1.5">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{new Date(exam.date + 'T00:00:00').toLocaleDateString()} · {exam.startTime} - {exam.endTime}</span>
                    </div>
                    {exam.room && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span>Room {exam.room}</span>
                      </div>
                    )}
                    <Badge variant="outline" className="text-xs">{exam.totalMarks} marks</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Past Exams Table */}
      {past.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Past Exams</h3>
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead className="hidden sm:table-cell">Subject</TableHead>
                      <TableHead className="hidden sm:table-cell">Class</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="hidden md:table-cell">Marks</TableHead>
                      <TableHead className="w-12">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {past.map(exam => (
                      <TableRow key={exam.id}>
                        <TableCell className="font-medium">{exam.title}</TableCell>
                        <TableCell className="hidden sm:table-cell">{exam.subject?.name}</TableCell>
                        <TableCell className="hidden sm:table-cell">{exam.class?.name}</TableCell>
                        <TableCell className="text-sm">{new Date(exam.date + 'T00:00:00').toLocaleDateString()}</TableCell>
                        <TableCell className="hidden md:table-cell">{exam.totalMarks}</TableCell>
                        <TableCell>
                          <Button size="sm" variant="ghost" className="h-7 text-red-500 hover:text-red-600" onClick={() => handleDelete(exam.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {filtered.length === 0 && (
        <Card>
          <CardContent className="text-center py-16 text-muted-foreground">
            <FileCheck className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No exams scheduled</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
