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
import { Award, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const TYPE_COLORS: Record<string, string> = {
  POSITIVE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  NEGATIVE: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const CATEGORY_LABELS: Record<string, string> = {
  EXCELLENCE: 'Excellence',
  HELPFUL: 'Helpful',
  LATE: 'Late',
  DISRUPTIVE: 'Disruptive',
  ABSENT: 'Absent',
  OTHER: 'Other',
};

export default function BehaviorList() {
  const store = useStore();
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [form, setForm] = useState({ studentId: '', type: 'POSITIVE', category: 'OTHER', description: '', date: '' });
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    async function load() {
      try {
        const [bRes, sRes] = await Promise.all([
          fetch('/api/behavior'),
          fetch('/api/students'),
        ]);
        const bData = await bRes.json();
        const sData = await sRes.json();
        setRecords(bData.records || []);
        if (sData.students) {
          setStudents(sData.students);
          store.setStudents(sData.students);
        }
      } catch { /* empty */ } finally {
        setLoading(false);
      }
    }
    load();
  }, [store]);

  const filtered = records.filter(r => filterType === 'all' || r.type === filterType);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.studentId || !form.date) {
      toast.error('Student and date are required');
      return;
    }
    setFormLoading(true);
    try {
      const res = await fetch('/api/behavior', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Failed'); return; }
      toast.success('Behavior record added');
      setRecords([data.record, ...records]);
      setForm({ studentId: '', type: 'POSITIVE', category: 'OTHER', description: '', date: '' });
      setDialogOpen(false);
    } catch { toast.error('Network error'); } finally { setFormLoading(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/behavior?id=${id}`, { method: 'DELETE' });
      toast.success('Record deleted');
      setRecords(records.filter(r => r.id !== id));
    } catch { toast.error('Network error'); }
  };

  if (loading) return <div className="space-y-4"><Skeleton className="h-10 w-full max-w-sm" /><Card><CardContent className="p-6"><Skeleton className="h-64 w-full" /></CardContent></Card></div>;

  const positiveCount = records.filter(r => r.type === 'POSITIVE').length;
  const negativeCount = records.filter(r => r.type === 'NEGATIVE').length;

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-emerald-600">{positiveCount}</p><p className="text-xs text-muted-foreground">Positive</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-red-600">{negativeCount}</p><p className="text-xs text-muted-foreground">Negative</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{records.length}</p><p className="text-xs text-muted-foreground">Total Records</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{records.length > 0 ? Math.round((positiveCount / records.length) * 100) : 0}%</p><p className="text-xs text-muted-foreground">Positive Rate</p></CardContent></Card>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-36"><SelectValue placeholder="All Types" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="POSITIVE">Positive</SelectItem>
              <SelectItem value="NEGATIVE">Negative</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="h-4 w-4 mr-2" /> Add Record
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Behavior Record</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Student *</Label>
                <Select value={form.studentId} onValueChange={v => setForm({ ...form, studentId: v })}>
                  <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                  <SelectContent>
                    {students.map(s => <SelectItem key={s.id} value={s.id}>{s.firstName} {s.lastName}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="POSITIVE">Positive</SelectItem>
                      <SelectItem value="NEGATIVE">Negative</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(CATEGORY_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Date *</Label>
                <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Details..." rows={3} />
              </div>
              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={formLoading}>
                {formLoading ? 'Saving...' : 'Add Record'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Award className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No behavior records found</p>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="hidden sm:table-cell">Category</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="hidden md:table-cell">Description</TableHead>
                    <TableHead className="w-12">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(r => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.student?.firstName} {r.student?.lastName}</TableCell>
                      <TableCell>
                        <Badge className={TYPE_COLORS[r.type] || TYPE_COLORS.POSITIVE}>{r.type}</Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant="outline">{CATEGORY_LABELS[r.category] || r.category}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">{new Date(r.date + 'T00:00:00').toLocaleDateString()}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground max-w-[200px] truncate">{r.description || '—'}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost" className="h-7 text-red-500 hover:text-red-600" onClick={() => handleDelete(r.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
