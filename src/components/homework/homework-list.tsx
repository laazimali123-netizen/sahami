'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { BookCopy, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  COMPLETED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  OVERDUE: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export default function HomeworkList() {
  const store = useStore();
  const [loading, setLoading] = useState(true);
  const [homeworks, setHomeworks] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', classId: '', subjectId: '', dueDate: '' });
  const [filterClass, setFilterClass] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    async function load() {
      try {
        const [hRes, cRes, sRes] = await Promise.all([
          fetch('/api/homework'),
          fetch('/api/classes'),
          fetch('/api/subjects'),
        ]);
        const hData = await hRes.json();
        const cData = await cRes.json();
        const sData = await sRes.json();
        setHomeworks(hData.homeworks || []);
        if (cData.classes) store.setClasses(cData.classes);
        if (sData.subjects) store.setSubjects(sData.subjects);
      } catch { /* empty */ } finally {
        setLoading(false);
      }
    }
    load();
  }, [store]);

  const filtered = homeworks.filter(h => {
    const matchClass = filterClass === 'all' || h.classId === filterClass;
    const matchStatus = filterStatus === 'all' || h.status === filterStatus;
    return matchClass && matchStatus;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.classId || !form.subjectId || !form.dueDate) {
      toast.error('All required fields must be filled');
      return;
    }
    setFormLoading(true);
    try {
      const res = await fetch('/api/homework', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Failed'); return; }
      toast.success('Homework created');
      setHomeworks([data.homework, ...homeworks]);
      setForm({ title: '', description: '', classId: '', subjectId: '', dueDate: '' });
      setDialogOpen(false);
    } catch { toast.error('Network error'); } finally { setFormLoading(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/homework?id=${id}`, { method: 'DELETE' });
      toast.success('Homework deleted');
      setHomeworks(homeworks.filter(h => h.id !== id));
    } catch { toast.error('Network error'); }
  };

  const handleComplete = async (id: string) => {
    try {
      const res = await fetch('/api/homework', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status: 'COMPLETED' }) });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Failed'); return; }
      toast.success('Marked as completed');
      setHomeworks(homeworks.map(h => h.id === id ? { ...h, status: 'COMPLETED' } : h));
    } catch { toast.error('Network error'); }
  };

  if (loading) return <div className="space-y-4"><Skeleton className="h-10 w-full max-w-sm" /><Card><CardContent className="p-6"><Skeleton className="h-64 w-full" /></CardContent></Card></div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 w-full sm:w-auto">
          <Select value={filterClass} onValueChange={setFilterClass}>
            <SelectTrigger className="w-40"><SelectValue placeholder="All Classes" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              {store.classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="OVERDUE">Overdue</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="h-4 w-4 mr-2" /> Add Homework
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Homework</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required placeholder="Chapter 3 Problems" />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Instructions..." rows={3} />
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
                <Label>Due Date *</Label>
                <Input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} required />
              </div>
              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={formLoading}>
                {formLoading ? 'Creating...' : 'Create Homework'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <BookCopy className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No homework assignments found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead className="hidden sm:table-cell">Class</TableHead>
                    <TableHead className="hidden md:table-cell">Subject</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(h => (
                    <TableRow key={h.id}>
                      <TableCell className="font-medium">{h.title}</TableCell>
                      <TableCell className="hidden sm:table-cell">{h.class?.name || '—'}</TableCell>
                      <TableCell className="hidden md:table-cell">{h.subject?.name || '—'}</TableCell>
                      <TableCell className="text-sm">{new Date(h.dueDate + 'T00:00:00').toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge className={STATUS_COLORS[h.status] || STATUS_COLORS.ACTIVE}>{h.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {h.status === 'ACTIVE' && (
                            <Button size="sm" variant="outline" className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 h-7" onClick={() => handleComplete(h.id)}>Done</Button>
                          )}
                          <Button size="sm" variant="ghost" className="h-7 text-red-500 hover:text-red-600" onClick={() => handleDelete(h.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      <p className="text-sm text-muted-foreground text-right">{filtered.length} assignment(s)</p>
    </div>
  );
}
