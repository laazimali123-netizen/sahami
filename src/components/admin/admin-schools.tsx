'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Building2, Plus, Search, MoreVertical, Pencil, Trash2, Eye,
  School, Users, GraduationCap, Loader2,
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface SchoolItem {
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
  _count: { students: number; users: number; classes: number };
}

export default function AdminSchools() {
  const navigate = useStore((s) => s.navigate);
  const [schools, setSchools] = useState<SchoolItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editSchool, setEditSchool] = useState<SchoolItem | null>(null);
  const [form, setForm] = useState({
    name: '', email: '', phone: '', plan: 'BASIC',
    managerName: '', managerEmail: '', managerPassword: '',
  });
  const [saving, setSaving] = useState(false);

  const loadSchools = async () => {
    try {
      const res = await fetch('/api/schools');
      if (res.ok) {
        const data = await res.json();
        setSchools(data.schools || []);
      }
    } catch { /* empty */ } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSchools(); }, []);

  const filtered = schools.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async () => {
    if (!form.name || !form.managerName || !form.managerEmail || !form.managerPassword) {
      toast.error('School name, manager name, email, and password are required');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/schools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Failed to create school'); return; }
      toast.success('School created successfully!');
      setCreateOpen(false);
      setForm({ name: '', email: '', phone: '', plan: 'BASIC', managerName: '', managerEmail: '', managerPassword: '' });
      loadSchools();
    } catch { toast.error('Network error'); } finally { setSaving(false); }
  };

  const handleToggleActive = async (school: SchoolItem) => {
    try {
      const res = await fetch(`/api/schools/${school.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !school.isActive }),
      });
      if (res.ok) {
        toast.success(school.isActive ? 'School deactivated' : 'School activated');
        loadSchools();
      }
    } catch { toast.error('Failed to update school'); }
  };

  const handleDelete = async (school: SchoolItem) => {
    if (!confirm(`Deactivate ${school.name} and all its users?`)) return;
    try {
      const res = await fetch(`/api/schools/${school.id}`, { method: 'DELETE' });
      if (res.ok) { toast.success('School deactivated'); loadSchools(); }
    } catch { toast.error('Failed'); }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-3">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">School Management</h2>
          <p className="text-muted-foreground">{schools.length} schools registered on the platform</p>
        </div>
        <Button onClick={() => navigate('admin-school-create')} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="h-4 w-4 mr-2" />
          Add New School
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xl font-bold">{schools.filter(s => s.isActive).length}</p>
              <p className="text-xs text-muted-foreground">Active Schools</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-50 flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xl font-bold">{schools.reduce((a, s) => a + s._count.students, 0)}</p>
              <p className="text-xs text-muted-foreground">Total Students</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-teal-50 flex items-center justify-center">
              <Users className="h-5 w-5 text-teal-600" />
            </div>
            <div>
              <p className="text-xl font-bold">{schools.filter(s => s.plan === 'PRO').length}</p>
              <p className="text-xs text-muted-foreground">PRO Schools</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center">
              <School className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xl font-bold">${schools.filter(s => s.plan === 'PRO').length * 29}/mo</p>
              <p className="text-xs text-muted-foreground">Revenue</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search schools..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Schools List */}
      <div className="grid gap-3">
        {filtered.map((school) => (
          <Card key={school.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div
                  className="flex items-center gap-4 flex-1 min-w-0 cursor-pointer"
                  onClick={() => navigate('admin-school-detail', { id: school.id })}
                >
                  <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${
                    school.plan === 'PRO' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    <School className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-base">{school.name}</h3>
                      <Badge className={school.plan === 'PRO'
                        ? 'bg-amber-100 text-amber-700 border-amber-200 text-[10px]'
                        : 'bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px]'
                      }>
                        {school.plan}
                      </Badge>
                      {!school.isActive && (
                        <Badge variant="secondary" className="text-[10px]">Inactive</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1"><GraduationCap className="h-3.5 w-3.5" /> {school._count.students} students</span>
                      <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {school._count.users} staff</span>
                      <span className="flex items-center gap-1"><School className="h-3.5 w-3.5" /> {school._count.classes} classes</span>
                      <span>Created {new Date(school.createdAt).toLocaleDateString()}</span>
                    </div>
                    {school.email && <p className="text-xs text-muted-foreground mt-1">{school.email}</p>}
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="shrink-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => navigate('admin-school-detail', { id: school.id })}>
                      <Eye className="h-4 w-4 mr-2" /> View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleToggleActive(school)}>
                      {school.isActive ? 'Deactivate' : 'Activate'}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDelete(school)} className="text-red-600 focus:text-red-600">
                      <Trash2 className="h-4 w-4 mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Building2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No schools found</p>
            <p className="text-sm">Try a different search or create a new school</p>
          </div>
        )}
      </div>
    </div>
  );
}
