'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function TeacherForm() {
  const store = useStore();
  const viewParams = store.viewParams;
  const isEdit = !!viewParams.id;
  const existing = isEdit ? store.teachers.find(t => t.id === viewParams.id) : null;

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: existing?.name || '',
    email: existing?.email || '',
    phone: existing?.phone || '',
    password: '',
  });

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email) {
      toast.error('Name and email are required');
      return;
    }
    if (!isEdit && !form.password) {
      toast.error('Password is required for new teachers');
      return;
    }
    setLoading(true);
    try {
      const url = isEdit ? `/api/teachers/${viewParams.id}` : '/api/teachers';
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to save teacher');
        return;
      }
      toast.success(isEdit ? 'Teacher updated' : 'Teacher created');
      store.navigate('teachers');
    } catch {
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => store.navigate('teachers')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-xl font-semibold">{isEdit ? 'Edit Teacher' : 'Add New Teacher'}</h2>
          <p className="text-sm text-muted-foreground">{isEdit ? 'Update teacher information' : 'Enter teacher details'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader><CardTitle className="text-base">Teacher Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name *</Label>
              <Input value={form.name} onChange={(e) => handleChange('name', e.target.value)} required placeholder="Jane Smith" />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input type="email" value={form.email} onChange={(e) => handleChange('email', e.target.value)} required placeholder="jane@school.com" />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} placeholder="+1 234 567 890" />
            </div>
            {!isEdit && (
              <div className="space-y-2">
                <Label>Password *</Label>
                <Input type="password" value={form.password} onChange={(e) => handleChange('password', e.target.value)} required placeholder="Min 6 characters" minLength={6} />
              </div>
            )}
          </CardContent>
        </Card>
        <div className="flex justify-end gap-3 mt-6">
          <Button type="button" variant="outline" onClick={() => store.navigate('teachers')}>Cancel</Button>
          <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? 'Update Teacher' : 'Create Teacher'}
          </Button>
        </div>
      </form>
    </div>
  );
}
