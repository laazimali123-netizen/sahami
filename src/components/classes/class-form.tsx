'use client';

import { useState } from 'react';
import { useStore } from '@/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ClassForm() {
  const store = useStore();
  const viewParams = store.viewParams;
  const isEdit = !!viewParams.id;

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    gradeLevel: '',
    section: '',
    room: '',
    capacity: '30',
  });

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.gradeLevel || !form.section) {
      toast.error('Please fill in all required fields');
      return;
    }
    setLoading(true);
    try {
      const url = isEdit ? `/api/classes/${viewParams.id}` : '/api/classes';
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, capacity: parseInt(form.capacity) || 30 }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to save class');
        return;
      }
      toast.success(isEdit ? 'Class updated' : 'Class created');
      store.navigate('classes');
    } catch {
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => store.navigate('classes')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-xl font-semibold">{isEdit ? 'Edit Class' : 'Add New Class'}</h2>
          <p className="text-sm text-muted-foreground">{isEdit ? 'Update class details' : 'Create a new class'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader><CardTitle className="text-base">Class Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Class Name *</Label>
              <Input value={form.name} onChange={(e) => handleChange('name', e.target.value)} required placeholder="Grade 10 - Alpha" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Grade Level *</Label>
                <Select value={form.gradeLevel} onValueChange={(v) => handleChange('gradeLevel', v)}>
                  <SelectTrigger><SelectValue placeholder="Select grade" /></SelectTrigger>
                  <SelectContent>
                    {[...Array(12)].map((_, i) => (
                      <SelectItem key={i + 1} value={String(i + 1)}>Grade {i + 1}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Section *</Label>
                <Select value={form.section} onValueChange={(v) => handleChange('section', v)}>
                  <SelectTrigger><SelectValue placeholder="Select section" /></SelectTrigger>
                  <SelectContent>
                    {['A', 'B', 'C', 'D', 'E'].map((s) => (
                      <SelectItem key={s} value={s}>Section {s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Room</Label>
                <Input value={form.room} onChange={(e) => handleChange('room', e.target.value)} placeholder="Room 101" />
              </div>
              <div className="space-y-2">
                <Label>Capacity</Label>
                <Input type="number" value={form.capacity} onChange={(e) => handleChange('capacity', e.target.value)} min={1} />
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="flex justify-end gap-3 mt-6">
          <Button type="button" variant="outline" onClick={() => store.navigate('classes')}>Cancel</Button>
          <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? 'Update Class' : 'Create Class'}
          </Button>
        </div>
      </form>
    </div>
  );
}
