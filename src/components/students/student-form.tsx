'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function StudentForm() {
  const store = useStore();
  const viewParams = store.viewParams;
  const isEdit = !!viewParams.id;
  const existingStudent = isEdit ? store.students.find(s => s.id === viewParams.id) : null;

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    firstName: existingStudent?.firstName || '',
    lastName: existingStudent?.lastName || '',
    dateOfBirth: existingStudent?.dateOfBirth?.split('T')[0] || '',
    gender: existingStudent?.gender || '',
    address: existingStudent?.address || '',
    phone: existingStudent?.phone || '',
    email: existingStudent?.email || '',
    guardianName: existingStudent?.guardianName || '',
    guardianPhone: existingStudent?.guardianPhone || '',
    guardianRelation: existingStudent?.guardianRelation || '',
    classId: existingStudent?.enrollments?.[0]?.classId || '',
    status: existingStudent?.status || 'ACTIVE',
  });

  const [classesAvailable, setClassesAvailable] = useState(true);

  useEffect(() => {
    async function loadClasses() {
      try {
        const res = await fetch('/api/classes');
        if (!res.ok) {
          setClassesAvailable(false);
          return;
        }
        const data = await res.json();
        if (data.classes) store.setClasses(data.classes);
        setClassesAvailable(true);
      } catch {
        setClassesAvailable(false);
      }
    }
    if (store.classes.length === 0) loadClasses();
    else setClassesAvailable(true);
  }, [store]);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.gender) {
      toast.error('Please fill in all required fields');
      return;
    }
    setLoading(true);
    try {
      const url = isEdit ? `/api/students/${viewParams.id}` : '/api/students';
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to save student');
        return;
      }
      toast.success(isEdit ? 'Student updated successfully' : 'Student created successfully');
      store.navigate('students');
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => store.navigate('students')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-xl font-semibold">{isEdit ? 'Edit Student' : 'Add New Student'}</h2>
          <p className="text-sm text-muted-foreground">{isEdit ? 'Update student information' : 'Fill in student details'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Name *</Label>
                <Input value={form.firstName} onChange={(e) => handleChange('firstName', e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Last Name *</Label>
                <Input value={form.lastName} onChange={(e) => handleChange('lastName', e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Date of Birth</Label>
                <Input type="date" value={form.dateOfBirth} onChange={(e) => handleChange('dateOfBirth', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Gender *</Label>
                <Select value={form.gender} onValueChange={(v) => handleChange('gender', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MALE">Male</SelectItem>
                    <SelectItem value="FEMALE">Female</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={(e) => handleChange('email', e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Textarea value={form.address} onChange={(e) => handleChange('address', e.target.value)} rows={2} />
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">Guardian Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Guardian Name</Label>
                <Input value={form.guardianName} onChange={(e) => handleChange('guardianName', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Guardian Phone</Label>
                <Input value={form.guardianPhone} onChange={(e) => handleChange('guardianPhone', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Relationship</Label>
                <Select value={form.guardianRelation} onValueChange={(v) => handleChange('guardianRelation', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Father">Father</SelectItem>
                    <SelectItem value="Mother">Mother</SelectItem>
                    <SelectItem value="Guardian">Guardian</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => handleChange('status', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                    <SelectItem value="GRADUATED">Graduated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">Enrollment</CardTitle>
          </CardHeader>
          <CardContent>
            {classesAvailable && store.classes.length > 0 ? (
              <div className="space-y-2">
                <Label>Class (optional)</Label>
                <Select value={form.classId} onValueChange={(v) => handleChange('classId', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select class (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {store.classes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name} ({c.gradeLevel}-{c.section})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                <p className="text-sm text-amber-700">
                  Class assignment requires a PRO plan. Students can still be created and assigned to classes later after upgrading.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3 mt-6">
          <Button type="button" variant="outline" onClick={() => store.navigate('students')}>Cancel</Button>
          <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? 'Update Student' : 'Create Student'}
          </Button>
        </div>
      </form>
    </div>
  );
}
