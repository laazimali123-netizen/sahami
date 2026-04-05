'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft, Building2, GraduationCap, Users, School, DollarSign,
  Loader2, Calendar, Mail, Phone, Check,
} from 'lucide-react';
import { toast } from 'sonner';

interface SchoolDetail {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  plan: string;
  maxStudents: number;
  maxTeachers: number;
  academicYear: string;
  isActive: boolean;
  createdAt: string;
  _count: { students: number; users: number; classes: number; subjects: number };
  users: { id: string; name: string; email: string; role: string; isActive: boolean; createdAt: string }[];
}

export default function AdminSchoolDetail() {
  const navigate = useStore((s) => s.navigate);
  const viewParams = useStore((s) => s.viewParams);
  const schoolId = viewParams.id;

  const [school, setSchool] = useState<SchoolDetail | null>(null);
  const [financial, setFinancial] = useState({ totalBilled: 0, totalCollected: 0 });
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '', email: '', phone: '', plan: 'BASIC', academicYear: '', maxStudents: 100, maxTeachers: 20,
  });
  const [saving, setSaving] = useState(false);

  const loadSchool = async () => {
    if (!schoolId) return;
    try {
      const res = await fetch(`/api/schools/${schoolId}`);
      if (res.ok) {
        const data = await res.json();
        setSchool(data.school);
        setFinancial(data.financial);
        setEditForm({
          name: data.school.name,
          email: data.school.email || '',
          phone: data.school.phone || '',
          plan: data.school.plan,
          academicYear: data.school.academicYear,
          maxStudents: data.school.maxStudents,
          maxTeachers: data.school.maxTeachers,
        });
      }
    } catch { /* empty */ } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSchool(); }, [schoolId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/schools/${schoolId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        toast.success('School updated successfully');
        setEditing(false);
        loadSchool();
      }
    } catch { toast.error('Failed to update'); } finally { setSaving(false); }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-60 w-full" />
      </div>
    );
  }

  if (!school) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">School not found</p>
        <Button variant="outline" onClick={() => navigate('admin-schools')} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Schools
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('admin-schools')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${
              school.plan === 'PRO' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
            }`}>
              <School className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{school.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={school.plan === 'PRO'
                  ? 'bg-amber-100 text-amber-700 border-amber-200'
                  : 'bg-emerald-100 text-emerald-700 border-emerald-200'
                }>
                  {school.plan} Plan
                </Badge>
                <Badge variant={school.isActive ? 'default' : 'secondary'}>
                  {school.isActive ? 'Active' : 'Inactive'}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Created {new Date(school.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
        {!editing ? (
          <Button variant="outline" onClick={() => setEditing(true)}>
            Edit School
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </div>
        )}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Students', value: school._count.students, icon: GraduationCap, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Staff', value: school._count.users, icon: Users, color: 'text-teal-600', bg: 'bg-teal-50' },
          { label: 'Classes', value: school._count.classes, icon: School, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Subjects', value: school._count.subjects, icon: Calendar, color: 'text-violet-600', bg: 'bg-violet-50' },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`h-10 w-10 rounded-lg ${stat.bg} flex items-center justify-center`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* School Info + Staff */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* School Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">School Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {editing ? (
              <>
                <div className="space-y-2">
                  <Label>School Name</Label>
                  <Input value={editForm.name} onChange={(e) => setEditForm(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={editForm.email} onChange={(e) => setEditForm(p => ({ ...p, email: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input value={editForm.phone} onChange={(e) => setEditForm(p => ({ ...p, phone: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Plan</Label>
                    <Select value={editForm.plan} onValueChange={(v) => setEditForm(p => ({
                      ...p, plan: v,
                      maxStudents: v === 'PRO' ? 500 : 100,
                      maxTeachers: v === 'PRO' ? 50 : 20,
                    }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BASIC">BASIC</SelectItem>
                        <SelectItem value="PRO">PRO</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Academic Year</Label>
                    <Input value={editForm.academicYear} onChange={(e) => setEditForm(p => ({ ...p, academicYear: e.target.value }))} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Max Students</Label>
                    <Input type="number" value={editForm.maxStudents} onChange={(e) => setEditForm(p => ({ ...p, maxStudents: parseInt(e.target.value) }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Max Teachers</Label>
                    <Input type="number" value={editForm.maxTeachers} onChange={(e) => setEditForm(p => ({ ...p, maxTeachers: parseInt(e.target.value) }))} />
                  </div>
                </div>
              </>
            ) : (
              <>
                {[
                  { icon: Building2, label: 'Name', value: school.name },
                  { icon: Mail, label: 'Email', value: school.email || '—' },
                  { icon: Phone, label: 'Phone', value: school.phone || '—' },
                  { icon: Calendar, label: 'Academic Year', value: school.academicYear },
                  { icon: GraduationCap, label: 'Student Capacity', value: `${school._count.students} / ${school.maxStudents}` },
                  { icon: Users, label: 'Teacher Capacity', value: `${school._count.users} / ${school.maxTeachers}` },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </div>
                    <span className="text-sm font-medium">{item.value}</span>
                  </div>
                ))}
              </>
            )}
          </CardContent>
        </Card>

        {/* Financial Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Financial Summary</CardTitle>
            <CardDescription>Billing and revenue data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Total Billed</p>
                <p className="text-2xl font-bold text-foreground">${financial.totalBilled.toLocaleString()}</p>
              </div>
              <div className="p-4 rounded-lg bg-emerald-50">
                <p className="text-sm text-emerald-600">Total Collected</p>
                <p className="text-2xl font-bold text-emerald-700">${financial.totalCollected.toLocaleString()}</p>
              </div>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">Outstanding</p>
              <p className="text-2xl font-bold text-amber-600">
                ${(financial.totalBilled - financial.totalCollected).toLocaleString()}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-amber-50">
              <p className="text-sm text-amber-600">Monthly Subscription</p>
              <p className="text-2xl font-bold text-amber-700">
                ${school.plan === 'PRO' ? '29' : '0'}/month
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Staff List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">School Staff ({school.users.length})</CardTitle>
          <CardDescription>Managers and teachers at this school</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-80 overflow-y-auto sahami-scroll">
            {school.users.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`h-9 w-9 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                    user.role === 'OWNER' ? 'bg-emerald-600'
                    : user.role === 'MANAGER' ? 'bg-teal-600'
                    : user.role === 'FINANCE' ? 'bg-purple-600'
                    : 'bg-blue-600'
                  }`}>
                    {user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={['OWNER', 'MANAGER'].includes(user.role) ? 'default' : 'secondary'} className="text-xs">
                    {user.role}
                  </Badge>
                  {!user.isActive && <Badge variant="outline" className="text-xs text-red-500">Inactive</Badge>}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
