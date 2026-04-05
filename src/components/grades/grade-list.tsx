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
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Plus, BarChart3, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function GradeList() {
  const store = useStore();
  const [loading, setLoading] = useState(true);
  const [grades, setGrades] = useState<any[]>([]);
  const [filterClass, setFilterClass] = useState('all');
  const [filterSubject, setFilterSubject] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [form, setForm] = useState({
    studentId: '', subjectId: '', classId: '', type: 'EXAM', score: '', maxScore: '100', term: 'TERM_1', comments: '',
  });

  useEffect(() => {
    async function load() {
      try {
        const [gRes, cRes, sRes] = await Promise.all([
          fetch('/api/grades'),
          fetch('/api/classes'),
          fetch('/api/subjects'),
        ]);
        const gData = await gRes.json();
        const cData = await cRes.json();
        const sData = await sRes.json();
        setGrades(gData.grades || []);
        if (cData.classes) store.setClasses(cData.classes);
        if (sData.subjects) store.setSubjects(sData.subjects);
      } catch { /* empty */ } finally {
        setLoading(false);
      }
    }
    load();
  }, [store]);

  const filtered = grades.filter((g) => {
    const matchClass = filterClass === 'all' || g.classId === filterClass;
    const matchSubject = filterSubject === 'all' || g.subjectId === filterSubject;
    return matchClass && matchSubject;
  });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.studentId || !form.subjectId || !form.score) {
      toast.error('Please fill in all required fields');
      return;
    }
    setFormLoading(true);
    try {
      const res = await fetch('/api/grades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, score: parseFloat(form.score), maxScore: parseFloat(form.maxScore) || 100 }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to add grade');
        return;
      }
      toast.success('Grade added');
      setGrades([data.grade, ...grades]);
      setForm({ studentId: '', subjectId: '', classId: '', type: 'EXAM', score: '', maxScore: '100', term: 'TERM_1', comments: '' });
      setDialogOpen(false);
    } catch {
      toast.error('Network error');
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) return <div className="space-y-4"><Skeleton className="h-64 w-full" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <Select value={filterClass} onValueChange={setFilterClass}>
            <SelectTrigger className="w-40"><SelectValue placeholder="All Classes" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              {store.classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterSubject} onValueChange={setFilterSubject}>
            <SelectTrigger className="w-40"><SelectValue placeholder="All Subjects" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subjects</SelectItem>
              {store.subjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700 shrink-0">
              <Plus className="h-4 w-4 mr-2" /> Add Grade
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Add Grade</DialogTitle></DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Student *</Label>
                  <Select value={form.studentId} onValueChange={(v) => setForm({ ...form, studentId: v })}>
                    <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                    <SelectContent>
                      {store.students.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.firstName} {s.lastName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Subject *</Label>
                  <Select value={form.subjectId} onValueChange={(v) => setForm({ ...form, subjectId: v })}>
                    <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                    <SelectContent>
                      {store.subjects.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EXAM">Exam</SelectItem>
                      <SelectItem value="QUIZ">Quiz</SelectItem>
                      <SelectItem value="HOMEWORK">Homework</SelectItem>
                      <SelectItem value="PROJECT">Project</SelectItem>
                      <SelectItem value="PARTICIPATION">Participation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Term</Label>
                  <Select value={form.term} onValueChange={(v) => setForm({ ...form, term: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TERM_1">Term 1</SelectItem>
                      <SelectItem value="TERM_2">Term 2</SelectItem>
                      <SelectItem value="TERM_3">Term 3</SelectItem>
                      <SelectItem value="FINAL">Final</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Score *</Label>
                  <Input type="number" value={form.score} onChange={(e) => setForm({ ...form, score: e.target.value })} required min={0} />
                </div>
                <div className="space-y-2">
                  <Label>Max Score</Label>
                  <Input type="number" value={form.maxScore} onChange={(e) => setForm({ ...form, maxScore: e.target.value })} min={1} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Comments</Label>
                <Textarea value={form.comments} onChange={(e) => setForm({ ...form, comments: e.target.value })} rows={2} />
              </div>
              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={formLoading}>
                {formLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Grade
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No grades found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead className="hidden sm:table-cell">Term</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((g) => {
                    const pct = Math.round((g.score / g.maxScore) * 100);
                    const letter = pct >= 90 ? 'A' : pct >= 80 ? 'B' : pct >= 70 ? 'C' : pct >= 60 ? 'D' : 'F';
                    return (
                      <TableRow key={g.id}>
                        <TableCell className="font-medium">
                          {g.student?.firstName} {g.student?.lastName}
                        </TableCell>
                        <TableCell>{g.subject?.name || g.subjectId}</TableCell>
                        <TableCell><Badge variant="outline">{g.type}</Badge></TableCell>
                        <TableCell>{g.score}/{g.maxScore} <span className="text-muted-foreground text-xs">({pct}%)</span></TableCell>
                        <TableCell>
                          <Badge variant={letter === 'A' ? 'default' : letter === 'F' ? 'destructive' : 'secondary'}>
                            {letter}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">{g.term}</TableCell>
                      </TableRow>
                    );
                  })}
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
