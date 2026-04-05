'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  UserCog, Plus, Search, MoreVertical, Pencil, Trash2, Shield,
  Users, GraduationCap, Building2, Loader2, Mail, DollarSign,
  Eye, EyeOff,
} from 'lucide-react';
import { toast } from 'sonner';

interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
  schoolId: string | null;
  school: { id: string; name: string; plan: string } | null;
  _count: { classAssignments: number; grades: number; attendanceMarks: number };
}

interface RoleCounts {
  total: number;
  admins: number;
  owners: number;
  managers: number;
  teachers: number;
  finance: number;
}

export default function AdminEmployees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [counts, setCounts] = useState<RoleCounts>({ total: 0, admins: 0, owners: 0, managers: 0, teachers: 0, finance: 0 });
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<Employee | null>(null);
  const [saving, setSaving] = useState(false);
  const [schools, setSchools] = useState<{ id: string; name: string }[]>([]);
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', password: '', role: 'MANAGER', schoolId: '',
  });
  const [editForm, setEditForm] = useState({
    name: '', email: '', phone: '', role: '', isActive: true, schoolId: '',
  });

  const loadData = async () => {
    try {
      const [usersRes, schoolsRes] = await Promise.all([
        fetch(`/api/admin/users?search=${search}&role=${roleFilter}`),
        fetch('/api/schools'),
      ]);
      if (usersRes.ok) {
        const data = await usersRes.json();
        setEmployees(data.users || []);
        setCounts(data.counts || { total: 0, admins: 0, owners: 0, managers: 0, teachers: 0, finance: 0 });
      }
      if (schoolsRes.ok) {
        const sData = await schoolsRes.json();
        setSchools(sData.schools || []);
      }
    } catch { /* empty */ } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [search, roleFilter]);

  const handleCreate = async () => {
    if (!form.name || !form.email || !form.password || !form.role) {
      toast.error('All fields are required');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Failed'); return; }
      toast.success('Employee created successfully!');
      setCreateOpen(false);
      setForm({ name: '', email: '', password: '', role: 'MANAGER', schoolId: '' });
      loadData();
    } catch { toast.error('Network error'); } finally { setSaving(false); }
  };

  const handleEdit = async () => {
    if (!editUser) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${editUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        toast.success('Employee updated!');
        setEditUser(null);
        loadData();
      }
    } catch { toast.error('Failed'); } finally { setSaving(false); }
  };

  const handleDeactivate = async (user: Employee) => {
    if (!confirm(`Deactivate ${user.name}? They will lose access to the system.`)) return;
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, { method: 'DELETE' });
      if (res.ok) { toast.success('Employee deactivated'); loadData(); }
    } catch { toast.error('Failed'); }
  };

  const openEdit = (user: Employee) => {
    setEditUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      isActive: user.isActive,
      schoolId: user.schoolId || '',
    });
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN': return <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px]"><Shield className="h-3 w-3 mr-1" /> SUPER ADMIN</Badge>;
      case 'OWNER': return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px]"><Shield className="h-3 w-3 mr-1" /> OWNER</Badge>;
      case 'MANAGER': return <Badge className="bg-teal-100 text-teal-700 border-teal-200 text-[10px]">MANAGER</Badge>;
      case 'TEACHER': return <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-[10px]">TEACHER</Badge>;
      case 'FINANCE': return <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-[10px]">FINANCE</Badge>;
      default: return <Badge variant="secondary" className="text-[10px]">{role}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Employee Management</h2>
          <p className="text-muted-foreground">{counts.total} users across the platform</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Employee
        </Button>
      </div>

      {/* Role Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'All Users', value: counts.total, icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Super Admins', value: counts.admins, icon: Shield, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Owners', value: counts.owners, icon: Shield, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Managers', value: counts.managers, icon: Building2, color: 'text-teal-600', bg: 'bg-teal-50' },
          { label: 'Teachers', value: counts.teachers, icon: GraduationCap, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Finance', value: counts.finance, icon: DollarSign, color: 'text-purple-600', bg: 'bg-purple-50' },
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

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v === 'ALL' ? '' : v)}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Roles</SelectItem>
            <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
            <SelectItem value="OWNER">Owner</SelectItem>
            <SelectItem value="MANAGER">Manager</SelectItem>
            <SelectItem value="TEACHER">Teacher</SelectItem>
            <SelectItem value="FINANCE">Finance</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Employee List */}
      <div className="space-y-2">
        {employees.map((emp) => (
          <Card key={emp.id} className="hover:shadow-sm transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${
                  emp.role === 'SUPER_ADMIN' ? 'bg-amber-600'
                  : emp.role === 'OWNER' ? 'bg-emerald-600'
                  : emp.role === 'MANAGER' ? 'bg-teal-600'
                  : emp.role === 'FINANCE' ? 'bg-purple-600'
                  : 'bg-blue-600'
                }`}>
                  {emp.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{emp.name}</span>
                    {getRoleBadge(emp.role)}
                    {!emp.isActive && <Badge variant="outline" className="text-xs text-red-500">Inactive</Badge>}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {emp.email}</span>
                    {emp.school && (
                      <span className="flex items-center gap-1"><Building2 className="h-3 w-3" /> {emp.school.name}</span>
                    )}
                    <span>Joined {new Date(emp.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="shrink-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openEdit(emp)}>
                      <Pencil className="h-4 w-4 mr-2" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDeactivate(emp)} className="text-red-600 focus:text-red-600">
                      <Trash2 className="h-4 w-4 mr-2" /> Deactivate
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>
        ))}

        {employees.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <UserCog className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No employees found</p>
            <p className="text-sm">Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Employee</DialogTitle>
            <DialogDescription>Create a new user account on the platform</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name *</Label>
              <Input placeholder="John Smith" value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input type="email" placeholder="john@school.edu" value={form.email} onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Password *</Label>
              <div className="relative">
                <Input type={showCreatePassword ? 'text' : 'password'} placeholder="Set account password (min 6 chars)" value={form.password} onChange={(e) => setForm(p => ({ ...p, password: e.target.value }))} />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowCreatePassword(!showCreatePassword)}>
                  {showCreatePassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Role *</Label>
                <Select value={form.role} onValueChange={(v) => setForm(p => ({ ...p, role: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                    <SelectItem value="OWNER">Owner (School Creator)</SelectItem>
                    <SelectItem value="MANAGER">Manager</SelectItem>
                    <SelectItem value="TEACHER">Teacher</SelectItem>
                    <SelectItem value="FINANCE">Finance Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Assign to School</Label>
                <Select value={form.schoolId} onValueChange={(v) => setForm(p => ({ ...p, schoolId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No School (Platform)</SelectItem>
                    {schools.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Employee
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
            <DialogDescription>Update employee information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={editForm.name} onChange={(e) => setEditForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={editForm.email} onChange={(e) => setEditForm(p => ({ ...p, email: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={editForm.phone} onChange={(e) => setEditForm(p => ({ ...p, phone: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={editForm.role} onValueChange={(v) => setEditForm(p => ({ ...p, role: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                    <SelectItem value="OWNER">Owner</SelectItem>
                    <SelectItem value="MANAGER">Manager</SelectItem>
                    <SelectItem value="TEACHER">Teacher</SelectItem>
                    <SelectItem value="FINANCE">Finance Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>School</Label>
                <Select value={editForm.schoolId} onValueChange={(v) => setEditForm(p => ({ ...p, schoolId: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No School</SelectItem>
                    {schools.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditUser(null)}>Cancel</Button>
            <Button onClick={handleEdit} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
